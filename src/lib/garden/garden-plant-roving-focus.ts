export interface GardenPlantFocusTarget {
  id: string
  x: number
  y: number
}

export type GardenPlantMoveDirection = 'up' | 'down' | 'left' | 'right'

function directionalRank(
  current: GardenPlantFocusTarget,
  other: GardenPlantFocusTarget,
  direction: GardenPlantMoveDirection,
): { dot: number; distance: number } | null {
  const dx = other.x - current.x
  const dy = other.y - current.y
  const primary = direction === 'left' || direction === 'right' ? dx : dy
  if (direction === 'left' && primary >= -4) return null
  if (direction === 'right' && primary <= 4) return null
  if (direction === 'up' && primary >= -4) return null
  if (direction === 'down' && primary <= 4) return null

  const lateral = direction === 'left' || direction === 'right' ? dy : dx
  const dot = primary - Math.abs(lateral) * 0.35
  const distance = Math.hypot(dx, dy)
  return { dot, distance }
}

export function findSpatialGardenPlantNeighbor(
  current: GardenPlantFocusTarget,
  direction: GardenPlantMoveDirection,
  candidates: readonly GardenPlantFocusTarget[],
): GardenPlantFocusTarget | null {
  let best: GardenPlantFocusTarget | null = null
  let bestDot = -Infinity
  let bestDistance = Infinity
  for (const candidate of candidates) {
    if (candidate.id === current.id) continue
    const rank = directionalRank(current, candidate, direction)
    if (rank === null) continue
    if (rank.dot < bestDot) continue
    if (rank.dot === bestDot && rank.distance >= bestDistance) continue
    bestDot = rank.dot
    bestDistance = rank.distance
    best = candidate
  }
  return best
}

export function gardenPlantFocusTargetsFromLayout(
  memories: readonly { id: string }[],
  layout: Map<string, { x: number; y: number }>,
  highlightedMemoryIds: Set<string> | null,
): GardenPlantFocusTarget[] {
  const targets: GardenPlantFocusTarget[] = []
  for (const memory of memories) {
    const isDimmed = highlightedMemoryIds !== null && !highlightedMemoryIds.has(memory.id)
    if (isDimmed) continue
    const pos = layout.get(memory.id)
    if (!pos) continue
    targets.push({ id: memory.id, x: pos.x, y: pos.y })
  }
  return targets
}
