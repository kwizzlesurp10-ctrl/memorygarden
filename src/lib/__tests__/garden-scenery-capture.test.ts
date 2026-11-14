import { describe, expect, it } from 'vitest'
import {
  GARDEN_SCENERY_CLOSEUP,
  sceneryAnchorsMeetClearance,
  WALK_ROCK_TIER_SHOWCASE,
} from '@/lib/open-world/garden-scenery-capture'

describe('garden scenery capture anchors', () => {
  it('keeps props and rock tiers ≥4 m apart', () => {
    expect(sceneryAnchorsMeetClearance()).toBe(true)
    expect(WALK_ROCK_TIER_SHOWCASE.map((r) => r.tier)).toEqual(['small', 'medium', 'large'])
    for (const rock of WALK_ROCK_TIER_SHOWCASE) {
      expect(rock.z).toBeLessThan(12)
    }
  })

  it('defines low close-up framing heights', () => {
    expect(GARDEN_SCENERY_CLOSEUP['rock-tiers'].height).toBeLessThan(1.5)
    expect(GARDEN_SCENERY_CLOSEUP.fence.aimY).toBeGreaterThan(0.8)
    expect(GARDEN_SCENERY_CLOSEUP.stump.aimY).toBeGreaterThan(0.9)
  })
})