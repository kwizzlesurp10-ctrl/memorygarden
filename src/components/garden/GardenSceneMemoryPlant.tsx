import type { ArtStyle, Memory } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import type { ResolvedMemoryScenePlacement } from '@/lib/garden/memory-scene-layout'
import { GrowthCeremony } from '@/components/garden/GrowthCeremony'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { HybridPlantSvg } from '@/components/plants/hybrid-builder'
import type { SeededVariety } from '@/components/plants/types'
import { plantStageToIndex } from '@/lib/garden/stage'
import { memoryPlantA11yLabel } from '@/lib/garden-helpers'
import {
  findSpatialGardenPlantNeighbor,
  gardenPlantFocusTargetsFromLayout,
  type GardenPlantMoveDirection,
} from '@/lib/garden/garden-plant-roving-focus'

const WORLD_POSITION_NUDGE = 14

interface GardenSceneMemoryPlantProps {
  memory: Memory
  pos: ResolvedMemoryScenePlacement
  isDimmed: boolean
  isGrowing: boolean
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  lensOn: boolean
  draggingMemory: string | null
  activeLayout: Map<string, ResolvedMemoryScenePlacement>
  memories: Memory[]
  highlightedMemoryIds: Set<string> | null
  onMemoryClick: (memory: Memory) => void
  onMemoryMove: (memoryId: string, newPosition: { x: number; y: number }) => void
  onLensDetail: (memory: Memory) => void
  focusGardenPlant: (memoryId: string) => void
  plantArtStyle?: ArtStyle
}

export function GardenSceneMemoryPlant({
  memory,
  pos,
  isDimmed,
  isGrowing,
  palette,
  rimStrength,
  motion,
  lensOn,
  draggingMemory,
  activeLayout,
  memories,
  highlightedMemoryIds,
  onMemoryClick,
  onMemoryMove,
  onLensDetail,
  focusGardenPlant,
  plantArtStyle,
}: GardenSceneMemoryPlantProps) {
  const sc = pos.plantScale

  const openMemory = () => {
    if (lensOn) {
      onLensDetail(memory)
    } else if (!draggingMemory) {
      onMemoryClick(memory)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDimmed) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      openMemory()
      return
    }

    const arrowToDir: Record<string, GardenPlantMoveDirection> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
    }
    const direction = arrowToDir[e.key]
    if (!direction) return

    e.preventDefault()
    e.stopPropagation()

    if (e.ctrlKey && !e.metaKey && !e.altKey) {
      const dx = direction === 'left' ? -WORLD_POSITION_NUDGE : direction === 'right' ? WORLD_POSITION_NUDGE : 0
      const dy = direction === 'up' ? -WORLD_POSITION_NUDGE : direction === 'down' ? WORLD_POSITION_NUDGE : 0
      onMemoryMove(memory.id, {
        x: memory.position.x + dx,
        y: memory.position.y + dy,
      })
      return
    }

    if (e.metaKey || e.altKey) return

    const targets = gardenPlantFocusTargetsFromLayout(memories, activeLayout, highlightedMemoryIds)
    const neighbor = findSpatialGardenPlantNeighbor(
      { id: memory.id, x: pos.x, y: pos.y },
      direction,
      targets,
    )
    if (neighbor) focusGardenPlant(neighbor.id)
  }

  return (
    <g
      data-memory-id={memory.id}
      role="button"
      tabIndex={isDimmed ? -1 : 0}
      aria-label={`Memory: ${memoryPlantA11yLabel(memory)}`}
      aria-disabled={isDimmed || undefined}
      transform={`translate(${pos.x} ${pos.y})`}
      opacity={isDimmed ? 0.15 : 1}
      className="garden-scene-plant"
      style={{ pointerEvents: isDimmed ? 'none' : 'auto', cursor: lensOn ? 'pointer' : 'grab' }}
      onClick={(e) => {
        e.stopPropagation()
        openMemory()
      }}
      onKeyDown={handleKeyDown}
    >
      <ellipse
        aria-hidden
        cx={0}
        cy={7}
        rx={Math.max(10, 16 * sc)}
        ry={Math.max(2.5, 4.5 * sc)}
        fill="#050308"
        opacity={0.34}
      />
      <GrowthCeremony active={isGrowing} glow={palette.glow} rim={palette.rim}>
        <g transform={`scale(${sc})`}>
          {memory.isHybrid && memory.hybridGenome ? (
            <HybridPlantSvg
              genome={memory.hybridGenome}
              palette={palette}
              rimStrength={rimStrength}
              motion={motion}
              stage={plantStageToIndex(memory.plantStage)}
              x={0}
              y={0}
              scale={1}
              artStyle={plantArtStyle}
            />
          ) : (
            <SeededPlantSvg
              variety={memory.plantVariety as SeededVariety}
              stage={memory.plantStage}
              geneticsSeed={memory.geneticsSeed || memory.id}
              palette={palette}
              rimStrength={rimStrength}
              motion={motion}
              facing={pos.facing}
              rimFromLeft={pos.rimFromLeft}
              artStyle={plantArtStyle}
            />
          )}
        </g>
      </GrowthCeremony>
    </g>
  )
}
