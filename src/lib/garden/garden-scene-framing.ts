import type { GardenLandscapeView, Memory } from '@/lib/types'
import { SCENE_H, SCENE_W } from '@/lib/garden/scene-constants'
import { plantStageToIndex } from '@/lib/garden/stage'
import {
  treeFootprintHalfW,
  type ResolvedMemoryScenePlacement,
} from '@/lib/garden/memory-scene-layout'
import { projectWorldToScene } from '@/lib/garden/landscape-world'
import { WORLD_COTTAGE } from '@/lib/garden/landscape-world-layout'

const SCENE_ART_BLEED = 120
const MOBILE_MAX_PX = 640
const EDGE_PAD = 36
const HUD_SCENE_PAD = 40
const LANDMARK_PAD = 48
const FULL_MIN_X = -SCENE_ART_BLEED
const FULL_MAX_X = SCENE_W + SCENE_ART_BLEED
const FULL_SPAN_X = FULL_MAX_X - FULL_MIN_X

/** Fills the scene wrap edge-to-edge; viewBox is tuned to include composition. */
export const GARDEN_SCENE_ASPECT = 'xMidYMid slice' as const

export function visibleSceneWidthForSlice(viewport: { w: number; h: number }): number {
  const fullW = SCENE_W + SCENE_ART_BLEED * 2
  const scale = Math.max(viewport.w / fullW, viewport.h / SCENE_H)
  return viewport.w / scale
}

function plantHalfWidth(memory: Memory, placement: ResolvedMemoryScenePlacement): number {
  const stageIndex = plantStageToIndex(memory.plantStage)
  if (memory.plantVariety === 'tree') {
    return treeFootprintHalfW(placement.plantScale, stageIndex)
  }
  return 14 * placement.plantScale
}

function treeCanopyTopY(baseY: number, memory: Memory, placement: ResolvedMemoryScenePlacement): number {
  const stageIndex = plantStageToIndex(memory.plantStage)
  if (memory.plantVariety !== 'tree' || stageIndex < 1) return baseY - 40
  const TREE_CANOPY_HEIGHT = 104
  return baseY - TREE_CANOPY_HEIGHT * placement.plantScale * 1.05
}

function sceneBounds(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const memory of memories) {
    const pos = layout.get(memory.id)
    if (!pos) continue
    const half = plantHalfWidth(memory, pos)
    minX = Math.min(minX, pos.x - half)
    maxX = Math.max(maxX, pos.x + half)
    minY = Math.min(minY, treeCanopyTopY(pos.y, memory, pos))
    maxY = Math.max(maxY, pos.y + 12)
  }
  if (!Number.isFinite(minX)) return null
  return { minX, maxX, minY, maxY }
}

function landmarkBounds(view: GardenLandscapeView): { minX: number; maxX: number; minY: number; maxY: number } {
  const shed = projectWorldToScene(WORLD_COTTAGE, view, {
    objectYaw: WORLD_COTTAGE.yaw,
    layer: 'near',
  })
  const half = 72 * shed.scale
  return {
    minX: shed.x - half - LANDMARK_PAD,
    maxX: shed.x + half + LANDMARK_PAD,
    minY: shed.y - 130 * shed.scale,
    maxY: SCENE_H - 20,
  }
}

function fullSceneBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
  return {
    minX: FULL_MIN_X,
    maxX: FULL_MAX_X,
    minY: 0,
    maxY: SCENE_H,
  }
}

