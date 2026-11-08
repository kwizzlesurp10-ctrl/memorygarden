import type { GardenLandscapeView } from '@/lib/types'
import { VIEW_FRAME } from '@/lib/garden/landscape-world'
import { SCENE_W } from '@/lib/garden/scene-constants'

/** Hill paths extend past the scene so VIEW_FRAME pan never exposes sky gaps. */
export const HILL_OVERSCAN_L = -340
export const HILL_OVERSCAN_R = SCENE_W + 340
export const HILL_FLOOR_Y = 472

export function hillPanX(view: GardenLandscapeView): number {
  return VIEW_FRAME[view].panX * 0.35
}

/** Horizontal phase so each camera sees a different stretch of the same rolling hills. */
export function hillWorldShift(view: GardenLandscapeView): number {
  const base: Record<GardenLandscapeView, number> = {
    pond: 0,
    lakeside: -110,
    meadow: 85,
    garden_path: 190,
  }
  return base[view] + VIEW_FRAME[view].panX * 0.12
}

/** Furthest ridge — high, soft peaks. */
export function farHillPathD(shift: number): string {
  const s = shift
  return [
    `M ${HILL_OVERSCAN_L} 440`,
    `Q ${80 + s} 318 ${260 + s} 368`,
    `T ${540 + s} 328`,
    `Q ${720 + s} 298 ${920 + s} 352`,
    `T ${1180 + s} 318`,
    `Q ${1380 + s} 348 ${HILL_OVERSCAN_R} 302`,
    `L ${HILL_OVERSCAN_R} ${HILL_FLOOR_Y} L ${HILL_OVERSCAN_L} ${HILL_FLOOR_Y} Z`,
  ].join(' ')
}

/** Middle ridge — tighter valleys. */
export function midHillPathD(shift: number): string {
  const s = shift
  return [
    `M ${HILL_OVERSCAN_L} 458`,
    `Q ${60 + s} 388 ${220 + s} 412`,
    `T ${500 + s} 378`,
    `Q ${680 + s} 358 ${860 + s} 396`,
    `T ${1140 + s} 372`,
    `Q ${1310 + s} 392 ${HILL_OVERSCAN_R} 418`,
    `L ${HILL_OVERSCAN_R} ${HILL_FLOOR_Y} L ${HILL_OVERSCAN_L} ${HILL_FLOOR_Y} Z`,
  ].join(' ')
}

/** Nearest roll — small bumps before the bank. */
export function nearHillPathD(shift: number): string {
  const s = shift
  return [
    `M ${HILL_OVERSCAN_L} 464`,
    `Q ${60 + s} 438 ${210 + s} 452`,
    `Q ${380 + s} 468 ${540 + s} 442`,
    `Q ${710 + s} 426 ${860 + s} 454`,
    `Q ${1020 + s} 472 ${1170 + s} 446`,
    `Q ${1340 + s} 458 ${HILL_OVERSCAN_R} 468`,
    `L ${HILL_OVERSCAN_R} ${HILL_FLOOR_Y} L ${HILL_OVERSCAN_L} ${HILL_FLOOR_Y} Z`,
  ].join(' ')
}

