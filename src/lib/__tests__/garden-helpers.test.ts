import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import {
  calcul
  getPlantColor,
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


  return {
    photoUrl: '',
    date: '2024-01-15',

    plantStage: 'seedling',

    audioRecordings: [],
  }

  return {
    height: 80,
    bloomCount: 2,
    rarityScore: 30,
    ...overrides,
}
// ─── selectPlantVariety ─
describe('selectPlantVari
    expect(selectP
  })
  it('returns flower for
  })
  i
 

  it('returns succulent for peaceful tone without home/quiet keywords', () =>
  })
  it('returns tre
  })
  it('returns 
  })
  it('returns flower as 
  })


  i
 

    expect(metrics).toHaveProperty('bloomCount')

  })
  it('vitality stays in [0, 100]', () => {
    const old = makeMemory({ visitCount: 999, reflections: Array.from({ length: 50 }, (_,
    })) })
    

    const memory = makeMemory()
    const withNeighbors = calculateGrowthMetrics(memory, [makeMemory
  })

    const many = makeMemory({
        id: `r${i}`, text: 'great', createdAt: new Date().toISOString(),
    })
  })
  it

      calculateGrowthMetrics(noShares, []).rarityScore
  })


  it('delegates to getPlantStageFromMetrics when
    expect(getPlantStage(memory)).toBe('elder')


  })
  it('returns sprout for a 1-day-old memory with no interactions', () => {
    

    })
  })
  it
  

      })),


    const base = makeMemory({ plantedAt: new Date(Date.now() - 3 
      plantedAt: new Date(Date.
      reflections: Array.from({ length: 5 }, (_, i) =>
    const baseStages: PlantStage[] = ['seed', 
    const activeIdx = baseStages.indexOf(get
  })


  const tones: EmotionalTone[] = ['happy', 'refle
  it.each(tones)('returns an oklch string for tone=%s',
    

    const colors = tones.map(getPlantColor
    expect(unique.size).toBe(tones.length)
})
// ─── getPlantSize ─────────────────────────────────────────────────
describe('

    stages.forEach((s) => {
    

    for (let i = 1; i < stages.length; i++) {
      const currSize = getPlant
      if (typeof prevSize === 'number' && typeof cur
      }
  })


  it('detects happy tone', async () => {
  })
  it('detects nostalgic tone'
  })
  it('detects bittersweet tone', async () => {
  })
  it('
  })
  it

  it('returns peaceful for empty string', async () =>
  })


  const emptyFilters: SearchFilters = {
    p
    


    makeMemory({ id: '3', text: 'peaceful garden walk', emotionalTone: 'peacef

    expect(filterMemories(memorie

    const result = filterMemories(memories, 'Paris', emptyFilters)
    expect(result[0].id).toBe('1')


    expect(result[0].id).toBe('2')

    const withReflection = makeMemory({
    

    expect(result).toHaveLength(1)
  })
  it('filters by emotional tone
    expect(result).toHaveLength(1)
  })
  it('filters by multi
    ex

    


    const result = filterMemori
  })
  it('filters by date
    expect(result).toHaveLength(1) // March only

    const 
    ex

    


    const result = filterMemories(memories, '', { ...emptyFilters, locations: ['Paris', 'London'] })
    expect(result.map((m) => m.

    const result = fi
    expect(result[0].id).toBe('2')

    const result = filterMemories(memories, 'xyzzy', emptyFilters)
  })


  co
  

  it('counts a non-empty search query as 1', () => {

  it('whitespace-only query does 
  })

      emotionalTones: ['happy'],
      dateRange: { start: '2024-01-01
    })).toBe(4)



    expect(getActiveFilterCount('query', {
      plantStages: ['seed'],
      locations: ['Paris'],
  })


  it('returns default peaceful/mist mood for empty garden', () => {


    const memories = [

      makeMemory({ emotionalTone: 'reflective' }),
    const mood = computeGar
    expect(mood.weatherType).toBe('sunny')

    

    const mood = computeGardenMood(memories)
    expect(mood.weatherType).toBe('rain-sun')

    const memories = [
      makeMemory({ emotionalTone: 'peaceful' }),
    ]
    expect(mood.intensity).toBe(24) // 3 memories 

    c
    
  

      const mood = computeGardenMood([makeMemory({ emotionalTone: tone })])

})
// ─── applyPremiumFertilizer ──────────
describe('applyPremiumFertilizer', () => {
    


    const memory = makeMemory({ visitCount: 5 })
    

    const memory = makeMemory({ visitCount: 0 
    expect(boosted.visitCount).toBe(15) // 0 + 15


    expect(boosted).not.toBe(memory)
  })


  beforeAll(() => vi.useFakeTimers())

    

    [11, 'winter'],

    
  

// ─── filterMemories ────────────────────────────────────────────────────────

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
    expect(result).toHaveLength(2) // June + September
  })

  it('filters by date range end', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, dateRange: { end: '2024-05-01' } })
    expect(result).toHaveLength(1) // March only
  })

  it('filters by date range both bounds', () => {
    const result = filterMemories(memories, '', { ...emptyFilters, dateRange: { start: '2024-05-01', end: '2024-07-01' } })
    expect(result).toHaveLength(1) // June only
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

// ─── getActiveFilterCount ──────────────────────────────────────────────────

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

// ─── computeGardenMood ─────────────────────────────────────────────────────

describe('computeGardenMood', () => {
  it('returns default peaceful/mist mood for empty garden', () => {
    const mood = computeGardenMood([])
    expect(mood).toEqual({ dominantEmotion: 'peaceful', intensity: 0.3, weatherType: 'mist' })
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
      makeMemory({ emotionalTone: 'reflective' }),
    ]
    const mood = computeGardenMood(memories)
    expect(mood.dominantEmotion).toBe('mixed')
    expect(mood.weatherType).toBe('partly-cloudy')
  })

  it('intensity equals top tone fraction', () => {
    const memories = [
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'happy' }),
    ]
    const mood = computeGardenMood(memories)
    expect(mood.intensity).toBeCloseTo(2 / 3)
  })

  it('maps each tone to the correct weather type', () => {
    const toneToWeather: Array<[EmotionalTone, string]> = [
      ['happy', 'sunny'],
      ['peaceful', 'mist'],
      ['reflective', 'rain'],
      ['bittersweet', 'rain-sun'],
      ['nostalgic', 'golden-haze'],
    ]
    for (const [tone, weather] of toneToWeather) {
      const mood = computeGardenMood([makeMemory({ emotionalTone: tone })])
      expect(mood.weatherType).toBe(weather)
    }
  })
})

// ─── applyPremiumFertilizer ────────────────────────────────────────────────

describe('applyPremiumFertilizer', () => {
  it('adds standard boost', () => {
    const memory = makeMemory({ visitCount: 10 })
    const boosted = applyPremiumFertilizer(memory, 'standard')
    expect(boosted.visitCount).toBe(13) // 10 + 3
  })

  it('adds premium boost', () => {
    const memory = makeMemory({ visitCount: 5 })
    const boosted = applyPremiumFertilizer(memory, 'premium')
    expect(boosted.visitCount).toBe(13) // 5 + 8
  })

  it('adds legendary boost', () => {
    const memory = makeMemory({ visitCount: 0 })
    const boosted = applyPremiumFertilizer(memory, 'legendary')
    expect(boosted.visitCount).toBe(15) // 0 + 15
  })

  it('returns a new memory object (immutability)', () => {
    const memory = makeMemory()
    const boosted = applyPremiumFertilizer(memory, 'standard')
    expect(boosted).not.toBe(memory)
    expect(memory.visitCount).toBe(3) // original unchanged
  })
})

// ─── getSeason / getDayPeriod ──────────────────────────────────────────────

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
    // Set a date that falls in the target month (day 15 to avoid TZ edge cases)
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

// ─── getSeasonalPlantModifier ──────────────────────────────────────────────

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

// ─── getSeasonalGroundCover ────────────────────────────────────────────────

// ─── getSeasonalGroundCover ────────────────────────────────────────────────

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

// ─── generateShareId / getShareUrl ────────────────────────────────────────

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

// ─── generateInviteToken / generateGardenId ────────────────────────────────

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

// ─── getSeasonalPlantModifier ──────────────────────────────────────────────

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

// ─── getSeasonalGroundCover ────────────────────────────────────────────────

// ─── getSeasonalGroundCover ────────────────────────────────────────────────

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

// ─── generateShareId / getShareUrl ────────────────────────────────────────

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

// ─── generateInviteToken / generateGardenId ────────────────────────────────

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
