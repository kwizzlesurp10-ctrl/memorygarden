import { describe, expect, it } from 'vitest'
import {
  GARDEN_SCENERY_CLOSEUP,
  WALK_ROCK_TIER_SHOWCASE,
} from '@/lib/open-world/garden-scenery-capture'

describe('garden scenery capture anchors', () => {
  it('lines up three rock tiers near the walk row', () => {
    expect(WALK_ROCK_TIER_SHOWCASE.map((r) => r.tier)).toEqual(['small', 'medium', 'large'])
    for (const rock of WALK_ROCK_TIER_SHOWCASE) {
      expect(rock.z).toBeGreaterThan(18)
      expect(rock.z).toBeLessThan(24)
    }
  })

  it('defines close-up focus heights for each subject kind', () => {
    expect(GARDEN_SCENERY_CLOSEUP['rock-tiers'].height).toBeGreaterThan(2)
    expect(GARDEN_SCENERY_CLOSEUP.fence.aimY).toBeGreaterThan(0.8)
    expect(GARDEN_SCENERY_CLOSEUP.stump.aimY).toBeLessThan(0.8)
  })
})