import type { GardenLandscapeView, Memory } from '@/lib/types'
import { SCENE_H, SCENE_W } from '@/lib/garden/scene-constants'
import { plantStageToIndex } from '@/lib/garden/stage'
import {
  layoutMemoryPlantsForView,
  treeFootprintHalfW,
  type ResolvedMemoryScenePlacement,
} from '@/lib/garden/memory-scene-layout'
import { projectWorldToScene } from '@/lib/garden/landscape-world'
import { WORLD_COTTAGE } from '@/lib/garden/landscape-world-layout'
/** Moon disc used in default night palette framing (MOONLIT_WATER). */
const FRAMING_MOON = { x: 320, y: 150, r: 34 } as const

const SCENE_ART_BLEED = 120
const MOBILE_MAX_PX = 640
const EDGE_PAD = 36
const DESKTOP_EDGE_PAD = 40
const LANDMARK_PAD = 52
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

function landmarkBounds(view: GardenLandscapeView): { minX: number; maxX: number; minY: number; maxY: number } {
  const shed = projectWorldToScene(WORLD_COTTAGE, view, {
    objectYaw: WORLD_COTTAGE.yaw,
    layer: 'near',
  })
  const half = 76 * shed.scale
  return {
    minX: shed.x - half - LANDMARK_PAD,
    maxX: shed.x + half + LANDMARK_PAD,
    minY: shed.y - 140 * shed.scale,
    maxY: SCENE_H - 16,
  }
}

function moonBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
  const { x, y, r } = FRAMING_MOON
  const glow = r * 2.4
  return {
    minX: x - glow - 12,
    maxX: x + glow + 12,
    minY: y - glow - 12,
    maxY: y + glow + 12,
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

function compositionBounds(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  view: GardenLandscapeView,
  edgePad: number,
): { minX: number; maxX: number } {
  const plants = sceneBounds(layout, memories)
  const merged = plants
    ? mergeBounds(plants, landmarkBounds(view))
    : landmarkBounds(view)
  const withMoon = mergeBounds(merged, moonBounds())
  return { minX: withMoon.minX - edgePad, maxX: withMoon.maxX + edgePad }
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

function sliceViewBoxForBounds(
  fitBounds: { minX: number; maxX: number },
  viewport: { w: number; h: number },
  pondZoomViewW?: number,
): string {
  const ar = viewport.w / Math.max(1, viewport.h)
  const contentMin = fitBounds.minX
  const contentMax = fitBounds.maxX
  const contentW = Math.max(80, contentMax - contentMin)
  const cx = (contentMin + contentMax) / 2
  const minVisibleW = SCENE_H * ar

  let viewW = Math.max(minVisibleW, contentW)
  if (pondZoomViewW !== undefined) {
    viewW = Math.max(pondZoomViewW, contentW, minVisibleW)
  }
  viewW = Math.min(FULL_SPAN_X, viewW)

  const { minX, viewW: w } = clampViewWindow(cx - viewW / 2, viewW)
  return `${minX} 0 ${w} ${SCENE_H}`
}

export function parseSceneViewBox(viewBox: string): { x: number; y: number; w: number; h: number } {
  const [x, y, w, h] = viewBox.split(/\s+/).map(Number)
  return { x, y, w, h }
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

/** Main-branch mobile pond fit — plants only (Keith reference). */
function mainLegacyMobilePondFraming(
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

function mobileViewBoxPondZoom(
  activeBounds: { minX: number; maxX: number },
  viewport: { w: number; h: number },
  pondViewW: number,
  edgePad: number,
): string {
  const contentMin = activeBounds.minX
  const contentMax = activeBounds.maxX
  const contentW = contentMax - contentMin
  const cx = (contentMin + contentMax) / 2
  const ar = viewport.w / Math.max(1, viewport.h)
  const minVisibleW = SCENE_H * ar

  let viewW = Math.max(pondViewW, contentW, minVisibleW)
  viewW = Math.min(FULL_SPAN_X, viewW)

  let minX = cx - viewW / 2
  const clamped = clampViewWindow(minX, viewW)
  minX = clamped.minX
  viewW = clamped.viewW

  if (contentMin < minX + edgePad * 0.25) {
    minX = Math.max(FULL_MIN_X, contentMin - edgePad)
    if (minX + viewW > FULL_MAX_X) minX = FULL_MAX_X - viewW
  }
  if (contentMax > minX + viewW - edgePad * 0.25) {
    const needW = contentMax - contentMin + edgePad * 2
    viewW = Math.min(FULL_SPAN_X, Math.max(viewW, needW, minVisibleW))
    minX = cx - viewW / 2
    const recentered = clampViewWindow(minX, viewW)
    minX = recentered.minX
    viewW = recentered.viewW
  }

  return `${minX} 0 ${viewW} ${SCENE_H}`
}

export function frameGardenSceneForViewport(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  viewport: { w: number; h: number },
  landscapeView: GardenLandscapeView,
): GardenSceneFraming {
  const isMobile = viewport.w < MOBILE_MAX_PX
  const edgePad = isMobile ? (viewport.w < 400 ? 48 : EDGE_PAD) : DESKTOP_EDGE_PAD

  if (memories.length === 0) {
    return {
      layout,
      viewBox: DEFAULT_SCENE_VIEWBOX,
      preserveAspectRatio: GARDEN_SCENE_ASPECT,
    }
  }

  const pondLayout = layoutMemoryPlantsForView(memories, FRAMING_REFERENCE_VIEW)
  const pondDesktopW = parseSceneViewBox(DEFAULT_SCENE_VIEWBOX).w

  if (!isMobile) {
    if (landscapeView === FRAMING_REFERENCE_VIEW) {
      const pondBounds = compositionBounds(pondLayout, memories, FRAMING_REFERENCE_VIEW, edgePad)
      const viewBox = sliceViewBoxForBounds(pondBounds, viewport, pondDesktopW)
      return {
        layout,
        viewBox,
        preserveAspectRatio: GARDEN_SCENE_ASPECT,
      }
    }
    const activeBounds = compositionBounds(layout, memories, landscapeView, edgePad)
    const viewBox = sliceViewBoxForBounds(activeBounds, viewport, pondDesktopW)
    return {
      layout,
      viewBox,
      preserveAspectRatio: GARDEN_SCENE_ASPECT,
    }
  }

  const pondRef = mainLegacyMobilePondFraming(pondLayout, memories, viewport)
  const refViewW = pondRef ? parseSceneViewBox(pondRef.viewBox).w : pondDesktopW
  const refFitScale = pondRef?.fitScale ?? 1

  if (landscapeView === FRAMING_REFERENCE_VIEW) {
    return {
      layout: pondRef?.layout ?? pondLayout,
      viewBox: pondRef?.viewBox ?? DEFAULT_SCENE_VIEWBOX,
      preserveAspectRatio: GARDEN_SCENE_ASPECT,
    }
  }

  const scaled = scaleLayoutUniform(layout, memories, refFitScale)
  const activeBounds = compositionBounds(scaled, memories, landscapeView, edgePad)
  const viewBox = mobileViewBoxPondZoom(activeBounds, viewport, refViewW, edgePad)

  return {
    layout: scaled,
    viewBox,
    preserveAspectRatio: GARDEN_SCENE_ASPECT,
  }
}