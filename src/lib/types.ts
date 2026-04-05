export type EmotionalTone = 'happy' | 'reflective' | 'bittersweet' | 'peaceful' | 'nostalgic'

export type PlantStage = 'seed' | 'sprout' | 'seedling' | 'young' | 'bud' | 'bloom' | 'mature' | 'elder'

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
