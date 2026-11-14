/** Must match `src/lib/open-world/walk-pond-capture.ts` (synthetic layout pond). */
export const WALK_SYNTHETIC_POND = { x: 0, z: -5.5, radius: 5.4 }

export function walkPondCloseupPoseFromFoot(footY) {
  const camX = WALK_SYNTHETIC_POND.x + 0.85
  const camZ = WALK_SYNTHETIC_POND.z + WALK_SYNTHETIC_POND.radius + 1.85
  const eyeY = footY + 1.55
  const dx = WALK_SYNTHETIC_POND.x - camX
  const dz = WALK_SYNTHETIC_POND.z - camZ
  const yaw = Math.atan2(dx, dz) + Math.PI
  const horiz = Math.hypot(dx, dz)
  const pitch = Math.min(-Math.atan2(eyeY - 0.1, horiz) - 0.05, -0.38)
  return { x: camX, z: camZ, yaw, pitch, eyeY }
}