import type { ArtStyle, PlantStage } from '@/lib/types'
import { plantArtFilterUrl, resolvePlantArtStyle } from '@/lib/garden/plant-art-style'
import type { PlantFacing } from '@/lib/garden/landscape-world'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng, seedFromGenetics } from '@/lib/garden/prng'
import { plantStageToIndex } from '@/lib/garden/stage'
import { buildSeededPlant, getSwayStyle } from './seeded-builders'
import { PlantPixelArtRasterLayer } from './PlantPixelArtRasterLayer'
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
  const plantFilter = pixelArt ? undefined : plantArtFilterUrl(resolvedStyle)
  const useBrowserRaster = pixelArt && typeof document !== 'undefined'

  const plantBody = (
    <g
      style={{
        ...swayStyle,
        shapeRendering: pixelArt ? 'crispEdges' : undefined,
      }}
      filter={plantFilter}
    >
      {nodes}
    </g>
  )

  return (
    <g className={className} transform={scale !== 1 ? `scale(${scale})` : undefined}>
      {pixelArt && useBrowserRaster ? (
        <PlantPixelArtRasterLayer
          variety={variety}
          stage={stage}
          scale={effectiveScale}
          swayStyle={swayStyle}
        >
          {nodes}
        </PlantPixelArtRasterLayer>
      ) : (
        plantBody
      )}
    </g>
  )
}
