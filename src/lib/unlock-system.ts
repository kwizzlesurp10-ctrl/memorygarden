import type {
  UnlockState,
  CurrencyWallet,
  InteractionCounters,
  UnlockableItem,
  Achievement,
  PaletteId,
  AdornmentId,
  PatternId,
  RarityTier,
  PlantGenetics,
  Memory,
} from './types'

// ── Default state ───────────────────────────────────────────────────────────

export function createDefaultUnlockState(): UnlockState {
  return {
    unlockedPalettes: ['earthy'],
    unlockedAdornments: ['none'],
    unlockedPatterns: ['solid'],
    unlockedFrames: [],
    wallet: { dew: 0, sunlight: 0, pollen: 0, starlight: 0 },
    counters: {
      totalReflections: 0,
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
}

export function ensureUnlockState(state: UnlockState | undefined): UnlockState {
  if (!state) return createDefaultUnlockState()
  return {
    ...createDefaultUnlockState(),
    ...state,
    wallet: { ...createDefaultUnlockState().wallet, ...state.wallet },
    counters: { ...createDefaultUnlockState().counters, ...state.counters },
  }
}

// ── Catalogue of unlockable items ───────────────────────────────────────────

export const UNLOCKABLE_ITEMS: UnlockableItem[] = [
  // Palettes (Common)
  { id: 'earthy', name: 'Earthy', description: 'Rich soil and bark tones', rarity: 'common', type: 'palette', requirement: 'Starter palette' },
  { id: 'warm', name: 'Warm', description: 'Sunset oranges and golden hues', rarity: 'common', type: 'palette', requirement: '10 total reflections' },
  { id: 'cool', name: 'Cool', description: 'Misty blues and lavender', rarity: 'common', type: 'palette', requirement: 'Revisit 5 memories older than 60 days' },
  { id: 'ocean', name: 'Ocean', description: 'Deep sea greens and teals', rarity: 'common', type: 'palette', requirement: 'Plant 10 memories' },
  { id: 'sunset', name: 'Sunset', description: 'Dusk pinks and amber', rarity: 'uncommon', type: 'palette', requirement: '25 total reflections' },
  { id: 'frost', name: 'Frost', description: 'Icy whites and pale blue', rarity: 'uncommon', type: 'palette', requirement: 'Visit garden at night 7 different days' },
  { id: 'midnight', name: 'Midnight', description: 'Deep indigo and starlight', rarity: 'rare', type: 'palette', requirement: '5 memories reach mature stage' },

  // Patterns (Uncommon)
  { id: 'solid', name: 'Solid', description: 'Clean, uniform color', rarity: 'common', type: 'pattern', requirement: 'Starter pattern' },
  { id: 'speckle', name: 'Speckle', description: 'Gentle speckled overlay', rarity: 'uncommon', type: 'pattern', requirement: '15 total reflections' },
  { id: 'gradient', name: 'Gradient', description: 'Smooth color gradient', rarity: 'uncommon', type: 'pattern', requirement: '20 total visits' },
  { id: 'stripe', name: 'Stripe', description: 'Subtle striped texture', rarity: 'uncommon', type: 'pattern', requirement: 'Plant 15 memories' },

  // Adornments (Rare)
  { id: 'none', name: 'None', description: 'No adornment', rarity: 'common', type: 'adornment', requirement: 'Default' },
  { id: 'dew-drops', name: 'Dew Drops', description: 'Glistening morning dew on petals', rarity: 'rare', type: 'adornment', requirement: 'Water the same plant 3 times' },
  { id: 'butterflies', name: 'Butterflies', description: 'Gentle butterflies resting nearby', rarity: 'rare', type: 'adornment', requirement: '30 total reflections' },
  { id: 'fireflies', name: 'Fireflies', description: 'Soft firefly glow at night', rarity: 'rare', type: 'adornment', requirement: 'Visit garden at night 7 different days' },
  { id: 'sparkles', name: 'Sparkles', description: 'Twinkling light motes', rarity: 'rare', type: 'adornment', requirement: '3 memories reach elder stage' },
  { id: 'seasonal-bloom', name: 'Seasonal Bloom', description: 'Extra seasonal flowers', rarity: 'rare', type: 'adornment', requirement: 'Plant 3 memories in one season + water 5 times' },

  // Legendary frame
  { id: 'golden-aura', name: 'Golden Aura', description: 'Subtle golden glow on hover', rarity: 'legendary', type: 'adornment', requirement: '50 total reflections + 10 memories reach mature' },
]

// ── Genetics ────────────────────────────────────────────────────────────────

/** Simple deterministic hash from a string seed → number in [0,1) */
function seedHash(seed: string, salt: number): number {
  let hash = 0
  const str = seed + String(salt)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash % 10000) / 10000
}

export function generatePlantGenetics(geneticsSeed: string): PlantGenetics {
  return {
    geneticsSeed,
    petalSizeMultiplier: 0.8 + seedHash(geneticsSeed, 1) * 0.4,     // 0.8–1.2
    petalRotationOffset: (seedHash(geneticsSeed, 2) - 0.5) * 20,     // -10 to +10 degrees
    stemCurveOffset: (seedHash(geneticsSeed, 3) - 0.5) * 8,          // -4 to +4 px
    leafAngleOffset: (seedHash(geneticsSeed, 4) - 0.5) * 16,         // -8 to +8 degrees
    accentColorIndex: Math.floor(seedHash(geneticsSeed, 5) * 5),      // 0–4
  }
}

// ── Currency awards ─────────────────────────────────────────────────────────

export interface CurrencyAward {
  type: 'dew' | 'sunlight' | 'pollen' | 'starlight'
  amount: number
  reason: string
}

/** Award dew for watering/reflecting */
export function awardForReflection(): CurrencyAward {
  return { type: 'dew', amount: 2, reason: 'Added a reflection' }
}

/** Award sunlight for revisiting old memories (>30 days) */
export function awardForRevisit(memory: Memory): CurrencyAward | null {
  const daysSincePlanted = Math.floor(
    (Date.now() - new Date(memory.plantedAt).getTime()) / 86400000
  )
  if (daysSincePlanted >= 30) {
    return { type: 'sunlight', amount: 3, reason: 'Revisited an old memory' }
  }
  return null
}

/** Award pollen for cluster/nearby interactions */
export function awardForClusterTending(nearbyCount: number): CurrencyAward | null {
  if (nearbyCount >= 2) {
    return { type: 'pollen', amount: 2, reason: 'Tended memories near each other' }
  }
  return null
}

/** Award dew for planting a new memory */
export function awardForPlanting(): CurrencyAward {
  return { type: 'dew', amount: 1, reason: 'Planted a new memory' }
}

export function applyAward(wallet: CurrencyWallet, award: CurrencyAward): CurrencyWallet {
  return {
    ...wallet,
    [award.type]: wallet[award.type] + award.amount,
  }
}

// ── Unlock rule evaluation ──────────────────────────────────────────────────

type UnlockCheck = (counters: InteractionCounters) => boolean

const PALETTE_UNLOCK_RULES: Record<PaletteId, UnlockCheck> = {
  earthy: () => true,
  warm: (c) => c.totalReflections >= 10,
  cool: (c) => c.uniqueOldMemoriesRevisited >= 5,
  ocean: (c) => c.totalMemoriesPlanted >= 10,
  sunset: (c) => c.totalReflections >= 25,
  frost: (c) => c.nightVisitDays >= 7,
  midnight: (c) => c.memoriesReachedMature >= 5,
}

const PATTERN_UNLOCK_RULES: Record<PatternId, UnlockCheck> = {
  solid: () => true,
  speckle: (c) => c.totalReflections >= 15,
  gradient: (c) => c.totalVisits >= 20,
  stripe: (c) => c.totalMemoriesPlanted >= 15,
}

const ADORNMENT_UNLOCK_RULES: Record<AdornmentId, UnlockCheck> = {
  'none': () => true,
  'dew-drops': (c) => c.memoriesWatered3.length >= 1,
  'butterflies': (c) => c.totalReflections >= 30,
  'fireflies': (c) => c.nightVisitDays >= 7,
  'sparkles': (c) => c.memoriesReachedElder >= 3,
  'seasonal-bloom': (c) => {
    const hasSeasonWith3 = Object.values(c.seasonalPlantings).some(v => v >= 3)
    return hasSeasonWith3 && c.totalReflections >= 5
  },
  'golden-aura': (c) => c.totalReflections >= 50 && c.memoriesReachedMature >= 10,
}

/**
 * Evaluate all unlock rules against current counters and return newly unlocked items.
 * Only returns items that are not already in the current unlock state.
 */
export function evaluateUnlocks(state: UnlockState): {
  newPalettes: PaletteId[]
  newPatterns: PatternId[]
  newAdornments: AdornmentId[]
} {
  const newPalettes: PaletteId[] = []
  const newPatterns: PatternId[] = []
  const newAdornments: AdornmentId[] = []

  for (const [id, check] of Object.entries(PALETTE_UNLOCK_RULES)) {
    const paletteId = id as PaletteId
    if (!state.unlockedPalettes.includes(paletteId) && check(state.counters)) {
      newPalettes.push(paletteId)
    }
  }

  for (const [id, check] of Object.entries(PATTERN_UNLOCK_RULES)) {
    const patternId = id as PatternId
    if (!state.unlockedPatterns.includes(patternId) && check(state.counters)) {
      newPatterns.push(patternId)
    }
  }

  for (const [id, check] of Object.entries(ADORNMENT_UNLOCK_RULES)) {
    const adornmentId = id as AdornmentId
    if (!state.unlockedAdornments.includes(adornmentId) && check(state.counters)) {
      newAdornments.push(adornmentId)
    }
  }

  return { newPalettes, newPatterns, newAdornments }
}

/** Apply newly unlocked items to the state */
export function applyNewUnlocks(
  state: UnlockState,
  unlocks: { newPalettes: PaletteId[]; newPatterns: PatternId[]; newAdornments: AdornmentId[] }
): UnlockState {
  return {
    ...state,
    unlockedPalettes: [...state.unlockedPalettes, ...unlocks.newPalettes],
    unlockedPatterns: [...state.unlockedPatterns, ...unlocks.newPatterns],
    unlockedAdornments: [...state.unlockedAdornments, ...unlocks.newAdornments],
  }
}

// ── Achievement evaluation ──────────────────────────────────────────────────

interface AchievementRule {
  id: string
  name: string
  description: string
  check: (counters: InteractionCounters) => boolean
  /** Starlight award on unlock */
  starlightReward: number
}

export const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    id: 'first-reflection',
    name: 'First Reflection',
    description: 'Added your first reflection',
    check: (c) => c.totalReflections >= 1,
    starlightReward: 1,
  },
  {
    id: 'green-thumb',
    name: 'Green Thumb',
    description: 'Added 30 total reflections',
    check: (c) => c.totalReflections >= 30,
    starlightReward: 5,
  },
  {
    id: 'master-gardener',
    name: 'Master Gardener',
    description: '10 memories reached mature stage',
    check: (c) => c.memoriesReachedMature >= 10,
    starlightReward: 10,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Visited the garden at night on 7 different days',
    check: (c) => c.nightVisitDays >= 7,
    starlightReward: 5,
  },
  {
    id: 'memory-keeper',
    name: 'Memory Keeper',
    description: 'Planted 20 memories',
    check: (c) => c.totalMemoriesPlanted >= 20,
    starlightReward: 5,
  },
  {
    id: 'time-traveler',
    name: 'Time Traveler',
    description: 'Revisited 10 memories older than 60 days',
    check: (c) => c.uniqueOldMemoriesRevisited >= 10,
    starlightReward: 8,
  },
  {
    id: 'elder-grove',
    name: 'Elder Grove',
    description: '3 memories reached elder stage',
    check: (c) => c.memoriesReachedElder >= 3,
    starlightReward: 15,
  },
]

