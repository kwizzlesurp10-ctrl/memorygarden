import { describe, expect, it } from 'vitest'
import { bloomWallTileSortWeight, getBloomWallTileSpan } from '../bloom-wall-layout'

describe('getBloomWallTileSpan', () => {
  it('grows spans from seed toward elder', () => {
    const seed = getBloomWallTileSpan('seed')
    const elder = getBloomWallTileSpan('elder')
    expect(seed.colSpan * seed.rowSpan).toBeLessThan(elder.colSpan * elder.rowSpan)
    expect(elder.colSpan).toBeGreaterThanOrEqual(getBloomWallTileSpan('mature').colSpan)
  })

  it('returns stable keys for every PlantStage', () => {
    const stages = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'] as const
    for (const s of stages) {
      const t = getBloomWallTileSpan(s)
      expect(t.colSpan).toBeGreaterThan(0)
      expect(t.rowSpan).toBeGreaterThan(0)
    }
  })
})

describe('bloomWallTileSortWeight', () => {
  it('matches product of spans', () => {
    const stage = 'bloom' as const
    const { colSpan, rowSpan } = getBloomWallTileSpan(stage)
    expect(bloomWallTileSortWeight(stage)).toBe(colSpan * rowSpan)
  })
})
