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

// Number of shooting stars per path
const STARS_PER_PATH = 5
// Number of sparkle particles trailing each star
const SPARKLES_PER_STAR = 8

export function GardenClusterPaths({
  memories,
  highlightedMemoryIds,
  canvasWidth,
  canvasHeight,
}: GardenClusterPathsProps) {
  const filterId = useId().replace(/:/g, '')

  const paths = useMemo(() => {
    if (highlightedMemoryIds != null && highlightedMemoryIds.size === 0) {
      return []
    }

    const groups = computeEmotionalClusterGroups(memories)
    const out: { id: string; d: string; stroke: string; pathLength: number }[] = []

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
      
      // Estimate path length for animation timing
      const pathLength = pts.reduce((acc, pt, i) => {
        if (i === 0) return 0
        const prev = pts[i - 1]
        return acc + Math.hypot(pt.x - prev.x, pt.y - prev.y)
      }, 0)
      
      out.push({ id: g.id, d, stroke: getPlantColor(g.theme), pathLength })
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
        {/* Glow filter for sparkles */}
        <filter id={`sparkle-glow-${filterId}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Brighter glow for shooting star head */}
        <filter id={`star-glow-${filterId}`} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient for sparkle trail fade */}
        {paths.map((p) => (
          <linearGradient key={`grad-${p.id}`} id={`trail-grad-${p.id}-${filterId}`}>
            <stop offset="0%" stopColor={p.stroke} stopOpacity="0" />
            <stop offset="30%" stopColor={p.stroke} stopOpacity="0.4" />
            <stop offset="100%" stopColor={p.stroke} stopOpacity="0.8" />
          </linearGradient>
        ))}
      </defs>

      {paths.map((p) => (
        <g key={p.id}>
          {/* Very faint base path to hint at the connection */}
          <path
            d={p.d}
            fill="none"
            stroke={p.stroke}
            strokeWidth={0.5}
            strokeLinecap="round"
            strokeDasharray="2 8"
            opacity={0.15}
          />

          {/* Shooting stars traveling along the path */}
          {Array.from({ length: STARS_PER_PATH }, (_, starIndex) => {
            const duration = 4 + starIndex * 0.8 // Stagger durations
            const delay = starIndex * (duration / STARS_PER_PATH) // Stagger starts
            
            return (
              <g key={`star-${starIndex}`}>
                {/* Sparkle trail particles */}
                {Array.from({ length: SPARKLES_PER_STAR }, (_, sparkleIndex) => {
                  const sparkleDelay = delay + (sparkleIndex * 0.08)
                  const sparkleSize = 2.5 - (sparkleIndex * 0.25) // Smaller towards tail
                  const sparkleOpacity = 0.8 - (sparkleIndex * 0.08) // Fade towards tail
                  
                  return (
                    <circle
                      key={`sparkle-${sparkleIndex}`}
                      r={sparkleSize}
                      fill={p.stroke}
                      filter={`url(#sparkle-glow-${filterId})`}
                      opacity={0}
                    >
                      <animateMotion
                        dur={`${duration}s`}
                        repeatCount="indefinite"
                        begin={`${sparkleDelay}s`}
                        path={p.d}
                        rotate="auto"
                      />
                      <animate
                        attributeName="opacity"
                        values={`0;${sparkleOpacity};${sparkleOpacity};0`}
                        keyTimes="0;0.1;0.85;1"
                        dur={`${duration}s`}
                        repeatCount="indefinite"
                        begin={`${sparkleDelay}s`}
                      />
                      <animate
                        attributeName="r"
                        values={`${sparkleSize * 0.5};${sparkleSize};${sparkleSize * 1.2};${sparkleSize * 0.3}`}
                        keyTimes="0;0.2;0.7;1"
                        dur={`${duration}s`}
                        repeatCount="indefinite"
                        begin={`${sparkleDelay}s`}
                      />
                    </circle>
                  )
                })}

                {/* Main shooting star head */}
                <circle
                  r={4}
                  fill="white"
                  filter={`url(#star-glow-${filterId})`}
                  opacity={0}
                >
                  <animateMotion
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                    path={p.d}
                    rotate="auto"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.95;0.95;0"
                    keyTimes="0;0.08;0.88;1"
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                  />
                  <animate
                    attributeName="r"
                    values="2;4;4;2"
                    keyTimes="0;0.15;0.8;1"
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                  />
                </circle>

                {/* Inner colored core of shooting star */}
                <circle
                  r={2.5}
                  fill={p.stroke}
                  opacity={0}
                >
                  <animateMotion
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                    path={p.d}
                    rotate="auto"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.08;0.88;1"
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    begin={`${delay}s`}
                  />
                </circle>
              </g>
            )
          })}

          {/* Stationary sparkle particles along the path for ambient effect */}
          {Array.from({ length: 12 }, (_, i) => {
            const offset = (i + 0.5) / 12 // Spread evenly along path
            const twinkleDelay = i * 0.3
            const size = 1.2 + Math.random() * 0.8
            
            return (
              <circle
                key={`ambient-${i}`}
                r={size}
                fill={p.stroke}
                filter={`url(#sparkle-glow-${filterId})`}
                opacity={0}
              >
                <animateMotion
                  dur="0.001s"
                  fill="freeze"
                  path={p.d}
                  keyPoints={`${offset};${offset}`}
                  keyTimes="0;1"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.6;0.3;0.7;0"
                  keyTimes="0;0.25;0.5;0.75;1"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${twinkleDelay}s`}
                />
                <animate
                  attributeName="r"
                  values={`${size * 0.6};${size};${size * 0.8};${size * 1.1};${size * 0.6}`}
                  keyTimes="0;0.25;0.5;0.75;1"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${twinkleDelay}s`}
                />
              </circle>
            )
          })}
        </g>
      ))}
    </svg>
  )
}
