import type { GardenLandscapeView, Position } from '@/lib/types'
import { SCENE_W } from '@/lib/garden/scene-constants'
import { getPondGeometry, LANDSCAPE_HORIZON_Y, pointInWaterBand } from '@/lib/garden/landscape-pond'

/** Compass radians: camera looks toward +WZ (pond / south in world space). */
export const CAMERA_YAW: Record<GardenLandscapeView, number> = {
  pond: 0,
  lakeside: Math.PI / 2,
  meadow: Math.PI,
  garden_path: (3 * Math.PI) / 2,
}

export type PlantFacing = 'front' | 'right' | 'back' | 'left'

export interface WorldCoord {
  wx: number
  wz: number
}

export interface SceneProjection {
  x: number
  y: number
  /** Painter order — larger draws on top. */
  depth: number
  facing: PlantFacing
}

const STORED_X_MIN = 80
const STORED_X_MAX = 1180
const STORED_Y_MIN = 420
const STORED_Y_MAX = 468

const WORLD_SPAN_X = 0.92
const WORLD_SPAN_Z = 0.88

/** Pond occupies the southern edge of world space (high wz). */
const WORLD_WATER_WZ = 0.9

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

export function resolvePlantFacing(
  view: GardenLandscapeView,
  objectYaw = 0,
): PlantFacing {
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

export function projectWorldToScene(world: WorldCoord, view: GardenLandscapeView): SceneProjection {
  const band = plantBand(view)
  const yaw = CAMERA_YAW[view]
  const cx = world.wx - 0.5
  const cz = world.wz - 0.5
  const rx = cx * Math.cos(yaw) - cz * Math.sin(yaw)
  const rz = cx * Math.sin(yaw) + cz * Math.cos(yaw)

  const x = SCENE_W / 2 + rx * SCENE_W * WORLD_SPAN_X
  let y = band.landSurfaceY - 8 - rz * (band.landSurfaceY - band.yMin) * WORLD_SPAN_Z * 1.05

  const landY = band.landSurfaceY - 2
  if (!sceneLandAt(x, y, view) || y > landY) {
    y = Math.min(y, landY)
  }
  y = Math.max(band.yMin, Math.min(band.yMax, y))

  const depth = rz * 1000 + y
  const facing = resolvePlantFacing(view, 0)

  return { x, y, depth, facing }
}

export function projectMemoryToSceneWorld(
  position: Position,
  view: GardenLandscapeView,
): { x: number; y: number; depth: number; facing: PlantFacing } {
  const proj = projectWorldToScene(positionToWorld(position), view)
  return { x: proj.x, y: proj.y, depth: proj.depth, facing: proj.facing }
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
