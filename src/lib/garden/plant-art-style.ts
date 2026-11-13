import type { ArtStyle } from '@/lib/types'

/** Shared prefix for SVG filter ids (one definition set per scene SVG). */
export const PLANT_ART_FILTER_PREFIX = 'mg-plant-art-'

export const PLANT_ART_STYLES: readonly ArtStyle[] = [
  'watercolor',
  'botanical-illustration',
  'pixel-art',
  'oil-painting',
  'studio-ghibli',
  'photorealistic',
] as const

export const DEFAULT_PLANT_ART_STYLE: ArtStyle = 'watercolor'

export function plantArtFilterId(artStyle: ArtStyle): string {
  return `${PLANT_ART_FILTER_PREFIX}${artStyle}`
}

export function plantArtFilterUrl(artStyle: ArtStyle): string {
  return `url(#${plantArtFilterId(artStyle)})`
}

export function resolvePlantArtStyle(artStyle: ArtStyle | undefined): ArtStyle {
  return artStyle ?? DEFAULT_PLANT_ART_STYLE
}
