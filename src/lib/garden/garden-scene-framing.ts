import type { GardenLandscapeView, Memory } from '@/lib/types'
import { SCENE_H, SCENE_W } from '@/lib/garden/scene-constants'
import { plantStageToIndex } from '@/lib/garden/stage'
import {
  layoutMemoryPlantsForView,
  treeFootprintHalfW,
  type ResolvedMemoryScenePlacement,
} from '@/lib/garden/memory-scene-layout'
const SCENE_ART_BLEED = 120
const MOBILE_MAX_PX = 640
const EDGE_PAD = 36
const FRAMING_REFERENCE_VIEW = 'pond' as const satisfies GardenLandscapeView
const FULL_MIN_X = -SCENE_ART_BLEED
const FULL_MAX_X = SCENE_W + SCENE_ART_BLEED
const FULL_SPAN_X = FULL_MAX_X - FULL_MIN_X

/** Fills the scene wrap edge-to-edge; viewBox is tuned to include composition. */
export const GARDEN_SCENE_ASPECT = 'xMidYMid slice' as const

/** Same default viewBox as main branch desktop (pond unchanged). */
export const DEFAULT_SCENE_VIEWBOX = `${FULL_MIN_X} 0 ${FULL_SPAN_X} ${SCENE_H}`

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

export interface GardenSceneFraming {
  layout: Map<string, ResolvedMemoryScenePlacement>
  viewBox: string
  preserveAspectRatio: typeof GARDEN_SCENE_ASPECT
}

function scaleLayoutUniform(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  fitScale: number,
): Map<string, ResolvedMemoryScenePlacement> {
  if (fitScale >= 0.999) return layout
  const bounds = sceneBounds(layout, memories)
  if (!bounds) return layout
  const centerX = (bounds.minX + bounds.maxX) / 2

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

/** Main-branch mobile pond fit (preserves pond tab on small viewports). */
function mainLegacyMobileFraming(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  viewport: { w: number; h: number },
): { layout: Map<string, ResolvedMemoryScenePlacement>; viewBox: string; fitScale: number } | null {
  const bounds = sceneBounds(layout, memories)
  if (!bounds) return null

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

  let fitMin = Infinity
  let fitMax = -Infinity
  for (const memory of memories) {
    const pos = nextLayout.get(memory.id)
    if (!pos) continue
    const half = plantHalfWidth(memory, pos)
    fitMin = Math.min(fitMin, pos.x - half)
    fitMax = Math.max(fitMax, pos.x + half)
  }

  const viewMin = Math.max(FULL_MIN_X, fitMin - edgePad)
  const viewW = Math.min(FULL_SPAN_X, fitMax + edgePad - viewMin)
  const viewBox = `${viewMin} 0 ${viewW} ${SCENE_H}`

  return { layout: nextLayout, viewBox, fitScale }
}

export function frameGardenSceneForViewport(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  viewport: { w: number; h: number },
  _landscapeView: GardenLandscapeView,
): GardenSceneFraming {
  const isMobile = viewport.w < MOBILE_MAX_PX

  if (!isMobile || memories.length === 0) {
    return {
      layout,
      viewBox: DEFAULT_SCENE_VIEWBOX,
      preserveAspectRatio: GARDEN_SCENE_ASPECT,
    }
  }

  const pondLayout = layoutMemoryPlantsForView(memories, FRAMING_REFERENCE_VIEW)
  const pondRef = mainLegacyMobileFraming(pondLayout, memories, viewport)
  const viewBox = pondRef?.viewBox ?? DEFAULT_SCENE_VIEWBOX
  const fitScale = pondRef?.fitScale ?? 1

  if (_landscapeView === FRAMING_REFERENCE_VIEW) {
    return {
      layout: pondRef?.layout ?? pondLayout,
      viewBox,
      preserveAspectRatio: GARDEN_SCENE_ASPECT,
    }
  }

  return {
    layout: scaleLayoutUniform(layout, memories, fitScale),
    viewBox,
    preserveAspectRatio: GARDEN_SCENE_ASPECT,
  }
}