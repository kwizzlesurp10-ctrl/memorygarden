import type { GardenLandscapeView, Memory, PlantStage } from '@/lib/types'
import { getPlantSize } from '@/lib/garden-helpers'
import { plantStageToIndex } from '@/lib/garden/stage'
import { SCENE_W } from '@/lib/garden/scene-constants'
import { projectMemoryToSceneWorld, projectWorldToScene, type PlantFacing } from '@/lib/garden/landscape-world'
import { WORLD_COTTAGE } from '@/lib/garden/landscape-world-layout'
import { TREE_PROGRESSION_FACE_SCALE } from '@/components/plants/facing-art'
import type { SeededVariety } from '@/components/plants/types'

const HUD_CLEARANCE_Y = 78
const TREE_CANOPY_HALF_W = 58
const TREE_CANOPY_HEIGHT = 104
const MIN_TREE_DRAW_SCALE = 0.48
const CANOPY_GAP_FACTOR = 1.02

const SCENE_MARGIN_X: Record<GardenLandscapeView, { left: number; right: number }> = {
  pond: { left: 102, right: 148 },
  lakeside: { left: 88, right: 104 },
  meadow: { left: 82, right: 96 },
  garden_path: { left: 108, right: 88 },
}

/** Draw scale applied in GardenCanvas (`getPlantSize` × projection). */
export function memoryPlantDrawScale(stage: PlantStage, projectionScale: number): number {
  const size = getPlantSize(stage) as number
  const baseSc = Math.max(0.55, Math.min(1.4, size / 90))
  return baseSc * projectionScale
}

function treeFacingMultiplier(stageIndex: number): number {
  if (stageIndex < 1) return 1
  return TREE_PROGRESSION_FACE_SCALE[stageIndex] ?? 1
}

export function treeFootprintHalfW(drawScale: number, stageIndex: number): number {
  if (stageIndex < 1) return 9 * drawScale
  return TREE_CANOPY_HALF_W * drawScale * treeFacingMultiplier(stageIndex)
}

function treeCanopyTopY(baseY: number, drawScale: number, stageIndex: number): number {
  if (stageIndex < 1) return baseY
  return baseY - TREE_CANOPY_HEIGHT * drawScale * treeFacingMultiplier(stageIndex)
}

function cottageKeepOut(view: GardenLandscapeView): { x0: number; x1: number } | null {
  const shed = projectWorldToScene(WORLD_COTTAGE, view, { objectYaw: WORLD_COTTAGE.yaw, layer: 'near' })
  const half = (shed.facing === 'front' || shed.facing === 'back' ? 54 : 58) * shed.scale * 0.62
  const pad = view === 'pond' ? 54 : 32
  return { x0: shed.x - half - pad, x1: shed.x + half + pad * 0.4 }
}

function hardCanopyRight(view: GardenLandscapeView, cottage: { x0: number; x1: number } | null): number {
  const margin = SCENE_MARGIN_X[view]
  return cottage ? cottage.x0 - 10 : SCENE_W - margin.right
}

export interface ResolvedMemoryScenePlacement {
  x: number
  y: number
  depth: number
  facing: PlantFacing
  rimFromLeft: boolean
  plantScale: number
}

interface TreeLayoutItem {
  id: string
  stageIndex: number
  /** Scene x from `projectMemoryToSceneWorld` (user placement). */
  anchorX: number
  x: number
  y: number
  depth: number
  facing: PlantFacing
  rimFromLeft: boolean
  plantScale: number
  baseScale: number
  halfW: number
}

function hudLimitedScale(drawScale: number, baseY: number, stageIndex: number): number {
  if (stageIndex < 1) return drawScale
  const top = treeCanopyTopY(baseY, drawScale, stageIndex)
  if (top >= HUD_CLEARANCE_Y) return drawScale
  const span = baseY - HUD_CLEARANCE_Y
  const need = TREE_CANOPY_HEIGHT * treeFacingMultiplier(stageIndex)
  if (span <= 0 || need <= 0) return drawScale
  return Math.min(drawScale, span / need)
}

function treeBlocksCottage(cx: number, halfW: number, cottage: { x0: number; x1: number } | null): boolean {
  if (!cottage) return false
  return cx + halfW > cottage.x0 && cx - halfW < cottage.x1
}

