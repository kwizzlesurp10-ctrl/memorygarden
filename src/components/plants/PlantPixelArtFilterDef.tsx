import { plantPixelCellRadius } from '@/lib/garden/plant-art-pixel'
import type { PlantStage } from '@/lib/types'
import type { SeededVariety } from './types'

const POSTERIZE =
  '0.1 0.22 0.34 0.46 0.58 0.7 0.82 0.94'

export function plantPixelFilterLocalId(variety: SeededVariety, stage: PlantStage, scale: number): string {
  const cell = Math.round(plantPixelCellRadius(variety, stage, scale) * 100)
  return `mg-pixel-${variety}-${stage}-${cell}`
}

export interface PlantPixelArtFilterDefProps {
  id: string
  variety: SeededVariety
  stage: PlantStage
  scale: number
}

/**
 * Resvg-compatible pixel mosaic: morphology block snap in userSpace + posterize.
 * CSS image-rendering does not apply to SSR/Resvg output.
 */
export function PlantPixelArtFilterDef({ id, variety, stage, scale }: PlantPixelArtFilterDefProps) {
  const cellR = plantPixelCellRadius(variety, stage, scale)
  const outlineR = Math.max(0.35, cellR * 0.22)

  return (
    <filter
      id={id}
      filterUnits="objectBoundingBox"
      x="-8%"
      y="-8%"
      width="116%"
      height="116%"
      primitiveUnits="userSpaceOnUse"
      colorInterpolationFilters="sRGB"
    >
      <feMorphology in="SourceGraphic" operator="dilate" radius={cellR} result="dilate" />
      <feMorphology in="dilate" operator="erode" radius={cellR} result="blocked" />
      <feComponentTransfer in="blocked" result="poster">
        <feFuncR type="discrete" tableValues={POSTERIZE} />
        <feFuncG type="discrete" tableValues={POSTERIZE} />
        <feFuncB type="discrete" tableValues={POSTERIZE} />
      </feComponentTransfer>
      <feMorphology in="poster" operator="dilate" radius={outlineR} result="dil" />
      <feMorphology in="poster" operator="erode" radius={outlineR} result="ero" />
      <feComposite in="dil" in2="ero" operator="out" result="edge" />
      <feFlood floodColor="#0a0810" floodOpacity="0.65" result="ink" />
      <feComposite in="ink" in2="edge" operator="in" result="outline" />
      <feMerge>
        <feMergeNode in="poster" />
        <feMergeNode in="outline" />
      </feMerge>
    </filter>
  )
}
