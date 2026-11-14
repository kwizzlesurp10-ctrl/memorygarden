import { describe, expect, it } from 'vitest'
import { MINECRAFT_WALK_ROCK_CLUSTERS, ROCK_TIER_BLOCKS } from '@/components/open-world/minecraft-visual'

describe('voxel rock tiers', () => {
  it('assigns small and large tiers on walk rock clusters', () => {
    const tiers = MINECRAFT_WALK_ROCK_CLUSTERS.map((c) => c.tier ?? 'medium')
    expect(tiers).toContain('small')
    expect(tiers).toContain('large')
  })

  it('keeps large tier block counts above small', () => {
    expect(ROCK_TIER_BLOCKS.large[0]).toBeGreaterThan(ROCK_TIER_BLOCKS.small[1])
  })
})