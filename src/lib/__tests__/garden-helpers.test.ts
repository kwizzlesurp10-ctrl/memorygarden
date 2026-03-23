import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Memory, EmotionalTone, PlantStage } from '../types'
import {
  getPlantStage,
  getPlantColor,
  getPlantSize,
  classifyEmotionalTone,
  generateAIReflection,
  getDayPeriod,
  getSeason,
  getBackgroundGradient,
  getSeasonalPlantModifier,
  getSeasonalGroundCover,
} from '../garden-helpers'

function createMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'test-id',
    photoUrl: 'https://example.com/photo.jpg',
    text: 'A beautiful day at the park',
    date: '2024-06-15',
    plantedAt: new Date().toISOString(),
    position: { x: 100, y: 200 },
    emotionalTone: 'happy',
    plantStage: 'seed',
    visitCount: 0,
    reflections: [],
    audioRecordings: [],
    ...overrides,
  }
}

describe('getPlantStage', () => {
  it('returns "seed" for a memory planted less than 1 day ago', () => {
    const memory = createMemory({ plantedAt: new Date().toISOString(), visitCount: 0 })
    expect(getPlantStage(memory)).toBe('seed')
  })

  it('returns "sprout" for a memory planted 1-2 days ago with < 2 visits', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: twoDaysAgo, visitCount: 1 })
    expect(getPlantStage(memory)).toBe('sprout')
  })

  it('returns "bud" for a memory planted 1-2 days ago with >= 2 visits', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: twoDaysAgo, visitCount: 2 })
    expect(getPlantStage(memory)).toBe('bud')
  })

  it('returns "bud" for a memory planted 4 days ago with < 3 visits', () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: fourDaysAgo, visitCount: 2 })
    expect(getPlantStage(memory)).toBe('bud')
  })

  it('returns "bloom" for a memory planted 8 days ago with >= 3 visits but < 5', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: eightDaysAgo, visitCount: 4 })
    expect(getPlantStage(memory)).toBe('bloom')
  })

  it('returns "bloom" for a memory planted 10 days ago with < 5 visits', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: tenDaysAgo, visitCount: 3 })
    expect(getPlantStage(memory)).toBe('bloom')
  })

  it('returns "mature" for a memory planted 31 days ago with >= 5 visits', () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: thirtyOneDaysAgo, visitCount: 5 })
    expect(getPlantStage(memory)).toBe('mature')
  })

  it('returns "evergreen" for a memory planted 91 days ago with >= 5 visits', () => {
    const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: ninetyOneDaysAgo, visitCount: 10 })
    expect(getPlantStage(memory)).toBe('evergreen')
  })

  it('returns "seed" for a memory planted just now with many visits', () => {
    const memory = createMemory({ plantedAt: new Date().toISOString(), visitCount: 100 })
    expect(getPlantStage(memory)).toBe('seed')
  })

  it('handles exact boundary at 1 day', () => {
    const exactlyOneDay = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: exactlyOneDay, visitCount: 0 })
    expect(getPlantStage(memory)).not.toBe('seed')
  })

  it('handles exact boundary at 3 days with 2 visits', () => {
    const exactlyThreeDays = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: exactlyThreeDays, visitCount: 2 })
    expect(getPlantStage(memory)).toBe('bud')
  })

  it('handles exact boundary at 7 days with >= 3 visits', () => {
    const exactlySevenDays = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: exactlySevenDays, visitCount: 3 })
    expect(getPlantStage(memory)).toBe('bloom')
  })

  it('handles exact boundary at 30 days with >= 5 visits', () => {
    const exactlyThirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: exactlyThirtyDays, visitCount: 5 })
    expect(getPlantStage(memory)).toBe('mature')
  })

  it('handles exact boundary at 90 days with >= 5 visits', () => {
    const exactlyNinetyDays = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const memory = createMemory({ plantedAt: exactlyNinetyDays, visitCount: 5 })
    expect(getPlantStage(memory)).toBe('evergreen')
  })
})

describe('getPlantColor', () => {
  it.each<[EmotionalTone, string]>([
    ['happy', 'oklch(0.78 0.14 85)'],
    ['reflective', 'oklch(0.60 0.12 240)'],
    ['bittersweet', 'oklch(0.70 0.15 340)'],
    ['peaceful', 'oklch(0.55 0.08 155)'],
    ['nostalgic', 'oklch(0.65 0.10 60)'],
  ])('returns correct color for "%s" tone', (tone, expectedColor) => {
    expect(getPlantColor(tone)).toBe(expectedColor)
  })
})

