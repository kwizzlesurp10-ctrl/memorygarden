import type { Memory } from './types'
import { getPlantSize, getPlantStage } from './garden-helpers'

export interface PathPoint {
  x: number
  y: number
}

export function getMemoryPlantCenter(memory: Memory): PathPoint {
  const stage = getPlantStage(memory)
  const size = getPlantSize(stage) as number
  return {
    x: memory.position.x + size / 2,
    y: memory.position.y + size / 2,
  }
}

/**
 * Angular sort around centroid so path edges connect “neighbors” in space,
 * yielding readable loops on the canvas.
 */
export function orderClusterPointsAroundCentroid(points: PathPoint[]): PathPoint[] {
  if (points.length <= 1) return points
  let cx = 0
  let cy = 0
  for (const p of points) {
    cx += p.x
    cy += p.y
  }
  cx /= points.length
  cy /= points.length
  return [...points].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
}

/** Builds a smooth closed SVG path through cluster centers (organic Q curves). */
export function buildClusterPathD(points: PathPoint[]): string | null {
  if (points.length < 2) return null
  const ordered = orderClusterPointsAroundCentroid(points)
  if (ordered.length === 2) {
    const [a, b] = ordered
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
  }

  const loop = [...ordered, ordered[0]]
  let d = `M ${loop[0].x} ${loop[0].y}`

  for (let i = 1; i < loop.length; i++) {
    const prev = loop[i - 1]
    const cur = loop[i]
    const mx = (prev.x + cur.x) / 2
    const my = (prev.y + cur.y) / 2
    const dx = cur.x - prev.x
    const dy = cur.y - prev.y
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const bend = Math.min(28, len * 0.22)
    const cx = mx + nx * bend
    const cy = my + ny * bend
    d += ` Q ${cx} ${cy} ${cur.x} ${cur.y}`
  }

  return d
}
