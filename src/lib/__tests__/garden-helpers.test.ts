import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import {
  selectPlantVariety,
  calculateGrowthMetrics,
  getPlantStage,
  getPlantColor,
  getPlantSize,
  classifyEmotionalTone,
  filterMemories,
  getActiveFilterCount,
  computeGardenMood,
  getSeason,
  getDayPeriod,
  getSeasonalPlantModifier,
  getSeasonalGroundCover,
  generateGardenId,
  generateInviteToken,
  generateShareId,
  getShareUrl,
  applyPremiumFertilizer,
} from '../garden-helpers'
import type { Memory, EmotionalTone, PlantStage, SearchFilters } from '../types'

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'test-memory',
    photoUrl: '',
    text: 'test memory',
    date: '2024-01-15',
    location: undefined,
    plantedAt: new Date().toISOString(),
    position: { x: 100, y: 100 },
    emotionalTone: 'peaceful',
    plantStage: 'seedling',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    ...overrides,
  }
}

function makeMetrics(overrides: Partial<ReturnType<typeof calculateGrowthMetrics>> = {}) {
  return {
    vitality: 50,
    height: 80,
    width: 60,
    bloomCount: 2,
    foliageDensity: 50,
    rarityScore: 30,
    lastInteractionAt: Date.now(),
    ...overrides,
  }
}

describe('selectPlantVariety', () => {
  it('returns wildflower for happy tone with celebration keyword', () => {
    expect(selectPlantVariety('happy', 'celebration party')).toBe('wildflower')
  })

  it('returns flower for happy tone without celebration keyword', () => {
    expect(selectPlantVariety('happy', 'just a happy day')).toBe('flower')
  })

  it('returns herb for peaceful tone with home/quiet keywords', () => {
    expect(selectPlantVariety('peaceful', 'quiet home evening')).toBe('herb')
  })

  it('returns succulent for peaceful tone without home/quiet keywords', () => {
    expect(selectPlantVariety('peaceful', 'calm morning')).toBe('succulent')
  })

  it('returns tree for reflective tone', () => {
    expect(selectPlantVariety('reflective', 'thinking about life')).toBe('tree')
  })

  it('returns vine for nostalgic tone', () => {
    expect(selectPlantVariety('nostalgic', 'remember when')).toBe('vine')
  })

  it('returns flower as default', () => {
    expect(selectPlantVariety('bittersweet', 'mixed feelings')).toBe('flower')
  })
})

describe('calculateGrowthMetrics', () => {
  it('returns all required metric properties', () => {
    const memory = makeMemory()
    const metrics = calculateGrowthMetrics(memory, [])
    expect(metrics).toHaveProperty('vitality')
    expect(metrics).toHaveProperty('height')
    expect(metrics).toHaveProperty('width')
    expect(metrics).toHaveProperty('bloomCount')
    expect(metrics).toHaveProperty('foliageDensity')
    expect(metrics).toHaveProperty('rarityScore')
    expect(metrics).toHaveProperty('lastInteractionAt')
  })

  it('vitality stays in [0, 100]', () => {
    const old = makeMemory({ 
      visitCount: 999, 
      reflections: Array.from({ length: 50 }, (_, i) => ({
        id: `r${i}`,
        text: 'reflection',
        createdAt: new Date().toISOString(),
      }))
    })
    const metrics = calculateGrowthMetrics(old, [])
    expect(metrics.vitality).toBeLessThanOrEqual(100)
  })

  it('increases vitality with nearby memories', () => {
    const memory = makeMemory()
    const isolated = calculateGrowthMetrics(memory, [])
    const withNeighbors = calculateGrowthMetrics(memory, [makeMemory(), makeMemory()])
    expect(withNeighbors.vitality).toBeGreaterThan(isolated.vitality)
  })

  it('increases bloomCount based on reflections', () => {
    const noReflections = makeMemory({ reflections: [] })
    const many = makeMemory({
      reflections: Array.from({ length: 5 }, (_, i) => ({
        id: `r${i}`,
        text: 'great',
        createdAt: new Date().toISOString(),
      }))
    })
    expect(calculateGrowthMetrics(many, []).bloomCount).toBeGreaterThan(
      calculateGrowthMetrics(noReflections, []).bloomCount
    )
  })

  it('increases rarityScore based on shareCount', () => {
    const noShares = makeMemory({ shareCount: 0 })
    const withShares = makeMemory({ shareCount: 5 })
    expect(calculateGrowthMetrics(withShares, []).rarityScore).toBeGreaterThan(
      calculateGrowthMetrics(noShares, []).rarityScore
    )
  })
})

