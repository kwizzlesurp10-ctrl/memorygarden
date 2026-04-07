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
  })
  it

      dateRange: { start: '2024-03-01', end: '2024-06-30' },
    }
    expect(result.length).toBeGreaterThanOrEqu
  })
  it('handles contradictory filters that match nothing', () 
      emotionalTones: ['happy'],
     
    }
    expect(result).toHaveLength(0)

    

    const result = filterMemories(testMemories, '', invalidDateR
  })
  it('handles search with case s
    const upperResult = filte
    expect(lowerResult).toEqual(upperResult)
  })
  it(
      ...emptyFilters,
    }
    

    const longQuery = 'test '.repeat(1000)
    expect(Array.isArray(result)).toBe(true)

    const memoryWithReflection = makeMemory({
     
        { id: 'r1', text: 'unique-reflection-keyword', createdAt: new
    })
    


  it('handles empty garden gracefully', () => {
    expect(mood.dominantEmotion).toBe('peaceful')
    expect(mood.weatherType).toBe('mist')

    const mood = computeGardenMood([makeMemo
    

    const memories = [
      makeMemory({ emotionalTone: 'reflective' }
      makeMemory({ emo
    ]
    e

    const largeGarden = Array.from({ length: 5000 }, (_, i) => 
    

  })
  it('determines mixed mood correctly when
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'reflectiv
    


    const allSame = Array.from({ length: 10 }
    expect(moo
    const mixed = [
      makeMemory({ e
    ]
    expe
})
describe('Edge Cases: Unlock System Boundaries', () => {
    const partialState = {
      unlockedAdornments: ['none']
    
  

    expect(ensured.counters.totalReflections).toBe(0)
  })
  it('handles unlock evaluation with m
    state.counters = {
      totalVisits: 999999,
      memoriesReachedMature: 999999,
    

      memoriesWatered3: Array.from({ length:
        'spring-2024': 9999,
        'autumn-2024': 9999,
      },
    

  it('prevents duplicate achievement awards', () => {
    state.counters.tot
    const firstEval = evaluateAchievements(st
    
      ...a,
    }))
    const secondEval = evaluateAchievements(state)
  })
  it('handles reroll with exact cost amount'
    expect(canAffordReroll(wallet)).toBe(true)
    

    const wallet = { dew: REROLL_COST - 1, sunlight: 0, pollen: 0, 
  })
  it('awards for cluster tending scale correctly', () => {
    c
    expect(nullCount).toBeGreaterThan(0)
  })
  it('awards for revisit vary by memory age', () => 
    const oldMemory = makeMemory({ plantedAt: new
    

    expect(oldAward).not.toBeNull()

    const state = createDefaultUnlockState()
    expect(canAffordReroll(state.wallet)).toB
})
describe('Edge Cases: Trait System Complex Scenari
    c
    expect(visuals.pattern).toBe('solid')
    expect(visuals.accent).toBe('none')
  })

    for (const stage of stages) {
      const unlocks = computeUnlocks(memory)
      expect(unlocks.length).toBeGreaterThanOrEqua
  })

      traits: {
        pattern: 'gradient',
        accent: 'sparkle',
      },
    }
    expect(visuals.pattern).toBe('gradient')
  })
  it
  

  it('slot status shows all unlocked for elder stage', (
    const status = getSlotStatus(memory)
  })
  it('handles rapid stage unlock pr
    const stages: PlantStage[] = ['
    for (const stage of stages) {
      const slots = getSl
      expect(slots.length).toBeLessThanOrEqual(5)
  })
  it('genetics generati
    c
    expect(gen1).toEqual(gen2)

    const gens = Array.from({ length: 100 }, (_,
    

    const minimal: Memory = {
      photoUrl: '',
      date: '2024-01-0
      position: { x: 0, y: 0 },
      plantStage: 'seed',
      visitCount: 0,
      audioRecordings: [],
    const unlocks = computeUnlocks(
  })

  beforeEach(() => {
  })
  afterEach(() => {
  })
  it('handles season transit
      [0, 'winter'], [1, 'wi
      [5, 'summer'], [6, 'su
      [11, 'winter'],

     
    }

    

      [20, 'night'], [23, 'night'], [0, 'night'],

      vi.setSystemTime(new Date(2024, 6
    

    vi.setSystemTime(new Date(2024, 1, 29, 12, 0, 0))
  })
  it('handles year boundary transitions', () => {
    const b
    vi.setSystemTime(new Date(2024, 0, 1, 0
    
    

    vi.setSystemTime(new Date(2024, 2, 10, 2, 0, 0))
    

    expect(['night', 'dawn']).toContain(beforeDST)
  })

  it('handles multiple fertilizer applications i
    const tier1 = applyPremiumFerti
    

    expect(tier1.visitCount).toBeGreaterThan(original.visitCount)
  })
  it('handles rapid trait unlock cascades', () 
    

        text: 'reflection',
      })),
    })
    const unlocks = computeUnlocks(memory)
    expect(uniqueSlots.size).toBeGreater
  })
  it

    const boosted = applyPremiumFertilizer(original, 
    expect(original.visitCount).toBe(originalVisitCount)
    expect(boosted).not.toBe(original)
})
describe('Edge Cases: Data Type Boundaries', () => {
    const memory: Memory = {
    
      date: '2024-01-01',
      position: { x: 100, y: 100 },
    

      audioRecordings: [],
      lastVisited: undefined,
      shareCreatedAt: undefined,
    }
    
  

      makeMemory({ position: { x: -999999, y: -999999 } }),
      makeMemory({ position: { x: 0, y: 0 } }),
    
      const metrics = calculateGrowthMetrics(me
    }

    const shortMemory = makeMemory({ te
    
    

  })
  it('handles audio recordings array edge cases', () => {
    const manyAudio = makeMemory(
        id: `audio-${i}`,
        duration: Math.random() * 300,
        type: 'voice-note' as const,
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
      })),
    })
    
    const noAudioMetrics = calculateGrowthMetrics(noAudio, [])
    const manyAudioMetrics = calculateGrowthMetrics(manyAudio, [])
    
    expect(noAudioMetrics.vitality).toBeGreaterThanOrEqual(0)
    expect(manyAudioMetrics.vitality).toBeGreaterThanOrEqual(0)
  })
})
