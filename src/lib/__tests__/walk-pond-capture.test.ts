import { describe, expect, it } from 'vitest'
import { walkPondCloseupPose, WALK_SYNTHETIC_POND } from '@/lib/open-world/walk-pond-capture'

describe('walkPondCloseupPose', () => {
  it('aims south toward the synthetic pond center (Three.js yaw + π)', () => {
    const pose = walkPondCloseupPose(0)
    const dx = WALK_SYNTHETIC_POND.x - pose.x
    const dz = WALK_SYNTHETIC_POND.z - pose.z
    expect(pose.x).toBeCloseTo(WALK_SYNTHETIC_POND.x + 0.85, 5)
    expect(pose.z).toBeCloseTo(WALK_SYNTHETIC_POND.z + WALK_SYNTHETIC_POND.radius + 1.85, 5)
    expect(pose.yaw).toBeCloseTo(Math.atan2(dx, dz) + Math.PI, 5)
    expect(pose.pitch).toBeLessThanOrEqual(-0.38)
  })
})