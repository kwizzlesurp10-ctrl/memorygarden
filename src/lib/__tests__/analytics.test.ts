import { describe, it, expect } from 'vitest'
import {
  computeGardenStats,
  computeGrowthTrend,
  buildAgeProfiles,
  findNeglectedMemories,
  computeToneVelocity,
  computePositionClusters,
  gardenSummary,
} from '../analytics'
import type { Memory, EmotionalTone, PlantStage, PlantVariety } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

let _idSeq = 0

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  const id = `mem-${++_idSeq}`
  return {
    id,
    photoUrl: 'data:image/png;base64,abc',
    text: 'test memory',
    date: '2024-06-15',
    plantedAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
    position: { x: 100 + _idSeq * 50, y: 200 + _idSeq * 50 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    ...overrides,
  }
}

const DAY = 86400_000

// Fixed "now" for deterministic tests: April 8, 2024 noon UTC
const NOW = new Date('2024-04-08T12:00:00.000Z').getTime()

// ── computeGardenStats ────────────────────────────────────────────────────────

describe('computeGardenStats', () => {
  it('returns empty stats for no memories', () => {
    const stats = computeGardenStats([], NOW)
    expect(stats.totalMemories).toBe(0)
    expect(stats.totalReflections).toBe(0)
    expect(stats.mostVisitedMemory).toBeNull()
    expect(stats.mostReflectedMemory).toBeNull()
  })

  it('counts memories correctly', () => {
    const memories = [makeMemory(), makeMemory(), makeMemory()]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.totalMemories).toBe(3)
  })

  it('counts total reflections across all memories', () => {
    const memories = [
      makeMemory({ reflections: [{ id: 'r1', text: 'first', createdAt: new Date().toISOString() }] }),
      makeMemory({ reflections: [
        { id: 'r2', text: 'second', createdAt: new Date().toISOString() },
        { id: 'r3', text: 'third', createdAt: new Date().toISOString() },
      ]}),
    ]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.totalReflections).toBe(3)
  })

  it('counts total visits correctly', () => {
    const memories = [makeMemory({ visitCount: 5 }), makeMemory({ visitCount: 10 })]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.totalVisits).toBe(15)
  })

  it('computes correct tone distribution', () => {
    const memories = [
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'peaceful' }),
    ]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.toneDistribution.happy).toBe(2)
    expect(stats.toneDistribution.peaceful).toBe(1)
    expect(stats.toneDistribution.reflective).toBe(0)
  })

  it('computes correct stage distribution', () => {
    const memories = [
      makeMemory({ plantStage: 'bloom' }),
      makeMemory({ plantStage: 'bloom' }),
      makeMemory({ plantStage: 'seed' }),
    ]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.stageDistribution.bloom).toBe(2)
    expect(stats.stageDistribution.seed).toBe(1)
  })

  it('identifies the most visited memory', () => {
    const a = makeMemory({ visitCount: 5 })
    const b = makeMemory({ visitCount: 20 })
    const c = makeMemory({ visitCount: 1 })
    const stats = computeGardenStats([a, b, c], NOW)
    expect(stats.mostVisitedMemory?.id).toBe(b.id)
  })

  it('identifies the most reflected memory', () => {
    const a = makeMemory({ reflections: [{ id: 'r1', text: 'a', createdAt: new Date().toISOString() }] })
    const b = makeMemory({
      reflections: [
        { id: 'r2', text: 'b', createdAt: new Date().toISOString() },
        { id: 'r3', text: 'c', createdAt: new Date().toISOString() },
        { id: 'r4', text: 'd', createdAt: new Date().toISOString() },
      ],
    })
    const stats = computeGardenStats([a, b], NOW)
    expect(stats.mostReflectedMemory?.id).toBe(b.id)
  })

  it('computes reflectionRate correctly', () => {
    const memories = [
      makeMemory({ reflections: [] }),
      makeMemory({ reflections: [{ id: 'r1', text: 'x', createdAt: new Date().toISOString() }] }),
    ]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.reflectionRate).toBe(0.5)
  })

  it('computes photoRate for memories with photos', () => {
    const memories = [
      makeMemory({ photoUrl: 'data:image/png;base64,abc' }),
      makeMemory({ photoUrl: '' }),
    ]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.photoRate).toBe(0.5)
  })

  it('computes audioRate correctly', () => {
    const memories = [
      makeMemory({ audioRecordings: [{ id: 'a1', dataUrl: 'data:audio/webm;base64,x', duration: 10, createdAt: new Date().toISOString(), type: 'voice-note' }] }),
      makeMemory({ audioRecordings: [] }),
    ]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.audioRate).toBe(0.5)
  })

  it('collects unique locations', () => {
    const memories = [
      makeMemory({ location: 'Paris' }),
      makeMemory({ location: 'Paris' }),
      makeMemory({ location: 'Tokyo' }),
      makeMemory({ location: undefined }),
    ]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.uniqueLocations).toBe(2)
    expect(stats.topLocation).toBe('Paris')
  })

  it('returns null topLocation when no locations', () => {
    const memories = [makeMemory({ location: undefined })]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.topLocation).toBeNull()
  })

  it('computes averageReflectionsPerMemory', () => {
    const memories = [
      makeMemory({ reflections: [] }),
      makeMemory({ reflections: [
        { id: 'r1', text: 'x', createdAt: new Date().toISOString() },
        { id: 'r2', text: 'y', createdAt: new Date().toISOString() },
      ]}),
    ]
    const stats = computeGardenStats(memories, NOW)
    expect(stats.averageReflectionsPerMemory).toBe(1)
  })

  it('counts plantedThisMonth correctly', () => {
    // Planted exactly in the same month as NOW (April 2024)
    const recent = makeMemory({ plantedAt: new Date('2024-04-05T10:00:00.000Z').toISOString() })
    const old = makeMemory({ plantedAt: new Date('2024-03-01T10:00:00.000Z').toISOString() })
    const stats = computeGardenStats([recent, old], NOW)
    expect(stats.plantedThisMonth).toBe(1)
  })
})