function applyHudAndScale(t: TreeLayoutItem): void {
  let sc = hudLimitedScale(t.plantScale, t.y, t.stageIndex)
  sc = Math.max(MIN_TREE_DRAW_SCALE, sc)
  t.plantScale = sc
  t.halfW = treeFootprintHalfW(sc, t.stageIndex)
}

/** Clamp current scene x/scale to margins, cottage, and HUD (does not reset to anchor). */
function applySceneBounds(t: TreeLayoutItem, view: GardenLandscapeView): void {
  const margin = SCENE_MARGIN_X[view]
  const cottage = cottageKeepOut(view)
  const maxRight = hardCanopyRight(view, cottage)

  applyHudAndScale(t)

  let cx = t.x
  const minCx = margin.left + t.halfW
  const maxCx = Math.min(SCENE_W - margin.right - t.halfW, maxRight - t.halfW)
  cx = Math.max(minCx, Math.min(maxCx, cx))

  if (cottage && treeBlocksCottage(cx, t.halfW, cottage)) {
    cx = Math.min(cx, cottage.x0 - t.halfW - 6)
    cx = Math.max(minCx, cx)
  }

  for (let pass = 0; pass < 6; pass++) {
    const overflowRight = cx + t.halfW - maxRight
    const overflowLeft = minCx - cx
    if (overflowRight > 0) cx -= overflowRight
    if (overflowLeft > 0) cx += overflowLeft
    if (overflowRight <= 0 && overflowLeft <= 0) break
    t.plantScale = Math.max(MIN_TREE_DRAW_SCALE, t.plantScale * 0.96)
    t.halfW = treeFootprintHalfW(t.plantScale, t.stageIndex)
  }

  t.x = cx
}

function placeTreeAtAnchor(t: TreeLayoutItem, view: GardenLandscapeView): void {
  t.x = t.anchorX
  applySceneBounds(t, view)
}

function pairOverlap(a: TreeLayoutItem, b: TreeLayoutItem): number {
  const need = (a.halfW + b.halfW) * CANOPY_GAP_FACTOR
  return need - Math.abs(a.x - b.x)
}

function shrinkTree(t: TreeLayoutItem, factor: number, view: GardenLandscapeView): void {
  t.plantScale = Math.max(MIN_TREE_DRAW_SCALE, t.plantScale * factor)
  t.halfW = treeFootprintHalfW(t.plantScale, t.stageIndex)
  applySceneBounds(t, view)
}

function nudgePairApart(left: TreeLayoutItem, right: TreeLayoutItem, overlap: number, view: GardenLandscapeView): boolean {
  const leftX = left.x
  const rightX = right.x
  left.x -= overlap * 0.45
  right.x += overlap * 0.55
  applySceneBounds(left, view)
  applySceneBounds(right, view)
  if (pairOverlap(left, right) > 0) {
    right.x = left.x + (left.halfW + right.halfW) * CANOPY_GAP_FACTOR
    applySceneBounds(right, view)
    applySceneBounds(left, view)
  }
  return left.x !== leftX || right.x !== rightX
}

/**
 * Render-time tree layout: keep projected anchors, only nudge or shrink where
 * canopies overlap or scene limits require it.
 */
function anyPairOverlap(items: TreeLayoutItem[]): boolean {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (pairOverlap(items[i], items[j]) > 0.5) return true
    }
  }
  return false
}

/** Uniform row scale at anchors — keeps cluster shape before local nudges. */
function uniformScaleAtAnchors(items: TreeLayoutItem[], view: GardenLandscapeView): void {
  let mul = 1
  for (let attempt = 0; attempt < 36; attempt++) {
    for (const t of items) {
      t.x = t.anchorX
      t.plantScale = Math.max(MIN_TREE_DRAW_SCALE, t.baseScale * mul)
      applySceneBounds(t, view)
    }
    if (!anyPairOverlap(items)) return
    mul *= 0.94
  }
}

