import { Fragment } from 'react'
import type { ArtStyle } from '@/lib/types'
import { PLANT_ART_STYLES, plantArtFilterId } from '@/lib/garden/plant-art-style'

const POSTERIZE_LEVELS =
  '0.1 0.22 0.34 0.46 0.58 0.7 0.82 0.94'

function WatercolorFilter({ id }: { id: string }) {
  return (
    <filter
      id={id}
      filterUnits="objectBoundingBox"
      x="-10%"
      y="-10%"
      width="120%"
      height="120%"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="2" result="dispNoise" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="dispNoise"
        scale="3.2"
        xChannelSelector="R"
        yChannelSelector="G"
        result="bleed"
      />
      <feGaussianBlur in="bleed" stdDeviation="0.8" result="soft" />
      <feMorphology in="soft" operator="erode" radius="0.85" result="washCore" />
      <feComposite in="soft" in2="washCore" operator="out" result="poolEdge" />
      <feColorMatrix
        in="poolEdge"
        type="matrix"
        values="0 0 0 0 0.05  0 0 0 0 0.06  0 0 0 0 0.08  0 0 0 0.45 0"
        result="pooling"
      />
      <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="3" seed="17" result="granNoise" />
      <feColorMatrix in="granNoise" type="saturate" values="0" result="granGray" />
      <feComposite in="granGray" in2="SourceAlpha" operator="in" result="granIn" />
      <feBlend in="soft" in2="granIn" mode="multiply" result="granular" />
      <feColorMatrix
        in="granular"
        type="matrix"
        values="1.03 0.02 0 0 0.06  0 1.03 0.02 0 0.06  0 0 1.03 0 0.05  0 0 0 0.9 0"
        result="wash"
      />
      <feMerge result="painted">
        <feMergeNode in="wash" />
        <feMergeNode in="pooling" />
      </feMerge>
      <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="2" seed="11" result="paperNoise" />
      <feColorMatrix
        in="paperNoise"
        type="matrix"
        values="0.333 0.333 0.333 0 0.04  0.333 0.333 0.333 0 0.04  0.333 0.333 0.333 0 0.04  0 0 0 0.12 0"
        result="paperGray"
      />
      <feComposite in="paperGray" in2="SourceAlpha" operator="in" result="paperInShape" />
      <feBlend in="painted" in2="paperInShape" mode="soft-light" result="textured" />
      <feMorphology in="SourceAlpha" operator="dilate" radius="0.55" result="cauliAlpha" />
      <feGaussianBlur in="textured" stdDeviation="1.1" result="bloomBlur" />
      <feComposite in="bloomBlur" in2="cauliAlpha" operator="in" result="cauliBloom" />
      <feColorMatrix
        in="cauliBloom"
        type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.28 0"
        result="cauliLight"
      />
      <feMerge result="merged">
        <feMergeNode in="cauliLight" />
        <feMergeNode in="textured" />
      </feMerge>
      <feComposite in="merged" in2="SourceAlpha" operator="in" result="clipped" />
      <feColorMatrix in="clipped" type="saturate" values="0.88" />
    </filter>
  )
}

function BotanicalFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
      <feColorMatrix
        type="matrix"
        values="0.96 0.03 0.02 0 0.02  0.02 1.08 0.02 0 0.01  0.02 0.02 0.9 0 0.02  0 0 0 1 0"
        in="SourceGraphic"
        result="tinted"
      />
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="1" seed="4" result="stipple" />
      <feColorMatrix in="stipple" type="saturate" values="0" result="stipGray" />
      <feComposite in="stipGray" in2="SourceAlpha" operator="in" result="stipIn" />
      <feBlend in="tinted" in2="stipIn" mode="multiply" result="stippled" />
      <feGaussianBlur in="stippled" stdDeviation="0.12" result="smooth" />
      <feTurbulence type="turbulence" baseFrequency="0.08 0.9" numOctaves="1" seed="9" result="hatch" />
      <feColorMatrix in="hatch" type="saturate" values="0" result="hatchG" />
      <feComposite in="hatchG" in2="SourceAlpha" operator="in" result="hatchIn" />
      <feBlend in="smooth" in2="hatchIn" mode="multiply" result="hatched" />
      <feMorphology in="hatched" operator="dilate" radius="1.05" result="dilated" />
      <feMorphology in="hatched" operator="erode" radius="1.05" result="eroded" />
      <feComposite in="dilated" in2="eroded" operator="out" result="edge" />
      <feFlood floodColor="#0f1a12" floodOpacity="0.88" result="ink" />
      <feComposite in="ink" in2="edge" operator="in" result="stroke" />
      <feMerge>
        <feMergeNode in="hatched" />
        <feMergeNode in="stroke" />
      </feMerge>
    </filter>
  )
}

