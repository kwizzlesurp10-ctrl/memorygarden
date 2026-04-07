import { describe, it, expect, beforeEach } from 'vitest'
import type { Memory, PlantStage, TraitSlot } from '../types'
import {
  getSlotsForStage,
  getStageForSlot,
  computeUnlocks,
  getAvailableCandidates,
  getSlotStatus,
  generateGeneticsSeed,
  resolveTraitVisuals,
  TRAIT_CATALOG,
  PALETTE_COLORS,
} from '../trait-system'

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'test-memory-1',
    photoUrl: 'data:image/png;base64,test',
    text: 'A test memory',
    date: '2025-01-01',
    plantedAt: '2025-01-01T00:00:00.000Z',
    position: { x: 500, y: 500 },
    emotionalTone: 'peaceful',
    plantStage: 'seed',
    plantVariety: 'flower',
    visitCount: 0,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'gs-test-abc123',
    traits: {},
    unlocks: [],
    ...overrides,
  }
}

// ──── getSlotsForStage ─────────────────────────────────────

describe('getSlotsForStage', () => {
  it('returns no slots for seed', () => {
    expect(getSlotsForStage('seed')).toEqual([])
  })

  it('returns palette for sprout', () => {
    expect(getSlotsForStage('sprout')).toEqual(['palette'])
  })

  it('returns palette + pattern for seedling', () => {
    expect(getSlotsForStage('seedling')).toEqual(['palette', 'pattern'])
  })

  it('returns palette + pattern + adornment for young', () => {
    expect(getSlotsForStage('young')).toEqual(['palette', 'pattern', 'adornment'])
  })

  it('returns 4 slots for bud', () => {
    expect(getSlotsForStage('bud')).toEqual(['palette', 'pattern', 'adornment', 'accent'])
  })

  it('returns all 5 slots for bloom', () => {
    expect(getSlotsForStage('bloom')).toEqual(['palette', 'pattern', 'adornment', 'accent', 'aura'])
  })

  it('returns all 5 slots for mature', () => {
    expect(getSlotsForStage('mature')).toEqual(['palette', 'pattern', 'adornment', 'accent', 'aura'])
  })

  it('returns all 5 slots for elder', () => {
    expect(getSlotsForStage('elder')).toEqual(['palette', 'pattern', 'adornment', 'accent', 'aura'])
  })

  it('unlocked slots accumulate monotonically', () => {
    const stages: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
    let prevCount = 0
    for (const stage of stages) {
      const slots = getSlotsForStage(stage)
      expect(slots.length).toBeGreaterThanOrEqual(prevCount)
      prevCount = slots.length
    }
  })
})

// ──── getStageForSlot ──────────────────────────────────────

describe('getStageForSlot', () => {
  it('maps palette to sprout', () => {
    expect(getStageForSlot('palette')).toBe('sprout')
  })

  it('maps pattern to seedling', () => {
    expect(getStageForSlot('pattern')).toBe('seedling')
  })

  it('maps adornment to young', () => {
    expect(getStageForSlot('adornment')).toBe('young')
  })

  it('maps accent to bud', () => {
    expect(getStageForSlot('accent')).toBe('bud')
  })

  it('maps aura to bloom', () => {
    expect(getStageForSlot('aura')).toBe('bloom')
  })
})

// ──── computeUnlocks ───────────────────────────────────────

