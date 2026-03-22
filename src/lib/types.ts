export type EmotionalTone = 'happy' | 'reflective' | 'bittersweet' | 'peaceful' | 'nostalgic'

export type PlantStage = 'seed' | 'sprout' | 'bud' | 'bloom' | 'mature' | 'evergreen'

export interface Position {
  x: number
  y: number
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
}

export interface Reflection {
  id: string
  text: string
  createdAt: string
}

export interface UserPreferences {
  hasCompletedOnboarding: boolean
  soundEnabled: boolean
  lastVisit: string
}