function adjustMemoryTreesInPlace(items: TreeLayoutItem[], view: GardenLandscapeView): void {
  for (const t of items) placeTreeAtAnchor(t, view)
  if (items.length < 2) return

  uniformScaleAtAnchors(items, view)

  for (let iter = 0; iter < 24; iter++) {
    let changed = false

    for (const t of items) {
      const beforeX = t.x
      const beforeSc = t.plantScale
      applySceneBounds(t, view)
      if (t.x !== beforeX || t.plantScale !== beforeSc) changed = true
    }

    const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id))
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = items.find((t) => t.id === sorted[i].id)!
        const b = items.find((t) => t.id === sorted[j].id)!
        let overlap = pairOverlap(a, b)
        if (overlap <= 0) continue

        const left = a.x <= b.x ? a : b
        const right = a.x <= b.x ? b : a
        if (nudgePairApart(left, right, overlap, view)) changed = true

        overlap = pairOverlap(a, b)
        if (overlap > 0.5) {
          shrinkTree(left, 0.97, view)
          shrinkTree(right, 0.97, view)
          nudgePairApart(left, right, pairOverlap(a, b), view)
          changed = true
        }
      }
    }

    const anyOverlap = sorted.some((a, i) =>
      sorted.slice(i + 1).some((b) => {
        const ta = items.find((t) => t.id === a.id)!
        const tb = items.find((t) => t.id === b.id)!
        return pairOverlap(ta, tb) > 0.5
      }),
    )
    if (!anyOverlap && !changed) break
  }

  for (const t of items) applySceneBounds(t, view)

  const byId = [...items].sort((a, b) => a.id.localeCompare(b.id))
  for (let i = 0; i < byId.length; i++) {
    for (let j = i + 1; j < byId.length; j++) {
      const ta = items.find((t) => t.id === byId[i].id)!
      const tb = items.find((t) => t.id === byId[j].id)!
      const left = ta.x <= tb.x ? ta : tb
      const right = ta.x <= tb.x ? tb : ta
      let guard = 0
      while (pairOverlap(left, right) > 0.5 && guard < 20) {
        guard += 1
        const need = (left.halfW + right.halfW) * CANOPY_GAP_FACTOR
        const margin = SCENE_MARGIN_X[view]
        const maxRight = hardCanopyRight(view, cottageKeepOut(view))
        const targetRight = left.x + need
        const maxCx = Math.min(SCENE_W - margin.right - right.halfW, maxRight - right.halfW)
        right.x = Math.min(targetRight, maxCx)
        if (right.x - left.x < need - 0.5) {
          left.x = Math.max(margin.left + left.halfW, right.x - need)
        }
        if (right.x - left.x < need - 0.5) {
          shrinkTree(left, 0.96, view)
          shrinkTree(right, 0.96, view)
        } else {
          applySceneBounds(left, view)
          applySceneBounds(right, view)
        }
      }
    }
  }
}

export function layoutMemoryPlantsForView(
  memories: readonly Memory[],
  view: GardenLandscapeView,
): Map<string, ResolvedMemoryScenePlacement> {
  const out = new Map<string, ResolvedMemoryScenePlacement>()
  const trees: TreeLayoutItem[] = []

  for (const memory of memories) {
    const proj = projectMemoryToSceneWorld(memory.position, view)
    const variety = memory.plantVariety as SeededVariety
    const stageIndex = plantStageToIndex(memory.plantStage)
    const drawScale = memoryPlantDrawScale(memory.plantStage, proj.scale)

    if (variety === 'tree') {
      const sc = stageIndex >= 1 ? hudLimitedScale(drawScale, proj.y, stageIndex) : drawScale
      trees.push({
        id: memory.id,
        stageIndex,
        anchorX: proj.x,
        x: proj.x,
        y: proj.y,
        depth: proj.depth,
        facing: proj.facing,
        rimFromLeft: proj.rimFromLeft,
        plantScale: sc,
        baseScale: sc,
        halfW: treeFootprintHalfW(sc, stageIndex),
      })
    } else {
      out.set(memory.id, {
        x: proj.x,
        y: proj.y,
        depth: proj.depth,
        facing: proj.facing,
        rimFromLeft: proj.rimFromLeft,
        plantScale: drawScale,
      })
    }
  }

  if (trees.length > 0) {
    adjustMemoryTreesInPlace(trees, view)
    for (const t of trees) {
      out.set(t.id, {
        x: t.x,
        y: t.y,
        depth: t.depth,
        facing: t.facing,
        rimFromLeft: t.rimFromLeft,
        plantScale: t.plantScale,
      })
    }
  }

  return out
}