/**
 * Evaluate achievements and return newly unlocked ones.
 */
export function evaluateAchievements(state: UnlockState): {
  newAchievements: Achievement[]
  starlightEarned: number
} {
  const existingIds = new Set(state.achievements.map(a => a.id))
  const newAchievements: Achievement[] = []
  let starlightEarned = 0

  for (const rule of ACHIEVEMENT_RULES) {
    if (!existingIds.has(rule.id) && rule.check(state.counters)) {
      newAchievements.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        unlockedAt: new Date().toISOString(),
      })
      starlightEarned += rule.starlightReward
    }
  }

  return { newAchievements, starlightEarned }
}

// ── Palette color mappings (OKLCH) ──────────────────────────────────────────

export const PALETTE_COLORS: Record<PaletteId, { primary: string; secondary: string; accent: string }> = {
  earthy: { primary: 'oklch(0.55 0.08 65)', secondary: 'oklch(0.45 0.06 55)', accent: 'oklch(0.65 0.10 75)' },
  warm: { primary: 'oklch(0.72 0.16 50)', secondary: 'oklch(0.65 0.14 40)', accent: 'oklch(0.80 0.18 60)' },
  cool: { primary: 'oklch(0.65 0.12 240)', secondary: 'oklch(0.58 0.10 230)', accent: 'oklch(0.72 0.14 250)' },
  ocean: { primary: 'oklch(0.60 0.10 180)', secondary: 'oklch(0.52 0.08 170)', accent: 'oklch(0.68 0.12 190)' },
  sunset: { primary: 'oklch(0.75 0.18 35)', secondary: 'oklch(0.68 0.16 25)', accent: 'oklch(0.82 0.20 45)' },
  frost: { primary: 'oklch(0.85 0.04 220)', secondary: 'oklch(0.78 0.06 210)', accent: 'oklch(0.90 0.03 230)' },
  midnight: { primary: 'oklch(0.35 0.12 270)', secondary: 'oklch(0.28 0.10 260)', accent: 'oklch(0.45 0.14 280)' },
}

