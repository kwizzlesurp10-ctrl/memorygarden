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

export type PlantVariety = 'flower' | 'tree' | 'succulent' | 'vine' | 'herb' | 'wildflower' | 'fern' | 'mushroom' | 'lotus' | 'ancient_oak' | 'eternal_rose' | 'phoenix_vine' | 'starlight_succulent'

export type HybridBaseVariety = 'flower' | 'tree' | 'succulent' | 'vine' | 'herb' | 'wildflower' | 'fern' | 'mushroom' | 'lotus'

export type HybridAdornment = 'motes' | 'fireflies' | 'rings' | 'halo' | 'none'

export type ShedStyle = 'antique' | 'storybook' | 'glass' | 'modern'

export interface MotifPath {
  d: string
  fill: 'sil' | 'rim' | 'glow' | 'accent' | 'none'
  stroke: 'sil' | 'rim' | 'glow' | 'accent' | 'none'
  sw: number
}

export interface HybridMotif {
  label: string
  paths: MotifPath[]
}

export interface HybridPalette {
  sil: string
  rim: string
  glow: string
  accent: string
}

export interface HybridGenome {
  name: string
  essence: string
  base: HybridBaseVariety
  graft: HybridBaseVariety
  palette: HybridPalette
  glowIntensity: number
  adornment: HybridAdornment
  seed: number
  motif: HybridMotif
}

export interface ShedSeed {
  id: string
  idea: string
  note: string
  when: number
  g: HybridGenome
}

export interface PlantedHybrid {
  g: HybridGenome
  seedId: string | null
  x: number
  y: number
  sc: number
}

export interface Candle {
  id: string
  date: string
  note: string
  x: number
  y: number
}

export interface StorageShedData {
  v: 1
  seeds: ShedSeed[]
  planted: PlantedHybrid[]
  shedStyle: ShedStyle
  candles: Candle[]
}

export type MemoryReactionType = 'sprout' | 'water' | 'bloom' | 'heart' | 'sparkle'

export interface MemoryReactionEntry {
  type: MemoryReactionType
  count: number
  reactedBy: string[]
}

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
  /** Optional http(s) link to a post, article, or page tied to this memory */
  linkUrl?: string
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
  /** Dream-a-plant hybrid genome (stored when isHybrid is true) */
  hybridGenome?: HybridGenome
  /** Optional social reactions (sprout, water, bloom, etc.) */
  reactions?: Partial<Record<MemoryReactionType, MemoryReactionEntry>>
  /** Original planter. Optional for backward compat with memories created before Phase 2.1. */
  plantedBy?: {
    id: string
    login: string
    avatarUrl: string
  }
  /** IDs of parent memories if this was created via Cross-Pollination */
  parentMemories?: string[]
  /** True if this memory is a hybrid created via Cross-Pollination */
  isHybrid?: boolean
  /** True if this memory belongs to the Sanctuary Circle collaborative meadow */
  isSharedPlot?: boolean
  /** Privacy visibility tier */
  visibility?: 'public' | 'circle' | 'private'
  /** 3D gifts and notes left at the base of this plant */
  gifts?: GardenGift[]
}

export interface SharedMemory {
  id: string
  memoryId: string
  shareId: string
  photoUrl: string
  text: string
  date: string
  location?: string
  linkUrl?: string
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
  /** User who added this reflection. Optional for backward compat with reflections written before Phase 2.1. */
  contributorId?: string
  contributorLogin?: string
  contributorAvatarUrl?: string
  /** True when the reflection was added by someone other than the memory's original planter — a "tend" rather than a self-reflection. */
  isTend?: boolean
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

// ──── Retention & Gentle Tending Systems ────────────────────
export type PlantHealthStatus = 'thriving' | 'healthy' | 'thirsty' | 'wilting' | 'dormant'

export interface PlantMoisture {
  level: number
  lastWateredAt: string
  depletionRatePerHour: number
  nurtureScore: number
  uniqueVisitDays: number
}

export type WaterSource =
  | 'direct_water_3d'
  | 'reflection_modal'
  | 'social_visitor'
  | 'morning_dew_ritual'
  | 'rain_weather'

export interface WateringRecord {
  id: string
  wateredAt: string
  wateredBy: {
    id: string
    login: string
    avatarUrl?: string
    isOwner: boolean
  }
  source: WaterSource
  moistureAdded: number
  vitalityGained: number
  note?: string
}

export interface WateringHistory {
  totalCount: number
  recentLogs: WateringRecord[]
}

/** User-level streak tracking with Dewdrops of Grace protective shields */
export interface GardenStreak {
  currentStreak: number
  longestStreak: number
  lastTendedDate: string
  streakShields: number
  maxStreakShields: 3
  lastShieldConsumedDate?: string
  tendedToday: boolean
}

export interface PlantCareHistory {
  totalTends: number
  lastTendedAt: string
  thrivingDaysCount: number
}

export interface DynamicVitalityMetrics extends GrowthMetrics {
  moistureLevel: number
  healthStatus: PlantHealthStatus
  wiltingFactor: number
  isEternal: boolean
}

/** Reciprocal tending bond between two gardeners (spawns twin fireflies) */
export interface GardenBond {
  partnerId: string
  partnerLogin: string
  partnerAvatarUrl?: string
  lastReciprocalWaterAt: string
  bondLevel: number
  totalReciprocalTends: number
}

// ──── Phase 4: 3D Gifts, Grove Milestones, Privacy & Gentle Whispers ─────────
export type GardenGiftType = 'blossom_note' | 'paper_lantern' | 'dew_vial' | 'wind_chime'

export interface GardenGift {
  id: string
  memoryId: string
  senderId: string
  senderLogin: string
  senderAvatarUrl?: string
  giftType: GardenGiftType
  message?: string
  createdAt: string
  openedAt?: string
  positionOffset: {
    angle: number
    distance: number
  }
}

export type GroveFeatureId =
  | 'birdbath'
  | 'fireflies'
  | 'sakura_tree'
  | 'starlight_fountain'
  | 'aurora'

export interface GroveProjectMilestone {
  gardenId: string
  totalCommunityWaterings: number
  currentTier: number
  unlockedFeatures: GroveFeatureId[]
  nextMilestoneAt: number
}

export type PrivacyMode = 'camouflage' | 'sleeping_seed'

export type GentleWhisperCategory =
  | 'on_this_day'
  | 'social_care'
  | 'gentle_thirst'
  | 'seasonal_solstice'

export interface GentleWhisper {
  id: string
  category: GentleWhisperCategory
  title: string
  message: string
  memoryId?: string
  createdAt: string
}

export type GardenLandscapeView = 'pond' | 'lakeside' | 'meadow' | 'garden_path'

export interface UserPreferences {
  hasCompletedOnboarding: boolean
  soundEnabled: boolean
  lastVisit: string
  plantStylePreference?: PlantStylePreference
  unlockState?: UnlockState
  gardenDefaults?: GardenDefaults
  /** 2D garden camera; omitted = pond (legacy default). */
  gardenLandscapeView?: GardenLandscapeView
  cloudSyncEnabled?: boolean
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
