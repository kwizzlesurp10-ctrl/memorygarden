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

function treeFootprintHalfW(drawScale: number, stageIndex: number): number {
  return TREE_CANOPY_HALF_W * drawScale * treeFacingMultiplier(stageIndex)
}

function treeCanopyTopY(baseY: number, drawScale: number, stageIndex: number): number {
  return baseY - TREE_CANOPY_HEIGHT * drawScale * treeFacingMultiplier(stageIndex)
}

function cottageKeepOut(view: GardenLandscapeView): { x0: number; x1: number } | null {
  const shed = projectWorldToScene(WORLD_COTTAGE, view, { objectYaw: WORLD_COTTAGE.yaw, layer: 'near' })
  const half = (shed.facing === 'front' || shed.facing === 'back' ? 54 : 58) * shed.scale * 0.62
  const pad = view === 'pond' ? 54 : 32
  return { x0: shed.x - half - pad, x1: shed.x + half + pad * 0.4 }
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
  order: number
  stageIndex: number
  x: number
  y: number
  depth: number
  facing: PlantFacing
  rimFromLeft: boolean
  plantScale: number
  baseScale: number
  halfW: number
}

function capTreeDrawScale(
  drawScale: number,
  stageIndex: number,
  x: number,
  y: number,
  view: GardenLandscapeView,
): { plantScale: number; x: number } {
  const margin = SCENE_MARGIN_X[view]
  let sc = drawScale
  let cx = x
  const cottage = cottageKeepOut(view)

  const applyFootprint = () => treeFootprintHalfW(sc, stageIndex)

  let halfW = applyFootprint()

  const minX = margin.left + halfW
  const maxX = SCENE_W - margin.right - halfW
  if (cx < minX) cx = minX
  if (cx > maxX) cx = maxX

  for (let pass = 0; pass < 8; pass++) {
    halfW = applyFootprint()
    const leftNeed = margin.left + halfW
    const rightNeed = SCENE_W - margin.right - halfW
    if (cx < leftNeed) cx = leftNeed
    if (cx > rightNeed) cx = rightNeed

    if (cottage && cx + halfW > cottage.x0 && cx - halfW < cottage.x1) {
      const overlapRight = cx + halfW - cottage.x0
      if (overlapRight > 0) cx -= overlapRight + 6
    }

    const top = treeCanopyTopY(y, sc, stageIndex)
    if (top < HUD_CLEARANCE_Y) {
      const span = y - HUD_CLEARANCE_Y
      const need = TREE_CANOPY_HEIGHT * treeFacingMultiplier(stageIndex)
      if (span > 0 && need > 0) {
        sc = Math.min(sc, span / need)
      }
    }

    const overflowRight = cx + applyFootprint() - (SCENE_W - margin.right)
    const overflowLeft = margin.left - (cx - applyFootprint())
    if (overflowRight > 0 || overflowLeft > 0) {
      sc *= 0.94
    } else {
      break
    }
  }

  return { plantScale: Math.max(0.48, sc), x: cx }
}

function treeBlocksCottage(cx: number, halfW: number, cottage: { x0: number; x1: number } | null): boolean {
  if (!cottage) return false
  return cx + halfW > cottage.x0 && cx - halfW < cottage.x1
}

function packMemoryTrees(items: TreeLayoutItem[], view: GardenLandscapeView): void {
  if (items.length === 1) return
  items.sort((a, b) => a.order - b.order)
  const margin = SCENE_MARGIN_X[view]
  const gapFactor = 1.04
  const cottage = cottageKeepOut(view)

  const hardCanopyRight = cottage ? cottage.x0 - 10 : SCENE_W - margin.right

  let rowMul = 1
  for (let attempt = 0; attempt < 40; attempt++) {
    let x = margin.left + treeFootprintHalfW(items[0].baseScale * rowMul, items[0].stageIndex)

    for (let i = 0; i < items.length; i++) {
      const t = items[i]
      const sc = t.baseScale * rowMul
      t.plantScale = Math.max(0.48, sc)
      t.halfW = treeFootprintHalfW(t.plantScale, t.stageIndex)
      t.x = x

      if (i < items.length - 1) {
        const next = items[i + 1]
        const nextHalf = treeFootprintHalfW(next.baseScale * rowMul, next.stageIndex)
        x += (t.halfW + nextHalf) * gapFactor
      }
    }

    const last = items[items.length - 1]
    const rightEdge = last.x + last.halfW + margin.right
    const hudOk = items.every(
      (t) => treeCanopyTopY(t.y, t.plantScale, t.stageIndex) >= HUD_CLEARANCE_Y,
    )
    const cottageOk = items.every((t) => !treeBlocksCottage(t.x, t.halfW, cottage))

    if (cottage && !cottageOk) {
      let maxShift = 0
      for (const t of items) {
        if (treeBlocksCottage(t.x, t.halfW, cottage)) {
          maxShift = Math.max(maxShift, t.x + t.halfW - cottage.x0 + 14)
        }
      }
      if (maxShift > 0) {
        for (const t of items) t.x -= maxShift
      }
    }

    const cottageOkAfter = items.every((t) => !treeBlocksCottage(t.x, t.halfW, cottage))
    const canopyRight = Math.max(...items.map((t) => t.x + t.halfW))
    const sceneOk = canopyRight + margin.right <= SCENE_W && canopyRight <= hardCanopyRight

    if (sceneOk && hudOk && cottageOkAfter) break
    rowMul = Math.max(0.34, rowMul * 0.92)
  }
}

export function layoutMemoryPlantsForView(
  memories: readonly Memory[],
  view: GardenLandscapeView,
): Map<string, ResolvedMemoryScenePlacement> {
  const out = new Map<string, ResolvedMemoryScenePlacement>()
  const trees: TreeLayoutItem[] = []
  let treeOrder = 0

  for (const memory of memories) {
    const proj = projectMemoryToSceneWorld(memory.position, view)
    const variety = memory.plantVariety as SeededVariety
    const stageIndex = plantStageToIndex(memory.plantStage)
    const drawScale = memoryPlantDrawScale(memory.plantStage, proj.scale)

    if (variety === 'tree') {
      const capped =
        stageIndex >= 1
          ? capTreeDrawScale(drawScale, stageIndex, proj.x, proj.y, view)
          : { plantScale: drawScale, x: proj.x }
      const halfW =
        stageIndex >= 1 ? treeFootprintHalfW(capped.plantScale, stageIndex) : 9 * capped.plantScale
      trees.push({
        id: memory.id,
        order: treeOrder++,
        stageIndex,
        x: capped.x,
        y: proj.y,
        depth: proj.depth,
        facing: proj.facing,
        rimFromLeft: proj.rimFromLeft,
        plantScale: capped.plantScale,
        baseScale: capped.plantScale,
        halfW,
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

  if (trees.length > 1) {
    packMemoryTrees(trees, view)
  } else if (trees.length === 1) {
    const only = trees[0]
    const capped = capTreeDrawScale(only.baseScale, only.stageIndex, only.x, only.y, view)
    only.x = capped.x
    only.plantScale = capped.plantScale
    only.halfW = treeFootprintHalfW(only.plantScale, only.stageIndex)
  }

  if (trees.length > 0) {
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
