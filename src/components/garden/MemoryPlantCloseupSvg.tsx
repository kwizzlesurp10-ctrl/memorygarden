import type { ArtStyle, Memory } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { HybridPlantSvg } from '@/components/plants/hybrid-builder'
import type { SeededVariety } from '@/components/plants/types'
import { plantStageToIndex } from '@/lib/garden/stage'
import { closeupPlantStage } from '@/lib/garden/memory-plant-closeup'
import { memoryCloseupSvgLayout } from '@/lib/garden/memory-closeup-frame'
import { cn } from '@/lib/utils'

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
  const stage = closeupPlantStage(memory)
  const isHybrid = Boolean(memory.isHybrid && memory.hybridGenome)
  const variety = (isHybrid ? memory.hybridGenome?.base : memory.plantVariety) as SeededVariety
  const { viewBox, plantTransform, shadow } = memoryCloseupSvgLayout(variety, stage, isHybrid)

  return (
    <svg
      data-testid="memory-plant-closeup-svg"
      data-art-style={plantArtStyle ?? 'watercolor'}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMax meet"
      className={cn('block h-full w-full min-h-[200px] max-h-[min(52dvh,320px)]', className)}
      role="img"
      aria-label={`Enlarged plant at ${stage} stage`}
    >
      <ellipse
        cx={shadow.cx}
        cy={shadow.cy}
        rx={shadow.rx}
        ry={shadow.ry}
        fill="#050308"
        opacity={0.32}
      />
      <g transform={plantTransform}>
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