describe('getPlantStage', () => {
  it('delegates to getPlantStageFromMetrics when growthMetrics present', () => {
    const memory = makeMemory({ 
      visitCount: 50, 
      reflections: [], 
      growthMetrics: makeMetrics({ vitality: 91 })
    })
    expect(getPlantStage(memory)).toBe('elder')
  })

  it('returns seed for a new memory with no interactions', () => {
    const fresh = makeMemory({ 
      plantedAt: new Date().toISOString(), 
      visitCount: 0, 
      reflections: [] 
    })
    expect(getPlantStage(fresh)).toBe('seed')
  })

  it('returns sprout for a 1-day-old memory with no interactions', () => {
    const oneDayOld = makeMemory({
      plantedAt: new Date(Date.now() - 86400000).toISOString(),
      visitCount: 0,
      reflections: []
    })
    expect(getPlantStage(oneDayOld)).toBe('sprout')
  })

  it('returns elder for an old memory with many interactions', () => {
    const ancient = makeMemory({
      plantedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      visitCount: 20,
      reflections: Array.from({ length: 5 }, (_, i) => ({
        id: `r${i}`,
        text: 'reflection',
        createdAt: new Date().toISOString(),
      }))
    })
    expect(getPlantStage(ancient)).toBe('elder')
  })

  it('stages progress monotonically with interactions', () => {
    const base = makeMemory({ 
      plantedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      visitCount: 0, 
      reflections: []
    })
    const active = makeMemory({
      plantedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      visitCount: 10,
      reflections: Array.from({ length: 5 }, (_, i) => ({
        id: `r${i}`,
        text: 'reflection',
        createdAt: new Date().toISOString(),
      }))
    })
    const baseStages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    const baseIdx = baseStages.indexOf(getPlantStage(base))
    const activeIdx = baseStages.indexOf(getPlantStage(active))
    expect(activeIdx).toBeGreaterThanOrEqual(baseIdx)
  })
})

describe('getPlantColor', () => {
  const tones: EmotionalTone[] = ['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']

  it.each(tones)('returns an oklch string for tone=%s', (tone) => {
    expect(getPlantColor(tone)).toMatch(/^oklch\(/)
  })

  it('returns distinct colors for different tones', () => {
    const colors = tones.map(getPlantColor)
    const unique = new Set(colors)
    expect(unique.size).toBe(tones.length)
  })
})

describe('getPlantSize', () => {
  it('returns a number for each plant stage', () => {
    const stages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    stages.forEach((s) => {
      expect(typeof getPlantSize(s)).toBe('number')
    })
  })

  it('sizes increase as stage progresses', () => {
    const stages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    let prevSize = 0
    for (let i = 1; i < stages.length; i++) {
      const currSize = getPlantSize(stages[i])
      if (typeof prevSize === 'number' && typeof currSize === 'number') {
        expect(currSize).toBeGreaterThanOrEqual(prevSize)
        prevSize = currSize
      }
    }
  })
})

describe('classifyEmotionalTone', () => {
  it('detects happy tone', async () => {
    expect(await classifyEmotionalTone('I feel so happy and joyful today!')).toBe('happy')
  })

  it('detects nostalgic tone', async () => {
    expect(await classifyEmotionalTone('I remember back then when we were kids')).toBe('nostalgic')
  })

  it('detects bittersweet tone', async () => {
    expect(await classifyEmotionalTone('I miss you so much, feeling sad')).toBe('bittersweet')
  })

  it('detects reflective tone', async () => {
    expect(await classifyEmotionalTone('Thinking about what I learned today')).toBe('reflective')
  })

  it('defaults to peaceful', async () => {
    expect(await classifyEmotionalTone('A calm day at the beach')).toBe('peaceful')
  })

  it('returns peaceful for empty string', async () => {
    expect(await classifyEmotionalTone('')).toBe('peaceful')
  })
})

describe('filterMemories', () => {
  const emptyFilters: SearchFilters = {
    emotionalTones: [],
    plantStages: [],
    dateRange: {},
    locations: [],
  }

  const memories: Memory[] = [
    makeMemory({ id: '1', text: 'sunny afternoon in Paris', emotionalTone: 'happy', plantStage: 'bloom', date: '2024-06-01', location: 'Paris' }),
    makeMemory({ id: '2', text: 'rainy morning reflections', emotionalTone: 'reflective', plantStage: 'seed', date: '2024-03-10', location: 'London' }),
    makeMemory({ id: '3', text: 'peaceful garden walk', emotionalTone: 'peaceful', plantStage: 'mature', date: '2024-09-20' }),
  ]

  it('returns all memories when no filters applied', () => {
    expect(filterMemories(memories, '', emptyFilters)).toHaveLength(3)
  })

  it('filters by text in memory text', () => {
    const result = filterMemories(memories, 'Paris', emptyFilters)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by text in location', () => {
    const result = filterMemories(memories, 'London', emptyFilters)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by text in reflections', () => {
    const withReflection = makeMemory({
      id: '4',
      text: 'ordinary day',
      reflections: [{ id: 'r1', text: 'special reflection here', createdAt: new Date().toISOString() }],
    })
    const result = filterMemories([...memories, withReflection], 'special reflection', emptyFilters)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('4')
  })

  it('filters by emotional tone', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, emotionalTones: ['happy'] })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by multiple emotional tones (OR)', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, emotionalTones: ['happy', 'reflective'] })
    expect(result).toHaveLength(2)
  })

  it('filters by plant stage', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, plantStages: ['seed'] })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by date range start', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, dateRange: { start: '2024-05-01' } })
    expect(result).toHaveLength(2)
  })

  it('filters by date range end', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, dateRange: { end: '2024-05-01' } })
    expect(result).toHaveLength(1)
  })

  it('filters by date range both bounds', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, dateRange: { start: '2024-05-01', end: '2024-07-01' } })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by location list', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, locations: ['Paris'] })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('excludes memories without a location when location filter is active', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, locations: ['Paris', 'London'] })
    expect(result).toHaveLength(2)
    expect(result.map((m) => m.id).sort()).toEqual(['1', '2'])
  })

  it('combines search query and filters', () => {
    const result = filterMemories(memories, 'morning', { ...emptyFilters, emotionalTones: ['reflective'] })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('returns empty array when nothing matches', () => {
    const result = filterMemories(memories, 'xyzzy', emptyFilters)
    expect(result).toHaveLength(0)
  })
})

