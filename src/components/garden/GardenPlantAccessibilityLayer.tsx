import type { GardenLandscapeView, Memory } from '@/lib/types'
import { layoutMemoryPlantsForView } from '@/lib/garden/memory-scene-layout'
import { resolveGardenLandscapeView } from '@/lib/garden/landscape-view'
import { memoryPlantA11yLabel } from '@/lib/garden/plant-a11y-label'

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
}: GardenPlantAccessibilityLayerProps) {
  const resolvedView = resolveGardenLandscapeView(landscapeView)
  const layout = layoutMemoryPlantsForView(memories, resolvedView)

  return (
    <ul
      className="sr-only"
      aria-label="Memory plants in the garden scene"
      data-testid="garden-plant-accessibility-layer"
    >
      {memories.map((memory) => {
        const isDimmed = highlightedMemoryIds !== null && !highlightedMemoryIds.has(memory.id)
        const pos = layout.get(memory.id)
        if (!pos) return null
        const label = memoryPlantA11yLabel(memory)
        return (
          <li key={memory.id} role="listitem" aria-hidden={isDimmed}>
            <span data-scene-x={Math.round(pos.x)} data-scene-y={Math.round(pos.y)}>
              {label}
              {isDimmed ? ' (hidden by filter)' : ''}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