/** Get rarity tier display info */
export function getRarityInfo(rarity: RarityTier): { label: string; color: string } {
  switch (rarity) {
    case 'common': return { label: 'Common', color: 'oklch(0.65 0.08 155)' }
    case 'uncommon': return { label: 'Uncommon', color: 'oklch(0.70 0.14 240)' }
    case 'rare': return { label: 'Rare', color: 'oklch(0.75 0.18 280)' }
    case 'legendary': return { label: 'Legendary', color: 'oklch(0.80 0.20 50)' }
  }
}

/** Get currency display info */
export function getCurrencyInfo(type: 'dew' | 'sunlight' | 'pollen' | 'starlight'): { label: string; emoji: string; color: string } {
  switch (type) {
    case 'dew': return { label: 'Dew', emoji: '💧', color: 'oklch(0.70 0.14 220)' }
    case 'sunlight': return { label: 'Sunlight', emoji: '☀️', color: 'oklch(0.80 0.18 85)' }
    case 'pollen': return { label: 'Pollen', emoji: '🌼', color: 'oklch(0.75 0.16 95)' }
    case 'starlight': return { label: 'Starlight', emoji: '✨', color: 'oklch(0.82 0.20 280)' }
  }
}

/** Cost to re-roll genetics for a plant */
export const REROLL_COST = 5 // dew

/** Check if user can afford a re-roll */
export function canAffordReroll(wallet: CurrencyWallet): boolean {
  return wallet.dew >= REROLL_COST
}

/** Deduct re-roll cost from wallet */
export function deductRerollCost(wallet: CurrencyWallet): CurrencyWallet {
  return { ...wallet, dew: wallet.dew - REROLL_COST }
}
