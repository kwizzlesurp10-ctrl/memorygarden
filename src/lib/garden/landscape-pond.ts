import type { GardenLandscapeView } from '@/lib/types'
import { SCENE_H, SCENE_W } from '@/lib/garden/scene-constants'

/** Classic horizon / back of near hill — unchanged across views. */
export const LANDSCAPE_HORIZON_Y = 470

export const POND_FULL_DEPTH = SCENE_H - LANDSCAPE_HORIZON_Y

/** Fraction of pond depth still visible (1 = full pond like default). */
const VISIBLE_POND_FRACTION: Record<GardenLandscapeView, number> = {
  pond: 1,
  lakeside: 0.42,
  meadow: 0.22,
  garden_path: 0,
}

export interface PondGeometry {
  view: GardenLandscapeView
  /** Top of open water (SVG y). Infinity-ish when no band water. */
  waterTopY: number
  /** Full-scene water path for clip + fill; null only if misconfigured. */
  waterPathD: string
  /** Shore lip stroke along top of water. */
  shoreLineD: string
  /** True for pond / lakeside / meadow band water. */
  bandWater: boolean
}

function wavyShorePoints(waterTopY: number): { left: number; mid: number; right: number } {
  return {
    left: waterTopY + 3,
    mid: waterTopY - 5,
    right: waterTopY + 2,
  }
}

/** Single organic pond sheet — full width, curved top edge. */
export function bandWaterPathD(waterTopY: number): string {
  const s = wavyShorePoints(waterTopY)
  return [
    `M -12 ${s.left}`,
    `Q 220 ${s.mid} 480 ${waterTopY - 2}`,
    `Q 760 ${waterTopY + 1} 1040 ${s.right}`,
    `Q 1220 ${waterTopY - 3} 1212 ${waterTopY + 4}`,
    `L 1212 ${SCENE_H + 12}`,
    `L -12 ${SCENE_H + 12}`,
    'Z',
  ].join(' ')
}

export function bandShoreLineD(waterTopY: number): string {
  const s = wavyShorePoints(waterTopY)
  return `M -12 ${s.left} Q 220 ${s.mid} 480 ${waterTopY - 2} Q 760 ${waterTopY + 1} 1040 ${s.right} Q 1220 ${waterTopY - 3} 1212 ${waterTopY + 4}`
}

/** Garden path: same pond cropped to ~10% of frame at bottom-left. */
export function cornerPoolPathD(): string {
  return [
    'M -12 712',
    'L -12 628',
    'Q 28 596 108 600',
    'Q 198 606 268 634',
    'Q 318 668 248 706',
    'Q 120 722 -12 712',
    'Z',
  ].join(' ')
}

export function cornerPoolShoreLineD(): string {
  return 'M -12 628 Q 48 592 128 598 Q 208 604 278 632 Q 308 656 268 678'
}

export function bandWaterTopY(view: GardenLandscapeView): number {
  const visible = VISIBLE_POND_FRACTION[view]
  if (visible <= 0) return SCENE_H + 1
  if (visible >= 1) return LANDSCAPE_HORIZON_Y
  const hidden = 1 - visible
  return Math.round(LANDSCAPE_HORIZON_Y + POND_FULL_DEPTH * hidden)
}

export function getPondGeometry(view: GardenLandscapeView): PondGeometry {
  if (view === 'garden_path') {
    return {
      view,
      waterTopY: SCENE_H,
      waterPathD: cornerPoolPathD(),
      shoreLineD: cornerPoolShoreLineD(),
      bandWater: false,
    }
  }
  const waterTopY = bandWaterTopY(view)
  return {
    view,
    waterTopY,
    waterPathD: bandWaterPathD(waterTopY),
    shoreLineD: bandShoreLineD(waterTopY),
    bandWater: true,
  }
}

/** Ground plane — always covers horizon to bottom (full bleed). */
export function groundPlanePathD(): string {
  return `M -280 ${LANDSCAPE_HORIZON_Y} L ${SCENE_W + 280} ${LANDSCAPE_HORIZON_Y} L ${SCENE_W + 280} ${SCENE_H + 8} L -280 ${SCENE_H + 8} Z`
}

/** Earthen garden path (filled), wide at foreground, narrow toward horizon. */
export function gardenPathFillD(): string {
  return [
    `M 60 ${SCENE_H - 8}`,
    `Q 280 ${SCENE_H - 42} 520 ${SCENE_H - 58}`,
    `Q 760 ${SCENE_H - 72} 980 ${SCENE_H - 54}`,
    `Q 1120 ${SCENE_H - 38} 1180 ${SCENE_H - 18}`,
    `L 1120 ${SCENE_H - 4}`,
    `Q 820 ${SCENE_H - 62} 520 ${SCENE_H - 78}`,
    `Q 240 ${SCENE_H - 82} 80 ${SCENE_H - 18}`,
    'Z',
  ].join(' ')
}

/** Soft path mid-ground ribbon (garden path view only). */
export function gardenPathMidRibbonD(waterTopY: number): string {
  const y0 = Math.min(578, waterTopY - 18)
  return [
    `M 140 ${y0 + 38}`,
    `Q 420 ${y0 + 12} 700 ${y0 + 22}`,
    `Q 940 ${y0 + 30} 1080 ${y0 + 44}`,
    `L 1040 ${y0 + 56}`,
    `Q 720 ${y0 + 42} 380 ${y0 + 48}`,
    `Q 200 ${y0 + 58} 120 ${y0 + 52}`,
    'Z',
  ].join(' ')
}

export function pointInWaterBand(
  px: number,
  py: number,
  geom: PondGeometry,
): boolean {
  if (geom.view === 'garden_path') {
    return px <= 320 && py >= 595 && py <= SCENE_H + 4
  }
  if (!geom.bandWater) return false
  return py >= geom.waterTopY - 4 && py <= SCENE_H + 4 && px >= -12 && px <= SCENE_W + 12
}

export function waterReflectionCenterY(geom: PondGeometry): number {
  if (geom.view === 'garden_path') {
    return 668
  }
  const depth = SCENE_H - geom.waterTopY
  return geom.waterTopY + Math.min(64, depth * 0.42)
}
