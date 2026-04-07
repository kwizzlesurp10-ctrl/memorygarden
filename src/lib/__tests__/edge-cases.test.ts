import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateGrowthMetrics,
  getPlantStage,
  classifyEmotionalTone,
  filterMemories,
  computeGardenMood,
  applyPremiumFertilizer,
  getSeason,
  getDayPeriod,
} from '../garden-helpers'
import {
  generatePlantGenetics,
  awardForRevisit,
  awardForClusterTending,
  evaluateUnlocks,
  evaluateAchievements,
  canAffordReroll,
  deductRerollCost,
  REROLL_COST,
  ensureUnlockState,
  createDefaultUnlockState,
} from '../unlock-system'
import {
  computeUnlocks,
  getSlotsForStage,
  getSlotStatus,
  resolveTraitVisuals,
} from '../trait-system'
import type { Memory, SearchFilters, EmotionalTone, PlantStage, UnlockState } from '../types'

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: `mem-${Date.now()}-${Math.random()}`,
    photoUrl: 'data:image/png;base64,test',
    text: 'test memory',
    date: '2024-06-15',
    plantedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    position: { x: 500, y: 500 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: `gs-${Date.now()}`,
    traits: {},
    unlocks: [],
    ...overrides,
  }
}

const emptyFilters: SearchFilters = {
  emotionalTones: [],
  plantStages: [],
  dateRange: {},
  locations: [],
}

describe('Edge Cases: Growth Calculation Extremes', () => {
  it('handles memory with zero interactions gracefully', () => {
    const memory = makeMemory({
      visitCount: 0,
      reflections: [],
      shareCount: 0,
      plantedAt: new Date().toISOString(),
    })
    const metrics = calculateGrowthMetrics(memory, [])
    expect(metrics.vitality).toBeGreaterThanOrEqual(0)
    expect(metrics.height).toBeGreaterThan(0)
    expect(metrics.bloomCount).toBeGreaterThanOrEqual(0)
  })

  it('handles extremely high interaction counts without overflow', () => {
    const memory = makeMemory({
      visitCount: 999999,
      reflections: Array.from({ length: 10000 }, (_, i) => ({
        id: `r${i}`,
        text: 'reflection',
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      })),
      shareCount: 10000,
    })
    const metrics = calculateGrowthMetrics(memory, [])
    expect(metrics.vitality).toBeLessThanOrEqual(100)
    expect(metrics.rarityScore).toBeLessThanOrEqual(100)
    expect(metrics.foliageDensity).toBeLessThanOrEqual(100)
  })

  it('handles negative dates by clamping to minimum values', () => {
    const futureDate = new Date(Date.now() + 365 * 86400000).toISOString()
    const memory = makeMemory({ plantedAt: futureDate })
    const metrics = calculateGrowthMetrics(memory, [])
    expect(metrics.vitality).toBeGreaterThanOrEqual(0)
    expect(metrics.height).toBeGreaterThan(0)
  })

  it('handles massive nearby memory clusters', () => {
    const memory = makeMemory()
    const nearbyCluster = Array.from({ length: 1000 }, () => makeMemory())
    const metrics = calculateGrowthMetrics(memory, nearbyCluster)
    expect(metrics.vitality).toBeLessThanOrEqual(100)
    expect(metrics.foliageDensity).toBeLessThanOrEqual(100)
  })

  it('calculates metrics consistently with identical input', () => {
    const memory = makeMemory({ visitCount: 5, reflections: [{ id: 'r1', text: 'test', createdAt: new Date().toISOString() }] })
    const nearby = [makeMemory(), makeMemory()]
    const metrics1 = calculateGrowthMetrics(memory, nearby)
    const metrics2 = calculateGrowthMetrics(memory, nearby)
    expect(metrics1).toEqual(metrics2)
  })

  it('handles memory planted exactly at epoch time', () => {
    const memory = makeMemory({ plantedAt: new Date(0).toISOString() })
    const metrics = calculateGrowthMetrics(memory, [])
    expect(metrics.vitality).toBeGreaterThanOrEqual(0)
    expect(metrics.lastInteractionAt).toBeGreaterThan(0)
  })

  it('handles all plant varieties consistently', () => {
    const varieties = ['flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower', 'ancient_oak', 'eternal_rose', 'phoenix_vine', 'starlight_succulent'] as const
    for (const variety of varieties) {
      const memory = makeMemory({ plantVariety: variety, visitCount: 10 })
      const metrics = calculateGrowthMetrics(memory, [])
      expect(metrics.vitality).toBeGreaterThan(0)
      expect(metrics.height).toBeGreaterThan(0)
      expect(metrics.width).toBeGreaterThan(0)
    }
  })
})

