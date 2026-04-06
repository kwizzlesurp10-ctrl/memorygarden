import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import type { Memory, GrowthMetrics, SearchFilters, EmotionalTone, PlantStage, PlantVariety } from '../types'
import {
  selectPlantVariety,
  calculateGrowthMetrics,
  getPlantStageFromMetrics,
  getPlantStage,
  getPlantColor,
  getPlantSize,
  classifyEmotionalTone,
  filterMemories,
  getActiveFilterCount,
  computeGardenMood,
  buildPlantPrompt,
  getSeason,
  getDayPeriod,
  getBackgroundGradient,
  getSeasonalPlantModifier,
  getSeasonalGroundCover,
  applyPremiumFertilizer,
  generateShareId,
  getShareUrl,
  generateInviteToken,
  generateGardenId,
} from '../garden-helpers'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'test-id',
    photoUrl: '',
    text: 'A peaceful walk in the park',
    date: '2024-01-15',
    plantedAt: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
    position: { x: 0, y: 0 },
    emotionalTone: 'peaceful',
    plantStage: 'seedling',
    plantVariety: 'herb',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    ...overrides,
  }
}

function makeMetrics(overrides: Partial<GrowthMetrics> = {}): GrowthMetrics {
  return {
    vitality: 50,
    height: 80,
    width: 60,
    bloomCount: 2,
    foliageDensity: 0.5,
    rarityScore: 30,
    lastInteractionAt: Date.now(),
    ...overrides,
  }
}

// ─── selectPlantVariety ────────────────────────────────────────────────────

describe('selectPlantVariety', () => {
  it('returns wildflower for happy tone with short text', () => {
    expect(selectPlantVariety('happy', 'short text')).toBe('wildflower')
  })

  it('returns flower for happy tone with long text (≥100 chars)', () => {
    const longText = 'a'.repeat(100)
    expect(selectPlantVariety('happy', longText)).toBe('flower')
  })

  it('returns herb for peaceful tone with home/quiet keywords', () => {
    expect(selectPlantVariety('peaceful', 'Quiet morning at home')).toBe('herb')
    expect(selectPlantVariety('peaceful', 'quiet evening')).toBe('herb')
    expect(selectPlantVariety('peaceful', 'home is where the heart is')).toBe('herb')
  })

  it('returns succulent for peaceful tone without home/quiet keywords', () => {
    expect(selectPlantVariety('peaceful', 'a lovely afternoon')).toBe('succulent')
  })

  it('returns tree for reflective tone', () => {
    expect(selectPlantVariety('reflective', 'pondering life')).toBe('tree')
  })

  it('returns vine for bittersweet tone', () => {
    expect(selectPlantVariety('bittersweet', 'missing someone')).toBe('vine')
  })

  it('returns flower as default for nostalgic tone', () => {
    expect(selectPlantVariety('nostalgic', 'remembering old days')).toBe('flower')
  })
})

// ─── calculateGrowthMetrics ───────────────────────────────────────────────

describe('calculateGrowthMetrics', () => {
  it('returns a GrowthMetrics object with expected keys', () => {
    const memory = makeMemory()
    const metrics = calculateGrowthMetrics(memory)
    expect(metrics).toHaveProperty('vitality')
    expect(metrics).toHaveProperty('height')
    expect(metrics).toHaveProperty('width')
    expect(metrics).toHaveProperty('bloomCount')
    expect(metrics).toHaveProperty('foliageDensity')
    expect(metrics).toHaveProperty('rarityScore')
    expect(metrics).toHaveProperty('lastInteractionAt')
  })

  it('vitality stays in [5, 100]', () => {
    const fresh = makeMemory({ plantedAt: new Date().toISOString(), visitCount: 0 })
    const old = makeMemory({ visitCount: 999, reflections: Array.from({ length: 50 }, (_, i) => ({
      id: `r${i}`, text: 'nice', createdAt: new Date().toISOString(), tone: 'peaceful' as EmotionalTone
    })) })
    expect(calculateGrowthMetrics(fresh).vitality).toBeGreaterThanOrEqual(5)
    expect(calculateGrowthMetrics(old).vitality).toBeLessThanOrEqual(100)
  })

  it('nearby memories increase vitality via synergy', () => {
    const memory = makeMemory()
    const alone = calculateGrowthMetrics(memory, [])
    const withNeighbors = calculateGrowthMetrics(memory, [makeMemory(), makeMemory()])
    expect(withNeighbors.vitality).toBeGreaterThanOrEqual(alone.vitality)
  })

  it('more reflections yield higher vitality', () => {
    const few = makeMemory({ reflections: [] })
    const many = makeMemory({
      reflections: Array.from({ length: 5 }, (_, i) => ({
        id: `r${i}`, text: 'great', createdAt: new Date().toISOString(), tone: 'peaceful' as EmotionalTone
      })),
    })
    expect(calculateGrowthMetrics(many).vitality).toBeGreaterThan(calculateGrowthMetrics(few).vitality)
  })

  it('rarityScore includes shareCount bonus', () => {
    const noShares = makeMemory()
    const withShares = makeMemory({ shareCount: 5 })
    expect(calculateGrowthMetrics(withShares).rarityScore).toBeGreaterThanOrEqual(
      calculateGrowthMetrics(noShares).rarityScore
    )
  })
})

