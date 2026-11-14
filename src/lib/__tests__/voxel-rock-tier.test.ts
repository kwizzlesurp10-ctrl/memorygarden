import { describe, expect, it } from 'vitest'
import { ROCK_TIER_BLOCKS } from '@/components/open-world/minecraft-visual'
import { WALK_ROCK_TIER_SHOWCASE } from '@/lib/open-world/garden-scenery-capture'

describe('voxel rock tiers', () => {
  it('assigns small and large tiers on walk rock clusters', () => {
    const tiers = WALK_ROCK_TIER_SHOWCASE.map((c) => c.tier)
    expect(tiers).toContain('small')
    expect(tiers).toContain('large')
  })

  it('keeps large tier block counts above small', () => {
    expect(ROCK_TIER_BLOCKS.large[0]).toBeGreaterThan(ROCK_TIER_BLOCKS.small[1])
  })
})