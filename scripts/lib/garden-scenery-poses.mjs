/** Keep in sync with `src/lib/open-world/garden-scenery-capture.ts`. */
const DEFAULT_CAPTURE_FOV = 68

const GARDEN_AMBIENT_FENCE_YAW = -0.72

const GARDEN_SCENERY_CLOSEUP = {
  'rock-tiers': { x: -8.25, z: 6, aimY: 0.72, height: 1.05, camDx: 1.1, camDz: 2.75 },
  fence: { x: 19, z: 24, aimY: 0.92, height: 0.95, camDx: 4.2, camDz: 3.6 },
  stump: { x: -17, z: 27, aimY: 1.05, height: 0.72, camDx: 2.4, camDz: 3.1 },
}

export function walkCaptureGroundY(x, z) {
  return Math.max(0, Math.round(Math.sin(x * 0.31) * 0.4 + Math.cos(z * 0.27) * 0.35))
}

export function computeGardenSceneryCloseupPose(kind, footY = walkCaptureGroundY, pullBack = 1) {
  const f = GARDEN_SCENERY_CLOSEUP[kind]
  if (!f) return null
  let camX = f.x + f.camDx * pullBack
  let camZ = f.z + f.camDz * pullBack
  if (kind === 'fence') {
    const dist = 5.2 * pullBack
    const fy = GARDEN_AMBIENT_FENCE_YAW
    const perpX = Math.cos(fy) * dist
    const perpZ = Math.sin(fy) * dist
    const alongX = Math.sin(fy) * 1.4 * pullBack
    const alongZ = -Math.cos(fy) * 1.4 * pullBack
    camX = f.x + perpX + alongX
    camZ = f.z + perpZ + alongZ
  }
  const ground = footY(camX, camZ)
  const eyeY = ground + 1.62
  const dx = f.x - camX
  const dz = f.z - camZ
  const dy = f.aimY - eyeY
  const yaw = Math.atan2(-dx, -dz)
  const horiz = Math.hypot(dx, dz)
  let pitch = -Math.atan2(dy, horiz)
  if (kind === 'stump') pitch = Math.min(pitch, -0.2)
  else if (pitch > -0.08) pitch = -0.08
  void DEFAULT_CAPTURE_FOV
  return { x: camX, z: camZ, yaw, pitch, eyeY }
}