describe('getActiveFilterCount', () => {
  const emptyFilters: SearchFilters = { emotionalTones: [], plantStages: [], dateRange: {}, locations: [] }

  it('returns 0 when no filters active', () => {
    expect(getActiveFilterCount('', emptyFilters)).toBe(0)
  })

  it('counts a non-empty search query as 1', () => {
    expect(getActiveFilterCount('hello', emptyFilters)).toBe(1)
  })

  it('whitespace-only query does not count', () => {
    expect(getActiveFilterCount('   ', emptyFilters)).toBe(0)
  })

  it('counts each active filter category', () => {
    expect(getActiveFilterCount('', {
      emotionalTones: ['happy'],
      plantStages: ['seed'],
      dateRange: { start: '2024-01-01' },
      locations: ['Paris'],
    })).toBe(4)
  })

  it('counts dateRange as 1 even when both start and end are set', () => {
    expect(getActiveFilterCount('', { ...emptyFilters, dateRange: { start: '2024-01-01', end: '2024-12-31' } })).toBe(1)
  })

  it('returns max of 5 when all filters active', () => {
    expect(getActiveFilterCount('query', {
      emotionalTones: ['happy'],
      plantStages: ['seed'],
      dateRange: { start: '2024-01-01' },
      locations: ['Paris'],
    })).toBe(5)
  })
})

describe('computeGardenMood', () => {
  it('returns default peaceful/mist mood for empty garden', () => {
    const mood = computeGardenMood([])
    expect(mood).toEqual({ dominantEmotion: 'peaceful', intensity: 0, weatherType: 'mist' })
  })

  it('returns dominant emotion when one tone dominates clearly', () => {
    const memories = [
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'reflective' }),
    ]
    const mood = computeGardenMood(memories)
    expect(mood.dominantEmotion).toBe('happy')
    expect(mood.weatherType).toBe('sunny')
  })

  it('returns mixed when two tones are close', () => {
    const memories = [
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'reflective' }),
    ]
    const mood = computeGardenMood(memories)
    expect(mood.weatherType).toBe('rain-sun')
  })

  it('intensity scales with memory count', () => {
    const memories = [
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'happy' }),
    ]
    const mood = computeGardenMood(memories)
    expect(mood.intensity).toBe(24)
  })

  it('maps each tone to the correct weather type', () => {
    const toneToWeather: Array<[EmotionalTone, string]> = [
      ['happy', 'sunny'],
      ['peaceful', 'mist'],
      ['reflective', 'partly-cloudy'],
      ['bittersweet', 'rain'],
      ['nostalgic', 'golden-haze'],
    ]
    for (const [tone, weather] of toneToWeather) {
      const mood = computeGardenMood([makeMemory({ emotionalTone: tone })])
      expect(mood.weatherType).toBe(weather)
    }
  })
})

