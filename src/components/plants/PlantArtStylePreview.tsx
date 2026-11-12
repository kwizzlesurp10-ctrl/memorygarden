import type { ArtStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { PlantArtStyleDefs } from '@/components/plants/PlantArtStyleDefs'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'

interface PlantArtStylePreviewProps {
  artStyle: ArtStyle
  palette?: ScenePalette
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

/** Zoomed bloom canopy so filter differences read in the customizer cards. */
export function PlantArtStylePreview({ artStyle, palette = PREVIEW_PALETTE, className }: PlantArtStylePreviewProps) {
  return (
    <svg
      viewBox="12 8 52 62"
      width="100%"
      height={88}
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <PlantArtStyleDefs />
      <rect x="0" y="0" width="76" height="78" fill="oklch(0.94 0.02 95)" />
      <g transform="translate(38 66) scale(1.35)">
        <SeededPlantSvg
          variety="flower"
          stage="bloom"
          geneticsSeed="style-preview"
          palette={palette}
          rimStrength={0.72}
          motion={false}
          artStyle={artStyle}
        />
      </g>
    </svg>
  )
}
