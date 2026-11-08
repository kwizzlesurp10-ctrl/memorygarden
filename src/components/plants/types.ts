import type { PlantStage, PlantVariety, Season } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import type { PlantFacing } from '@/lib/garden/landscape-world'

export interface PlantProps {
  stage: PlantStage
  color: string
  stemColor: string
  groundColor: string
  season: Season
}

export interface SeededPlantContext {
  stageIndex: number
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  rng: () => number
  facing?: PlantFacing
  rimFromLeft?: boolean
  geneticsSeed?: string
}

export type SeededVariety = Extract<
  PlantVariety,
  'flower' | 'tree' | 'succulent' | 'vine' | 'herb' | 'wildflower' | 'fern' | 'mushroom' | 'lotus'
>

export const SEEDED_VARIETIES: SeededVariety[] = [
  'flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower', 'fern', 'mushroom', 'lotus',
]