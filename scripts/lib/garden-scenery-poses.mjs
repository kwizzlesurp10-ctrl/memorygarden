/** Keep in sync with `src/lib/open-world/garden-scenery-capture.ts`. */
const GARDEN_AMBIENT_FENCE_YAW = -0.72

const GARDEN_SCENERY_CLOSEUP = {
  fence: { x: 19, z: 24, aimY: 0.54, camDx: 4.2, camDz: 3.6 },
  stump: { x: -17, z: 27, aimY: 1.05, camDx: 2.4, camDz: 3.1 },
  rocks: { x: -4.55, z: -4.15, aimY: 0.52, camDx: 2.35, camDz: 2.75 },
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
    const dist = 0.22 * pullBack
    const fy = GARDEN_AMBIENT_FENCE_YAW
    const fx = f.x
    const fz = f.z
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
  if (kind === 'stump') pitch = Math.min(pitch, -0.2)
  else if (kind === 'fence') pitch = Math.min(pitch, -0.42)
  else if (kind === 'rocks') pitch = Math.min(pitch, -0.32)
  else if (pitch > -0.08) pitch = -0.08
  return { x: camX, z: camZ, yaw, pitch, eyeY }
}