describe('computeUnlocks', () => {
  it('always unlocks default palette and solid pattern', () => {
    const memory = makeMemory()
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'palette' && u.traitId === 'default')).toBe(true)
    expect(unlocks.some((u) => u.slot === 'pattern' && u.traitId === 'solid')).toBe(true)
  })

  it('unlocks dew after 3+ visits', () => {
    const memory = makeMemory({ visitCount: 3 })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'adornment' && u.traitId === 'dew')).toBe(true)
  })

  it('does not unlock dew with fewer than 3 visits', () => {
    const memory = makeMemory({ visitCount: 2 })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'adornment' && u.traitId === 'dew')).toBe(false)
  })

  it('unlocks sparkle after 5+ visits', () => {
    const memory = makeMemory({ visitCount: 5 })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'accent' && u.traitId === 'sparkle')).toBe(true)
  })

  it('unlocks dawn palette after 8+ visits', () => {
    const memory = makeMemory({ visitCount: 8 })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'palette' && u.traitId === 'dawn')).toBe(true)
  })

  it('unlocks softGlow aura after 12+ visits', () => {
    const memory = makeMemory({ visitCount: 12 })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'aura' && u.traitId === 'softGlow')).toBe(true)
  })

  it('unlocks coral palette after 1+ reflection', () => {
    const memory = makeMemory({
      reflections: [{ id: 'r1', text: 'first', createdAt: '2025-01-02T00:00:00.000Z' }],
    })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'palette' && u.traitId === 'coral')).toBe(true)
  })

  it('unlocks rings accent after 3+ reflections', () => {
    const memory = makeMemory({
      reflections: [
        { id: 'r1', text: 'first', createdAt: '2025-01-02T00:00:00.000Z' },
        { id: 'r2', text: 'second', createdAt: '2025-01-03T00:00:00.000Z' },
        { id: 'r3', text: 'third', createdAt: '2025-01-04T00:00:00.000Z' },
      ],
    })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'accent' && u.traitId === 'rings')).toBe(true)
  })

  it('unlocks gradient pattern with reflections on different days', () => {
    const memory = makeMemory({
      reflections: [
        { id: 'r1', text: 'first', createdAt: '2025-01-02T00:00:00.000Z' },
        { id: 'r2', text: 'second', createdAt: '2025-01-03T00:00:00.000Z' },
      ],
    })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'pattern' && u.traitId === 'gradient')).toBe(true)
  })

  it('does not unlock gradient with reflections on the same day', () => {
    const memory = makeMemory({
      reflections: [
        { id: 'r1', text: 'first', createdAt: '2025-01-02T10:00:00.000Z' },
        { id: 'r2', text: 'second', createdAt: '2025-01-02T15:00:00.000Z' },
      ],
    })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'pattern' && u.traitId === 'gradient')).toBe(false)
  })

  it('unlocks butterflies after sharing', () => {
    const memory = makeMemory({ shareCount: 1, shareCreatedAt: '2025-01-05T00:00:00.000Z' })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'adornment' && u.traitId === 'butterflies')).toBe(true)
  })

  it('unlocks pollen after 3+ shares', () => {
    const memory = makeMemory({ shareCount: 3, shareCreatedAt: '2025-01-05T00:00:00.000Z' })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'adornment' && u.traitId === 'pollen')).toBe(true)
  })

  it('unlocks forest palette after 7+ days', () => {
    const memory = makeMemory({
      plantedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'palette' && u.traitId === 'forest')).toBe(true)
  })

  it('unlocks fireflies after 14+ days', () => {
    const memory = makeMemory({
      plantedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'adornment' && u.traitId === 'fireflies')).toBe(true)
  })

  it('unlocks starlight aura after 30+ days', () => {
    const memory = makeMemory({
      plantedAt: new Date(Date.now() - 31 * 86400000).toISOString(),
    })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.slot === 'aura' && u.traitId === 'starlight')).toBe(true)
  })

  it('unlocks elder-tier traits after 60+ days and 15+ visits', () => {
    const memory = makeMemory({
      plantedAt: new Date(Date.now() - 61 * 86400000).toISOString(),
      visitCount: 16,
    })
    const unlocks = computeUnlocks(memory)
    expect(unlocks.some((u) => u.traitId === 'twilight')).toBe(true)
    expect(unlocks.some((u) => u.traitId === 'lavender')).toBe(true)
    expect(unlocks.some((u) => u.traitId === 'aurora')).toBe(true)
    expect(unlocks.some((u) => u.traitId === 'halo')).toBe(true)
    expect(unlocks.some((u) => u.traitId === 'stripe')).toBe(true)
  })

  it('does not produce duplicate unlocks', () => {
    const memory = makeMemory({
      visitCount: 20,
      plantedAt: new Date(Date.now() - 70 * 86400000).toISOString(),
      reflections: [
        { id: 'r1', text: 'first', createdAt: '2025-01-02T00:00:00.000Z' },
        { id: 'r2', text: 'second', createdAt: '2025-01-03T00:00:00.000Z' },
        { id: 'r3', text: 'third', createdAt: '2025-01-04T00:00:00.000Z' },
      ],
      shareCount: 3,
    })
    const unlocks = computeUnlocks(memory)
    const ids = unlocks.map((u) => `${u.slot}:${u.traitId}`)
    const unique = new Set(ids)
    expect(ids.length).toBe(unique.size)
  })
})

// ──── getAvailableCandidates ───────────────────────────────

describe('getAvailableCandidates', () => {
  it('returns only unlocked candidates for a given slot', () => {
    const memory = makeMemory({
      unlocks: [
        { slot: 'palette', traitId: 'default', unlockedAt: '2025-01-01T00:00:00.000Z' },
        { slot: 'palette', traitId: 'dawn', unlockedAt: '2025-01-02T00:00:00.000Z' },
      ],
    })
    const candidates = getAvailableCandidates(memory, 'palette')
    expect(candidates.length).toBe(2)
    expect(candidates.map((c) => c.traitId)).toContain('default')
    expect(candidates.map((c) => c.traitId)).toContain('dawn')
  })

  it('returns empty array when no unlocks for slot', () => {
    const memory = makeMemory({
      unlocks: [
        { slot: 'palette', traitId: 'default', unlockedAt: '2025-01-01T00:00:00.000Z' },
      ],
    })
    const candidates = getAvailableCandidates(memory, 'adornment')
    expect(candidates).toEqual([])
  })
})

