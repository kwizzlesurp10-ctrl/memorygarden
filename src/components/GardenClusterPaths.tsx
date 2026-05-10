import { useMemo, useId } from 'react'
import type { Memory } from '@/lib/types'
import { computeEmotionalClusterGroups } from '@/lib/memory-cluster-groups'
import { buildClusterPathD, getMemoryPlantCenter } from '@/lib/cluster-path-geometry'
import { getPlantColor } from '@/lib/garden-helpers'

interface GardenClusterPathsProps {
  memories: Memory[]
  highlightedMemoryIds?: Set<string> | null
  canvasWidth: number
  canvasHeight: number
}

export function GardenClusterPaths({
  memories,
  highlightedMemoryIds,
  canvasWidth,
  canvasHeight,
}: GardenClusterPathsProps) {
  const filterId = useId().replace(/:/g, '')

  const paths = useMemo(() => {
    if (highlightedMemoryIds !== null && highlightedMemoryIds.size === 0) {
      return []
    }

    const groups = computeEmotionalClusterGroups(memories)
    const out: { id: string; d: string; stroke: string }[] = []

    for (const g of groups) {
      let ids = g.memoryIds
      if (highlightedMemoryIds && highlightedMemoryIds.size > 0) {
        ids = ids.filter((id) => highlightedMemoryIds.has(id))
      }
      if (ids.length < 2) continue

      const pts = ids
        .map((id) => memories.find((m) => m.id === id))
        .filter((m): m is Memory => Boolean(m))
        .map(getMemoryPlantCenter)

      if (pts.length < 2) continue
      const d = buildClusterPathD(pts)
      if (!d) continue
      out.push({ id: g.id, d, stroke: getPlantColor(g.theme) })
    }
    return out
  }, [memories, highlightedMemoryIds])

  if (paths.length === 0) return null

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      aria-hidden
    >
      <defs>
        <filter id={`cluster-glow-${filterId}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          stroke={p.stroke}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.38}
          filter={`url(#cluster-glow-${filterId})`}
        />
      ))}
    </svg>
  )
}
