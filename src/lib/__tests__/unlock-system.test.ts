import { describe, it, expect } from 'vitest'
import {
  createDefaultUnlockState,
  ensureUnlockState,
  generatePlantGenetics,
  awardForReflection,
  awardForRevisit,
  awardForClusterTending,
  awardForPlanting,
  applyAward,
  evaluateUnlocks,
  applyNewUnlocks,
  evaluateAchievements,
  canAffordReroll,
  deductRerollCost,
  REROLL_COST,
  UNLOCKABLE_ITEMS,
  ACHIEVEMENT_RULES,
  getRarityInfo,
  getCurrencyInfo,
  PALETTE_COLORS,
} from '../unlock-system'
import type { Memory, UnlockState } from '../types'

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'test-memory',
    photoUrl: '',
    text: 'test',
    date: '2024-01-01',
    plantedAt: new Date(Date.now() - 90 * 86400000).toISOString(), // 90 days ago
    position: { x: 0, y: 0 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 5,
    reflections: [
      { id: 'r1', text: 'reflection', createdAt: new Date().toISOString() },
    ],
    audioRecordings: [],
    ...overrides,
  }
}

// ── createDefaultUnlockState ────────────────────────────────────────────────

describe('createDefaultUnlockState', () => {
  it('returns a valid default state', () => {
    const state = createDefaultUnlockState()
    expect(state.unlockedPalettes).toContain('earthy')
    expect(state.unlockedAdornments).toContain('none')
    expect(state.unlockedPatterns).toContain('solid')
    expect(state.wallet.dew).toBe(0)
    expect(state.wallet.sunlight).toBe(0)
    expect(state.wallet.pollen).toBe(0)
    expect(state.wallet.starlight).toBe(0)
    expect(state.counters.totalReflections).toBe(0)
    expect(state.achievements).toHaveLength(0)
  })
})

// ── ensureUnlockState ───────────────────────────────────────────────────────

describe('ensureUnlockState', () => {
  it('returns default when given undefined', () => {
    const state = ensureUnlockState(undefined)
    expect(state.unlockedPalettes).toContain('earthy')
    expect(state.wallet.dew).toBe(0)
  })

  it('merges partial state with defaults', () => {
    const partial: UnlockState = {
      unlockedPalettes: ['earthy', 'warm'],
      unlockedAdornments: ['none'],
      unlockedPatterns: ['solid'],
      unlockedFrames: [],
      wallet: { dew: 10, sunlight: 0, pollen: 0, starlight: 0 },
      counters: {
        totalReflections: 5,
        totalVisits: 0,
        totalMemoriesPlanted: 0,
        memoriesReachedMature: 0,
        memoriesReachedElder: 0,
        nightVisitDays: 0,
        uniqueOldMemoriesRevisited: 0,
        clustersTended: 0,
        nightVisitDates: [],
        memoriesWatered3: [],
        seasonalPlantings: {},
      },
      achievements: [],
    }
    const state = ensureUnlockState(partial)
    expect(state.unlockedPalettes).toEqual(['earthy', 'warm'])
    expect(state.wallet.dew).toBe(10)
    expect(state.counters.totalReflections).toBe(5)
  })
})

// ── generatePlantGenetics ───────────────────────────────────────────────────

describe('generatePlantGenetics', () => {
  it('generates deterministic genetics from the same seed', () => {
    const g1 = generatePlantGenetics('test-seed-123')
    const g2 = generatePlantGenetics('test-seed-123')
    expect(g1).toEqual(g2)
  })

  it('generates different genetics from different seeds', () => {
    const g1 = generatePlantGenetics('seed-a')
    const g2 = generatePlantGenetics('seed-b')
    expect(g1.petalSizeMultiplier).not.toBe(g2.petalSizeMultiplier)
  })

  it('keeps values within expected ranges', () => {
    const g = generatePlantGenetics('range-test')
    expect(g.petalSizeMultiplier).toBeGreaterThanOrEqual(0.8)
    expect(g.petalSizeMultiplier).toBeLessThanOrEqual(1.2)
    expect(g.accentColorIndex).toBeGreaterThanOrEqual(0)
    expect(g.accentColorIndex).toBeLessThanOrEqual(4)
  })

  it('preserves the geneticsSeed in the output', () => {
    const g = generatePlantGenetics('my-seed')
    expect(g.geneticsSeed).toBe('my-seed')
  })
})

// ── Currency awards ─────────────────────────────────────────────────────────