function mergeBounds(
  a: { minX: number; maxX: number; minY: number; maxY: number },
  b: { minX: number; maxX: number; minY: number; maxY: number },
): { minX: number; maxX: number; minY: number; maxY: number } {
  return {
    minX: Math.min(a.minX, b.minX),
    maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

function clampViewWindow(minX: number, viewW: number): { minX: number; viewW: number } {
  if (viewW >= FULL_SPAN_X) {
    return { minX: FULL_MIN_X, viewW: FULL_SPAN_X }
  }
  let x0 = minX
  if (x0 < FULL_MIN_X) x0 = FULL_MIN_X
  if (x0 + viewW > FULL_MAX_X) x0 = FULL_MAX_X - viewW
  x0 = Math.max(FULL_MIN_X, Math.min(FULL_MAX_X - viewW, x0))
  return { minX: x0, viewW }
}

/**
 * Slice-friendly viewBox: always full scene height so mobile/desktop fill the canvas
 * without letterbox bands; horizontal window matches viewport aspect × SCENE_H.
 */
function sliceViewBoxFullHeight(
  fitBounds: { minX: number; maxX: number },
  viewport: { w: number; h: number },
  edgePad: number,
): string {
  const ar = viewport.w / Math.max(1, viewport.h)
  const contentMin = fitBounds.minX - edgePad
  const contentMax = fitBounds.maxX + edgePad
  const contentW = Math.max(80, contentMax - contentMin)
  const cx = (contentMin + contentMax) / 2

  let viewW = Math.max(SCENE_H * ar, contentW)
  viewW = Math.min(FULL_SPAN_X, viewW)

  const { minX, viewW: w } = clampViewWindow(cx - viewW / 2, viewW)
  return `${minX} 0 ${w} ${SCENE_H}`
}

function mobileSliceViewBox(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  viewport: { w: number; h: number },
  edgePad: number,
): string {
  let fitMin = Infinity
  let fitMax = -Infinity
  for (const memory of memories) {
    const pos = layout.get(memory.id)
    if (!pos) continue
    const half = plantHalfWidth(memory, pos)
    fitMin = Math.min(fitMin, pos.x - half)
    fitMax = Math.max(fitMax, pos.x + half)
  }

  const ar = viewport.w / Math.max(1, viewport.h)
  const minVisibleW = SCENE_H * ar
  const span = fitMax - fitMin + edgePad * 2
  const viewW = Math.min(FULL_SPAN_X, Math.max(minVisibleW, span))
  const cx = (fitMin + fitMax) / 2
  const { minX, viewW: w } = clampViewWindow(cx - viewW / 2, viewW)
  return `${minX} 0 ${w} ${SCENE_H}`
}

export interface GardenSceneFraming {
  layout: Map<string, ResolvedMemoryScenePlacement>
  viewBox: string
  preserveAspectRatio: typeof GARDEN_SCENE_ASPECT
}

function mobileScaleLayout(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  viewport: { w: number; h: number },
): Map<string, ResolvedMemoryScenePlacement> {
  const bounds = sceneBounds(layout, memories)
  if (!bounds) return layout

  const centerX = (bounds.minX + bounds.maxX) / 2
  const edgePad = viewport.w < 400 ? 48 : EDGE_PAD
  const span = bounds.maxX - bounds.minX + edgePad * 2
  const visibleW = visibleSceneWidthForSlice(viewport)
  const fitScale = Math.min(1, visibleW / span)

  const nextLayout = new Map<string, ResolvedMemoryScenePlacement>()
  for (const memory of memories) {
    const pos = layout.get(memory.id)
    if (!pos) continue
    nextLayout.set(memory.id, {
      ...pos,
      x: centerX + (pos.x - centerX) * fitScale,
      plantScale: pos.plantScale * fitScale,
    })
  }
  return nextLayout
}

export function frameGardenSceneForViewport(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  viewport: { w: number; h: number },
  landscapeView: GardenLandscapeView,
): GardenSceneFraming {
  const landmarks = landmarkBounds(landscapeView)
  const plantBounds = sceneBounds(layout, memories)
  const isMobile = viewport.w < MOBILE_MAX_PX

  const activeLayout =
    isMobile && memories.length > 0 ? mobileScaleLayout(layout, memories, viewport) : layout

  const layoutBounds =
    isMobile && memories.length > 0 ? sceneBounds(activeLayout, memories) : plantBounds

  const fitBounds = layoutBounds
    ? mergeBounds(layoutBounds, landmarks)
    : mergeBounds(fullSceneBounds(), landmarks)

  const edgePad = isMobile ? (viewport.w < 400 ? 48 : EDGE_PAD) : 32

  const viewBox =
    isMobile && memories.length > 0
      ? mobileSliceViewBox(activeLayout, memories, viewport, edgePad)
      : sliceViewBoxFullHeight(fitBounds, viewport, edgePad)

  return {
    layout: activeLayout,
    viewBox,
    preserveAspectRatio: GARDEN_SCENE_ASPECT,
  }
}