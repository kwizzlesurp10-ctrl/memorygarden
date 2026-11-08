import type { GardenLandscapeView } from '@/lib/types'
import { projectWorldToScene, type WorldLayer } from '@/lib/garden/landscape-world'

/** Starter mature mushroom cap width in SVG user units (stemW=5.6, capHW=0.95×stemW). */
export const STARTER_MUSHROOM_STEM_W = 5.6
export const STARTER_MUSHROOM_CAP_WIDTH_UNITS = 2 * STARTER_MUSHROOM_STEM_W * 0.95

export const STARTER_CAP_PX_NEAR_MIN = 28
export const STARTER_CAP_PX_NEAR_MAX = 34
export const STARTER_CAP_PX_FAR_MIN = 13
export const STARTER_CAP_PX_FAR_MAX = 16

const FAR_TARGET = (STARTER_CAP_PX_FAR_MIN + STARTER_CAP_PX_FAR_MAX) / 2
const NEAR_TARGET = (STARTER_CAP_PX_NEAR_MIN + STARTER_CAP_PX_NEAR_MAX) / 2

export function starterMushroomDepthT(wz: number, wzMin: number, wzMax: number): number {
  if (wzMax <= wzMin) return 1
  return Math.max(0, Math.min(1, (wz - wzMin) / (wzMax - wzMin)))
}

export function targetStarterMushroomCapWidthPx(depthT: number): number {
  return FAR_TARGET + depthT * (NEAR_TARGET - FAR_TARGET)
}

export function starterMushroomLayer(wz: number): WorldLayer {
  return wz < 0.26 ? 'far' : wz > 0.44 ? 'near' : 'mid'
}

/** World `scale()` multiplier so cap width hits pixel targets on the 1200×700 scene. */
export function starterMushroomWorldDrawScale(
  wz: number,
  projScale: number,
  decorScale: number,
  wzMin: number,
  wzMax: number,
): number {
  const depthT = starterMushroomDepthT(wz, wzMin, wzMax)
  const targetPx = targetStarterMushroomCapWidthPx(depthT)
  const base = STARTER_MUSHROOM_CAP_WIDTH_UNITS * Math.max(0.01, projScale * decorScale)
  return targetPx / base
}

export function projectedStarterMushroomCapWidthPx(
  wx: number,
  wz: number,
  view: GardenLandscapeView,
  decorScale: number,
  wzMin: number,
  wzMax: number,
): number {
  const layer = starterMushroomLayer(wz)
  const proj = projectWorldToScene({ wx, wz }, view, { layer })
  const draw = starterMushroomWorldDrawScale(wz, proj.scale, decorScale, wzMin, wzMax)
  return STARTER_MUSHROOM_CAP_WIDTH_UNITS * proj.scale * decorScale * draw
}

export function starterMushroomWzBounds(mushrooms: ReadonlyArray<{ wz: number }>): { wzMin: number; wzMax: number } {
  let wzMin = 1
  let wzMax = 0
  for (const m of mushrooms) {
    wzMin = Math.min(wzMin, m.wz)
    wzMax = Math.max(wzMax, m.wz)
  }
  if (wzMax <= wzMin) wzMax = wzMin + 0.01
  return { wzMin, wzMax }
}
