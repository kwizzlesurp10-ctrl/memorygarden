import type { GardenLandscapeView, Position } from '@/lib/types'
import { SCENE_H, SCENE_W } from '@/components/garden/GardenSceneSvg'

export const GARDEN_LANDSCAPE_VIEWS = [
  'pond',
  'lakeside',
  'meadow',
  'garden_path',
] as const satisfies readonly GardenLandscapeView[]

export const DEFAULT_LANDSCAPE_VIEW: GardenLandscapeView = 'pond'
export const ONBOARDING_DEFAULT_LANDSCAPE_VIEW: GardenLandscapeView = 'meadow'

export interface GardenLandscapeViewMeta {
  id: GardenLandscapeView
  label: string
  description: string
}

export const GARDEN_LANDSCAPE_VIEW_META: readonly GardenLandscapeViewMeta[] = [
  { id: 'pond', label: 'Pond view', description: 'Wide reflective pond — the classic vista' },
  { id: 'lakeside', label: 'Lakeside', description: 'Shoreline path with a calmer sheet of water' },
  { id: 'meadow', label: 'Meadow', description: 'Open grassland with a tucked-away pool' },
  { id: 'garden_path', label: 'Garden path', description: 'Winding path; water glimpsed at the edge' },
]

export interface WaterRect {
  x: number
  y: number
  width: number
  height: number
  rx?: number
}

export interface ViewWaterLayout {
  /** Top edge of main water body (SVG y, increases downward). */
  waterTopY: number
  /** Full-scene water band height; 0 when only a corner patch is used. */
  bandHeight: number
  /** Optional corner pond (garden path) — visible sliver at frame edge. */
  corner?: WaterRect
}

export interface ViewPlantBand {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  /** Land surface y — plants anchor above this. */
  landSurfaceY: number
}

const STORED_X_MIN = 80
const STORED_X_MAX = SCENE_W - 80
const STORED_Y_MIN = 420
const STORED_Y_MAX = 468

function normalizeStored(position: Position): { nx: number; ny: number } {
  const nx = Math.max(0, Math.min(1, (position.x - STORED_X_MIN) / (STORED_X_MAX - STORED_X_MIN)))
  const ny = Math.max(0, Math.min(1, (position.y - STORED_Y_MIN) / (STORED_Y_MAX - STORED_Y_MIN)))
  return { nx, ny }
}

/** Horizontal parallax shift so the same garden reads as a different angle. */
const VIEW_X_SHIFT: Record<GardenLandscapeView, number> = {
  pond: 0,
  lakeside: -28,
  meadow: 42,
  garden_path: -18,
}

export function resolveGardenLandscapeView(
  pref: GardenLandscapeView | undefined | null,
): GardenLandscapeView {
  if (pref && GARDEN_LANDSCAPE_VIEWS.includes(pref)) return pref
  return DEFAULT_LANDSCAPE_VIEW
}

export function isGardenLandscapeView(value: unknown): value is GardenLandscapeView {
  return typeof value === 'string' && (GARDEN_LANDSCAPE_VIEWS as readonly string[]).includes(value)
}

export function getViewWaterLayout(view: GardenLandscapeView): ViewWaterLayout {
  switch (view) {
    case 'pond':
      return { waterTopY: 470, bandHeight: SCENE_H - 470 }
    case 'lakeside':
      return { waterTopY: 518, bandHeight: SCENE_H - 518 }
    case 'meadow':
      return { waterTopY: 592, bandHeight: SCENE_H - 592 }
    case 'garden_path':
      return {
        waterTopY: SCENE_H,
        bandHeight: 0,
        corner: { x: 0, y: 598, width: 340, height: 102, rx: 14 },
      }
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

export function getViewPlantBand(view: GardenLandscapeView): ViewPlantBand {
  switch (view) {
    case 'pond':
      return { xMin: 100, xMax: SCENE_W - 100, yMin: 432, yMax: 466, landSurfaceY: 468 }
    case 'lakeside':
      return { xMin: 90, xMax: SCENE_W - 90, yMin: 428, yMax: 512, landSurfaceY: 514 }
    case 'meadow':
      return { xMin: 72, xMax: SCENE_W - 72, yMin: 418, yMax: 578, landSurfaceY: 586 }
    case 'garden_path':
      return { xMin: 160, xMax: SCENE_W - 48, yMin: 404, yMax: 612, landSurfaceY: 618 }
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

/** True when a scene y coordinate is on land (not standing in open water). */
function pointInRect(px: number, py: number, rect: WaterRect): boolean {
  return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height
}

export function getWaterMaskClipRects(layout: ViewWaterLayout): WaterRect[] {
  const rects: WaterRect[] = []
  if (layout.bandHeight > 0) {
    rects.push({ x: 0, y: layout.waterTopY, width: SCENE_W, height: layout.bandHeight })
  }
  if (layout.corner) {
    rects.push(layout.corner)
  }
  return rects
}

export function rippleIntersectsWater(
  x: number,
  y: number,
  layout: ViewWaterLayout,
): boolean {
  const rects = getWaterMaskClipRects(layout)
  return rects.some((rect) => pointInRect(x, y, rect))
}

/** Y anchor for sun/moon column reflections on the water surface. */
export function getWaterReflectionCenterY(layout: ViewWaterLayout, fallbackSunX?: number): number {
  void fallbackSunX
  if (layout.bandHeight > 0) {
    return layout.waterTopY + Math.min(72, layout.bandHeight * 0.45)
  }
  if (layout.corner) {
    return layout.corner.y + layout.corner.height * 0.38
  }
  return SCENE_H - 40
}

export function isSceneYOnLand(y: number, view: GardenLandscapeView): boolean {
  const layout = getViewWaterLayout(view)
  const rects = getWaterMaskClipRects(layout)
  if (rects.length === 0) return true
  return !rects.some((rect) => y >= rect.y - 2 && y <= rect.y + rect.height + 2)
}

export function projectMemoryToScene(
  position: Position,
  view: GardenLandscapeView,
): { x: number; y: number } {
  const { nx, ny } = normalizeStored(position)
  const band = getViewPlantBand(view)
  const x = Math.max(
    band.xMin,
    Math.min(band.xMax, band.xMin + nx * (band.xMax - band.xMin) + VIEW_X_SHIFT[view]),
  )
  let y = band.yMin + ny * (band.yMax - band.yMin)
  const landY = band.landSurfaceY - 2
  if (!isSceneYOnLand(y, view) || y > landY) {
    y = Math.min(y, landY)
  }
  y = Math.max(band.yMin, Math.min(band.yMax, y))
  return { x, y }
}
