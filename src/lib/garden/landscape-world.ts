import type { GardenLandscapeView, Position } from '@/lib/types'
import { SCENE_H, SCENE_W } from '@/lib/garden/scene-constants'
import { getPondGeometry, LANDSCAPE_HORIZON_Y, pointInWaterBand } from '@/lib/garden/landscape-pond'

/** Camera looks toward +WZ (pond / south). */
export const CAMERA_YAW: Record<GardenLandscapeView, number> = {
  pond: 0,
  lakeside: Math.PI / 2,
  meadow: Math.PI,
  garden_path: (3 * Math.PI) / 2,
}

export const VIEW_FRAME: Record<
  GardenLandscapeView,
  { rxMul: number; rzMul: number; panX: number; skyPanX: number }
> = {
  pond: { rxMul: 1, rzMul: 1, panX: 0, skyPanX: 0 },
  lakeside: { rxMul: 1.18, rzMul: 0.88, panX: -72, skyPanX: -48 },
  meadow: { rxMul: 1.08, rzMul: 1.22, panX: 28, skyPanX: 22 },
  garden_path: { rxMul: 1.14, rzMul: 1.28, panX: 96, skyPanX: 56 },
}

export type PlantFacing = 'front' | 'right' | 'back' | 'left'

export type WorldLayer = 'far' | 'mid' | 'near'

export interface WorldCoord {
  wx: number
  wz: number
}

export interface SceneProjection {
  x: number
  y: number
  depth: number
  facing: PlantFacing
  scale: number
  rimFromLeft: boolean
}

const STORED_X_MIN = 80
const STORED_X_MAX = 1180
const STORED_Y_MIN = 420
const STORED_Y_MAX = 468

const WORLD_SPAN_X = 1.02
const WORLD_SPAN_Z = 0.95

/** Pond occupies the southern edge of world space (high wz). */
const WORLD_WATER_WZ = 0.88
const SHORE_BUFFER_WZ = 0.62

export function positionToWorld(position: Position): WorldCoord {
  const wx = Math.max(0, Math.min(1, (position.x - STORED_X_MIN) / (STORED_X_MAX - STORED_X_MIN)))
  const wz = Math.max(0, Math.min(1, (position.y - STORED_Y_MIN) / (STORED_Y_MAX - STORED_Y_MIN)))
  return { wx, wz }
}

export function worldToStored(world: WorldCoord): Position {
  return {
    x: STORED_X_MIN + world.wx * (STORED_X_MAX - STORED_X_MIN),
    y: STORED_Y_MIN + world.wz * (STORED_Y_MAX - STORED_Y_MIN),
  }
}

function sceneLandAt(x: number, y: number, view: GardenLandscapeView): boolean {
  return !pointInWaterBand(x, y, getPondGeometry(view))
}