// ── computeGrowthTrend ────────────────────────────────────────────────────────

describe('computeGrowthTrend', () => {
  it('returns correct number of data points for default window', () => {
    const trend = computeGrowthTrend([], 30, NOW)
    expect(trend).toHaveLength(30)
  })

  it('returns correct number of data points for custom window', () => {
    const trend = computeGrowthTrend([], 7, NOW)
    expect(trend).toHaveLength(7)
  })

  it('counts memory planted within the window', () => {
    const recent = makeMemory({ plantedAt: new Date(NOW - 3 * DAY).toISOString() })
    const trend = computeGrowthTrend([recent], 30, NOW)
    const totalPlanted = trend.reduce((s, d) => s + d.planted, 0)
    expect(totalPlanted).toBe(1)
  })

  it('does not count memory planted before the window', () => {
    const old = makeMemory({ plantedAt: new Date(NOW - 60 * DAY).toISOString() })
    const trend = computeGrowthTrend([old], 30, NOW)
    const totalPlanted = trend.reduce((s, d) => s + d.planted, 0)
    expect(totalPlanted).toBe(0)
  })

  it('returns monotonically increasing total', () => {
    const memories = [
      makeMemory({ plantedAt: new Date(NOW - 5 * DAY).toISOString() }),
      makeMemory({ plantedAt: new Date(NOW - 3 * DAY).toISOString() }),
    ]
    const trend = computeGrowthTrend(memories, 10, NOW)
    for (let i = 1; i < trend.length; i++) {
      expect(trend[i].total).toBeGreaterThanOrEqual(trend[i - 1].total)
    }
  })

  it('returns trend in chronological order', () => {
    const trend = computeGrowthTrend([], 5, NOW)
    for (let i = 1; i < trend.length; i++) {
      expect(trend[i].date > trend[i - 1].date).toBe(true)
    }
  })
})

// ── buildAgeProfiles ──────────────────────────────────────────────────────────

describe('buildAgeProfiles', () => {
  it('returns one profile per memory', () => {
    const memories = [makeMemory(), makeMemory()]
    const profiles = buildAgeProfiles(memories, NOW)
    expect(profiles).toHaveLength(2)
  })

  it('computes correct ageDays', () => {
    const memory = makeMemory({ plantedAt: new Date(NOW - 10 * DAY).toISOString() })
    const profiles = buildAgeProfiles([memory], NOW)
    expect(profiles[0].ageDays).toBe(10)
  })

  it('computes engagementRatio as reflections/visits', () => {
    const memory = makeMemory({
      visitCount: 4,
      reflections: [
        { id: 'r1', text: 'a', createdAt: new Date().toISOString() },
        { id: 'r2', text: 'b', createdAt: new Date().toISOString() },
      ],
    })
    const profiles = buildAgeProfiles([memory], NOW)
    expect(profiles[0].engagementRatio).toBe(0.5)
  })

  it('handles zero visits gracefully', () => {
    const memory = makeMemory({
      visitCount: 0,
      plantedAt: new Date(NOW - 10 * DAY).toISOString(),
      reflections: [{ id: 'r1', text: 'a', createdAt: new Date().toISOString() }],
    })
    const profiles = buildAgeProfiles([memory], NOW)
    expect(profiles[0].engagementRatio).toBeGreaterThan(0)
  })
})

// ── findNeglectedMemories ─────────────────────────────────────────────────────

describe('findNeglectedMemories', () => {
  it('returns memories not visited in the threshold period', () => {
    const neglected = makeMemory({ lastVisited: new Date(NOW - 20 * DAY).toISOString() })
    const recent = makeMemory({ lastVisited: new Date(NOW - 3 * DAY).toISOString() })
    const result = findNeglectedMemories([neglected, recent], 14, NOW)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(neglected.id)
  })

  it('falls back to plantedAt when lastVisited is absent', () => {
    const old = makeMemory({
      lastVisited: undefined,
      plantedAt: new Date(NOW - 30 * DAY).toISOString(),
    })
    const result = findNeglectedMemories([old], 14, NOW)
    expect(result).toHaveLength(1)
  })

  it('returns empty array when all memories are recently visited', () => {
    const memories = [
      makeMemory({ lastVisited: new Date(NOW - 1 * DAY).toISOString() }),
      makeMemory({ lastVisited: new Date(NOW - 2 * DAY).toISOString() }),
    ]
    const result = findNeglectedMemories(memories, 14, NOW)
    expect(result).toHaveLength(0)
  })
})

