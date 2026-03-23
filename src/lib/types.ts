export type EmotionalTone = 'happy' | 'reflective' | 'bittersweet' | 'peaceful' | 'nostalgic'

export type PlantStage = 'seed' | 'sprout' | 'bud' | 'bloom' | 'mature' | 'evergreen'

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
  visitCount: number
  lastVisited?: string
  reflections: Reflection[]
  audioRecordings: AudioRecording[]
  shareId?: string
  shareCreatedAt?: string
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
  audioRecordings: AudioRecording[]
  sharedBy: string
  sharedAt: string
}

export interface Reflection {
  id: string
  text: string
  createdAt: string
  audioUrl?: string
}

export interface UserPreferences {
  hasCompletedOnboarding: boolean
  soundEnabled: boolean
  lastVisit: string
}
