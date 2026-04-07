import type {
  Memory,
  PlantStage,
  PlantTraits,
  TraitSlot,
  TraitUnlock,
  PaletteId,
  PatternId,
  AdornmentId,
  AccentId,
  AuraId,
} from './types'

// ──── Slot progression: which stage unlocks which slot ─────
const STAGE_SLOT_MAP: Record<PlantStage, TraitSlot | null> = {
  seed: null,
  sprout: 'palette',
  seedling: 'pattern',
  young: 'adornment',
  bud: 'accent',
  bloom: 'aura',
  mature: null, // all slots already unlocked; rare variants available
  elder: null,
}

/** Ordered list of stages from earliest to latest */
const STAGE_ORDER: PlantStage[] = [
  'seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder',
]

/**
 * Returns all trait slots unlocked at a given stage.
 * A slot is unlocked if the plant has reached or passed the stage that grants it.
 */
export function getSlotsForStage(stage: PlantStage): TraitSlot[] {
  const stageIdx = STAGE_ORDER.indexOf(stage)
  const slots: TraitSlot[] = []
  for (let i = 0; i <= stageIdx; i++) {
    const slot = STAGE_SLOT_MAP[STAGE_ORDER[i]]
    if (slot) slots.push(slot)
  }
  return slots
}

/**
 * Returns the stage at which a given slot unlocks.
 */
export function getStageForSlot(slot: TraitSlot): PlantStage {
  for (const [stage, s] of Object.entries(STAGE_SLOT_MAP)) {
    if (s === slot) return stage as PlantStage
  }
  return 'bloom'
}

// ──── Trait candidate catalog ──────────────────────────────

export interface TraitCandidate {
  slot: TraitSlot
  traitId: string
  label: string
  description: string
}

export const TRAIT_CATALOG: TraitCandidate[] = [
  // Palette variants (available at sprout)
  { slot: 'palette', traitId: 'default', label: 'Natural', description: 'The natural hues of this plant' },
  { slot: 'palette', traitId: 'dawn', label: 'Dawn', description: 'Warm sunrise tones' },
  { slot: 'palette', traitId: 'twilight', label: 'Twilight', description: 'Dusky purple-blue shades' },
  { slot: 'palette', traitId: 'forest', label: 'Forest', description: 'Deep emerald tones' },
  { slot: 'palette', traitId: 'coral', label: 'Coral', description: 'Soft coral-pink tones' },
  { slot: 'palette', traitId: 'lavender', label: 'Lavender', description: 'Gentle lavender hues' },
  // Pattern variants (available at seedling)
  { slot: 'pattern', traitId: 'solid', label: 'Solid', description: 'Uniform color throughout' },
  { slot: 'pattern', traitId: 'speckle', label: 'Speckle', description: 'Dappled light spots' },
  { slot: 'pattern', traitId: 'gradient', label: 'Gradient', description: 'Color fades from tip to base' },
  { slot: 'pattern', traitId: 'stripe', label: 'Stripe', description: 'Thin striped veins' },
  // Adornments (available at young)
  { slot: 'adornment', traitId: 'none', label: 'None', description: 'No adornment' },
  { slot: 'adornment', traitId: 'dew', label: 'Morning Dew', description: 'Tiny glistening dew drops' },
  { slot: 'adornment', traitId: 'butterflies', label: 'Butterflies', description: 'Fluttering visitors' },
  { slot: 'adornment', traitId: 'fireflies', label: 'Fireflies', description: 'Gentle nighttime glow' },
  { slot: 'adornment', traitId: 'pollen', label: 'Pollen Drift', description: 'Floating golden pollen' },
  // Accents (available at bud)
  { slot: 'accent', traitId: 'none', label: 'None', description: 'No accent' },
  { slot: 'accent', traitId: 'sparkle', label: 'Sparkle', description: 'Twinkling star dust' },
  { slot: 'accent', traitId: 'rings', label: 'Growth Rings', description: 'Visible growth rings' },
  { slot: 'accent', traitId: 'halo', label: 'Halo', description: 'A soft halo overhead' },
  // Aura (available at bloom)
  { slot: 'aura', traitId: 'none', label: 'None', description: 'No aura' },
  { slot: 'aura', traitId: 'softGlow', label: 'Soft Glow', description: 'A warm ambient glow' },
  { slot: 'aura', traitId: 'starlight', label: 'Starlight', description: 'Sparkling celestial light' },
  { slot: 'aura', traitId: 'aurora', label: 'Aurora', description: 'Northern-lights shimmer' },
]