// ── computeToneVelocity ───────────────────────────────────────────────────────

describe('computeToneVelocity', () => {
  it('returns all 5 tones', () => {
    const result = computeToneVelocity([], 30, NOW)
    expect(result).toHaveLength(5)
    const tones = result.map(t => t.tone)
    expect(tones).toContain('happy')
    expect(tones).toContain('peaceful')
  })

  it('counts recent memories correctly', () => {
    const recent = makeMemory({
      emotionalTone: 'happy',
      plantedAt: new Date(NOW - 5 * DAY).toISOString(),
    })
    const old = makeMemory({
      emotionalTone: 'happy',
      plantedAt: new Date(NOW - 60 * DAY).toISOString(),
    })
    const result = computeToneVelocity([recent, old], 30, NOW)
    const happyVelocity = result.find(t => t.tone === 'happy')!
    expect(happyVelocity.recentCount).toBe(1)
    expect(happyVelocity.historicalCount).toBe(1)
  })

  it('computes positive delta when recent > historical', () => {
    const memories = [
      makeMemory({ emotionalTone: 'reflective', plantedAt: new Date(NOW - 5 * DAY).toISOString() }),
      makeMemory({ emotionalTone: 'reflective', plantedAt: new Date(NOW - 10 * DAY).toISOString() }),
    ]
    const result = computeToneVelocity(memories, 30, NOW)
    const v = result.find(t => t.tone === 'reflective')!
    expect(v.delta).toBe(2) // both in recent window (< 30 days), none historical
  })
})

// ── computePositionClusters ───────────────────────────────────────────────────

describe('computePositionClusters', () => {
  it('returns empty array for no memories', () => {
    expect(computePositionClusters([])).toEqual([])
  })

  it('returns empty array when all memories are isolated', () => {
    const memories = [
      makeMemory({ position: { x: 0, y: 0 } }),
      makeMemory({ position: { x: 10000, y: 0 } }),
      makeMemory({ position: { x: 0, y: 10000 } }),
    ]
    // With cellSize=200, each memory is in a different cell
    expect(computePositionClusters(memories, 200)).toHaveLength(0)
  })

  it('identifies a cluster of nearby memories', () => {
    const memories = [
      makeMemory({ position: { x: 100, y: 100 } }),
      makeMemory({ position: { x: 120, y: 110 } }),
      makeMemory({ position: { x: 90, y: 130 } }),
    ]
    // All within same 200-unit cell
    const clusters = computePositionClusters(memories, 200)
    expect(clusters).toHaveLength(1)
    expect(clusters[0].memoryIds).toHaveLength(3)
  })

  it('sorts clusters by size descending', () => {
    const bigCluster = [
      makeMemory({ position: { x: 50, y: 50 } }),
      makeMemory({ position: { x: 60, y: 60 } }),
      makeMemory({ position: { x: 70, y: 70 } }),
    ]
    const smallCluster = [
      makeMemory({ position: { x: 1050, y: 1050 } }),
      makeMemory({ position: { x: 1060, y: 1060 } }),
    ]
    const clusters = computePositionClusters([...bigCluster, ...smallCluster], 200)
    expect(clusters[0].memoryIds.length).toBeGreaterThanOrEqual(clusters[1]?.memoryIds.length ?? 0)
  })
})

// ── gardenSummary ─────────────────────────────────────────────────────────────

describe('gardenSummary', () => {
  it('returns seeding message for empty garden', () => {
    const stats = computeGardenStats([], NOW)
    const summary = gardenSummary(stats)
    expect(summary).toMatch(/empty/i)
    expect(summary).toMatch(/first memory/i)
  })

  it('returns a descriptive sentence for a populated garden', () => {
    const memories = [
      makeMemory({ emotionalTone: 'happy', plantStage: 'bloom' }),
      makeMemory({ emotionalTone: 'happy', plantStage: 'bloom' }),
      makeMemory({ emotionalTone: 'peaceful', plantStage: 'mature' }),
    ]
    const stats = computeGardenStats(memories, NOW)
    const summary = gardenSummary(stats)
    expect(summary).toMatch(/garden holds 3/i)
    expect(summary).toMatch(/happy/i)
  })

  it('uses singular "memory" for a single memory', () => {
    const memories = [makeMemory()]
    const stats = computeGardenStats(memories, NOW)
    const summary = gardenSummary(stats)
    expect(summary).toMatch(/1 memory/i)
    expect(summary).not.toMatch(/1 memories/i)
  })
})