describe('getPlantSize', () => {
  it.each<[PlantStage, number]>([
    ['seed', 20],
    ['sprout', 35],
    ['bud', 50],
    ['bloom', 70],
    ['mature', 90],
    ['evergreen', 110],
  ])('returns correct size %d for "%s" stage', (stage, expectedSize) => {
    expect(getPlantSize(stage)).toBe(expectedSize)
  })

  it('returns progressively larger sizes for each stage', () => {
    const stages: PlantStage[] = ['seed', 'sprout', 'bud', 'bloom', 'mature', 'evergreen']
    for (let i = 1; i < stages.length; i++) {
      expect(getPlantSize(stages[i])).toBeGreaterThan(getPlantSize(stages[i - 1]))
    }
  })
})

describe('classifyEmotionalTone', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      ...globalThis.window,
      spark: {
        llm: vi.fn(),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each<EmotionalTone>(['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic'])(
    'returns "%s" when LLM responds with that tone',
    async (tone) => {
      vi.mocked(window.spark.llm).mockResolvedValue(tone)
      const result = await classifyEmotionalTone('Some memory text')
      expect(result).toBe(tone)
    }
  )

  it('trims whitespace from LLM response', async () => {
    vi.mocked(window.spark.llm).mockResolvedValue('  happy  \n')
    const result = await classifyEmotionalTone('Happy memory')
    expect(result).toBe('happy')
  })

  it('handles case-insensitive LLM response', async () => {
    vi.mocked(window.spark.llm).mockResolvedValue('HAPPY')
    const result = await classifyEmotionalTone('Happy memory')
    expect(result).toBe('happy')
  })

  it('defaults to "peaceful" for unrecognized LLM response', async () => {
    vi.mocked(window.spark.llm).mockResolvedValue('confused')
    const result = await classifyEmotionalTone('Some memory')
    expect(result).toBe('peaceful')
  })

  it('defaults to "peaceful" when LLM call fails', async () => {
    vi.mocked(window.spark.llm).mockRejectedValue(new Error('Network error'))
    const result = await classifyEmotionalTone('Some memory')
    expect(result).toBe('peaceful')
  })

  it('passes the memory text to the LLM', async () => {
    vi.mocked(window.spark.llm).mockResolvedValue('happy')
    await classifyEmotionalTone('My special memory text')
    expect(window.spark.llm).toHaveBeenCalledWith(
      expect.stringContaining('My special memory text'),
      'gpt-4o-mini'
    )
  })
})

describe('generateAIReflection', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      ...globalThis.window,
      spark: {
        llm: vi.fn(),
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns LLM-generated reflection text', async () => {
    const reflectionText = 'This is a beautiful memory that speaks to your growth.'
    vi.mocked(window.spark.llm).mockResolvedValue(reflectionText)
    const memory = createMemory()
    const result = await generateAIReflection(memory, [])
    expect(result).toBe(reflectionText)
  })

  it('trims whitespace from the reflection', async () => {
    vi.mocked(window.spark.llm).mockResolvedValue('  A reflection  \n')
    const memory = createMemory()
    const result = await generateAIReflection(memory, [])
    expect(result).toBe('A reflection')
  })

  it('includes nearby memories context in the prompt', async () => {
    vi.mocked(window.spark.llm).mockResolvedValue('Reflection')
    const memory = createMemory()
    const nearbyMemory = createMemory({ id: 'nearby', text: 'A nearby memory about friendship' })
    await generateAIReflection(memory, [nearbyMemory])
    expect(window.spark.llm).toHaveBeenCalledWith(
      expect.stringContaining('Nearby memories'),
      'gpt-4o'
    )
  })

  it('includes the memory location when provided', async () => {
    vi.mocked(window.spark.llm).mockResolvedValue('Reflection')
    const memory = createMemory({ location: 'Central Park' })
    await generateAIReflection(memory, [])
    expect(window.spark.llm).toHaveBeenCalledWith(
      expect.stringContaining('Central Park'),
      'gpt-4o'
    )
  })

  it('returns fallback text when LLM call fails', async () => {
    vi.mocked(window.spark.llm).mockRejectedValue(new Error('API error'))
    const memory = createMemory()
    const result = await generateAIReflection(memory, [])
    expect(result).toBe(
      'This memory holds a special place in your garden. What feelings arise when you revisit this moment?'
    )
  })

  it('uses gpt-4o model', async () => {
    vi.mocked(window.spark.llm).mockResolvedValue('Reflection')
    const memory = createMemory()
    await generateAIReflection(memory, [])
    expect(window.spark.llm).toHaveBeenCalledWith(expect.any(String), 'gpt-4o')
  })
})