describe('applyPremiumFertilizer', () => {
  it('adds standard boost', () => {
    const memory = makeMemory({ visitCount: 10 })
    const boosted = applyPremiumFertilizer(memory, 'standard')
    expect(boosted.visitCount).toBe(13)
  })

  it('adds premium boost', () => {
    const memory = makeMemory({ visitCount: 5 })
    const boosted = applyPremiumFertilizer(memory, 'premium')
    expect(boosted.visitCount).toBe(13)
  })

  it('adds legendary boost', () => {
    const memory = makeMemory({ visitCount: 0 })
    const boosted = applyPremiumFertilizer(memory, 'legendary')
    expect(boosted.visitCount).toBe(15)
  })

  it('returns a new memory object (immutability)', () => {
    const memory = makeMemory()
    const boosted = applyPremiumFertilizer(memory, 'standard')
    expect(boosted).not.toBe(memory)
    expect(memory.visitCount).toBe(3)
  })
})

describe('getSeason', () => {
  beforeAll(() => vi.useFakeTimers())
  afterAll(() => vi.useRealTimers())

  const seasonCases: Array<[number, string]> = [
    [0, 'winter'], [1, 'winter'],
    [2, 'spring'], [3, 'spring'], [4, 'spring'],
    [5, 'summer'], [6, 'summer'], [7, 'summer'],
    [8, 'autumn'], [9, 'autumn'], [10, 'autumn'],
    [11, 'winter'],
  ]

  it.each(seasonCases)('month %i → season=%s', (month, season) => {
    vi.setSystemTime(new Date(2024, month, 15, 12, 0, 0))
    expect(getSeason()).toBe(season)
  })
})

describe('getDayPeriod', () => {
  beforeAll(() => vi.useFakeTimers())
  afterAll(() => vi.useRealTimers())

  const periodCases: Array<[number, string]> = [
    [5, 'dawn'], [7, 'dawn'],
    [8, 'day'], [12, 'day'], [16, 'day'],
    [17, 'dusk'], [19, 'dusk'],
    [20, 'night'], [23, 'night'], [0, 'night'], [4, 'night'],
  ]

  it.each(periodCases)('hour %i → period=%s', (hour, period) => {
    vi.setSystemTime(new Date(2024, 5, 15, hour, 0, 0))
    expect(getDayPeriod()).toBe(period)
  })
})

describe('getSeasonalPlantModifier', () => {
  const seasons = ['spring', 'summer', 'autumn', 'winter'] as const
  const tones: EmotionalTone[] = ['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']

  it('returns an oklch color for every season + tone combo', () => {
    for (const season of seasons) {
      for (const tone of tones) {
        expect(getSeasonalPlantModifier(season, tone)).toMatch(/^oklch\(/)
      }
    }
  })
})

describe('getSeasonalGroundCover', () => {
  const seasons = ['spring', 'summer', 'autumn', 'winter'] as const

  it('returns an oklch color for each season', () => {
    for (const season of seasons) {
      expect(getSeasonalGroundCover(season)).toMatch(/^oklch\(/)
    }
  })

  it('returns distinct colors for different seasons', () => {
    const colors = seasons.map(getSeasonalGroundCover)
    const unique = new Set(colors)
    expect(unique.size).toBe(4)
  })
})

describe('generateShareId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateShareId()).toBe('string')
    expect(generateShareId().length).toBeGreaterThan(0)
  })

  it('returns unique ids on repeated calls', () => {
    const ids = new Set(Array.from({ length: 20 }, generateShareId))
    expect(ids.size).toBe(20)
  })
})

describe('getShareUrl', () => {
  it('constructs a URL containing the shareId', () => {
    const url = getShareUrl('abc-123')
    expect(url).toContain('abc-123')
    expect(url).toContain('?share=')
  })
})

describe('generateInviteToken', () => {
  it('starts with "invite-"', () => {
    expect(generateInviteToken()).toMatch(/^invite-/)
  })

  it('returns unique tokens', () => {
    const tokens = new Set(Array.from({ length: 10 }, generateInviteToken))
    expect(tokens.size).toBe(10)
  })
})

describe('generateGardenId', () => {
  it('starts with "garden-"', () => {
    expect(generateGardenId()).toMatch(/^garden-/)
  })

  it('returns unique ids', () => {
    const ids = new Set(Array.from({ length: 10 }, generateGardenId))
    expect(ids.size).toBe(10)
  })
})