describe('currency awards', () => {
  describe('awardForReflection', () => {
    it('awards dew', () => {
      const award = awardForReflection()
      expect(award.type).toBe('dew')
      expect(award.amount).toBeGreaterThan(0)
    })
  })

  describe('awardForRevisit', () => {
    it('returns sunlight for old memories (>= 30 days)', () => {
      const memory = makeMemory({ plantedAt: new Date(Date.now() - 60 * 86400000).toISOString() })
      const award = awardForRevisit(memory)
      expect(award).not.toBeNull()
      expect(award!.type).toBe('sunlight')
    })

    it('returns null for recent memories', () => {
      const memory = makeMemory({ plantedAt: new Date().toISOString() })
      const award = awardForRevisit(memory)
      expect(award).toBeNull()
    })
  })

  describe('awardForClusterTending', () => {
    it('returns pollen when >= 2 nearby', () => {
      const award = awardForClusterTending(3)
      expect(award).not.toBeNull()
      expect(award!.type).toBe('pollen')
    })

    it('returns null when < 2 nearby', () => {
      const award = awardForClusterTending(1)
      expect(award).toBeNull()
    })
  })

  describe('awardForPlanting', () => {
    it('awards dew', () => {
      const award = awardForPlanting()
      expect(award.type).toBe('dew')
      expect(award.amount).toBeGreaterThan(0)
    })
  })

  describe('applyAward', () => {
    it('increases the correct currency', () => {
      const wallet = { dew: 5, sunlight: 3, pollen: 1, starlight: 0 }
      const result = applyAward(wallet, { type: 'dew', amount: 2, reason: 'test' })
      expect(result.dew).toBe(7)
      expect(result.sunlight).toBe(3) // unchanged
    })
  })
})

// ── Unlock evaluation ───────────────────────────────────────────────────────

describe('evaluateUnlocks', () => {
  it('returns no new unlocks for default state', () => {
    const state = createDefaultUnlockState()
    const result = evaluateUnlocks(state)
    // 'default' palette always unlocks via () => true; already-unlocked items are excluded
    expect(result.newPalettes).toEqual(['default'])
    expect(result.newPatterns).toHaveLength(0)
    expect(result.newAdornments).toHaveLength(0)
  })

  it('unlocks warm palette at 10 reflections', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 10
    const result = evaluateUnlocks(state)
    expect(result.newPalettes).toContain('warm')
  })

  it('does not re-unlock already unlocked items', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 10
    state.unlockedPalettes.push('warm')
    const result = evaluateUnlocks(state)
    expect(result.newPalettes).not.toContain('warm')
  })

  it('unlocks cool palette when 5+ old memories revisited', () => {
    const state = createDefaultUnlockState()
    state.counters.uniqueOldMemoriesRevisited = 5
    const result = evaluateUnlocks(state)
    expect(result.newPalettes).toContain('cool')
  })

  it('unlocks speckle pattern at 15 reflections', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 15
    const result = evaluateUnlocks(state)
    expect(result.newPatterns).toContain('speckle')
  })

  it('unlocks dew-drops when at least 1 memory watered 3+ times', () => {
    const state = createDefaultUnlockState()
    state.counters.memoriesWatered3 = ['memory-1']
    const result = evaluateUnlocks(state)
    expect(result.newAdornments).toContain('dew-drops')
  })

  it('unlocks fireflies at 7 night visit days', () => {
    const state = createDefaultUnlockState()
    state.counters.nightVisitDays = 7
    const result = evaluateUnlocks(state)
    expect(result.newAdornments).toContain('fireflies')
  })

  it('unlocks golden-aura at 50 reflections + 10 mature memories', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 50
    state.counters.memoriesReachedMature = 10
    const result = evaluateUnlocks(state)
    expect(result.newAdornments).toContain('golden-aura')
  })

  it('does not unlock golden-aura with only reflections', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 50
    state.counters.memoriesReachedMature = 5
    const result = evaluateUnlocks(state)
    expect(result.newAdornments).not.toContain('golden-aura')
  })
})

describe('applyNewUnlocks', () => {
  it('adds new unlocks to the state', () => {
    const state = createDefaultUnlockState()
    const result = applyNewUnlocks(state, {
      newPalettes: ['warm', 'cool'],
      newPatterns: ['speckle'],
      newAdornments: [],
    })
    expect(result.unlockedPalettes).toContain('warm')
    expect(result.unlockedPalettes).toContain('cool')
    expect(result.unlockedPatterns).toContain('speckle')
  })
})

// ── Achievement evaluation ──────────────────────────────────────────────────