describe('Edge Cases: Plant Stage Transitions', () => {
  it('handles rapid stage progression from fertilizer boosts', () => {
    let memory = makeMemory({ visitCount: 0 })
    expect(getPlantStage(memory)).toBe('seed')
    
    memory = applyPremiumFertilizer(memory, 'legendary')
    const stage = getPlantStage(memory)
    expect(['seed', 'sprout', 'seedling', 'young', 'bud']).toContain(stage)
  })

  it('maintains elder stage even with declining vitality', () => {
    const memory = makeMemory({
      visitCount: 100,
      reflections: Array.from({ length: 50 }, (_, i) => ({
        id: `r${i}`,
        text: 'reflection',
        createdAt: new Date().toISOString(),
      })),
      plantedAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    })
    const stage = getPlantStage(memory)
    expect(stage).toBe('elder')
  })

  it('handles boundary values for stage thresholds', () => {
    const testCases = [
      { vitality: 9.99, expectedStages: ['seed'] },
      { vitality: 10, expectedStages: ['sprout', 'seedling'] },
      { vitality: 22, expectedStages: ['seedling', 'young'] },
      { vitality: 36, expectedStages: ['young', 'bud'] },
      { vitality: 50, expectedStages: ['bud', 'bloom'] },
      { vitality: 64, expectedStages: ['bloom', 'mature'] },
      { vitality: 78, expectedStages: ['mature', 'elder'] },
      { vitality: 90, expectedStages: ['elder'] },
    ]

    for (const { vitality, expectedStages } of testCases) {
      const memory = makeMemory({
        growthMetrics: {
          vitality,
          height: 80,
          width: 60,
          bloomCount: 3,
          foliageDensity: 50,
          rarityScore: 40,
          lastInteractionAt: Date.now(),
        },
      })
      expect(expectedStages).toContain(getPlantStage(memory))
    }
  })

  it('handles concurrent boost applications', () => {
    const memory = makeMemory({ visitCount: 5 })
    const boosted1 = applyPremiumFertilizer(memory, 'standard')
    const boosted2 = applyPremiumFertilizer(boosted1, 'premium')
    const boosted3 = applyPremiumFertilizer(boosted2, 'legendary')
    
    expect(boosted3.visitCount).toBeGreaterThan(boosted2.visitCount)
    expect(boosted2.visitCount).toBeGreaterThan(boosted1.visitCount)
    expect(boosted1.visitCount).toBeGreaterThan(memory.visitCount)
  })
})

describe('Edge Cases: Emotional Tone Classification', () => {
  it('handles empty strings', async () => {
    const tone = await classifyEmotionalTone('')
    expect(tone).toBe('peaceful')
  })

  it('handles extremely long text', async () => {
    const longText = 'wonderful '.repeat(10000)
    const tone = await classifyEmotionalTone(longText)
    expect(['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']).toContain(tone)
  })

  it('handles text with mixed emotional signals', async () => {
    const mixedText = 'I am so happy but also sad and contemplative about the beautiful memories of yesterday while feeling peaceful today'
    const tone = await classifyEmotionalTone(mixedText)
    expect(['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']).toContain(tone)
  })

  it('handles special characters and emojis', async () => {
    const specialText = '🎉🎊💔😢🌅🏔️ !@#$%^&*()_+-=[]{}|;:,.<>?'
    const tone = await classifyEmotionalTone(specialText)
    expect(['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']).toContain(tone)
  })

  it('handles non-English text patterns', async () => {
    const unicodeText = '私は幸せです こんにちは 世界 🌸'
    const tone = await classifyEmotionalTone(unicodeText)
    expect(['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']).toContain(tone)
  })

  it('handles only whitespace', async () => {
    const whitespace = '     \n\t\r    '
    const tone = await classifyEmotionalTone(whitespace)
    expect(tone).toBe('peaceful')
  })

  it('classifies tone consistently for the same input', async () => {
    const text = 'This is a test memory about happiness'
    const tone1 = await classifyEmotionalTone(text)
    const tone2 = await classifyEmotionalTone(text)
    expect(tone1).toBe(tone2)
  })
})

