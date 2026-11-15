import { describe, expect, it } from 'vitest'
import { computeGardenSceneryCloseupPose, GARDEN_SCENERY_CLOSEUP } from '@/lib/open-world/garden-scenery-capture'

describe('garden scenery capture poses', () => {
  const footY = () => 0

  it('defines fence and stump close-up anchors', () => {
    expect(GARDEN_SCENERY_CLOSEUP.fence.aimY).toBeGreaterThan(0.8)
    expect(GARDEN_SCENERY_CLOSEUP.stump.aimY).toBeGreaterThan(0.9)
  })

  it('returns walk poses for fence and stump', () => {
    const fence = computeGardenSceneryCloseupPose('fence', footY)
    const stump = computeGardenSceneryCloseupPose('stump', footY)
    expect(fence.x).not.toBe(stump.x)
    expect(fence.pitch).toBeLessThan(0)
    expect(stump.pitch).toBeLessThanOrEqual(-0.2)
  })
})