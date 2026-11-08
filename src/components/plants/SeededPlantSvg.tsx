import type { PlantStage } from '@/lib/types'
import type { PlantFacing } from '@/lib/garden/landscape-world'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng, seedFromGenetics } from '@/lib/garden/prng'
import { plantStageToIndex } from '@/lib/garden/stage'
import { buildSeededPlant, getSwayStyle } from './seeded-builders'
import type { SeededVariety } from './types'

export interface SeededPlantSvgProps {
  variety: SeededVariety
  stage: PlantStage
  geneticsSeed: string
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  scale?: number
  facing?: PlantFacing
  rimFromLeft?: boolean
  className?: string
}

export function SeededPlantSvg({
  variety,
  stage,
  geneticsSeed,
  palette,
  rimStrength,
  motion,
  scale = 1,
  facing = 'front',
  rimFromLeft = true,
  className,
}: SeededPlantSvgProps) {
  const seedN = seedFromGenetics(geneticsSeed, `${variety}-${stage}`)
  const rng = gardenRng(seedN)
  const stageIndex = plantStageToIndex(stage)
  const ctx = { stageIndex, palette, rimStrength, motion, rng, facing, rimFromLeft, geneticsSeed }
  const nodes = buildSeededPlant(variety, ctx)
  const swayStyle = getSwayStyle(seedN, motion, variety === 'tree')

  return (
    <g className={className} transform={scale !== 1 ? `scale(${scale})` : undefined}>
      <g style={swayStyle}>{nodes}</g>
    </g>
  )
}