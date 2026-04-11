import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import {
  calculateGrowthMetrics,
  getPlantStage,
  getPlantColor,
  getPlantSize,
  selectPlantVariety,
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
    photoUrl: 'data:image/png;base64,test',
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
    width: 70,
    bloomCount: 2,
    foliageDensity: 50,
    rarityScore: 30,
    lastInteractionAt: Date.now(),
    ...overrides,
  }
}

describe('selectPlantVariety', () => {
  it('returns wildflower for happy tone with celebration/joy keywords', () => {
    expect(selectPlantVariety('happy', 'What a celebration this is!')).toBe('wildflower')
    expect(selectPlantVariety('happy', 'Filled with joy today')).toBe('wildflower')
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

  it('returns flower for bittersweet tone', () => {
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
      })),
    })
    const metrics = calculateGrowthMetrics(old, [])
    expect(metrics.vitality).toBeGreaterThanOrEqual(0)
    expect(metrics.vitality).toBeLessThanOrEqual(100)
  })

  it('increases vitality with nearby memories', () => {
    const memory = makeMemory()
    const isolated = calculateGrowthMetrics(memory, [])
    const withNeighbors = calculateGrowthMetrics(memory, [makeMemory(), makeMemory()])
    expect(withNeighbors.vitality).toBeGreaterThan(isolated.vitality)
  })

  it('increases bloom count with more reflections', () => {
    const noReflections = makeMemory({ reflections: [] })
    const many = makeMemory({
      reflections: Array.from({ length: 5 }, (_, i) => ({
        id: `r${i}`,
        text: 'great',
        createdAt: new Date().toISOString(),
      })),
    })
    expect(calculateGrowthMetrics(many, []).bloomCount).toBeGreaterThan(
      calculateGrowthMetrics(noReflections, []).bloomCount
    )
  })

  it('increases rarity score with shares', () => {
    const withShares = makeMemory({ shareCount: 5 })
    const noShares = makeMemory({ shareCount: 0 })
    expect(calculateGrowthMetrics(withShares, []).rarityScore).toBeGreaterThan(
      calculateGrowthMetrics(noShares, []).rarityScore
    )
  })
})

describe('getPlantStage', () => {
  it('returns seed for very low vitality', () => {
    const memory = makeMemory({
      visitCount: 0,
      reflections: [],
      growthMetrics: makeMetrics({ vitality: 5 }),
    })
    expect(getPlantStage(memory)).toBe('seed')
  })

  it('returns elder for very high vitality', () => {
    const memory = makeMemory({
      visitCount: 50,
      reflections: [],
      growthMetrics: makeMetrics({ vitality: 98 }),
    })
    expect(getPlantStage(memory)).toBe('elder')
  })

  it('calculates stage from vitality if metrics exist', () => {
    const memory = makeMemory({
      growthMetrics: makeMetrics({ vitality: 50 }),
    })
    const stage = getPlantStage(memory)
    expect(['seedling', 'young', 'bud']).toContain(stage)
  })
})

describe('getPlantColor', () => {
  it('returns color string for each emotional tone', () => {
    const tones: EmotionalTone[] = ['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']
    for (const tone of tones) {
      const color = getPlantColor(tone)
      expect(color).toContain('oklch(')
    }
  })
})

describe('getPlantSize', () => {
  it('returns increasing sizes for later stages', () => {
    const stages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    const sizes = stages.map(stage => {
      const size = getPlantSize(stage)
      return typeof size === 'number' ? size : size.height
    })
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1])
    }
  })
})

describe('classifyEmotionalTone', () => {
  it('returns peaceful for empty string', async () => {
    const tone = await classifyEmotionalTone('')
    expect(tone).toBe('peaceful')
  })

  it('detects happy tone', async () => {
    const tone = await classifyEmotionalTone('I am so happy and joyful today!')
    expect(tone).toBe('happy')
  })

  it('detects reflective tone', async () => {
    const tone = await classifyEmotionalTone('I have been thinking deeply about my life')
    expect(tone).toBe('reflective')
  })

  it('detects nostalgic tone', async () => {
    const tone = await classifyEmotionalTone('I remember back when we were young')
    expect(tone).toBe('nostalgic')
  })
})

