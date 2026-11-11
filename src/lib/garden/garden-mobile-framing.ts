import type { GardenLandscapeView, Memory } from '@/lib/types'
import { SCENE_H, SCENE_W } from '@/lib/garden/scene-constants'
import { plantStageToIndex } from '@/lib/garden/stage'
import {
  treeFootprintHalfW,
  type ResolvedMemoryScenePlacement,
} from '@/lib/garden/memory-scene-layout'

const SCENE_ART_BLEED = 120
const MOBILE_MAX_PX = 640
const EDGE_PAD = 36

function plantHalfWidth(memory: Memory, placement: ResolvedMemoryScenePlacement): number {
  const stageIndex = plantStageToIndex(memory.plantStage)
  if (memory.plantVariety === 'tree') {
    return treeFootprintHalfW(placement.plantScale, stageIndex)
  }
  return 14 * placement.plantScale
}

export function visibleSceneWidthForSlice(viewport: { w: number; h: number }): number {
  const fullW = SCENE_W + SCENE_ART_BLEED * 2
  const scale = Math.max(viewport.w / fullW, viewport.h / SCENE_H)
  return viewport.w / scale
}

function sceneBounds(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
): { minX: number; maxX: number } | null {
  let minX = Infinity
  let maxX = -Infinity
  for (const memory of memories) {
    const pos = layout.get(memory.id)
    if (!pos) continue
    const half = plantHalfWidth(memory, pos)
    minX = Math.min(minX, pos.x - half)
    maxX = Math.max(maxX, pos.x + half)
  }
  if (!Number.isFinite(minX)) return null
  return { minX, maxX }
}

export interface MobileGardenFraming {
  layout: Map<string, ResolvedMemoryScenePlacement>
  viewBox: string
}

export function frameMemoryPlantsForMobile(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  viewport: { w: number; h: number },
): MobileGardenFraming | null {
  if (viewport.w >= MOBILE_MAX_PX || memories.length === 0) return null

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

  const viewMin = Math.max(-SCENE_ART_BLEED, fitMin - edgePad)
  const viewW = Math.min(
    SCENE_W + SCENE_ART_BLEED * 2,
    fitMax + edgePad - viewMin,
  )
  const viewBox = `${viewMin} 0 ${viewW} ${SCENE_H}`

  return { layout: nextLayout, viewBox }
}
