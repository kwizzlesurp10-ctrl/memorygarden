import type { ArtStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { PlantArtStyleDefs } from '@/components/plants/PlantArtStyleDefs'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'

interface PlantArtStylePreviewProps {
  artStyle: ArtStyle
  palette: ScenePalette
  className?: string
}

const PREVIEW_PALETTE: ScenePalette = {
  sky: ['#b8d4e8', '#dce8f0'],
  cloud: '#e8f0f4',
  hills: ['#5a7a52', '#6d9460', '#88aa78'],
  bank: '#7a9568',
  sil: '#1a2a18',
  silSoft: '#2a3d28',
  rim: '#e8f0d8',
  glow: '#f5e6a8',
  accent: '#d4a85a',
  waterTint: ['#7ab8c8', '#4a8898'],
  ripple: '#ffffff',
  fire: '#ffe8a0',
  birds: '#2a3828',
}

/** Compact bloom flower used in PlantStyleCustomizer swatches. */
export function PlantArtStylePreview({ artStyle, palette = PREVIEW_PALETTE, className }: PlantArtStylePreviewProps) {
  return (
    <svg
      viewBox="0 0 88 72"
      width={88}
      height={56}
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <PlantArtStyleDefs />
      <rect width="88" height="72" fill="oklch(0.94 0.02 95)" rx="6" />
      <g transform="translate(44 58) scale(0.72)">
        <SeededPlantSvg
          variety="flower"
          stage="bloom"
          geneticsSeed="style-preview"
          palette={palette}
          rimStrength={0.68}
          motion={false}
          artStyle={artStyle}
        />
      </g>
    </svg>
  )
}