describe('Edge Cases: Search and Filter Combinations', () => {
  const testMemories = [
    makeMemory({ id: '1', text: 'Paris vacation', emotionalTone: 'happy', plantStage: 'bloom', date: '2024-06-15', location: 'Paris' }),
    makeMemory({ id: '2', text: 'Quiet reflection', emotionalTone: 'reflective', plantStage: 'seed', date: '2024-03-10', location: 'London' }),
    makeMemory({ id: '3', text: 'Bittersweet farewell', emotionalTone: 'bittersweet', plantStage: 'mature', date: '2024-09-20' }),
    makeMemory({ id: '4', text: 'Nostalgic memories', emotionalTone: 'nostalgic', plantStage: 'elder', date: '2024-01-05', location: 'Paris' }),
    makeMemory({ id: '5', text: 'Peaceful garden', emotionalTone: 'peaceful', plantStage: 'young', date: '2024-12-25', location: 'Tokyo' }),
  ]

  it('handles empty search query with empty filters', () => {
    const result = filterMemories(testMemories, '', emptyFilters)
    expect(result).toHaveLength(testMemories.length)
  })

  it('handles search query matching no memories', () => {
    const result = filterMemories(testMemories, 'nonexistent-keyword-xyz', emptyFilters)
    expect(result).toHaveLength(0)
  })

  it('filters with all filter types active simultaneously', () => {
    const complexFilters: SearchFilters = {
      emotionalTones: ['happy', 'reflective'],
      plantStages: ['bloom', 'seed'],
      dateRange: { start: '2024-03-01', end: '2024-06-30' },
      locations: ['Paris', 'London'],
    }
    const result = filterMemories(testMemories, '', complexFilters)
    expect(result.length).toBeGreaterThanOrEqual(0)
    expect(result.length).toBeLessThanOrEqual(testMemories.length)
  })

  it('handles contradictory filters that match nothing', () => {
    const contradictoryFilters: SearchFilters = {
      emotionalTones: ['happy'],
      plantStages: ['bloom'],
      dateRange: { start: '2024-01-01', end: '2024-01-31' },
      locations: ['London'],
    }
    const result = filterMemories(testMemories, '', contradictoryFilters)
    expect(result).toHaveLength(0)
  })

  it('handles date range with start after end', () => {
    const invalidDateRange: SearchFilters = {
      ...emptyFilters,
      dateRange: { start: '2024-12-31', end: '2024-01-01' },
    }
    const result = filterMemories(testMemories, '', invalidDateRange)
    expect(result).toHaveLength(0)
  })

  it('handles search with case sensitivity variations', () => {
    const lowerResult = filterMemories(testMemories, 'paris', emptyFilters)
    const upperResult = filterMemories(testMemories, 'PARIS', emptyFilters)
    const mixedResult = filterMemories(testMemories, 'PaRiS', emptyFilters)
    expect(lowerResult).toEqual(upperResult)
    expect(upperResult).toEqual(mixedResult)
  })

  it('filters memories without location when location filter is active', () => {
    const withLocationFilters: SearchFilters = {
      ...emptyFilters,
      locations: ['Paris'],
    }
    const result = filterMemories(testMemories, '', withLocationFilters)
    expect(result.every(m => m.location === 'Paris')).toBe(true)
  })

  it('handles very long search queries', () => {
    const longQuery = 'test '.repeat(1000)
    const result = filterMemories(testMemories, longQuery, emptyFilters)
    expect(Array.isArray(result)).toBe(true)
  })

  it('filters by reflections content when present', () => {
    const memoryWithReflection = makeMemory({
      id: '6',
      text: 'ordinary day',
      reflections: [
        { id: 'r1', text: 'unique-reflection-keyword', createdAt: new Date().toISOString() },
      ],
    })
    const result = filterMemories([...testMemories, memoryWithReflection], 'unique-reflection-keyword', emptyFilters)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('6')
  })
})

