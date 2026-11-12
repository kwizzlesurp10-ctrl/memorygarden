import { Fragment } from 'react'
import type { ArtStyle } from '@/lib/types'
import { PLANT_ART_STYLES, plantArtFilterId } from '@/lib/garden/plant-art-style'

/** Soft bleed + washed tint; grayscale grain clipped to SourceAlpha only. */
function WatercolorFilter({ id }: { id: string }) {
  return (
    <filter
      id={id}
      filterUnits="objectBoundingBox"
      x="-6%"
      y="-6%"
      width="112%"
      height="112%"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="2" seed="2" result="dispNoise" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="dispNoise"
        scale="2.4"
        xChannelSelector="R"
        yChannelSelector="G"
        result="bleed"
      />
      <feGaussianBlur in="bleed" stdDeviation="0.65" result="soft" />
      <feColorMatrix
        in="soft"
        type="matrix"
        values="1 0 0 0 0.07  0 1 0 0 0.07  0 0 1 0 0.06  0 0 0 0.88 0"
        result="wash"
      />
      <feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves="1" seed="11" result="paperNoise" />
      <feColorMatrix
        in="paperNoise"
        type="matrix"
        values="0.333 0.333 0.333 0 0.04  0.333 0.333 0.333 0 0.04  0.333 0.333 0.333 0 0.04  0 0 0 0.09 0"
        result="paperGray"
      />
      <feComposite in="paperGray" in2="SourceAlpha" operator="in" result="paperInShape" />
      <feBlend in="wash" in2="paperInShape" mode="soft-light" result="textured" />
      <feComposite in="textured" in2="SourceAlpha" operator="in" result="clipped" />
      <feColorMatrix in="clipped" type="saturate" values="0.86" />
    </filter>
  )
}

/** Ink outlines + paper warmth; greens stay green (no full sepia). */
function BotanicalFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
      <feColorMatrix
        type="matrix"
        values="0.96 0.03 0.02 0 0.02  0.02 1.08 0.02 0 0.01  0.02 0.02 0.9 0 0.02  0 0 0 1 0"
        in="SourceGraphic"
        result="tinted"
      />
      <feGaussianBlur in="tinted" stdDeviation="0.15" result="smooth" />
      <feMorphology in="smooth" operator="dilate" radius="1.05" result="dilated" />
      <feMorphology in="smooth" operator="erode" radius="1.05" result="eroded" />
      <feComposite in="dilated" in2="eroded" operator="out" result="edge" />
      <feFlood floodColor="#0f1a12" floodOpacity="0.9" result="ink" />
      <feComposite in="ink" in2="edge" operator="in" result="stroke" />
      <feMerge result="lined">
        <feMergeNode in="tinted" />
        <feMergeNode in="stroke" />
      </feMerge>
      <feColorMatrix
        in="lined"
        type="matrix"
        values="0.98 0.02 0 0 0  0.04 1.08 0.04 0 0  0 0.05 0.95 0 0  0 0 0 1 0"
      />
      <feConvolveMatrix
        order="3"
        kernelMatrix="0 -0.55 0 -0.55 3 -0.55 0 -0.55 0"
        preserveAlpha
        edgeMode="duplicate"
      />
    </filter>
  )
}

/**
 * Chunky morphology + posterize (feTile mosaic is unreliable in resvg/Batik stacks).
 * Reads as pixel blocks while keeping plant colors opaque.
 */
function PixelArtFilter({ id }: { id: string }) {
  return (
    <filter id={id} filterUnits="objectBoundingBox" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceGraphic" operator="dilate" radius="2" result="chunk" />
      <feGaussianBlur in="chunk" stdDeviation="0.3" result="blocks" />
      <feComponentTransfer in="blocks">
        <feFuncR type="discrete" tableValues="0.2 0.36 0.52 0.68 0.84" />
        <feFuncG type="discrete" tableValues="0.2 0.36 0.52 0.68 0.84" />
        <feFuncB type="discrete" tableValues="0.2 0.36 0.52 0.68 0.84" />
      </feComponentTransfer>
      <feMorphology operator="dilate" radius="0.9" />
    </filter>
  )
}

function OilPaintingFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" seed="7" result="brush" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="brush"
        scale="16"
        xChannelSelector="R"
        yChannelSelector="G"
        result="strokes"
      />
      <feGaussianBlur in="strokes" stdDeviation="0.2" result="smear" />
      <feColorMatrix in="smear" type="saturate" values="1.48" result="rich" />
      <feComponentTransfer in="rich">
        <feFuncR type="linear" slope="0.92" intercept="-0.06" />
        <feFuncG type="linear" slope="0.9" intercept="-0.07" />
        <feFuncB type="linear" slope="0.88" intercept="-0.08" />
      </feComponentTransfer>
    </filter>
  )
}

function GhibliFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3.6" result="halo" />
      <feColorMatrix
        in="halo"
        type="matrix"
        values="1.22 0.12 0 0 0.1  0.08 1.18 0 0 0.08  0 0.02 1.05 0 0.04  0 0 0 0.85 0"
        result="warmHalo"
      />
      <feMerge result="lit">
        <feMergeNode in="warmHalo" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
      <feColorMatrix
        in="lit"
        type="matrix"
        values="1.1 0.04 0 0 0.04  0.03 1.08 0 0 0.03  0 0.02 0.98 0 0.02  0 0 0 1 0"
      />
      <feColorMatrix type="saturate" values="1.38" />
    </filter>
  )
}

function PhotorealisticFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.4" result="alphaBlur" />
      <feOffset in="SourceAlpha" dx="2.5" dy="4.5" result="offAlpha" />
      <feGaussianBlur in="offAlpha" stdDeviation="3.2" result="shadowBlur" />
      <feFlood floodColor="#050403" floodOpacity="0.72" result="shadowColor" />
      <feComposite in="shadowColor" in2="shadowBlur" operator="in" result="shadow" />
      <feMerge result="grounded">
        <feMergeNode in="shadow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
      <feSpecularLighting
        in="alphaBlur"
        surfaceScale="3"
        specularConstant="0.55"
        specularExponent="22"
        lightingColor="#fff8ee"
        result="spec"
      >
        <fePointLight x="-40" y="-60" z="90" />
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specMask" />
      <feBlend in="grounded" in2="specMask" mode="screen" result="shaded" />
      <feColorMatrix
        in="shaded"
        type="matrix"
        values="1.04 0.01 0.01 0 0  0.01 1.04 0.01 0 0  0.01 0.01 1.04 0 0  0 0 0 1 0"
      />
      <feColorMatrix type="saturate" values="1.05" />
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
      {PLANT_ART_STYLES.map((style) => (
        <Fragment key={style}>{filterForStyle(style, plantArtFilterId(style))}</Fragment>
      ))}
    </defs>
  )
}
