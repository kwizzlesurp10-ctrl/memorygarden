import { useLayoutEffect, useRef, useState } from 'react'
import type { HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { buildCloseupHybrid } from '@/components/plants/hybrid-builder'
import { estimateCloseupHybridBounds } from '@/lib/garden/closeup-bounds'
import {
  domRectToBox,
  paddedViewBox,
  parseViewBox,
  viewBoxContains,
  viewBoxString,
  type SvgBox,
} from '@/lib/garden/closeup-viewbox'
import { cn } from '@/lib/utils'

export interface DreamPlantCloseupSvgProps {
  stageIndex: number
  genome: HybridGenome
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  stageLabel: string
  className?: string
  /** Test-only: draw viewBox frame inside SVG. */
  showDebugFrame?: boolean
}

function initialViewBox(stageIndex: number, genome: HybridGenome): string {
  return viewBoxString(paddedViewBox(estimateCloseupHybridBounds(stageIndex, genome)))
}

export function measureCloseupContentBox(contentGroup: SVGGraphicsElement): SvgBox {
  const rect = contentGroup.getBBox()
  return domRectToBox(rect)
}

export function fitCloseupViewBox(contentBox: SvgBox): string {
  return viewBoxString(paddedViewBox(contentBox))
}

export function DreamPlantCloseupSvg({
  stageIndex,
  genome,
  palette,
  rimStrength,
  motion,
  stageLabel,
  className,
  showDebugFrame = false,
}: DreamPlantCloseupSvgProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const contentRef = useRef<SVGGElement>(null)
  const [viewBox, setViewBox] = useState(() => initialViewBox(stageIndex, genome))

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return

    let contentBox: SvgBox
    try {
      const measured = measureCloseupContentBox(content)
      if (measured.width > 0.5 && measured.height > 0.5) {
        contentBox = measured
      } else {
        contentBox = estimateCloseupHybridBounds(stageIndex, genome)
      }
    } catch {
      contentBox = estimateCloseupHybridBounds(stageIndex, genome)
    }

    const next = fitCloseupViewBox(contentBox)
    setViewBox((prev) => (prev === next ? prev : next))
  }, [stageIndex, genome, palette, rimStrength, motion])

  const frameBox = showDebugFrame ? parseViewBox(viewBox) : null

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      overflow="visible"
      className={cn('block h-full w-full overflow-visible', className)}
      role="img"
      aria-label={`${genome.name} at ${stageLabel} growth stage`}
      data-testid="dream-plant-closeup-svg"
      data-viewbox={viewBox}
    >
      <g ref={contentRef} data-testid="dream-plant-closeup-content">
        {buildCloseupHybrid(stageIndex, genome, palette, rimStrength, motion)}
      </g>
      {showDebugFrame && frameBox && (
        <rect
          data-testid="dream-plant-closeup-debug-frame"
          x={frameBox.x + 2}
          y={frameBox.y + 2}
          width={frameBox.width - 4}
          height={frameBox.height - 4}
          fill="none"
          stroke="#ffb877"
          strokeOpacity={0.45}
          strokeWidth={0.75}
          strokeDasharray="3 2"
          pointerEvents="none"
        />
      )}
    </svg>
  )
}

/** Verify padded viewBox encloses conservative estimate (unit tests). */
export function closeupViewBoxFitsEstimate(viewBox: string, stageIndex: number, genome: HybridGenome): boolean {
  const outer = parseViewBox(viewBox)
  const inner = estimateCloseupHybridBounds(stageIndex, genome)
  return viewBoxContains(outer, inner)
}