// ─── getPlantStageFromMetrics ──────────────────────────────────────────────

describe('getPlantStageFromMetrics', () => {
  const cases: [number, PlantStage][] = [
    [0, 'seed'],
    [11, 'seed'],
    [12, 'sprout'],
    [27, 'sprout'],
    [28, 'seedling'],
    [43, 'seedling'],
    [44, 'young'],
    [61, 'young'],
    [62, 'bud'],
    [77, 'bud'],
    [78, 'bloom'],
    [88, 'bloom'],
    [89, 'mature'],
    [96, 'mature'],
    [97, 'elder'],
    [100, 'elder'],
  ]

  it.each(cases)('vitality=%i → stage=%s', (vitality, expected) => {
    expect(getPlantStageFromMetrics(makeMetrics({ vitality }))).toBe(expected)
  })
})

// ─── getPlantStage ─────────────────────────────────────────────────────────

describe('getPlantStage', () => {
  it('delegates to getPlantStageFromMetrics when growthMetrics present', () => {
    const memory = makeMemory({ growthMetrics: makeMetrics({ vitality: 97 }) })
    expect(getPlantStage(memory)).toBe('elder')
  })

  it('returns seed for brand-new memory with no interactions', () => {
    const memory = makeMemory({ plantedAt: new Date().toISOString(), visitCount: 0, reflections: [] })
    expect(getPlantStage(memory)).toBe('seed')
  })

  it('returns sprout for a 1-day-old memory with no interactions', () => {
    // 28 hours ago → daysSincePlanted === 1, interactionScore === 0 → sprout
    const memory = makeMemory({
      plantedAt: new Date(Date.now() - 28 * 3600000).toISOString(),
      visitCount: 0,
      reflections: [],
    })
    expect(getPlantStage(memory)).toBe('sprout')
  })

  it('returns elder for very old memory with many interactions', () => {
    const memory = makeMemory({
      plantedAt: new Date(Date.now() - 200 * 86400000).toISOString(), // 200 days ago
      visitCount: 50,
      reflections: Array.from({ length: 10 }, (_, i) => ({
        id: `r${i}`, text: 'nice', createdAt: new Date().toISOString()
      })),
    })
    expect(getPlantStage(memory)).toBe('elder')
  })

  it('advances stage with higher interaction score', () => {
    const base = makeMemory({ plantedAt: new Date(Date.now() - 3 * 86400000).toISOString(), visitCount: 0, reflections: [] })
    const active = makeMemory({
      plantedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      visitCount: 10,
      reflections: Array.from({ length: 5 }, (_, i) => ({ id: `r${i}`, text: 'x', createdAt: new Date().toISOString() })),
    })
    const baseStages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    const baseIdx = baseStages.indexOf(getPlantStage(base))
    const activeIdx = baseStages.indexOf(getPlantStage(active))
    expect(activeIdx).toBeGreaterThan(baseIdx)
  })
})

// ─── getPlantColor ─────────────────────────────────────────────────────────

