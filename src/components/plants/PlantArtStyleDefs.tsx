import type { ArtStyle } from '@/lib/types'
import {
  PLANT_ART_STYLES,
  plantArtFilterId,
} from '@/lib/garden/plant-art-style'

function WatercolorFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.9" xChannelSelector="R" yChannelSelector="G" />
      <feColorMatrix type="saturate" values="0.98" />
    </filter>
  )
}

function BotanicalFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-6%" y="-6%" width="112%" height="112%" colorInterpolationFilters="sRGB">
      <feColorMatrix
        type="matrix"
        values="0.34 0.38 0.28 0 0.03  0.27 0.32 0.24 0 0.02  0.19 0.24 0.18 0 0.02  0 0 0 1 0"
        result="sepia"
      />
      <feComponentTransfer in="sepia">
        <feFuncR type="linear" slope="1.22" intercept="-0.08" />
        <feFuncG type="linear" slope="1.18" intercept="-0.07" />
        <feFuncB type="linear" slope="1.14" intercept="-0.06" />
      </feComponentTransfer>
      <feConvolveMatrix
        order="3"
        kernelMatrix="0 -1 0 -1 5.5 -1 0 -1 0"
        preserveAlpha
        edgeMode="duplicate"
      />
    </filter>
  )
}

function PixelArtFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feMorphology operator="dilate" radius="0.65" in="SourceGraphic" result="chunky" />
      <feGaussianBlur in="chunky" stdDeviation="0" />
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="0 0.33 0.66 1" />
        <feFuncG type="discrete" tableValues="0 0.33 0.66 1" />
        <feFuncB type="discrete" tableValues="0 0.33 0.66 1" />
      </feComponentTransfer>
      <feMorphology operator="dilate" radius="1.1" />
    </filter>
  )
}

function OilPaintingFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feTurbulence type="turbulence" baseFrequency="0.07" numOctaves="3" seed="4" result="tex" />
      <feDisplacementMap in="SourceGraphic" in2="tex" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
      <feGaussianBlur stdDeviation="0.35" />
      <feColorMatrix type="saturate" values="1.32" />
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.05" intercept="0" />
        <feFuncG type="linear" slope="1.02" intercept="0" />
        <feFuncB type="linear" slope="0.98" intercept="0" />
      </feComponentTransfer>
    </filter>
  )
}

function GhibliFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" result="glow" />
      <feColorMatrix
        in="glow"
        type="matrix"
        values="1 0 0 0 0.04  0 0.95 0 0 0.03  0 0 0.88 0 0.01  0 0 0 0.45 0"
        result="warmGlow"
      />
      <feMerge>
        <feMergeNode in="warmGlow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
      <feColorMatrix type="matrix" values="1.06 0 0 0 0.02  0 1.03 0 0 0.02  0 0 0.96 0 0  0 0 0 1 0" />
    </filter>
  )
}

function PhotorealisticFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
      <feDropShadow dx="0.8" dy="1.6" stdDeviation="1.2" floodColor="#120a08" floodOpacity="0.38" />
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.08" intercept="-0.03" />
        <feFuncG type="linear" slope="1.07" intercept="-0.03" />
        <feFuncB type="linear" slope="1.06" intercept="-0.03" />
        <feFuncA type="linear" slope="1" intercept="0" />
      </feComponentTransfer>
    </filter>
  )
}

function filterForStyle(style: ArtStyle, id: string) {
  switch (style) {
    case 'watercolor':
      return <WatercolorFilter id={id} />
    case 'botanical-illustration':
      return <BotanicalFilter id={id} />
    case 'pixel-art':
      return <PixelArtFilter id={id} />
    case 'oil-painting':
      return <OilPaintingFilter id={id} />
    case 'studio-ghibli':
      return <GhibliFilter id={id} />
    case 'photorealistic':
      return <PhotorealisticFilter id={id} />
    default: {
      const _exhaustive: never = style
      return _exhaustive
    }
  }
}

/** Mount once per scene SVG — all memory and world plants reference these ids. */
export function PlantArtStyleDefs() {
  return (
    <defs data-plant-art-filters="true">
      {PLANT_ART_STYLES.map((style) => filterForStyle(style, plantArtFilterId(style)))}
    </defs>
  )
}