/** Posterize + 1px-style outline; pair with {@link PlantPixelArtRaster} for fine blocks. */
function PixelArtFilter({ id }: { id: string }) {
  return (
    <filter id={id} filterUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
      <feComponentTransfer in="SourceGraphic" result="poster">
        <feFuncR type="discrete" tableValues={POSTERIZE_LEVELS} />
        <feFuncG type="discrete" tableValues={POSTERIZE_LEVELS} />
        <feFuncB type="discrete" tableValues={POSTERIZE_LEVELS} />
      </feComponentTransfer>
      <feMorphology in="poster" operator="dilate" radius="0.22" result="dil" />
      <feMorphology in="poster" operator="erode" radius="0.22" result="ero" />
      <feComposite in="dil" in2="ero" operator="out" result="edge" />
      <feFlood floodColor="#0a0810" floodOpacity="0.7" result="ink" />
      <feComposite in="ink" in2="edge" operator="in" result="outline" />
      <feMerge>
        <feMergeNode in="poster" />
        <feMergeNode in="outline" />
      </feMerge>
    </filter>
  )
}

function OilPaintingFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feTurbulence type="turbulence" baseFrequency="0.035 0.12" numOctaves="3" seed="7" result="brush" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="brush"
        scale="14"
        xChannelSelector="R"
        yChannelSelector="G"
        result="strokes"
      />
      <feGaussianBlur in="strokes" stdDeviation="0.18" result="smear" />
      <feColorMatrix in="smear" type="saturate" values="1.52" result="rich" />
      <feSpecularLighting
        in="SourceAlpha"
        surfaceScale="2.5"
        specularConstant="0.4"
        specularExponent="18"
        lightingColor="#fff5e8"
        result="impasto"
      >
        <fePointLight x="-30" y="-40" z="60" />
      </feSpecularLighting>
      <feComposite in="impasto" in2="SourceAlpha" operator="in" result="impastoMask" />
      <feBlend in="rich" in2="impastoMask" mode="screen" result="lit" />
      <feComponentTransfer in="lit">
        <feFuncR type="linear" slope="0.9" intercept="-0.06" />
        <feFuncG type="linear" slope="0.88" intercept="-0.07" />
        <feFuncB type="linear" slope="0.86" intercept="-0.08" />
      </feComponentTransfer>
    </filter>
  )
}

function GhibliFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.8" result="halo" />
      <feColorMatrix
        in="halo"
        type="matrix"
        values="1.2 0.14 0 0 0.12  0.1 1.16 0 0 0.1  0 0.02 1.04 0 0.06  0 0 0 0.82 0"
        result="warmHalo"
      />
      <feDiffuseLighting in="SourceAlpha" diffuseConstant="0.85" lightingColor="#fff0d4" result="cel">
        <fePointLight x="40" y="-50" z="80" />
      </feDiffuseLighting>
      <feComposite in="cel" in2="SourceAlpha" operator="in" result="celMask" />
      <feBlend in="SourceGraphic" in2="celMask" mode="multiply" result="celShaded" />
      <feSpecularLighting
        in="SourceAlpha"
        surfaceScale="1.5"
        specularConstant="0.35"
        specularExponent="12"
        lightingColor="#ffd4a0"
        result="rim"
      >
        <fePointLight x="-50" y="-30" z="40" />
      </feSpecularLighting>
      <feComposite in="rim" in2="SourceAlpha" operator="in" result="rimMask" />
      <feMerge result="lit">
        <feMergeNode in="warmHalo" />
        <feMergeNode in="celShaded" />
        <feMergeNode in="rimMask" />
      </feMerge>
      <feColorMatrix in="lit" type="saturate" values="1.35" />
    </filter>
  )
}

function PhotorealisticFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="3" result="micro" />
      <feColorMatrix in="micro" type="saturate" values="0" result="microG" />
      <feComposite in="microG" in2="SourceAlpha" operator="in" result="microIn" />
      <feBlend in="SourceGraphic" in2="microIn" mode="overlay" result="detailed" />
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.35" result="alphaBlur" />
      <feOffset in="SourceAlpha" dx="2.5" dy="4.5" result="offAlpha" />
      <feGaussianBlur in="offAlpha" stdDeviation="3" result="shadowBlur" />
      <feFlood floodColor="#050403" floodOpacity="0.68" result="shadowColor" />
      <feComposite in="shadowColor" in2="shadowBlur" operator="in" result="shadow" />
      <feMerge result="grounded">
        <feMergeNode in="shadow" />
        <feMergeNode in="detailed" />
      </feMerge>
      <feSpecularLighting
        in="alphaBlur"
        surfaceScale="2.8"
        specularConstant="0.5"
        specularExponent="24"
        lightingColor="#fff8ee"
        result="spec"
      >
        <fePointLight x="-40" y="-60" z="90" />
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specMask" />
      <feBlend in="grounded" in2="specMask" mode="screen" result="shaded" />
      <feColorMatrix in="shaded" type="saturate" values="1.06" />
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

export function PlantArtStyleDefs() {
  return (
    <defs>
      {PLANT_ART_STYLES.map((style) => (
        <Fragment key={style}>{filterForStyle(style, plantArtFilterId(style))}</Fragment>
      ))}
    </defs>
  )
}