describe('filterMemories', () => {
  const memories = [
    makeMemory({ id: '1', text: 'Paris trip', emotionalTone: 'happy', location: 'Paris', plantStage: 'bloom' }),
    makeMemory({ id: '2', text: 'Quiet evening', emotionalTone: 'peaceful', location: 'Home', plantStage: 'seed' }),
    makeMemory({ id: '3', text: 'Old memories', emotionalTone: 'nostalgic', plantStage: 'elder' }),
  ]

  it('filters by search query', () => {
    const result = filterMemories(memories, 'Paris', {
      emotionalTones: [],
      plantStages: [],
      dateRange: {},
      locations: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by emotional tone', () => {
    const result = filterMemories(memories, '', {
      emotionalTones: ['peaceful'],
      plantStages: [],
      dateRange: {},
      locations: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by plant stage', () => {
    const result = filterMemories(memories, '', {
      emotionalTones: [],
      plantStages: ['elder'],
      dateRange: {},
      locations: [],
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('filters by location', () => {
    const result = filterMemories(memories, '', {
      emotionalTones: [],
      plantStages: [],
      dateRange: {},
      locations: ['Home'],
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('returns all memories when no filters', () => {
    const result = filterMemories(memories, '', {
      emotionalTones: [],
      plantStages: [],
      dateRange: {},
      locations: [],
    })
    expect(result).toHaveLength(3)
  })
})

describe('getActiveFilterCount', () => {
  it('returns 0 for empty filters', () => {
    const count = getActiveFilterCount('', {
      emotionalTones: [],
      plantStages: [],
      dateRange: {},
      locations: [],
    })
    expect(count).toBe(0)
  })

  it('counts search query', () => {
    const count = getActiveFilterCount('test', {
      emotionalTones: [],
      plantStages: [],
      dateRange: {},
      locations: [],
    })
    expect(count).toBe(1)
  })

  it('counts all active filters', () => {
    const count = getActiveFilterCount('test', {
      emotionalTones: ['happy'],
      plantStages: ['bloom'],
      dateRange: { start: '2024-01-01' },
      locations: ['Paris'],
    })
    expect(count).toBe(5)
  })
})

describe('computeGardenMood', () => {
  it('returns peaceful mist for empty garden', () => {
    const mood = computeGardenMood([])
    expect(mood).toEqual({
      dominantEmotion: 'peaceful',
      intensity: 0,
      weatherType: 'mist',
    })
  })

  it('determines dominant emotion', () => {
    const memories = [
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'peaceful' }),
    ]
    const mood = computeGardenMood(memories)
    expect(mood.dominantEmotion).toBe('happy')
  })

  it('intensity is based on memory count', () => {
    const memories = [
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'happy' }),
    ]
    const mood = computeGardenMood(memories)
    expect(mood.intensity).toBe(24)
  })

  it('maps emotion to weather type', () => {
    const happy = computeGardenMood([makeMemory({ emotionalTone: 'happy' })])
    expect(happy.weatherType).toBe('sunny')

    const reflective = computeGardenMood([makeMemory({ emotionalTone: 'reflective' })])
    expect(reflective.weatherType).toBe('partly-cloudy')

    const nostalgic = computeGardenMood([makeMemory({ emotionalTone: 'nostalgic' })])
    expect(nostalgic.weatherType).toBe('golden-haze')

    const bittersweet = computeGardenMood([makeMemory({ emotionalTone: 'bittersweet' })])
    expect(bittersweet.weatherType).toBe('rain')

    const peaceful = computeGardenMood([makeMemory({ emotionalTone: 'peaceful' })])
    expect(peaceful.weatherType).toBe('mist')
  })
})

describe('applyPremiumFertilizer', () => {
  it('increases visit count for standard boost', () => {
    const memory = makeMemory({ visitCount: 5 })
    const boosted = applyPremiumFertilizer(memory, 'standard')
    expect(boosted.visitCount).toBe(23)
  })

  it('increases visit count for premium boost', () => {
    const memory = makeMemory({ visitCount: 5 })
    const boosted = applyPremiumFertilizer(memory, 'premium')
    expect(boosted.visitCount).toBe(39)
  })

  it('increases visit count for legendary boost', () => {
    const memory = makeMemory({ visitCount: 5 })
    const boosted = applyPremiumFertilizer(memory, 'legendary')
    expect(boosted.visitCount).toBe(60)
  })
})

describe('getSeason', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('returns spring for March-May', () => {
    vi.setSystemTime(new Date('2024-04-15'))
    expect(getSeason()).toBe('spring')
  })

  it('returns summer for June-August', () => {
    vi.setSystemTime(new Date('2024-07-15'))
    expect(getSeason()).toBe('summer')
  })

  it('returns autumn for September-November', () => {
    vi.setSystemTime(new Date('2024-10-15'))
    expect(getSeason()).toBe('autumn')
  })

  it('returns winter for December-February', () => {
    vi.setSystemTime(new Date('2024-01-15'))
    expect(getSeason()).toBe('winter')
  })
})

describe('getDayPeriod', () => {
  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('returns dawn for 5-8am', () => {
    vi.setSystemTime(new Date('2024-01-15T06:30:00'))
    expect(getDayPeriod()).toBe('dawn')
  })

  it('returns day for 8am-5pm', () => {
    vi.setSystemTime(new Date('2024-01-15T14:00:00'))
    expect(getDayPeriod()).toBe('day')
  })

  it('returns dusk for 5-8pm', () => {
    vi.setSystemTime(new Date('2024-01-15T18:30:00'))
    expect(getDayPeriod()).toBe('dusk')
  })

  it('returns night for 8pm-5am', () => {
    vi.setSystemTime(new Date('2024-01-15T23:00:00'))
    expect(getDayPeriod()).toBe('night')
  })
})

describe('getSeasonalPlantModifier', () => {
  it('returns color string for each season/tone combo', () => {
    const seasons = ['spring', 'summer', 'autumn', 'winter'] as const
    const tones: EmotionalTone[] = ['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']
    for (const season of seasons) {
      for (const tone of tones) {
        const color = getSeasonalPlantModifier(season, tone)
        expect(color).toMatch(/oklch\(/)
      }
    }
  })
})

describe('getSeasonalGroundCover', () => {
  it('returns description for each season', () => {
    expect(getSeasonalGroundCover('spring')).toBeTruthy()
    expect(getSeasonalGroundCover('summer')).toBeTruthy()
    expect(getSeasonalGroundCover('autumn')).toBeTruthy()
    expect(getSeasonalGroundCover('winter')).toBeTruthy()
  })
})

describe('ID generation functions', () => {
  it('generateShareId creates unique IDs', () => {
    const id1 = generateShareId()
    const id2 = generateShareId()
    expect(id1).not.toBe(id2)
    expect(id1).toHaveLength(8)
  })

  it('generateGardenId creates unique IDs', () => {
    const id1 = generateGardenId()
    const id2 = generateGardenId()
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^garden-/)
  })

  it('generateInviteToken creates unique tokens', () => {
    const token1 = generateInviteToken()
    const token2 = generateInviteToken()
    expect(token1).not.toBe(token2)
    expect(token1).toHaveLength(16)
  })
})

describe('getShareUrl', () => {
  it('constructs proper share URL', () => {
    const url = getShareUrl('test123')
    expect(url).toContain('?share=test123')
  })
})
