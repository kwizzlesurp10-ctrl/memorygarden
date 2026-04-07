export type EmotionalTone = 'happy' | 'reflective' | 'bittersweet' | 'peaceful' | 'nostalgic'

export type PlantStage = 'seed' | 'sprout' | 'seedling' | 'young' | 'bud' | 'bloom' | 'mature' | 'elder'

// ──── Per-plant cosmetic trait system ──────────────────────
export type TraitSlot = 'palette' | 'pattern' | 'adornment' | 'accent' | 'aura'

export type PaletteId = 'default' | 'dawn' | 'twilight' | 'forest' | 'coral' | 'lavender' | 'earthy' | 'warm' | 'cool' | 'ocean' | 'sunset' | 'frost' | 'midnight'
export type PatternId = 'solid' | 'speckle' | 'gradient' | 'stripe'
export type AdornmentId = 'none' | 'dew' | 'butterflies' | 'fireflies' | 'pollen' | 'dew-drops' | 'sparkles' | 'seasonal-bloom' | 'golden-aura'
export type AccentId = 'none' | 'sparkle' | 'rings' | 'halo'
export type AuraId = 'none' | 'softGlow' | 'starlight' | 'aurora'

export interface PlantTraits {
  paletteId?: PaletteId
  pattern?: PatternId
  adornment?: AdornmentId
  accent?: AccentId
  aura?: AuraId
}

/** A concrete unlock earned by a specific plant based on its tending history */
export interface TraitUnlock {
  slot: TraitSlot
  traitId: string
  unlockedAt: string
}

export type PlantVariety = 'flower' | 'tree' | 'succulent' | 'vine' | 'herb' | 'wildflower' | 'ancient_oak' | 'eternal_rose' | 'phoenix_vine' | 'starlight_succulent'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export interface Position {
  x: number
  y: number
}

export interface AudioRecording {
  id: string
  dataUrl: string
  duration: number
  createdAt: string
  type: 'voice-note' | 'ambient-sound'
}

export interface Memory {
  id: string
  photoUrl: string
  text: string
  date: string
  location?: string
  plantedAt: string
  position: Position
  emotionalTone: EmotionalTone
  plantStage: PlantStage
  plantVariety: PlantVariety
  visitCount: number
  lastVisited?: string
  reflections: Reflection[]
  audioRecordings: AudioRecording[]
  shareId?: string
  shareCreatedAt?: string
  shareCount?: number
  growthMetrics?: GrowthMetrics
  generatedPlantImages?: GeneratedPlantImages
  plantStyle?: PlantStylePreference
  /** Deterministic seed for procedural appearance variation (set at planting) */
  geneticsSeed?: string
  /** Applied cosmetic traits for this plant */
  traits?: PlantTraits
  /** Persisted unlocks earned by this plant's tending history */
  unlocks?: TraitUnlock[]
  genetics?: PlantGenetics
  cosmetics?: PlantCosmetics
}

export interface SharedMemory {
  id: string
  memoryId: string
  shareId: string
  photoUrl: string
  text: string
  date: string
  location?: string
  plantedAt: string
  emotionalTone: EmotionalTone
  plantStage: PlantStage
  plantVariety: PlantVariety
  audioRecordings: AudioRecording[]
  sharedBy: string
  sharedAt: string
}

export interface Reflection {
  id: string
  text: string
  createdAt: string
  audioUrl?: string
  tone?: EmotionalTone
}

export interface GrowthMetrics {
  vitality: number
  height: number
  width: number
  bloomCount: number
  foliageDensity: number
  rarityScore: number
  lastInteractionAt: number
}

export interface UserPreferences {
  hasCompletedOnboarding: boolean
  soundEnabled: boolean
  lastVisit: string
  plantStylePreference?: PlantStylePreference
  unlockState?: UnlockState
  gardenDefaults?: GardenDefaults
}

// Feature 1: Search/Filter
export interface SearchFilters {
  emotionalTones: EmotionalTone[]
  plantStages: PlantStage[]
  dateRange: { start?: string; end?: string }
  locations: string[]
}

// Feature 2: Collaborative Gardens
export type GardenRole = 'owner' | 'collaborator' | 'viewer'

export interface GardenMember {
  userId: string
  login: string
  avatarUrl: string
  role: GardenRole
  joinedAt: string
}