describe('getPlantColor', () => {
  const tones: EmotionalTone[] = ['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']

  it.each(tones)('returns an oklch string for tone=%s', (tone) => {
    const color = getPlantColor(tone)
    expect(color).toMatch(/^oklch\(/)
  })

  it('returns distinct colors for different tones', () => {
    const colors = tones.map(getPlantColor)
    const unique = new Set(colors)
    expect(unique.size).toBe(tones.length)
  })
})

// ─── getPlantSize ──────────────────────────────────────────────────────────

describe('getPlantSize', () => {
  const stages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']

  it('returns a positive number for every stage', () => {
    stages.forEach((s) => {
      expect(getPlantSize(s)).toBeGreaterThan(0)
    })
  })

  it('size increases monotonically through growth stages', () => {
    for (let i = 1; i < stages.length; i++) {
      expect(getPlantSize(stages[i])).toBeGreaterThan(getPlantSize(stages[i - 1]))
    }
  })
})

// ─── classifyEmotionalTone ─────────────────────────────────────────────────

describe('classifyEmotionalTone', () => {
  it('detects happy tone', async () => {
    expect(await classifyEmotionalTone('What a wonderful and joyful day!')).toBe('happy')
  })

  it('detects nostalgic tone', async () => {
    expect(await classifyEmotionalTone('I really miss those days from 5 years ago')).toBe('nostalgic')
  })

  it('detects bittersweet tone', async () => {
    expect(await classifyEmotionalTone('Feeling sad about the loss')).toBe('bittersweet')
  })

  it('detects reflective tone', async () => {
    expect(await classifyEmotionalTone('I wonder and reflect about life')).toBe('reflective')
  })

  it('defaults to peaceful when no keywords match', async () => {
    expect(await classifyEmotionalTone('The sky is blue today')).toBe('peaceful')
  })

  it('returns peaceful for empty string', async () => {
    expect(await classifyEmotionalTone('')).toBe('peaceful')
  })
})

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
  it('adds standard boost by default', () => {
    const memory = makeMemory({ visitCount: 10 })
    const boosted = applyPremiumFertilizer(memory)
    expect(boosted.visitCount).toBe(28) // 10 + 18
  })

  it('adds premium boost', () => {
    const memory = makeMemory({ visitCount: 5 })
    const boosted = applyPremiumFertilizer(memory, 'premium')
    expect(boosted.visitCount).toBe(39) // 5 + 34
  })

  it('adds legendary boost', () => {
    const memory = makeMemory({ visitCount: 0 })
    const boosted = applyPremiumFertilizer(memory, 'legendary')
    expect(boosted.visitCount).toBe(55)
  })

  it('returns a new memory object (immutability)', () => {
    const memory = makeMemory()
    const boosted = applyPremiumFertilizer(memory)
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

// ─── getBackgroundGradient ─────────────────────────────────────────────────

describe('getBackgroundGradient', () => {
  const seasons = ['spring', 'summer', 'autumn', 'winter'] as const
  const periods = ['dawn', 'day', 'dusk', 'night'] as const

  it('returns a non-empty gradient string for every season/period combo', () => {
    for (const season of seasons) {
      for (const period of periods) {
        const gradient = getBackgroundGradient(period, season)
        expect(gradient).toMatch(/^linear-gradient/)
      }
    }
  })

  it('returns distinct gradients for different times of day', () => {
    const gradients = periods.map((p) => getBackgroundGradient(p, 'spring'))
    const unique = new Set(gradients)
    expect(unique.size).toBe(4)
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

// ─── buildPlantPrompt ──────────────────────────────────────────────────────

describe('buildPlantPrompt', () => {
  const varieties: PlantVariety[] = ['flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower']
  const stages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']

  it('includes variety, stage, tone, and season in the prompt', () => {
    const prompt = buildPlantPrompt('flower', 'bloom', 'happy', 'spring')
    expect(prompt).toContain('flower')
    expect(prompt).toContain('bloom')
    expect(prompt).toContain('happy')
    expect(prompt).toContain('spring')
  })

  it('includes custom hints when provided', () => {
    const prompt = buildPlantPrompt('tree', 'mature', 'reflective', 'autumn', 'watercolor', 'with golden leaves')
    expect(prompt).toContain('with golden leaves')
  })

  it('includes stage description for every stage', () => {
    for (const stage of stages) {
      const prompt = buildPlantPrompt('herb', stage, 'peaceful', 'summer')
      expect(prompt.length).toBeGreaterThan(20)
    }
  })

  it.each(varieties)('builds a non-empty prompt for variety=%s', (variety) => {
    const prompt = buildPlantPrompt(variety, 'bloom', 'happy', 'spring')
    expect(prompt.length).toBeGreaterThan(10)
  })
})
