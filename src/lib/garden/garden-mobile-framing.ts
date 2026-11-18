import type { GardenLandscapeView, Memory } from '@/lib/types'
import type { ResolvedMemoryScenePlacement } from '@/lib/garden/memory-scene-layout'
import {
  frameGardenSceneForViewport,
  visibleSceneWidthForSlice,
  type GardenSceneFraming,
} from '@/lib/garden/garden-scene-framing'

export { visibleSceneWidthForSlice }

export interface MobileGardenFraming {
  layout: Map<string, ResolvedMemoryScenePlacement>
  viewBox: string
}

export function frameMemoryPlantsForMobile(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  viewport: { w: number; h: number },
  landscapeView: GardenLandscapeView = 'pond',
): MobileGardenFraming | null {
  const framed = frameGardenSceneForViewport(layout, memories, viewport, landscapeView)
  if (viewport.w >= 640) return null
  return { layout: framed.layout, viewBox: framed.viewBox }
}

export function frameGardenScene(
  layout: Map<string, ResolvedMemoryScenePlacement>,
  memories: readonly Memory[],
  viewport: { w: number; h: number },
  landscapeView: GardenLandscapeView,
): GardenSceneFraming {
  return frameGardenSceneForViewport(layout, memories, viewport, landscapeView)
}