export interface GardenSettings {
  allowReflections: boolean
  allowRearrange: boolean
  isPublic: boolean
  maxMembers: number
}

export interface CollaborativeGarden {
  id: string
  name: string
  description: string
  ownerId: string
  ownerLogin: string
  members: GardenMember[]
  createdAt: string
  settings: GardenSettings
  inviteToken?: string
}

export interface CollaborativeMemory extends Memory {
  contributorId: string
  contributorLogin: string
  contributorAvatarUrl: string
}

export interface ActivityEvent {
  id: string
  type: 'plant' | 'reflect' | 'boost' | 'join' | 'leave'
  userId: string
  userLogin: string
  memoryId?: string
  description: string
  createdAt: string
}

// Feature 3: Weather Effects
export type WeatherType = 'sunny' | 'mist' | 'rain' | 'rain-sun' | 'golden-haze' | 'partly-cloudy'

export interface GardenMood {
  dominantEmotion: EmotionalTone | 'mixed'
  intensity: number
  weatherType: WeatherType
}

// Feature 5: AI Plant Generation
export type ArtStyle = 'watercolor' | 'botanical-illustration' | 'pixel-art' | 'oil-painting' | 'studio-ghibli' | 'photorealistic'

export interface PlantStylePreference {
  artStyle: ArtStyle
  colorPalette?: string[]
  customPromptHints?: string
}

export interface GeneratedPlantImages {
  [stage: string]: string // PlantStage -> base64 DataURL
}

// ── Constraint / Unlock System ──────────────────────────────────────────────

/** Non-monetary currencies earned through interaction patterns */
export type CurrencyType = 'dew' | 'sunlight' | 'pollen' | 'starlight'

/** Rarity tiers for cosmetic unlocks */
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'legendary'

/** Palette bias presets */
export type PaletteId = 'earthy' | 'warm' | 'cool' | 'ocean' | 'sunset' | 'frost' | 'midnight'

/** Adornment types that can be applied to plants */
export type AdornmentId = 'none' | 'dew-drops' | 'butterflies' | 'fireflies' | 'sparkles' | 'seasonal-bloom' | 'golden-aura'

/** Pattern overlays for plant rendering */
export type PatternId = 'solid' | 'speckle' | 'gradient' | 'stripe'

/** Currency wallet — how much the user currently holds */
export interface CurrencyWallet {
  dew: number
  sunlight: number
  pollen: number
  starlight: number
}

/** Persistent interaction counters used to evaluate unlock rules */
export interface InteractionCounters {
  totalReflections: number
  totalVisits: number
  totalMemoriesPlanted: number
  memoriesReachedMature: number
  memoriesReachedElder: number
  nightVisitDays: number
  uniqueOldMemoriesRevisited: number
  clustersTended: number
  /** ISO date strings of distinct days the garden was visited at night */
  nightVisitDates: string[]
  /** Memory IDs that have been watered 3+ times */
  memoriesWatered3: string[]
  /** Season keys for which the user planted 3+ memories */
  seasonalPlantings: Record<string, number>
}

/** A single unlockable cosmetic item */
export interface UnlockableItem {
  id: string
  name: string
  description: string
  rarity: RarityTier
  type: 'palette' | 'adornment' | 'pattern' | 'frame'
  /** Human-readable requirement */
  requirement: string
}

/** Achievement flag with timestamp */
export interface Achievement {
  id: string
  name: string
  description: string
  unlockedAt: string
}

/** Per-memory genetics seed + applied cosmetics */
export interface PlantGenetics {
  geneticsSeed: string
  petalSizeMultiplier: number
  petalRotationOffset: number
  stemCurveOffset: number
  leafAngleOffset: number
  accentColorIndex: number
}

export interface PlantCosmetics {
  paletteId?: PaletteId
  adornmentId?: AdornmentId
  patternId?: PatternId
}

/** Unlock state stored in UserPreferences */
export interface UnlockState {
  unlockedPalettes: PaletteId[]
  unlockedAdornments: AdornmentId[]
  unlockedPatterns: PatternId[]
  unlockedFrames: string[]
  wallet: CurrencyWallet
  counters: InteractionCounters
  achievements: Achievement[]
}

/** Global garden defaults (settings modal) */
export interface GardenDefaults {
  paletteBias: PaletteId
  animationIntensity: 'subtle' | 'normal' | 'lively'
}
