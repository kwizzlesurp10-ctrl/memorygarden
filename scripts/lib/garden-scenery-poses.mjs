/** Keep in sync with `src/lib/open-world/garden-scenery-capture.ts`. */
const DEFAULT_CAPTURE_FOV = 68

const GARDEN_SCENERY_CLOSEUP = {
  'rock-tiers': { x: 9.5, z: 20.5, aimY: 1.35, height: 2.8 },
  fence: { x: 10.5, z: 20.5, aimY: 1.05, height: 1.05 },
  stump: { x: 13.5, z: 19.25, aimY: 0.55, height: 0.65 },
}

export function walkCaptureGroundY(x, z) {
  return Math.max(0, Math.round(Math.sin(x * 0.31) * 0.4 + Math.cos(z * 0.27) * 0.35))
}

export function computeGardenSceneryCloseupPose(kind, footY = walkCaptureGroundY) {
  const f = GARDEN_SCENERY_CLOSEUP[kind]
  if (!f) return null
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