import type { VoxelRockTier } from '@/components/open-world/minecraft-visual'
import type { WalkCapturePose } from './walk-capture-bridge'

const DEFAULT_CAPTURE_FOV = 68

/** Along south side of the main walk row (plants at z≈14–30); visible from spawn path, off plant pins. */
export const GARDEN_AMBIENT_FENCE = {
  x: 10.5,
  z: 20.5,
  yaw: 0.92,
} as const

export const GARDEN_AMBIENT_STUMP = {
  x: 13.5,
  z: 19.25,
} as const

/** Three-tier rock lineup — one camera frames small + medium + large together. */
export const WALK_ROCK_TIER_SHOWCASE: Array<{
  x: number
  z: number
  seed: number
  tier: VoxelRockTier
}> = [
  { x: 5.5, z: 20.75, seed: 701, tier: 'small' },
  { x: 9.25, z: 20.5, seed: 702, tier: 'medium' },
  { x: 13.75, z: 20.25, seed: 703, tier: 'large' },
]

export type GardenSceneryCloseupKind = 'rock-tiers' | 'fence' | 'stump'

export interface GardenSceneryFocus {
  x: number
  z: number
  aimY: number
  span: number
  height: number
  yawBias: number
}

export const GARDEN_SCENERY_CLOSEUP: Record<GardenSceneryCloseupKind, GardenSceneryFocus> = {
  'rock-tiers': {
    x: 9.5,
    z: 20.5,
    aimY: 1.35,
    span: 5.2,
    height: 2.8,
    yawBias: -0.15,
  },
  fence: {
    x: GARDEN_AMBIENT_FENCE.x,
    z: GARDEN_AMBIENT_FENCE.z,
    aimY: 1.05,
    span: 1.35,
    height: 1.05,
    yawBias: GARDEN_AMBIENT_FENCE.yaw,
  },
  stump: {
    x: GARDEN_AMBIENT_STUMP.x,
    z: GARDEN_AMBIENT_STUMP.z,
    aimY: 0.55,
    span: 0.85,
    height: 0.65,
    yawBias: -0.35,
  },
}

/** Shared deterministic camera (before @40da93a and after use identical numbers). */
export function computeGardenSceneryCloseupPose(
  kind: GardenSceneryCloseupKind,
  footY: (x: number, z: number) => number,
): WalkCapturePose {
  const f = GARDEN_SCENERY_CLOSEUP[kind]
  const targetFill = 0.44
  const fovRad = (DEFAULT_CAPTURE_FOV * Math.PI) / 180
  const dist = (f.height * 0.95) / (Math.tan(fovRad / 2) * targetFill)
  const camZ = f.z + dist * 0.94
  const camX = f.x - dist * 0.34
  const ground = footY(camX, camZ)
  const eyeY = ground + 1.58
  const dx = f.x - camX
  const dz = f.z - camZ
  const dy = f.aimY - eyeY
  const yaw = Math.atan2(-dx, -dz)
  const horiz = Math.hypot(dx, dz)
  const pitch = -Math.atan2(dy, horiz)
  return { x: camX, z: camZ, yaw, pitch, eyeY }
}