describe('Edge Cases: Garden Mood Computation', () => {
  it('handles empty garden gracefully', () => {
    const mood = computeGardenMood([])
    expect(mood.dominantEmotion).toBe('peaceful')
    expect(mood.intensity).toBe(0.3)
    expect(mood.weatherType).toBe('mist')
  })

  it('handles single memory garden', () => {
    const mood = computeGardenMood([makeMemory({ emotionalTone: 'happy' })])
    expect(mood.dominantEmotion).toBe('happy')
    expect(mood.weatherType).toBe('sunny')
  })

  it('handles perfectly balanced emotional distribution', () => {
    const memories = [
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'reflective' }),
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'nostalgic' }),
      makeMemory({ emotionalTone: 'bittersweet' }),
    ]
    const mood = computeGardenMood(memories)
    expect(['happy', 'reflective', 'peaceful', 'nostalgic', 'bittersweet', 'mixed']).toContain(mood.dominantEmotion)
  })

  it('handles extreme garden size (thousands of memories)', () => {
    const largeGarden = Array.from({ length: 5000 }, (_, i) => 
      makeMemory({ emotionalTone: i % 2 === 0 ? 'happy' : 'reflective' })
    )
    const mood = computeGardenMood(largeGarden)
    expect(['happy', 'reflective', 'mixed']).toContain(mood.dominantEmotion)
    expect(mood.intensity).toBeGreaterThanOrEqual(0)
    expect(mood.intensity).toBeLessThanOrEqual(1)
  })

  it('determines mixed mood correctly when tones are close', () => {
    const memories = [
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'reflective' }),
      makeMemory({ emotionalTone: 'reflective' }),
    ]
    const mood = computeGardenMood(memories)
    expect(['happy', 'reflective', 'mixed']).toContain(mood.dominantEmotion)
  })

  it('computes intensity proportional to dominant emotion', () => {
    const allSame = Array.from({ length: 10 }, () => makeMemory({ emotionalTone: 'peaceful' }))
    const moodAllSame = computeGardenMood(allSame)
    expect(moodAllSame.intensity).toBe(1)

    const mixed = [
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'happy' }),
    ]
    const moodMixed = computeGardenMood(mixed)
    expect(moodMixed.intensity).toBeCloseTo(2 / 3)
  })
})

