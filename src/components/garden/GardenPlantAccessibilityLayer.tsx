import type { GardenLandscapeView, Memory } from '@/lib/types'
import { projectMemoryToSceneWorld } from '@/lib/garden/landscape-world'
import { resolveGardenLandscapeView } from '@/lib/garden/landscape-view'

interface GardenPlantAccessibilityLayerProps {
  memories: Memory[]
  landscapeView?: GardenLandscapeView
  highlightedMemoryIds: Set<string> | null
  onMemoryClick: (memory: Memory) => void
}

export function GardenPlantAccessibilityLayer({
  memories,
  landscapeView,
  highlightedMemoryIds,
  onMemoryClick,
}: GardenPlantAccessibilityLayerProps) {
  const resolvedView = resolveGardenLandscapeView(landscapeView)

  return (
    <ul
      className="sr-only"
      aria-label="Memory plants in the garden scene"
      data-testid="garden-plant-accessibility-layer"
    >
      {memories.map((memory) => {
        const isDimmed = highlightedMemoryIds !== null && !highlightedMemoryIds.has(memory.id)
        const pos = projectMemoryToSceneWorld(memory.position, resolvedView)
        const label =
          memory.text?.trim().slice(0, 80) ||
          `${memory.emotionalTone} memory, ${memory.plantStage} stage`
        return (
          <li key={memory.id}>
            <button
              type="button"
              disabled={isDimmed}
              onClick={() => onMemoryClick(memory)}
              aria-label={`Open memory: ${label}`}
              data-scene-x={Math.round(pos.x)}
              data-scene-y={Math.round(pos.y)}
            >
              {label}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
