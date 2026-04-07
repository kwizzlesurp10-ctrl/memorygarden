import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateGrowthMetrics,
  getPlantStage,
  applyPremiumFertilizer,
  selectPlantVariety,
  computeGardenMood,
  filterMemories,
} from '../garden-helpers'
import {
  generatePlantGenetics,
  ensureUnlockState,
  evaluateUnlocks,
  evaluateAchievements,
  applyAward,
  awardForReflection,
  awardForPlanting,
  awardForRevisit,
  awardForClusterTending,
  applyNewUnlocks,
  createDefaultUnlockState,
} from '../unlock-system'
import {
  computeUnlocks,
  getSlotStatus,
  resolveTraitVisuals,
  getSlotsForStage,
} from '../trait-system'
import type { Memory, UnlockState, SearchFilters, PlantStage } from '../types'

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

describe('Integration: Complete Memory Lifecycle', () => {
  it('simulates planting → tending → maturity → elder progression', () => {
    let memory = makeMemory({
      visitCount: 0,
      reflections: [],
      plantedAt: new Date().toISOString(),
    })

    expect(getPlantStage(memory)).toBe('seed')

    memory = { ...memory, visitCount: 2, reflections: [{ id: 'r1', text: 'first thought', createdAt: new Date().toISOString() }] }
    const stage2 = getPlantStage(memory)
    expect(['seed', 'sprout', 'seedling']).toContain(stage2)

    memory = { ...memory, visitCount: 10, reflections: Array.from({ length: 5 }, (_, i) => ({ id: `r${i}`, text: 'reflection', createdAt: new Date().toISOString() })) }
    const stage3 = getPlantStage(memory)
    expect(['sprout', 'seedling', 'young', 'bud', 'bloom', 'mature']).toContain(stage3)

    memory = {
      ...memory,
      visitCount: 30,
      reflections: Array.from({ length: 15 }, (_, i) => ({ id: `r${i}`, text: 'reflection', createdAt: new Date().toISOString() })),
      plantedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    }
    const stage4 = getPlantStage(memory)
    expect(['bloom', 'mature', 'elder']).toContain(stage4)
  })

  it('simulates trait slot unlocking through growth stages', () => {
    const stages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    let prevSlotCount = 0

    for (const stage of stages) {
      const memory = makeMemory({ plantStage: stage })
      const status = getSlotStatus(memory)
      const unlockedCount = status.filter(s => s.unlocked).length
      expect(unlockedCount).toBeGreaterThanOrEqual(prevSlotCount)
      prevSlotCount = unlockedCount
    }
  })

  it('simulates earning traits through interactions', () => {
    let memory = makeMemory({ visitCount: 0, reflections: [], plantedAt: new Date().toISOString() })
    let unlocks = computeUnlocks(memory)
    const initialUnlockCount = unlocks.length

    memory = { ...memory, visitCount: 3 }
    unlocks = computeUnlocks(memory)
    expect(unlocks.length).toBeGreaterThan(initialUnlockCount)

    memory = {
      ...memory,
      visitCount: 8,
      reflections: [
        { id: 'r1', text: 'first', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: 'r2', text: 'second', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
      ],
    }
    const laterUnlocks = computeUnlocks(memory)
    expect(laterUnlocks.length).toBeGreaterThan(unlocks.length)
  })

  it('simulates complete currency earning lifecycle', () => {
    let state = createDefaultUnlockState()
    expect(state.wallet.dew).toBe(0)

    const plantAward = awardForPlanting()
    state.wallet = applyAward(state.wallet, plantAward)
    expect(state.wallet.dew).toBeGreaterThan(0)

    const reflectionAward = awardForReflection()
    state.wallet = applyAward(state.wallet, reflectionAward)
    expect(state.wallet.dew).toBeGreaterThan(plantAward.amount)

    const oldMemory = makeMemory({ plantedAt: new Date(Date.now() - 60 * 86400000).toISOString() })
    const revisitAward = awardForRevisit(oldMemory)
    if (revisitAward) {
      state.wallet = applyAward(state.wallet, revisitAward)
      expect(state.wallet.sunlight).toBeGreaterThan(0)
    }

    const clusterAward = awardForClusterTending(5)
    if (clusterAward) {
      state.wallet = applyAward(state.wallet, clusterAward)
      expect(state.wallet.pollen).toBeGreaterThan(0)
    }
  })
})

describe('Integration: Garden Ecosystem Interactions', () => {
  it('simulates cluster synergy effects on growth', () => {
    const centerMemory = makeMemory({ visitCount: 5, position: { x: 500, y: 500 } })
    
    const noNeighbors = calculateGrowthMetrics(centerMemory, [])
    
    const nearby = Array.from({ length: 3 }, (_, i) =>
      makeMemory({ position: { x: 500 + i * 50, y: 500 + i * 50 } })
    )
    const withNeighbors = calculateGrowthMetrics(centerMemory, nearby)
    
    expect(withNeighbors.vitality).toBeGreaterThanOrEqual(noNeighbors.vitality)
    expect(withNeighbors.foliageDensity).toBeGreaterThan(noNeighbors.foliageDensity)
  })

  it('simulates mood changes as garden composition evolves', () => {
    const allHappy = Array.from({ length: 10 }, () => makeMemory({ emotionalTone: 'happy' }))
    const moodAllHappy = computeGardenMood(allHappy)
    expect(moodAllHappy.dominantEmotion).toBe('happy')
    expect(moodAllHappy.weatherType).toBe('sunny')

    const mixed = [
      ...Array.from({ length: 5 }, () => makeMemory({ emotionalTone: 'happy' })),
      ...Array.from({ length: 5 }, () => makeMemory({ emotionalTone: 'reflective' })),
    ]
    const moodMixed = computeGardenMood(mixed)
    expect(['happy', 'reflective', 'mixed']).toContain(moodMixed.dominantEmotion)
    expect(['sunny', 'rain', 'partly-cloudy', 'rain-sun']).toContain(moodMixed.weatherType)

    const diverse = [
      makeMemory({ emotionalTone: 'happy' }),
      makeMemory({ emotionalTone: 'reflective' }),
      makeMemory({ emotionalTone: 'peaceful' }),
      makeMemory({ emotionalTone: 'nostalgic' }),
      makeMemory({ emotionalTone: 'bittersweet' }),
    ]
    const moodDiverse = computeGardenMood(diverse)
    expect(['happy', 'reflective', 'peaceful', 'nostalgic', 'bittersweet', 'mixed']).toContain(moodDiverse.dominantEmotion)
  })

  it('simulates search filtering through evolving garden', () => {
    const garden = [
      makeMemory({ id: '1', text: 'happy birthday party', emotionalTone: 'happy', date: '2024-06-01', location: 'Paris' }),
      makeMemory({ id: '2', text: 'quiet reflection time', emotionalTone: 'reflective', date: '2024-03-15', location: 'London' }),
      makeMemory({ id: '3', text: 'peaceful morning walk', emotionalTone: 'peaceful', date: '2024-09-20' }),
      makeMemory({ id: '4', text: 'nostalgic old photos', emotionalTone: 'nostalgic', date: '2024-01-10', location: 'Paris' }),
    ]

    const emptyFilters: SearchFilters = { emotionalTones: [], plantStages: [], dateRange: {}, locations: [] }
    
    const byText = filterMemories(garden, 'reflection', emptyFilters)
    expect(byText).toHaveLength(1)
    expect(byText[0].id).toBe('2')

    const byTone = filterMemories(garden, '', { ...emptyFilters, emotionalTones: ['happy', 'nostalgic'] })
    expect(byTone).toHaveLength(2)
    expect(byTone.map(m => m.id).sort()).toEqual(['1', '4'])

    const byLocation = filterMemories(garden, '', { ...emptyFilters, locations: ['Paris'] })
    expect(byLocation).toHaveLength(2)
    expect(byLocation.every(m => m.location === 'Paris')).toBe(true)

    const combined = filterMemories(garden, 'nostalgic', { ...emptyFilters, locations: ['Paris'] })
    expect(combined).toHaveLength(1)
    expect(combined[0].id).toBe('4')
  })
})

describe('Integration: Unlock Progression System', () => {
  it('simulates earning cosmetic unlocks through milestones', () => {
    let state = createDefaultUnlockState()
    expect(state.unlockedPalettes).toEqual(['earthy'])
    expect(state.unlockedPatterns).toEqual(['solid'])
    expect(state.unlockedAdornments).toEqual(['none'])

    state.counters.totalReflections = 10
    let unlocks = evaluateUnlocks(state)
    expect(unlocks.newPalettes.length).toBeGreaterThan(0)
    state = applyNewUnlocks(state, unlocks)
    expect(state.unlockedPalettes.length).toBeGreaterThan(1)

    state.counters.totalReflections = 30
    state.counters.memoriesReachedMature = 5
    unlocks = evaluateUnlocks(state)
    expect(unlocks.newPalettes.length + unlocks.newPatterns.length + unlocks.newAdornments.length).toBeGreaterThan(0)
    state = applyNewUnlocks(state, unlocks)

    expect(state.unlockedPalettes.length).toBeGreaterThan(1)
  })

  it('simulates earning achievements through gameplay', () => {
    let state = createDefaultUnlockState()
    expect(state.achievements).toHaveLength(0)
    expect(state.wallet.starlight).toBe(0)

    state.counters.totalReflections = 1
    let achievements = evaluateAchievements(state)
    expect(achievements.newAchievements.length).toBeGreaterThan(0)
    expect(achievements.starlightEarned).toBeGreaterThan(0)

    state.achievements = achievements.newAchievements.map(a => ({ ...a, unlockedAt: new Date().toISOString() }))
    state.wallet.starlight += achievements.starlightEarned

    state.counters.totalReflections = 30
    state.counters.totalMemoriesPlanted = 20
    achievements = evaluateAchievements(state)
    expect(achievements.newAchievements.length).toBeGreaterThan(0)
  })

  it('simulates unlock cascades from multiple simultaneous triggers', () => {
    const state = createDefaultUnlockState()
    state.counters = {
      totalReflections: 50,
      totalVisits: 100,
      totalMemoriesPlanted: 30,
      memoriesReachedMature: 10,
      memoriesReachedElder: 5,
      nightVisitDays: 7,
      uniqueOldMemoriesRevisited: 10,
      clustersTended: 20,
      nightVisitDates: Array.from({ length: 7 }, (_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`),
      memoriesWatered3: ['mem1', 'mem2', 'mem3'],
      seasonalPlantings: { 'spring-2024': 10, 'summer-2024': 10 },
    }

    const unlocks = evaluateUnlocks(state)
    const totalNewUnlocks = unlocks.newPalettes.length + unlocks.newPatterns.length + unlocks.newAdornments.length
    expect(totalNewUnlocks).toBeGreaterThan(5)

    const achievements = evaluateAchievements(state)
    expect(achievements.newAchievements.length).toBeGreaterThan(3)
  })
})

describe('Integration: Fertilizer Boost System', () => {
  it('simulates standard → premium → legendary boost chain', () => {
    const original = makeMemory({ visitCount: 5 })
    const originalStage = getPlantStage(original)

    const standardBoosted = applyPremiumFertilizer(original, 'standard')
    const standardStage = getPlantStage(standardBoosted)

    const premiumBoosted = applyPremiumFertilizer(standardBoosted, 'premium')
    const premiumStage = getPlantStage(premiumBoosted)

    const legendaryBoosted = applyPremiumFertilizer(premiumBoosted, 'legendary')
    const legendaryStage = getPlantStage(legendaryBoosted)

    expect(standardBoosted.visitCount).toBeGreaterThan(original.visitCount)
    expect(premiumBoosted.visitCount).toBeGreaterThan(standardBoosted.visitCount)
    expect(legendaryBoosted.visitCount).toBeGreaterThan(premiumBoosted.visitCount)

    const stages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    const originalIdx = stages.indexOf(originalStage)
    const legendaryIdx = stages.indexOf(legendaryStage)
    expect(legendaryIdx).toBeGreaterThanOrEqual(originalIdx)
  })

  it('simulates boost effects on trait unlocks', () => {
    const memory = makeMemory({ visitCount: 2, reflections: [] })
    const initialUnlocks = computeUnlocks(memory)

    const boosted = applyPremiumFertilizer(memory, 'legendary')
    const boostedUnlocks = computeUnlocks(boosted)

    expect(boostedUnlocks.length).toBeGreaterThanOrEqual(initialUnlocks.length)
  })

  it('simulates boost combined with natural growth', () => {
    const memory = makeMemory({
      visitCount: 5,
      reflections: [{ id: 'r1', text: 'reflection', createdAt: new Date().toISOString() }],
      plantedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    })

    const metricsNatural = calculateGrowthMetrics(memory, [])
    
    const boosted = applyPremiumFertilizer(memory, 'premium')
    const metricsBoosted = calculateGrowthMetrics(boosted, [])

    expect(metricsBoosted.vitality).toBeGreaterThanOrEqual(metricsNatural.vitality)
  })
})

describe('Integration: Plant Variety System', () => {
  it('simulates variety selection based on tone and text', () => {
    const happyCelebration = selectPlantVariety('happy', 'celebration time with friends')
    expect(happyCelebration).toBe('wildflower')

    const happyNormal = selectPlantVariety('happy', 'nice day at the park')
    expect(happyNormal).toBe('flower')

    const peacefulHome = selectPlantVariety('peaceful', 'quiet evening at home')
    expect(peacefulHome).toBe('herb')

    const peacefulNormal = selectPlantVariety('peaceful', 'calm afternoon')
    expect(peacefulNormal).toBe('succulent')

    const reflective = selectPlantVariety('reflective', 'thinking about life')
    expect(reflective).toBe('tree')

    const nostalgic = selectPlantVariety('nostalgic', 'remembering old times')
    expect(nostalgic).toBe('vine')
  })

  it('simulates variety effects on growth metrics', () => {
    const varieties = ['flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower'] as const
    const metrics = varieties.map(variety => {
      const memory = makeMemory({ plantVariety: variety, visitCount: 10, reflections: Array.from({ length: 3 }, (_, i) => ({ id: `r${i}`, text: 'test', createdAt: new Date().toISOString() })) })
      return { variety, metrics: calculateGrowthMetrics(memory, []) }
    })

    for (const { variety, metrics: m } of metrics) {
      expect(m.height).toBeGreaterThan(0)
      expect(m.width).toBeGreaterThan(0)
      expect(m.rarityScore).toBeGreaterThanOrEqual(0)
    }

    const treeMetrics = metrics.find(m => m.variety === 'tree')!.metrics
    const succulentMetrics = metrics.find(m => m.variety === 'succulent')!.metrics
    expect(treeMetrics.height).toBeGreaterThan(succulentMetrics.height)
  })
})

describe('Integration: Genetics and Visual System', () => {
  it('simulates deterministic appearance from genetics seed', () => {
    const seed = 'test-seed-123'
    const memory1 = makeMemory({ geneticsSeed: seed })
    const memory2 = makeMemory({ geneticsSeed: seed })

    const gen1 = generatePlantGenetics(seed)
    const gen2 = generatePlantGenetics(seed)

    expect(gen1).toEqual(gen2)
  })

  it('simulates trait application to visuals', () => {
    const memoryNoTraits = makeMemory({ traits: {} })
    const visualsDefault = resolveTraitVisuals(memoryNoTraits)
    expect(visualsDefault.colorOverride).toBeNull()
    expect(visualsDefault.pattern).toBe('solid')

    const memoryWithTraits = makeMemory({
      traits: {
        paletteId: 'dawn',
        pattern: 'gradient',
        adornment: 'butterflies',
        accent: 'sparkle',
        aura: 'starlight',
      },
    })
    const visualsCustom = resolveTraitVisuals(memoryWithTraits)
    expect(visualsCustom.colorOverride).not.toBeNull()
    expect(visualsCustom.pattern).toBe('gradient')
    expect(visualsCustom.adornment).toBe('butterflies')
    expect(visualsCustom.accent).toBe('sparkle')
    expect(visualsCustom.aura).toBe('starlight')
  })

  it('simulates cosmetic customization flow', () => {
    let memory = makeMemory({
      plantStage: 'bloom',
      visitCount: 10,
      reflections: Array.from({ length: 5 }, (_, i) => ({ id: `r${i}`, text: 'test', createdAt: new Date().toISOString() })),
    })

    const unlocks = computeUnlocks(memory)
    expect(unlocks.length).toBeGreaterThan(0)

    memory = { ...memory, unlocks }

    const slotStatus = getSlotStatus(memory)
    const unlockedSlots = slotStatus.filter(s => s.unlocked)
    expect(unlockedSlots.length).toBeGreaterThan(0)

    const paletteUnlock = unlocks.find(u => u.slot === 'palette' && u.traitId !== 'default')
    if (paletteUnlock) {
      memory = {
        ...memory,
        traits: { ...memory.traits, paletteId: paletteUnlock.traitId as any },
      }

      const visuals = resolveTraitVisuals(memory)
      expect(visuals.colorOverride).not.toBeNull()
    }
  })
})

describe('Integration: Multi-Memory Garden Scenarios', () => {
  it('simulates a diverse garden with varied interactions', () => {
    const garden = [
      makeMemory({ id: '1', visitCount: 20, reflections: Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, text: 'test', createdAt: new Date().toISOString() })), plantedAt: new Date(Date.now() - 100 * 86400000).toISOString(), emotionalTone: 'happy' }),
      makeMemory({ id: '2', visitCount: 2, reflections: [], plantedAt: new Date().toISOString(), emotionalTone: 'peaceful' }),
      makeMemory({ id: '3', visitCount: 8, reflections: Array.from({ length: 3 }, (_, i) => ({ id: `r${i}`, text: 'test', createdAt: new Date().toISOString() })), plantedAt: new Date(Date.now() - 45 * 86400000).toISOString(), emotionalTone: 'reflective' }),
      makeMemory({ id: '4', visitCount: 15, shareCount: 2, reflections: Array.from({ length: 7 }, (_, i) => ({ id: `r${i}`, text: 'test', createdAt: new Date().toISOString() })), plantedAt: new Date(Date.now() - 60 * 86400000).toISOString(), emotionalTone: 'nostalgic' }),
    ]

    for (const memory of garden) {
      const metrics = calculateGrowthMetrics(memory, garden.filter(m => m.id !== memory.id))
      expect(metrics.vitality).toBeGreaterThan(0)
      expect(metrics.vitality).toBeLessThanOrEqual(100)
    }

    const mood = computeGardenMood(garden)
    expect(['happy', 'peaceful', 'reflective', 'nostalgic', 'mixed']).toContain(mood.dominantEmotion)

    const stages = garden.map(m => getPlantStage(m))
    expect(stages).toContain('elder')
  })

  it('simulates cluster formation and effects', () => {
    const clusterCenter = { x: 500, y: 500 }
    const cluster = Array.from({ length: 5 }, (_, i) =>
      makeMemory({
        id: `cluster-${i}`,
        position: {
          x: clusterCenter.x + (Math.random() - 0.5) * 200,
          y: clusterCenter.y + (Math.random() - 0.5) * 200,
        },
        visitCount: 5 + i,
      })
    )

    const isolated = makeMemory({
      id: 'isolated',
      position: { x: 2000, y: 2000 },
      visitCount: 5,
    })

    const clusterMetrics = cluster.map(m =>
      calculateGrowthMetrics(m, cluster.filter(other => other.id !== m.id))
    )

    const isolatedMetrics = calculateGrowthMetrics(isolated, [])

    const avgClusterVitality = clusterMetrics.reduce((sum, m) => sum + m.vitality, 0) / clusterMetrics.length
    expect(avgClusterVitality).toBeGreaterThanOrEqual(isolatedMetrics.vitality)
  })

  it('simulates seasonal planting patterns', () => {
    const seasons = ['spring', 'summer', 'autumn', 'winter'] as const
    const seasonalGarden = seasons.flatMap((season, idx) =>
      Array.from({ length: 5 }, (_, i) =>
        makeMemory({
          id: `${season}-${i}`,
          plantedAt: new Date(2024, idx * 3, 15).toISOString(),
        })
      )
    )

    expect(seasonalGarden).toHaveLength(20)

    const state = createDefaultUnlockState()
    for (const memory of seasonalGarden) {
      const plantedDate = new Date(memory.plantedAt)
      const month = plantedDate.getMonth()
      const year = plantedDate.getFullYear()
      let season: string
      if (month < 2 || month === 11) season = 'winter'
      else if (month < 5) season = 'spring'
      else if (month < 8) season = 'summer'
      else season = 'autumn'

      const key = `${season}-${year}`
      state.counters.seasonalPlantings[key] = (state.counters.seasonalPlantings[key] || 0) + 1
    }

    expect(Object.keys(state.counters.seasonalPlantings).length).toBeGreaterThan(0)
  })
})

describe('Integration: State Persistence Patterns', () => {
  it('simulates complete state save/load cycle', () => {
    const memory = makeMemory({
      visitCount: 10,
      reflections: Array.from({ length: 3 }, (_, i) => ({ id: `r${i}`, text: 'test', createdAt: new Date().toISOString() })),
      traits: { paletteId: 'dawn', pattern: 'gradient' },
      unlocks: [
        { slot: 'palette', traitId: 'dawn', unlockedAt: new Date().toISOString() },
        { slot: 'pattern', traitId: 'gradient', unlockedAt: new Date().toISOString() },
      ],
    })

    const serialized = JSON.stringify(memory)
    const deserialized: Memory = JSON.parse(serialized)

    expect(deserialized.visitCount).toBe(memory.visitCount)
    expect(deserialized.reflections.length).toBe(memory.reflections.length)
    expect(deserialized.traits?.paletteId).toBe(memory.traits?.paletteId)
    expect(deserialized.unlocks?.length).toBe(memory.unlocks?.length)
  })

  it('simulates unlock state save/load cycle', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 50
    state.wallet.dew = 100
    state.wallet.sunlight = 25
    state.achievements = [
      { id: 'test', name: 'Test', description: 'Test', unlockedAt: new Date().toISOString() },
    ]

    const serialized = JSON.stringify(state)
    const deserialized: UnlockState = JSON.parse(serialized)
    const ensured = ensureUnlockState(deserialized)

    expect(ensured.counters.totalReflections).toBe(50)
    expect(ensured.wallet.dew).toBe(100)
    expect(ensured.achievements.length).toBe(1)
  })
})
