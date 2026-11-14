import type { VoxelRockTier } from '@/components/open-world/minecraft-visual'
import type { WalkCapturePose } from './walk-capture-bridge'

const DEFAULT_CAPTURE_FOV = 68

export const SCENERY_PROP_CLEAR_RADIUS = 4

/** East glade — fence alone, no rocks in 4 m. */
export const GARDEN_AMBIENT_FENCE = {
  x: 19,
  z: 24,
  yaw: -0.72,
} as const

/** North-west patch — stump alone. */
export const GARDEN_AMBIENT_STUMP = {
  x: -17,
  z: 27,
} as const

/** West meadow edge — tier lineup, away from walk row (plants z≈14–30). */
export const WALK_ROCK_TIER_SHOWCASE: Array<{
  x: number
  z: number
  seed: number
  tier: VoxelRockTier
}> = [
  { x: -12.5, z: 5.5, seed: 701, tier: 'small' },
  { x: -8.25, z: 6, seed: 702, tier: 'medium' },
  { x: -4, z: 5.75, seed: 703, tier: 'large' },
]

export const ROCK_TIER_LINEUP_CENTER = { x: -8.25, z: 6 } as const

export type GardenSceneryCloseupKind = 'rock-tiers' | 'fence' | 'stump'

export interface GardenSceneryFocus {
  x: number
  z: number
  aimY: number
  /** Approximate subject height for framing. */
  height: number
  /** Camera offset from focus (world space, approach from +Z / path side). */
  camDx: number
  camDz: number
}

export const GARDEN_SCENERY_CLOSEUP: Record<GardenSceneryCloseupKind, GardenSceneryFocus> = {
  'rock-tiers': {
    x: ROCK_TIER_LINEUP_CENTER.x,
    z: ROCK_TIER_LINEUP_CENTER.z,
    aimY: 0.72,
    height: 1.05,
    camDx: 1.1,
    camDz: 3.4,
  },
  fence: {
    x: GARDEN_AMBIENT_FENCE.x,
    z: GARDEN_AMBIENT_FENCE.z,
    aimY: 0.92,
    height: 0.95,
    camDx: 4.2,
    camDz: 3.6,
  },
  stump: {
    x: GARDEN_AMBIENT_STUMP.x,
    z: GARDEN_AMBIENT_STUMP.z,
    aimY: 1.05,
    height: 0.72,
    camDx: 2.4,
    camDz: 3.1,
  },
}

const TARGET_FILL = 0.46

export function sceneryAnchorsMeetClearance(): boolean {
  const fence = { x: GARDEN_AMBIENT_FENCE.x, z: GARDEN_AMBIENT_FENCE.z }
  const stump = { x: GARDEN_AMBIENT_STUMP.x, z: GARDEN_AMBIENT_STUMP.z }
  const lineup = ROCK_TIER_LINEUP_CENTER
  if (Math.hypot(fence.x - stump.x, fence.z - stump.z) < SCENERY_PROP_CLEAR_RADIUS) return false
  if (Math.hypot(fence.x - lineup.x, fence.z - lineup.z) < SCENERY_PROP_CLEAR_RADIUS) return false
  if (Math.hypot(stump.x - lineup.x, stump.z - lineup.z) < SCENERY_PROP_CLEAR_RADIUS) return false
  return true
}

/** Shared deterministic camera (identical before @40da93a and after). */
export function computeGardenSceneryCloseupPose(
  kind: GardenSceneryCloseupKind,
  footY: (x: number, z: number) => number,
  pullBack = 1,
): WalkCapturePose {
  const f = GARDEN_SCENERY_CLOSEUP[kind]
  let camX = f.x + f.camDx * pullBack
  let camZ = f.z + f.camDz * pullBack
  if (kind === 'fence') {
    const dist = 5.2 * pullBack
    const fy = GARDEN_AMBIENT_FENCE.yaw
    const fx = GARDEN_AMBIENT_FENCE.x
    const fz = GARDEN_AMBIENT_FENCE.z
    const perpX = Math.cos(fy) * dist
    const perpZ = Math.sin(fy) * dist
    const alongX = Math.sin(fy) * 1.4 * pullBack
    const alongZ = -Math.cos(fy) * 1.4 * pullBack
    camX = fx + perpX + alongX
    camZ = fz + perpZ + alongZ
  }
  const ground = footY(camX, camZ)
  const eyeY = ground + 1.62
  const dx = f.x - camX
  const dz = f.z - camZ
  const dy = f.aimY - eyeY
  const yaw = Math.atan2(-dx, -dz)
  const horiz = Math.hypot(dx, dz)
  let pitch = -Math.atan2(dy, horiz)
  if (kind === 'stump') {
    pitch = Math.min(pitch, -0.2)
  } else if (pitch > -0.08) {
    pitch = -0.08
  }
  void TARGET_FILL
  return { x: camX, z: camZ, yaw, pitch, eyeY }
}