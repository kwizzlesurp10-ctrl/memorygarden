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
}
