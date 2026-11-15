import { useLayoutEffect, useRef, useState } from 'react'
import type { ArtStyle, Memory } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { resolvePlantArtStyle } from '@/lib/garden/plant-art-style'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { HybridPlantSvg } from '@/components/plants/hybrid-builder'
import type { SeededVariety } from '@/components/plants/types'
import { plantStageToIndex } from '@/lib/garden/stage'
import { closeupPlantStage } from '@/lib/garden/memory-plant-closeup'
import {
  closeupShadowFromPlantBBox,
  closeupUsesMeasuredPlantFrame,
  closeupViewBoxFromPlantBBox,
  memoryCloseupSvgLayout,
  plantArtPanelFillRatio,
} from '@/lib/garden/memory-closeup-frame'
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
  const resolvedStyle = resolvePlantArtStyle(plantArtStyle)
  const pixelArt = resolvedStyle === 'pixel-art'
  const preferMeasuredFrame = closeupUsesMeasuredPlantFrame(variety)
  const layout = memoryCloseupSvgLayout(variety, stage, isHybrid)

  const svgRef = useRef<SVGSVGElement>(null)
  const plantRef = useRef<SVGGElement>(null)
  const [measuredViewBox, setMeasuredViewBox] = useState<string | null>(null)
  const [measuredShadow, setMeasuredShadow] = useState<typeof layout.shadow | null>(null)
  const [useTightFrame, setUseTightFrame] = useState(preferMeasuredFrame)

  useLayoutEffect(() => {
    const svg = svgRef.current
    const plant = plantRef.current
    if (!svg || !plant) return

    const applyMeasure = () => {
      if (typeof plant.getBBox !== 'function') return
      const bbox = plant.getBBox()
      if (bbox.width < 1 || bbox.height < 1) return

      const [, , , vbH] = layout.viewBox.split(' ').map(Number)
      const overflows = bbox.y < -0.5 || bbox.y + bbox.height > vbH - 2
      const reframe = preferMeasuredFrame || overflows
      if (reframe) {
        setUseTightFrame(true)
        setMeasuredViewBox(closeupViewBoxFromPlantBBox(bbox, 0.08))
        setMeasuredShadow(closeupShadowFromPlantBBox(bbox, 0.08))
      } else {
        setUseTightFrame(false)
        setMeasuredViewBox(null)
        setMeasuredShadow(null)
      }

      const fill = plantArtPanelFillRatio(svg, plant)
      svg.dataset.plantFillRatio = fill.toFixed(3)
    }

    applyMeasure()
    const t = window.setTimeout(applyMeasure, 150)
    const t2 = window.setTimeout(applyMeasure, 320)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(t2)
    }
  }, [
    preferMeasuredFrame,
    variety,
    stage,
    pixelArt,
    layout.plantTransform,
    layout.viewBox,
    measuredViewBox,
    useTightFrame,
    memory.id,
    memory.plantVariety,
    isHybrid,
  ])

  const viewBox = useTightFrame && measuredViewBox ? measuredViewBox : layout.viewBox
  const shadow = useTightFrame && measuredShadow ? measuredShadow : layout.shadow
  const preserveAspectRatio = useTightFrame && measuredViewBox ? 'xMidYMid meet' : 'xMidYMax meet'

  const translateMatch = layout.plantTransform.match(/^translate\(([\d.]+)\s+([\d.]+)\)/)
  const tx = translateMatch ? Number(translateMatch[1]) : 0
  const ty = translateMatch ? Number(translateMatch[2]) : 0
  const plantTranslate = `translate(${tx} ${ty})`

  return (
    <svg
      ref={svgRef}
      data-testid="memory-plant-closeup-svg"
      data-art-style={resolvedStyle}
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      className={cn(
        'block h-full w-full min-h-[200px] max-h-[min(52dvh,320px)]',
        pixelArt && '[image-rendering:pixelated]',
        className,
      )}
      style={pixelArt ? { imageRendering: 'pixelated', shapeRendering: 'crispEdges' } : undefined}
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
      <g
        ref={plantRef}
        data-testid="memory-plant-closeup-plant"
        transform={pixelArt ? plantTranslate : layout.plantTransform}
        style={pixelArt ? { imageRendering: 'pixelated' } : undefined}
      >
        {isHybrid && memory.hybridGenome ? (
          <HybridPlantSvg
            genome={memory.hybridGenome}
            palette={palette}
            rimStrength={rimStrength}
            motion={motion}
            stage={plantStageToIndex(stage)}
            x={0}
            y={0}
            scale={pixelArt ? layout.scale : 1}
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
            layoutScale={pixelArt ? layout.scale : undefined}
            artStyle={plantArtStyle}
          />
        )}
      </g>
    </svg>
  )
}