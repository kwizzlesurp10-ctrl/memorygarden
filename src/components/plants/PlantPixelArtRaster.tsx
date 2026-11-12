import type { CSSProperties, ReactNode } from 'react'
import type { PlantStage } from '@/lib/types'
import { plantPixelRasterStep } from '@/lib/garden/plant-art-pixel'
import type { SeededVariety } from './types'

export interface PlantPixelArtRasterProps {
  variety: SeededVariety
  stage: PlantStage
  scale: number
  children: ReactNode
}

/** Coarse downscale + integer upscale so SVG filters see real pixel blocks. */
export function PlantPixelArtRaster({ variety, stage, scale, children }: PlantPixelArtRasterProps) {
  const step = plantPixelRasterStep(variety, scale, stage)
  if (step <= 1) return <>{children}</>

  const innerStyle: CSSProperties = {
    transform: `scale(${step})`,
    transformBox: 'fill-box',
    transformOrigin: '50% 100%',
    imageRendering: 'pixelated',
  }
  const outerStyle: CSSProperties = {
    transform: `scale(${1 / step})`,
    transformBox: 'fill-box',
    transformOrigin: '50% 100%',
  }

  return (
    <g style={outerStyle}>
      <g style={innerStyle}>{children}</g>
    </g>
  )
}
