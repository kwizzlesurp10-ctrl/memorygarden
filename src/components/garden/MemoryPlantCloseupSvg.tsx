import type { ArtStyle, Memory } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { HybridPlantSvg } from '@/components/plants/hybrid-builder'
import type { SeededVariety } from '@/components/plants/types'
import { plantStageToIndex } from '@/lib/garden/stage'
import { getPlantStage } from '@/lib/garden-helpers'
import { cn } from '@/lib/utils'

const DISPLAY_SCALE = 2.35

export interface MemoryPlantCloseupSvgProps {
  memory: Memory
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  plantArtStyle?: ArtStyle
  className?: string
}

export function MemoryPlantCloseupSvg({
  memory,
  palette,
  rimStrength,
  motion,
  plantArtStyle,
  className,
}: MemoryPlantCloseupSvgProps) {
  const stage = getPlantStage(memory)
  const isHybrid = Boolean(memory.isHybrid && memory.hybridGenome)

  return (
    <svg
      data-testid="memory-plant-closeup-svg"
      viewBox="0 0 420 340"
      className={cn('block h-auto w-full max-w-full', className)}
      role="img"
      aria-label={`Enlarged plant at ${stage} stage`}
    >
      <defs>
        <linearGradient id="memoryCloseupSoil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.hills[1]} stopOpacity={0.35} />
          <stop offset="100%" stopColor={palette.hills[2]} stopOpacity={0.85} />
        </linearGradient>
      </defs>
      <rect width="420" height="340" fill={palette.bank} opacity={0.55} />
      <ellipse cx={210} cy={268} rx={108} ry={14} fill="#050308" opacity={0.38} />
      <ellipse cx={210} cy={278} rx={132} ry={22} fill="url(#memoryCloseupSoil)" />
      <g transform={`translate(210 275) scale(${DISPLAY_SCALE})`}>
        {isHybrid && memory.hybridGenome ? (
          <HybridPlantSvg
            genome={memory.hybridGenome}
            palette={palette}
            rimStrength={rimStrength}
            motion={motion}
            stage={plantStageToIndex(stage)}
            x={0}
            y={0}
            scale={1}
            artStyle={plantArtStyle}
          />
        ) : (
          <SeededPlantSvg
            variety={memory.plantVariety as SeededVariety}
            stage={stage}
            geneticsSeed={memory.geneticsSeed || memory.id}
            palette={palette}
            rimStrength={rimStrength}
            motion={motion}
            artStyle={plantArtStyle}
          />
        )}
      </g>
    </svg>
  )
}