describe('Edge Cases: Unlock System Boundaries', () => {
  it('handles state with missing or malformed counters', () => {
    const partialState = {
      unlockedPalettes: ['earthy'],
      unlockedAdornments: ['none'],
      unlockedPatterns: ['solid'],
      unlockedFrames: [],
      wallet: { dew: 0, sunlight: 0, pollen: 0, starlight: 0 },
      counters: {} as any,
      achievements: [],
    }
    const ensured = ensureUnlockState(partialState as UnlockState)
    expect(ensured.counters.totalReflections).toBe(0)
    expect(ensured.counters.totalVisits).toBe(0)
  })

  it('handles unlock evaluation with maxed-out counters', () => {
    const state = createDefaultUnlockState()
    state.counters = {
      totalReflections: 999999,
      totalVisits: 999999,
      totalMemoriesPlanted: 999999,
      memoriesReachedMature: 999999,
      memoriesReachedElder: 999999,
      nightVisitDays: 999999,
      uniqueOldMemoriesRevisited: 999999,
      clustersTended: 999999,
      nightVisitDates: Array.from({ length: 1000 }, (_, i) => `2024-${String(i % 12 + 1).padStart(2, '0')}-01`),
      memoriesWatered3: Array.from({ length: 1000 }, (_, i) => `mem-${i}`),
      seasonalPlantings: {
        'spring-2024': 9999,
        'summer-2024': 9999,
        'autumn-2024': 9999,
        'winter-2024': 9999,
      },
    }
    const unlocks = evaluateUnlocks(state)
    expect(unlocks.newPalettes.length + unlocks.newPatterns.length + unlocks.newAdornments.length).toBeGreaterThan(0)
  })

  it('prevents duplicate achievement awards', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 1
    
    const firstEval = evaluateAchievements(state)
    expect(firstEval.newAchievements.length).toBeGreaterThan(0)
    
    state.achievements = firstEval.newAchievements.map(a => ({
      ...a,
      unlockedAt: new Date().toISOString(),
    }))
    
    const secondEval = evaluateAchievements(state)
    expect(secondEval.newAchievements).toHaveLength(0)
  })

  it('handles reroll with exact cost amount', () => {
    const wallet = { dew: REROLL_COST, sunlight: 0, pollen: 0, starlight: 0 }
    expect(canAffordReroll(wallet)).toBe(true)
    const afterDeduct = deductRerollCost(wallet)
    expect(afterDeduct.dew).toBe(0)
  })

  it('handles reroll when cost exceeds wallet (should fail)', () => {
    const wallet = { dew: REROLL_COST - 1, sunlight: 0, pollen: 0, starlight: 0 }
    expect(canAffordReroll(wallet)).toBe(false)
  })

  it('awards for cluster tending scale correctly', () => {
    const awards = [0, 1, 2, 3, 5, 10, 100].map(nearby => awardForClusterTending(nearby))
    const nullCount = awards.filter(a => a === null).length
    const nonNullCount = awards.filter(a => a !== null).length
    expect(nullCount).toBeGreaterThan(0)
    expect(nonNullCount).toBeGreaterThan(0)
  })

  it('awards for revisit vary by memory age', () => {
    const recentMemory = makeMemory({ plantedAt: new Date(Date.now() - 1 * 86400000).toISOString() })
    const oldMemory = makeMemory({ plantedAt: new Date(Date.now() - 100 * 86400000).toISOString() })
    
    const recentAward = awardForRevisit(recentMemory)
    const oldAward = awardForRevisit(oldMemory)
    
    expect(recentAward).toBeNull()
    expect(oldAward).not.toBeNull()
  })

  it('handles unlock state with negative wallet values gracefully', () => {
    const state = createDefaultUnlockState()
    state.wallet = { dew: -100, sunlight: -50, pollen: -25, starlight: -10 }
    expect(canAffordReroll(state.wallet)).toBe(false)
  })
})