// ──── getSlotStatus ────────────────────────────────────────

describe('getSlotStatus', () => {
  it('returns 5 slots', () => {
    const memory = makeMemory()
    const status = getSlotStatus(memory)
    expect(status.length).toBe(5)
  })

  it('marks all slots as locked for seed stage', () => {
    const memory = makeMemory({ plantStage: 'seed' })
    const status = getSlotStatus(memory)
    expect(status.every((s) => !s.unlocked)).toBe(true)
  })

  it('marks palette as unlocked for sprout stage', () => {
    const memory = makeMemory({ plantStage: 'sprout' })
    const status = getSlotStatus(memory)
    const paletteSlot = status.find((s) => s.slot === 'palette')
    expect(paletteSlot?.unlocked).toBe(true)
    const patternSlot = status.find((s) => s.slot === 'pattern')
    expect(patternSlot?.unlocked).toBe(false)
  })

  it('all slots unlocked for bloom stage', () => {
    const memory = makeMemory({ plantStage: 'bloom' })
    const status = getSlotStatus(memory)
    expect(status.every((s) => s.unlocked)).toBe(true)
  })

  it('shows active trait when set', () => {
    const memory = makeMemory({
      plantStage: 'bloom',
      traits: { paletteId: 'dawn', aura: 'starlight' },
    })
    const status = getSlotStatus(memory)
    const paletteSlot = status.find((s) => s.slot === 'palette')
    expect(paletteSlot?.activeTrait).toBe('dawn')
    const auraSlot = status.find((s) => s.slot === 'aura')
    expect(auraSlot?.activeTrait).toBe('starlight')
  })
})

// ──── generateGeneticsSeed ─────────────────────────────────

describe('generateGeneticsSeed', () => {
  it('generates unique seeds', () => {
    const seeds = new Set(Array.from({ length: 20 }, () => generateGeneticsSeed()))
    expect(seeds.size).toBe(20)
  })

  it('starts with gs- prefix', () => {
    const seed = generateGeneticsSeed()
    expect(seed.startsWith('gs-')).toBe(true)
  })
})

// ──── resolveTraitVisuals ──────────────────────────────────

describe('resolveTraitVisuals', () => {
  it('returns defaults for memory without traits', () => {
    const memory = makeMemory()
    const visuals = resolveTraitVisuals(memory)
    expect(visuals.colorOverride).toBeNull()
    expect(visuals.pattern).toBe('solid')
    expect(visuals.adornment).toBe('none')
    expect(visuals.accent).toBe('none')
    expect(visuals.aura).toBe('none')
  })

  it('returns color override for non-default palette', () => {
    const memory = makeMemory({ traits: { paletteId: 'dawn' } })
    const visuals = resolveTraitVisuals(memory)
    expect(visuals.colorOverride).toBe(PALETTE_COLORS.dawn)
  })

  it('returns null color override for default palette', () => {
    const memory = makeMemory({ traits: { paletteId: 'default' } })
    const visuals = resolveTraitVisuals(memory)
    expect(visuals.colorOverride).toBeNull()
  })

  it('passes through applied traits', () => {
    const memory = makeMemory({
      traits: {
        pattern: 'gradient',
        adornment: 'butterflies',
        accent: 'sparkle',
        aura: 'starlight',
      },
    })
    const visuals = resolveTraitVisuals(memory)
    expect(visuals.pattern).toBe('gradient')
    expect(visuals.adornment).toBe('butterflies')
    expect(visuals.accent).toBe('sparkle')
    expect(visuals.aura).toBe('starlight')
  })
})

// ──── TRAIT_CATALOG ────────────────────────────────────────

describe('TRAIT_CATALOG', () => {
  it('has entries for all 5 slots', () => {
    const slots = new Set(TRAIT_CATALOG.map((c) => c.slot))
    expect(slots.size).toBe(5)
    expect(slots.has('palette')).toBe(true)
    expect(slots.has('pattern')).toBe(true)
    expect(slots.has('adornment')).toBe(true)
    expect(slots.has('accent')).toBe(true)
    expect(slots.has('aura')).toBe(true)
  })

  it('each entry has required fields', () => {
    for (const candidate of TRAIT_CATALOG) {
      expect(candidate.slot).toBeTruthy()
      expect(candidate.traitId).toBeTruthy()
      expect(candidate.label).toBeTruthy()
      expect(candidate.description).toBeTruthy()
    }
  })

  it('has no duplicate slot+traitId combinations', () => {
    const keys = TRAIT_CATALOG.map((c) => `${c.slot}:${c.traitId}`)
    expect(keys.length).toBe(new Set(keys).size)
  })
})