// ──── Unlock computation ───────────────────────────────────
// Each plant earns candidates based on its tending history.

/**
 * Compute which traits a plant has earned based on its growth history.
 * Returns a deduplicated array of TraitUnlock objects.
 * Results are *deterministic* given the same memory state.
 */
export function computeUnlocks(memory: Memory): TraitUnlock[] {
  const unlocks: TraitUnlock[] = []
  const now = new Date()

  // Always unlock default palette and solid pattern
  addUnlock(unlocks, 'palette', 'default', memory.plantedAt)
  addUnlock(unlocks, 'pattern', 'solid', memory.plantedAt)

  // --- Visit-based unlocks ---
  if (memory.visitCount >= 3) {
    addUnlock(unlocks, 'adornment', 'dew', memory.lastVisited || memory.plantedAt)
  }
  if (memory.visitCount >= 5) {
    addUnlock(unlocks, 'accent', 'sparkle', memory.lastVisited || memory.plantedAt)
  }
  if (memory.visitCount >= 8) {
    addUnlock(unlocks, 'palette', 'dawn', memory.lastVisited || memory.plantedAt)
  }
  if (memory.visitCount >= 12) {
    addUnlock(unlocks, 'aura', 'softGlow', memory.lastVisited || memory.plantedAt)
  }

  // --- Reflection-based unlocks ---
  const reflections = memory.reflections
  if (reflections.length >= 1) {
    addUnlock(unlocks, 'palette', 'coral', reflections[0].createdAt)
  }
  if (reflections.length >= 3) {
    addUnlock(unlocks, 'accent', 'rings', reflections[2].createdAt)
  }

  // Reflections on different days → gradient pattern
  if (hasReflectionsOnDifferentDays(memory)) {
    addUnlock(unlocks, 'pattern', 'gradient', reflections[reflections.length - 1].createdAt)
  }

  // --- Time-based unlocks ---
  const daysSincePlanted = Math.floor(
    (now.getTime() - new Date(memory.plantedAt).getTime()) / 86400000
  )

  if (daysSincePlanted >= 7) {
    addUnlock(unlocks, 'palette', 'forest', memory.plantedAt)
  }
  if (daysSincePlanted >= 14) {
    addUnlock(unlocks, 'adornment', 'fireflies', memory.plantedAt)
  }
  if (daysSincePlanted >= 30) {
    addUnlock(unlocks, 'aura', 'starlight', memory.plantedAt)
  }

  // --- Revisit-after-absence unlock ---
  if (memory.lastVisited) {
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - new Date(memory.lastVisited).getTime()) / 86400000
    )
    if (daysSinceLastVisit >= 3 && memory.visitCount >= 5) {
      addUnlock(unlocks, 'pattern', 'speckle', memory.lastVisited)
    }
  }

  // --- Share-based unlocks ---
  if ((memory.shareCount || 0) >= 1) {
    addUnlock(unlocks, 'adornment', 'butterflies', memory.shareCreatedAt || memory.plantedAt)
  }
  if ((memory.shareCount || 0) >= 3) {
    addUnlock(unlocks, 'adornment', 'pollen', memory.shareCreatedAt || memory.plantedAt)
  }

  // --- Elder-tier unlocks ---
  if (daysSincePlanted >= 60 && memory.visitCount >= 15) {
    addUnlock(unlocks, 'palette', 'twilight', memory.plantedAt)
    addUnlock(unlocks, 'palette', 'lavender', memory.plantedAt)
    addUnlock(unlocks, 'aura', 'aurora', memory.plantedAt)
    addUnlock(unlocks, 'accent', 'halo', memory.plantedAt)
    addUnlock(unlocks, 'pattern', 'stripe', memory.plantedAt)
  }

  return unlocks
}