describe('Edge Cases: Trait System Complex Scenarios', () => {
  it('handles memory with no unlocks attempting to resolve visuals', () => {
    const memory = makeMemory({ unlocks: [], traits: {} })
    const visuals = resolveTraitVisuals(memory)
    expect(visuals.pattern).toBe('solid')
    expect(visuals.adornment).toBe('none')
    expect(visuals.accent).toBe('none')
    expect(visuals.aura).toBe('none')
  })

  it('computes unlocks for memory at every stage', () => {
    const stages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    for (const stage of stages) {
      const memory = makeMemory({ plantStage: stage, visitCount: 15, reflections: Array.from({ length: 5 }, (_, i) => ({ id: `r${i}`, text: 'test', createdAt: new Date().toISOString() })) })
      const unlocks = computeUnlocks(memory)
      expect(Array.isArray(unlocks)).toBe(true)
      expect(unlocks.length).toBeGreaterThanOrEqual(0)
    }
  })

  it('handles memory with contradictory traits set', () => {
    const memory = makeMemory({
      traits: {
        paletteId: 'dawn',
        pattern: 'gradient',
        adornment: 'butterflies',
        accent: 'sparkle',
        aura: 'starlight',
      },
      unlocks: [],
    })
    const visuals = resolveTraitVisuals(memory)
    expect(visuals.pattern).toBe('gradient')
    expect(visuals.adornment).toBe('butterflies')
  })

  it('slot status reflects locked slots for early stage', () => {
    const memory = makeMemory({ plantStage: 'seed' })
    const status = getSlotStatus(memory)
    expect(status.every(s => !s.unlocked)).toBe(true)
  })

  it('slot status shows all unlocked for elder stage', () => {
    const memory = makeMemory({ plantStage: 'elder' })
    const status = getSlotStatus(memory)
    expect(status.every(s => s.unlocked)).toBe(true)
  })

  it('handles rapid stage unlock progression', () => {
    let memory = makeMemory({ plantStage: 'seed' })
    const stages: PlantStage[] = ['sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    
    for (const stage of stages) {
      memory = { ...memory, plantStage: stage }
      const slots = getSlotsForStage(stage)
      expect(slots.length).toBeGreaterThanOrEqual(0)
      expect(slots.length).toBeLessThanOrEqual(5)
    }
  })

  it('genetics generation is deterministic', () => {
    const seed = 'test-seed-xyz'
    const gen1 = generatePlantGenetics(seed)
    const gen2 = generatePlantGenetics(seed)
    expect(gen1).toEqual(gen2)
  })

  it('genetics generation produces unique results for different seeds', () => {
    const gens = Array.from({ length: 100 }, (_, i) => generatePlantGenetics(`seed-${i}`))
    const uniquePetalSizes = new Set(gens.map(g => g.petalSizeMultiplier))
    expect(uniquePetalSizes.size).toBeGreaterThan(50)
  })

  it('handles memory with missing optional fields', () => {
    const minimal: Memory = {
      id: 'minimal',
      photoUrl: '',
      text: 'test',
      date: '2024-01-01',
      plantedAt: new Date().toISOString(),
      position: { x: 0, y: 0 },
      emotionalTone: 'peaceful',
      plantStage: 'seed',
      plantVariety: 'flower',
      visitCount: 0,
      reflections: [],
      audioRecordings: [],
    }
    const unlocks = computeUnlocks(minimal)
    expect(Array.isArray(unlocks)).toBe(true)
  })
})

describe('Edge Cases: Time and Date Boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles season transitions at month boundaries', () => {
    const monthSeasonPairs = [
      [0, 'winter'], [1, 'winter'],
      [2, 'spring'], [3, 'spring'], [4, 'spring'],
      [5, 'summer'], [6, 'summer'], [7, 'summer'],
      [8, 'autumn'], [9, 'autumn'], [10, 'autumn'],
      [11, 'winter'],
    ]

    for (const [month, expectedSeason] of monthSeasonPairs) {
      vi.setSystemTime(new Date(2024, month as number, 15, 12, 0, 0))
      expect(getSeason()).toBe(expectedSeason)
    }
  })

  it('handles day period transitions at hour boundaries', () => {
    const transitions = [
      [4, 'night'], [5, 'dawn'], [7, 'dawn'],
      [8, 'day'], [16, 'day'],
      [17, 'dusk'], [19, 'dusk'],
      [20, 'night'], [23, 'night'], [0, 'night'],
    ]

    for (const [hour, expectedPeriod] of transitions) {
      vi.setSystemTime(new Date(2024, 6, 15, hour as number, 0, 0))
      expect(getDayPeriod()).toBe(expectedPeriod)
    }
  })

  it('handles leap year February correctly', () => {
    vi.setSystemTime(new Date(2024, 1, 29, 12, 0, 0))
    expect(getSeason()).toBe('winter')
  })

  it('handles year boundary transitions', () => {
    vi.setSystemTime(new Date(2023, 11, 31, 23, 59, 59))
    const beforeMidnight = getSeason()
    
    vi.setSystemTime(new Date(2024, 0, 1, 0, 0, 0))
    const afterMidnight = getSeason()
    
    expect(beforeMidnight).toBe('winter')
    expect(afterMidnight).toBe('winter')
  })

  it('handles DST transitions gracefully', () => {
    vi.setSystemTime(new Date(2024, 2, 10, 2, 0, 0))
    const beforeDST = getDayPeriod()
    
    vi.setSystemTime(new Date(2024, 2, 10, 3, 0, 0))
    const afterDST = getDayPeriod()
    
    expect(['night', 'dawn']).toContain(beforeDST)
    expect(['night', 'dawn']).toContain(afterDST)
  })
})

