/** Keep in sync with `src/lib/open-world/garden-scenery-capture.ts`. */
const DEFAULT_CAPTURE_FOV = 68

const GARDEN_SCENERY_CLOSEUP = {
  'rock-tiers': { x: -8, z: 6, aimY: 0.68, height: 1.15, camDx: 0.8, camDz: 5.4 },
  fence: { x: 19, z: 24, aimY: 0.96, height: 1.05, camDx: 6.5, camDz: 2.8 },
  stump: { x: -17, z: 27, aimY: 0.52, height: 0.62, camDx: 3.2, camDz: 4.6 },
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
    const dist = 5.8 * pullBack
    const fy = 0.92
    camX = 19 + Math.sin(fy) * dist
    camZ = 24 - Math.cos(fy) * dist
  }
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