describe('evaluateAchievements', () => {
  it('returns no achievements for default state', () => {
    const state = createDefaultUnlockState()
    const result = evaluateAchievements(state)
    expect(result.newAchievements).toHaveLength(0)
    expect(result.starlightEarned).toBe(0)
  })

  it('awards first-reflection achievement', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 1
    const result = evaluateAchievements(state)
    expect(result.newAchievements.map(a => a.id)).toContain('first-reflection')
    expect(result.starlightEarned).toBeGreaterThan(0)
  })

  it('does not re-award existing achievements', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 1
    state.achievements = [{
      id: 'first-reflection',
      name: 'First Reflection',
      description: 'Added your first reflection',
      unlockedAt: new Date().toISOString(),
    }]
    const result = evaluateAchievements(state)
    expect(result.newAchievements).toHaveLength(0)
  })

  it('awards multiple achievements when criteria met', () => {
    const state = createDefaultUnlockState()
    state.counters.totalReflections = 30
    state.counters.totalMemoriesPlanted = 20
    const result = evaluateAchievements(state)
    const ids = result.newAchievements.map(a => a.id)
    expect(ids).toContain('first-reflection')
    expect(ids).toContain('green-thumb')
    expect(ids).toContain('memory-keeper')
  })

  it('awards night-owl at 7 night visit days', () => {
    const state = createDefaultUnlockState()
    state.counters.nightVisitDays = 7
    const result = evaluateAchievements(state)
    expect(result.newAchievements.map(a => a.id)).toContain('night-owl')
  })
})

// ── Reroll cost ─────────────────────────────────────────────────────────────

describe('reroll', () => {
  it('canAffordReroll returns true when wallet has enough dew', () => {
    expect(canAffordReroll({ dew: REROLL_COST, sunlight: 0, pollen: 0, starlight: 0 })).toBe(true)
    expect(canAffordReroll({ dew: REROLL_COST + 5, sunlight: 0, pollen: 0, starlight: 0 })).toBe(true)
  })

  it('canAffordReroll returns false when wallet is short', () => {
    expect(canAffordReroll({ dew: REROLL_COST - 1, sunlight: 0, pollen: 0, starlight: 0 })).toBe(false)
    expect(canAffordReroll({ dew: 0, sunlight: 0, pollen: 0, starlight: 0 })).toBe(false)
  })

  it('deductRerollCost subtracts the correct amount', () => {
    const wallet = { dew: 10, sunlight: 5, pollen: 3, starlight: 1 }
    const result = deductRerollCost(wallet)
    expect(result.dew).toBe(10 - REROLL_COST)
    expect(result.sunlight).toBe(5) // unchanged
  })
})

// ── Display helpers ─────────────────────────────────────────────────────────

describe('display helpers', () => {
  it('getRarityInfo returns label and color for each tier', () => {
    const tiers = ['common', 'uncommon', 'rare', 'legendary'] as const
    for (const tier of tiers) {
      const info = getRarityInfo(tier)
      expect(info.label).toBeTruthy()
      expect(info.color).toMatch(/oklch/)
    }
  })

  it('getCurrencyInfo returns info for each currency', () => {
    const currencies = ['dew', 'sunlight', 'pollen', 'starlight'] as const
    for (const c of currencies) {
      const info = getCurrencyInfo(c)
      expect(info.label).toBeTruthy()
      expect(info.emoji).toBeTruthy()
      expect(info.color).toMatch(/oklch/)
    }
  })

  it('PALETTE_COLORS has entries for all palette IDs', () => {
    const paletteIds = ['earthy', 'warm', 'cool', 'ocean', 'sunset', 'frost', 'midnight'] as const
    for (const id of paletteIds) {
      const colors = PALETTE_COLORS[id]
      expect(colors.primary).toMatch(/oklch/)
      expect(colors.secondary).toMatch(/oklch/)
      expect(colors.accent).toMatch(/oklch/)
    }
  })
})

// ── Catalogues ──────────────────────────────────────────────────────────────

describe('catalogues', () => {
  it('UNLOCKABLE_ITEMS has valid entries', () => {
    expect(UNLOCKABLE_ITEMS.length).toBeGreaterThan(0)
    for (const item of UNLOCKABLE_ITEMS) {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.type).toMatch(/^(palette|adornment|pattern|frame)$/)
      expect(item.rarity).toMatch(/^(common|uncommon|rare|legendary)$/)
    }
  })

  it('ACHIEVEMENT_RULES has valid entries', () => {
    expect(ACHIEVEMENT_RULES.length).toBeGreaterThan(0)
    for (const rule of ACHIEVEMENT_RULES) {
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBeTruthy()
      expect(rule.starlightReward).toBeGreaterThan(0)
      expect(typeof rule.check).toBe('function')
    }
  })
})