function addUnlock(unlocks: TraitUnlock[], slot: TraitSlot, traitId: string, unlockedAt: string) {
  if (!unlocks.some((u) => u.slot === slot && u.traitId === traitId)) {
    unlocks.push({ slot, traitId, unlockedAt })
  }
}

function hasReflectionsOnDifferentDays(memory: Memory): boolean {
  if (memory.reflections.length < 2) return false
  const days = new Set(
    memory.reflections.map((r) => new Date(r.createdAt).toDateString())
  )
  return days.size >= 2
}

// ──── Candidate helpers for UI ─────────────────────────────

/**
 * Get the trait candidates available for a given slot on a specific memory.
 * Only returns candidates that the memory has unlocked.
 */
export function getAvailableCandidates(
  memory: Memory,
  slot: TraitSlot
): TraitCandidate[] {
  const unlocks = memory.unlocks || []
  const unlockedIds = new Set(
    unlocks.filter((u) => u.slot === slot).map((u) => u.traitId)
  )
  return TRAIT_CATALOG.filter(
    (c) => c.slot === slot && unlockedIds.has(c.traitId)
  )
}

/**
 * Get all slots with their status for a specific memory.
 */
export function getSlotStatus(memory: Memory): Array<{
  slot: TraitSlot
  unlocked: boolean
  unlocksAtStage: PlantStage
  activeTrait: string | undefined
  candidates: TraitCandidate[]
}> {
  const unlockedSlots = getSlotsForStage(memory.plantStage)
  const allSlots: TraitSlot[] = ['palette', 'pattern', 'adornment', 'accent', 'aura']

  return allSlots.map((slot) => {
    const unlocked = unlockedSlots.includes(slot)
    const traitMap: Record<TraitSlot, string | undefined> = {
      palette: memory.traits?.paletteId,
      pattern: memory.traits?.pattern,
      adornment: memory.traits?.adornment,
      accent: memory.traits?.accent,
      aura: memory.traits?.aura,
    }
    return {
      slot,
      unlocked,
      unlocksAtStage: getStageForSlot(slot),
      activeTrait: traitMap[slot],
      candidates: unlocked ? getAvailableCandidates(memory, slot) : [],
    }
  })
}

// ──── Genetics seed generation ─────────────────────────────

/**
 * Generate a random genetics seed string. Used at planting time.
 */
export function generateGeneticsSeed(): string {
  return `gs-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
}

// ──── Palette color map ────────────────────────────────────

export const PALETTE_COLORS: Record<PaletteId, string> = {
  default: '', // use the plant's natural color
  dawn: 'oklch(0.80 0.14 65)',
  twilight: 'oklch(0.62 0.16 280)',
  forest: 'oklch(0.52 0.12 150)',
  coral: 'oklch(0.75 0.16 25)',
  lavender: 'oklch(0.72 0.14 300)',
}

// ──── Trait application helpers for rendering ──────────────

export interface ResolvedTraitVisuals {
  colorOverride: string | null
  pattern: PatternId
  adornment: AdornmentId
  accent: AccentId
  aura: AuraId
}

/**
 * Resolve applied traits to concrete visual values for Plant rendering.
 */
export function resolveTraitVisuals(memory: Memory): ResolvedTraitVisuals {
  const traits = memory.traits || {}
  const paletteId = (traits.paletteId || 'default') as PaletteId
  const colorOverride = paletteId !== 'default' ? PALETTE_COLORS[paletteId] || null : null

  return {
    colorOverride,
    pattern: (traits.pattern || 'solid') as PatternId,
    adornment: (traits.adornment || 'none') as AdornmentId,
    accent: (traits.accent || 'none') as AccentId,
    aura: (traits.aura || 'none') as AuraId,
  }
}
