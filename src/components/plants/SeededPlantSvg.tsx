import type { ArtStyle, PlantStage } from '@/lib/types'
import { plantArtFilterUrl, resolvePlantArtStyle } from '@/lib/garden/plant-art-style'
import {
  PlantPixelArtFilterDef,
  plantPixelFilterLocalId,
} from './PlantPixelArtFilterDef'
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
  /** Scene graph scale outside this component (e.g. landscape projection). */
  layoutScale?: number
  facing?: PlantFacing
  rimFromLeft?: boolean
  className?: string
  artStyle?: ArtStyle
}

export function SeededPlantSvg({
  variety,
  stage,
  geneticsSeed,
  palette,
  rimStrength,
  motion,
  scale = 1,
  layoutScale = 1,
  facing = 'front',
  rimFromLeft = true,
  className,
  artStyle,
}: SeededPlantSvgProps) {
  const seedN = seedFromGenetics(geneticsSeed, `${variety}-${stage}`)
  const rng = gardenRng(seedN)
  const stageIndex = plantStageToIndex(stage)
  const ctx = { stageIndex, palette, rimStrength, motion, rng, facing, rimFromLeft, geneticsSeed }
  const nodes = buildSeededPlant(variety, ctx)
  const swayStyle = getSwayStyle(seedN, motion, variety === 'tree')
  const resolvedStyle = resolvePlantArtStyle(artStyle)
  const pixelArt = resolvedStyle === 'pixel-art'
  const effectiveScale = scale * layoutScale
  const pixelFilterId = pixelArt
    ? plantPixelFilterLocalId(variety, stage, effectiveScale)
    : ''
  const plantFilter = pixelArt ? `url(#${pixelFilterId})` : plantArtFilterUrl(resolvedStyle)

  return (
    <g className={className} transform={scale !== 1 ? `scale(${scale})` : undefined}>
      {pixelArt ? (
        <defs>
          <PlantPixelArtFilterDef
            id={pixelFilterId}
            variety={variety}
            stage={stage}
            scale={effectiveScale}
          />
        </defs>
      ) : null}
      <g
        style={{
          ...swayStyle,
          shapeRendering: pixelArt ? 'crispEdges' : undefined,
        }}
        filter={plantFilter}
      >
        {nodes}
      </g>
    </g>
  )
}