function plantBand(view: GardenLandscapeView): {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  landSurfaceY: number
} {
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

export function isWorldOnLand(world: WorldCoord): boolean {
  if (world.wz >= WORLD_WATER_WZ) return false
  const pond = projectWorldToScene(world, 'pond')
  return sceneLandAt(pond.x, pond.y, 'pond')
}

export function isWorldOffShoreGrass(world: WorldCoord): boolean {
  return isWorldOnLand(world) && world.wz <= SHORE_BUFFER_WZ
}

export function resolvePlantFacing(view: GardenLandscapeView, objectYaw = 0): PlantFacing {
  const relative = normalizeAngle(CAMERA_YAW[view] - objectYaw)
  const quad = Math.round(relative / (Math.PI / 2)) % 4
  switch ((quad + 4) % 4) {
    case 0:
      return 'front'
    case 1:
      return 'right'
    case 2:
      return 'back'
    case 3:
      return 'left'
    default: {
      const _exhaustive: never = quad as never
      return _exhaustive
    }
  }
}

function depthScaleFromRz(rz: number, layer: WorldLayer): number {
  const closeness = Math.max(0, Math.min(1, 0.5 - rz))
  const base = layer === 'far' ? 0.55 : layer === 'near' ? 1.28 : 1
  return base * (0.72 + closeness * 0.75)
}

export function projectWorldToScene(
  world: WorldCoord,
  view: GardenLandscapeView,
  options?: { objectYaw?: number; layer?: WorldLayer },
): SceneProjection {
  const band = plantBand(view)
  const frame = VIEW_FRAME[view]
  const yaw = CAMERA_YAW[view]
  const layer = options?.layer ?? 'mid'
  const objectYaw = options?.objectYaw ?? 0

  const cx = world.wx - 0.5
  const cz = world.wz - 0.5
  let rx = (cx * Math.cos(yaw) - cz * Math.sin(yaw)) * frame.rxMul
  let rz = (cx * Math.sin(yaw) + cz * Math.cos(yaw)) * frame.rzMul

  if (layer === 'far') {
    rx *= 1.35
    rz *= 0.55
  } else if (layer === 'near') {
    rz *= 1.12
  }

  const x = SCENE_W / 2 + rx * SCENE_W * WORLD_SPAN_X + frame.panX

  const ySpan = band.landSurfaceY - band.yMin
  const layerLift = layer === 'far' ? 38 : layer === 'near' ? -22 : 0
  let y = band.landSurfaceY - 8 - rz * ySpan * WORLD_SPAN_Z * 1.08 + layerLift

  if (layer === 'near') {
    y = Math.min(SCENE_H - 38, y + 24)
  }

  const landY = band.landSurfaceY - 2
  if (!sceneLandAt(x, y, view) || y > landY) {
    y = Math.min(y, landY)
  }
  y = Math.max(band.yMin, Math.min(band.yMax, y))

  const depth = rz * 1000 + y
  const facing = resolvePlantFacing(view, objectYaw)
  const scale = depthScaleFromRz(rz, layer)
  const rimFromLeft = Math.cos(yaw - objectYaw) >= 0

  return { x, y, depth, facing, scale, rimFromLeft }
}

export function projectWorldToSky(world: WorldCoord, view: GardenLandscapeView): { x: number; y: number } {
  const frame = VIEW_FRAME[view]
  const yaw = CAMERA_YAW[view]
  const cx = world.wx - 0.5
  const cz = world.wz - 0.5
  const rx = (cx * Math.cos(yaw) - cz * Math.sin(yaw)) * frame.rxMul
  const x = SCENE_W / 2 + rx * SCENE_W * 0.82 + frame.skyPanX
  const y = 72 + (0.5 - cz) * 90
  return { x: Math.max(48, Math.min(SCENE_W - 48, x)), y: Math.max(52, Math.min(200, y)) }
}

export function viewRimLighting(view: GardenLandscapeView): { lightX: number; rimFromLeft: boolean } {
  const sun = projectWorldToSky({ wx: 0.72, wz: -0.22 }, view)
  return { lightX: sun.x, rimFromLeft: sun.x < SCENE_W / 2 }
}

export function projectMemoryToSceneWorld(
  position: Position,
  view: GardenLandscapeView,
): { x: number; y: number; depth: number; facing: PlantFacing; scale: number; rimFromLeft: boolean } {
  const proj = projectWorldToScene(positionToWorld(position), view, { layer: 'mid' })
  const memoryScale = proj.scale * (1.02 + Math.max(0, (proj.y - 440) / 220) * 0.35)
  return {
    x: proj.x,
    y: proj.y,
    depth: proj.depth,
    facing: proj.facing,
    scale: Math.min(1.55, memoryScale),
    rimFromLeft: proj.rimFromLeft,
  }
}

export function projectMemoryToSceneCompat(position: Position, view: GardenLandscapeView): { x: number; y: number } {
  const { x, y } = projectMemoryToSceneWorld(position, view)
  return { x, y }
}

function normalizeAngle(rad: number): number {
  let a = rad % (2 * Math.PI)
  if (a < 0) a += 2 * Math.PI
  return a
}
