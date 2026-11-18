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
const HUD_SCENE_PAD = 52
const LANDMARK_PAD = 48

export const GARDEN_SCENE_ASPECT = 'xMidYMid meet' as const

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
    minX: -SCENE_ART_BLEED,
    maxX: SCENE_W + SCENE_ART_BLEED,
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

function aspectFitViewBox(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  viewport: { w: number; h: number },
  edgePad: number,
): string {
  let minX = bounds.minX - edgePad
  let maxX = bounds.maxX + edgePad
  let minY = Math.max(0, bounds.minY - edgePad - HUD_SCENE_PAD * 0.35)
  let maxY = Math.min(SCENE_H, bounds.maxY + edgePad)

  let w = maxX - minX
  let h = maxY - minY
  if (w < 80) w = 80
  if (h < 80) h = 80

  const ar = viewport.w / viewport.h
  const contentAr = w / h

  if (contentAr < ar) {
    const newW = h * ar
    const cx = (minX + maxX) / 2
    minX = cx - newW / 2
    maxX = cx + newW / 2
  } else if (contentAr > ar) {
    const newH = w / ar
    const cy = (minY + maxY) / 2
    minY = cy - newH / 2
    maxY = cy + newH / 2
  }

  minX = Math.max(-SCENE_ART_BLEED, minX)
  maxX = Math.min(SCENE_W + SCENE_ART_BLEED, maxX)
  w = maxX - minX

  if (minY < 0) {
    maxY -= minY
    minY = 0
  }
  if (maxY > SCENE_H) {
    const overflow = maxY - SCENE_H
    minY = Math.max(0, minY - overflow)
    maxY = SCENE_H
  }
  let fitH = maxY - minY

  if (w / fitH < ar) {
    const fitW = fitH * ar
    const cx = (minX + maxX) / 2
    minX = Math.max(-SCENE_ART_BLEED, cx - fitW / 2)
    maxX = Math.min(SCENE_W + SCENE_ART_BLEED, minX + fitW)
    w = maxX - minX
  }

  return `${minX} ${minY} ${w} ${fitH}`
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
  const content = plantBounds
    ? mergeBounds(plantBounds, landmarks)
    : mergeBounds(fullSceneBounds(), landmarks)

  const edgePad = viewport.w < MOBILE_MAX_PX ? (viewport.w < 400 ? 48 : EDGE_PAD) : 28
  const activeLayout =
    viewport.w < MOBILE_MAX_PX && memories.length > 0
      ? mobileScaleLayout(layout, memories, viewport)
      : layout

  const layoutBounds =
    viewport.w < MOBILE_MAX_PX && memories.length > 0
      ? sceneBounds(activeLayout, memories)
      : plantBounds

  const fitBounds = layoutBounds ? mergeBounds(layoutBounds, landmarks) : content
  const viewBox = aspectFitViewBox(fitBounds, viewport, edgePad)

  return {
    layout: activeLayout,
    viewBox,
    preserveAspectRatio: GARDEN_SCENE_ASPECT,
  }
}