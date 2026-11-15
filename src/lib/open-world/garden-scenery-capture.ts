import type { WalkCapturePose } from './walk-capture-bridge'

/** Watercolor showcase fence (~1.1 m tall); pixel stump anchor is separate. */
export const GARDEN_AMBIENT_FENCE = {
  x: 19,
  z: 24,
  yaw: -0.72,
} as const

export const GARDEN_AMBIENT_STUMP = {
  x: -17,
  z: 27,
} as const

export type GardenSceneryCloseupKind = 'fence' | 'stump' | 'rocks'

export interface GardenSceneryFocus {
  x: number
  z: number
  aimY: number
  camDx: number
  camDz: number
}

export const GARDEN_SCENERY_CLOSEUP: Record<GardenSceneryCloseupKind, GardenSceneryFocus> = {
  fence: {
    x: GARDEN_AMBIENT_FENCE.x,
    z: GARDEN_AMBIENT_FENCE.z,
    /** Meters above terrain at the fence anchor (post height ≈1.08 m). */
    aimY: 0.54,
    camDx: 4.2,
    camDz: 3.6,
  },
  stump: {
    x: GARDEN_AMBIENT_STUMP.x,
    z: GARDEN_AMBIENT_STUMP.z,
    aimY: 1.05,
    camDx: 2.4,
    camDz: 3.1,
  },
  /** Pond-edge hero boulder (matches terrain `rockPositions` near x≈-4.6, z≈-4.2). */
  rocks: {
    x: -4.55,
    z: -4.15,
    aimY: 0.52,
    camDx: 2.35,
    camDz: 2.75,
  },
}

/** Shared deterministic camera (identical before @40da93a and after for each subject). */
export function computeGardenSceneryCloseupPose(
  kind: GardenSceneryCloseupKind,
  footY: (x: number, z: number) => number,
  pullBack = 1,
): WalkCapturePose {
  const f = GARDEN_SCENERY_CLOSEUP[kind]
  let camX = f.x + f.camDx * pullBack
  let camZ = f.z + f.camDz * pullBack
  if (kind === 'fence') {
    const dist = 0.22 * pullBack
    const fy = GARDEN_AMBIENT_FENCE.yaw
    const fx = GARDEN_AMBIENT_FENCE.x
    const fz = GARDEN_AMBIENT_FENCE.z
    const perpX = Math.cos(fy) * dist
    const perpZ = Math.sin(fy) * dist
    const alongX = Math.sin(fy) * 0.82 * pullBack
    const alongZ = -Math.cos(fy) * 0.82 * pullBack
    camX = fx + perpX + alongX
    camZ = fz + perpZ + alongZ
  }
  const ground = footY(camX, camZ)
  const fenceFoot = kind === 'fence' ? footY(f.x, f.z) : ground
  const eyeY = kind === 'fence' ? fenceFoot + 0.88 : ground + 1.62
  const dx = f.x - camX
  const dz = f.z - camZ
  const aimY = kind === 'fence' ? fenceFoot + f.aimY : f.aimY
  const dy = aimY - eyeY
  const yaw = Math.atan2(-dx, -dz)
  const horiz = Math.hypot(dx, dz)
  let pitch = -Math.atan2(dy, horiz)
  if (kind === 'stump') {
    pitch = Math.min(pitch, -0.2)
  } else if (kind === 'fence') {
    pitch = Math.min(pitch, -0.42)
  } else if (kind === 'rocks') {
    pitch = Math.min(pitch, -0.32)
  } else if (pitch > -0.08) {
    pitch = -0.08
  }
  return { x: camX, z: camZ, yaw, pitch, eyeY }
}