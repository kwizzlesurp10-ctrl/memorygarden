/** Keep in sync with `src/lib/open-world/garden-scenery-capture.ts`. */
const DEFAULT_CAPTURE_FOV = 68

const GARDEN_SCENERY_CLOSEUP = {
  'rock-tiers': { x: -8, z: 6, aimY: 0.72, height: 1.15, camDx: 1.2, camDz: 7.8 },
  fence: { x: 19, z: 24, aimY: 0.88, height: 1.05, camDx: -5.2, camDz: 5.5 },
  stump: { x: -17, z: 27, aimY: 0.48, height: 0.62, camDx: 4.8, camDz: 5.2 },
}

export function walkCaptureGroundY(x, z) {
  return Math.max(0, Math.round(Math.sin(x * 0.31) * 0.4 + Math.cos(z * 0.27) * 0.35))
}

export function computeGardenSceneryCloseupPose(kind, footY = walkCaptureGroundY, pullBack = 1) {
  const f = GARDEN_SCENERY_CLOSEUP[kind]
  if (!f) return null
  const camX = f.x + f.camDx * pullBack
  const camZ = f.z + f.camDz * pullBack
  const ground = footY(camX, camZ)
  const eyeY = ground + 1.62
  const dx = f.x - camX
  const dz = f.z - camZ
  const dy = f.aimY - eyeY
  const yaw = Math.atan2(-dx, -dz)
  const horiz = Math.hypot(dx, dz)
  let pitch = -Math.atan2(dy, horiz)
  if (pitch > -0.08) pitch = -0.08
  return { x: camX, z: camZ, yaw, pitch, eyeY }
}