describe('getDayPeriod', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    [5, 'dawn'],
    [6, 'dawn'],
    [7, 'dawn'],
    [8, 'day'],
    [12, 'day'],
    [16, 'day'],
    [17, 'dusk'],
    [18, 'dusk'],
    [19, 'dusk'],
    [20, 'night'],
    [23, 'night'],
    [0, 'night'],
    [3, 'night'],
    [4, 'night'],
  ] as const)('at hour %d returns "%s"', (hour, expectedPeriod) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 5, 15, hour, 30, 0))
    expect(getDayPeriod()).toBe(expectedPeriod)
    vi.useRealTimers()
  })
})

describe('getSeason', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    [0, 'winter'],   // January
    [1, 'winter'],   // February
    [2, 'spring'],   // March
    [3, 'spring'],   // April
    [4, 'spring'],   // May
    [5, 'summer'],   // June
    [6, 'summer'],   // July
    [7, 'summer'],   // August
    [8, 'autumn'],   // September
    [9, 'autumn'],   // October
    [10, 'autumn'],  // November
    [11, 'winter'],  // December
  ] as const)('for month index %d returns "%s"', (month, expectedSeason) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, month, 15))
    expect(getSeason()).toBe(expectedSeason)
    vi.useRealTimers()
  })
})

describe('getBackgroundGradient', () => {
  const periods = ['dawn', 'day', 'dusk', 'night'] as const
  const seasons = ['spring', 'summer', 'autumn', 'winter'] as const

  it.each(
    seasons.flatMap((season) =>
      periods.map((period) => [season, period] as const)
    )
  )('returns a gradient string for season="%s" period="%s"', (season, period) => {
    const result = getBackgroundGradient(period, season)
    expect(result).toMatch(/^linear-gradient/)
    expect(result).toContain('oklch')
  })

  it('returns different gradients for different periods in the same season', () => {
    const dawnGradient = getBackgroundGradient('dawn', 'summer')
    const nightGradient = getBackgroundGradient('night', 'summer')
    expect(dawnGradient).not.toBe(nightGradient)
  })

  it('returns different gradients for different seasons at the same period', () => {
    const springDay = getBackgroundGradient('day', 'spring')
    const winterDay = getBackgroundGradient('day', 'winter')
    expect(springDay).not.toBe(winterDay)
  })
})

describe('getSeasonalPlantModifier', () => {
  const tones: EmotionalTone[] = ['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']
  const seasons = ['spring', 'summer', 'autumn', 'winter'] as const

  it.each(
    seasons.flatMap((season) =>
      tones.map((tone) => [season, tone] as const)
    )
  )('returns an oklch color for season="%s" tone="%s"', (season, tone) => {
    const result = getSeasonalPlantModifier(season, tone)
    expect(result).toMatch(/^oklch\(/)
  })

  it('returns different colors for the same tone in different seasons', () => {
    const springHappy = getSeasonalPlantModifier('spring', 'happy')
    const winterHappy = getSeasonalPlantModifier('winter', 'happy')
    expect(springHappy).not.toBe(winterHappy)
  })
})

describe('getSeasonalGroundCover', () => {
  it.each([
    ['spring', 'oklch(0.70 0.12 130)'],
    ['summer', 'oklch(0.65 0.14 140)'],
    ['autumn', 'oklch(0.58 0.12 60)'],
    ['winter', 'oklch(0.85 0.02 220)'],
  ] as const)('returns correct ground color for "%s"', (season, expectedColor) => {
    expect(getSeasonalGroundCover(season)).toBe(expectedColor)
  })

  it('returns a unique color for each season', () => {
    const seasons = ['spring', 'summer', 'autumn', 'winter'] as const
    const colors = seasons.map((s) => getSeasonalGroundCover(s))
    const uniqueColors = new Set(colors)
    expect(uniqueColors.size).toBe(4)
  })
})