describe('Edge Cases: Concurrent Operations', () => {
  it('handles multiple fertilizer applications in sequence', () => {
    const original = makeMemory({ visitCount: 10 })
    const tier1 = applyPremiumFertilizer(original, 'standard')
    const tier2 = applyPremiumFertilizer(tier1, 'premium')
    const tier3 = applyPremiumFertilizer(tier2, 'legendary')
    
    expect(tier3.visitCount).toBeGreaterThan(tier2.visitCount)
    expect(tier2.visitCount).toBeGreaterThan(tier1.visitCount)
    expect(tier1.visitCount).toBeGreaterThan(original.visitCount)
    expect(original.visitCount).toBe(10)
  })

  it('handles rapid trait unlock cascades', () => {
    const memory = makeMemory({
      visitCount: 20,
      plantedAt: new Date(Date.now() - 100 * 86400000).toISOString(),
      reflections: Array.from({ length: 10 }, (_, i) => ({
        id: `r${i}`,
        text: 'reflection',
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      })),
      shareCount: 5,
    })
    
    const unlocks = computeUnlocks(memory)
    const uniqueSlots = new Set(unlocks.map(u => u.slot))
    expect(uniqueSlots.size).toBeGreaterThan(0)
    expect(uniqueSlots.size).toBeLessThanOrEqual(5)
  })

  it('maintains memory immutability through operations', () => {
    const original = makeMemory({ visitCount: 5 })
    const originalVisitCount = original.visitCount
    
    const boosted = applyPremiumFertilizer(original, 'premium')
    
    expect(original.visitCount).toBe(originalVisitCount)
    expect(boosted.visitCount).toBeGreaterThan(originalVisitCount)
    expect(boosted).not.toBe(original)
  })
})

describe('Edge Cases: Data Type Boundaries', () => {
  it('handles memory with undefined optional properties', () => {
    const memory: Memory = {
      id: 'test',
      photoUrl: '',
      text: 'test',
      date: '2024-01-01',
      plantedAt: new Date().toISOString(),
      position: { x: 100, y: 100 },
      emotionalTone: 'peaceful',
      plantStage: 'seed',
      plantVariety: 'flower',
      visitCount: 0,
      reflections: [],
      audioRecordings: [],
      location: undefined,
      lastVisited: undefined,
      shareId: undefined,
      shareCreatedAt: undefined,
      shareCount: undefined,
    }
    
    const metrics = calculateGrowthMetrics(memory, [])
    expect(metrics.vitality).toBeGreaterThanOrEqual(0)
  })

  it('handles extreme position coordinates', () => {
    const extremeMemories = [
      makeMemory({ position: { x: -999999, y: -999999 } }),
      makeMemory({ position: { x: 999999, y: 999999 } }),
      makeMemory({ position: { x: 0, y: 0 } }),
    ]
    
    for (const memory of extremeMemories) {
      const metrics = calculateGrowthMetrics(memory, [])
      expect(metrics.vitality).toBeGreaterThanOrEqual(0)
    }
  })

  it('handles very short and very long text content', () => {
    const shortMemory = makeMemory({ text: 'a' })
    const longMemory = makeMemory({ text: 'test word '.repeat(10000) })
    
    const shortMetrics = calculateGrowthMetrics(shortMemory, [])
    const longMetrics = calculateGrowthMetrics(longMemory, [])
    
    expect(shortMetrics.vitality).toBeGreaterThanOrEqual(0)
    expect(longMetrics.vitality).toBeGreaterThanOrEqual(0)
  })

  it('handles audio recordings array edge cases', () => {
    const noAudio = makeMemory({ audioRecordings: [] })
    const manyAudio = makeMemory({
      audioRecordings: Array.from({ length: 100 }, (_, i) => ({
        id: `audio-${i}`,
        dataUrl: `data:audio/wav;base64,test${i}`,
        duration: Math.random() * 300,
        createdAt: new Date().toISOString(),
        type: 'voice-note' as const,
      })),
    })
    
    const noAudioMetrics = calculateGrowthMetrics(noAudio, [])
    const manyAudioMetrics = calculateGrowthMetrics(manyAudio, [])
    
    expect(noAudioMetrics.vitality).toBeGreaterThanOrEqual(0)
    expect(manyAudioMetrics.vitality).toBeGreaterThanOrEqual(0)
  })
})
