import type { GardenLandscapeView, Position } from '@/lib/types'
import { projectMemoryToSceneCompat } from '@/lib/garden/landscape-world'
import { SCENE_H, SCENE_W } from '@/lib/garden/scene-constants'
import {
  bandWaterTopY,
  getPondGeometry,
  LANDSCAPE_HORIZON_Y,
  pointInWaterBand,
  waterReflectionCenterY,
} from '@/lib/garden/landscape-pond'

export { LANDSCAPE_HORIZON_Y, getPondGeometry, type PondGeometry } from '@/lib/garden/landscape-pond'

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

export const GARDEN_LANDSCAPE_VIEW_COMPACT_LABEL: Record<GardenLandscapeView, string> = {
  pond: 'Pond',
  lakeside: 'Lake',
  meadow: 'Meadow',
  garden_path: 'Path',
}

/** @deprecated Use PondGeometry — kept for scene clip helpers. */
export interface WaterRect {
  x: number
  y: number
  width: number
  height: number
  rx?: number
}

export interface ViewWaterLayout {
  waterTopY: number
  bandHeight: number
  corner?: WaterRect
}

export interface ViewPlantBand {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
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

const VIEW_X_SHIFT: Record<GardenLandscapeView, number> = {
  pond: 0,
  lakeside: -12,
  meadow: 10,
  garden_path: -8,
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
  const geom = getPondGeometry(view)
  if (geom.bandWater) {
    return { waterTopY: geom.waterTopY, bandHeight: SCENE_H - geom.waterTopY }
  }
  return { waterTopY: SCENE_H, bandHeight: 0 }
}

export function getViewPlantBand(view: GardenLandscapeView): ViewPlantBand {
  const geom = getPondGeometry(view)
  const landY = geom.bandWater ? geom.waterTopY - 6 : LANDSCAPE_HORIZON_Y + 40
  switch (view) {
    case 'pond':
      return { xMin: 100, xMax: SCENE_W - 100, yMin: 432, yMax: 466, landSurfaceY: Math.min(466, landY) }
    case 'lakeside':
      return { xMin: 90, xMax: SCENE_W - 90, yMin: 428, yMax: landY - 2, landSurfaceY: landY }
    case 'meadow':
      return { xMin: 72, xMax: SCENE_W - 72, yMin: 418, yMax: landY - 2, landSurfaceY: landY }
    case 'garden_path':
      return { xMin: 160, xMax: SCENE_W - 48, yMin: 404, yMax: 612, landSurfaceY: 618 }
    default: {
      const _exhaustive: never = view
      return _exhaustive
    }
  }
}

export function getWaterMaskClipRects(layout: ViewWaterLayout): WaterRect[] {
  const rects: WaterRect[] = []
  if (layout.bandHeight > 0) {
    rects.push({ x: 0, y: layout.waterTopY, width: SCENE_W, height: layout.bandHeight })
  }
  return rects
}

export function rippleIntersectsWater(
  x: number,
  y: number,
  view: GardenLandscapeView,
): boolean {
  return pointInWaterBand(x, y, getPondGeometry(view))
}

export function getWaterReflectionCenterY(view: GardenLandscapeView, _fallbackSunX?: number): number {
  void _fallbackSunX
  return waterReflectionCenterY(getPondGeometry(view))
}

export function isSceneYOnLand(y: number, view: GardenLandscapeView, x: number = SCENE_W / 2): boolean {
  return !pointInWaterBand(x, y, getPondGeometry(view))
}

export function projectMemoryToScene(
  position: Position,
  view: GardenLandscapeView,
): { x: number; y: number } {
  return projectMemoryToSceneCompat(position, view)
}

/** @deprecated */
export function cornerWaterPathD(corner: WaterRect): string {
  return getPondGeometry('garden_path').waterPathD
}

export function shoreLineYForView(view: GardenLandscapeView): number {
  const geom = getPondGeometry(view)
  return geom.bandWater ? geom.waterTopY : LANDSCAPE_HORIZON_Y
}

export function bandWaterTopYForTests(view: GardenLandscapeView): number {
  return bandWaterTopY(view)
}

