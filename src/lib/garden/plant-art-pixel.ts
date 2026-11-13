import type { PlantStage } from '@/lib/types'
import type { SeededVariety } from '@/components/plants/types'
import { plantStageToIndex } from '@/lib/garden/stage'

/** Target on-screen size of one art pixel (both browser canvas and capture). */
export const PIXEL_ART_BLOCK_SCREEN_PX = 4

/** Approximate horizontal extent at bloom / mature in SVG user units (pre scene scale). */
const APPROX_WIDTH: Partial<Record<SeededVariety, number>> = {
  flower: 78,
  wildflower: 72,
  tree: 156,
  mushroom: 48,
  vine: 70,
  fern: 82,
  succulent: 52,
  herb: 58,
  lotus: 72,
}

const APPROX_HEIGHT_RATIO: Partial<Record<SeededVariety, number>> = {
  tree: 1.42,
  mushroom: 0.92,
  vine: 1.25,
  fern: 1.2,
}

export function plantPixelViewBox(
  variety: SeededVariety,
  stage: PlantStage,
  scale: number,
): { minX: number; minY: number; width: number; height: number } {
  const stageT = plantStageToIndex(stage) / 7
  const width = (APPROX_WIDTH[variety] ?? 64) * Math.max(0.35, scale) * (0.55 + stageT * 0.5)
  const height = width * (APPROX_HEIGHT_RATIO[variety] ?? 1.08)
  return { minX: -width / 2, minY: -height, width, height }
}

/** feMorphology radius — legacy filter path (capture SSR fallback). */
export function plantPixelCellRadius(
  variety: SeededVariety,
  stage: PlantStage,
  scale: number,
): number {
  const { width } = plantPixelViewBox(variety, stage, scale)
  const cols = Math.max(8, Math.round(width / PIXEL_ART_BLOCK_SCREEN_PX))
  const cell = width / cols
  return Math.max(3.2, Math.min(8.5, cell * 0.55))
}

/** Low-res width in pixels when rasterizing a plant bbox at {@link renderWidthPx}. */
export function plantPixelRasterWidth(renderWidthPx: number, blockPx = PIXEL_ART_BLOCK_SCREEN_PX): number {
  return Math.max(4, Math.round(renderWidthPx / blockPx))
}

/** Hard quantize RGBA — each block becomes its top-left sample (crisp minecraft-style cells). */
export function pixelateRgba(
  src: Uint8Array,
  width: number,
  height: number,
  blockPx: number,
): { data: Uint8Array; width: number; height: number } {
  const outW = Math.max(1, Math.ceil(width / blockPx))
  const outH = Math.max(1, Math.ceil(height / blockPx))
  const out = new Uint8Array(outW * outH * 4)
  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const sx = Math.min(width - 1, ox * blockPx)
      const sy = Math.min(height - 1, oy * blockPx)
      const si = (sy * width + sx) * 4
      const oi = (oy * outW + ox) * 4
      out[oi] = src[si]
      out[oi + 1] = src[si + 1]
      out[oi + 2] = src[si + 2]
      out[oi + 3] = src[si + 3]
    }
  }
  return { data: out, width: outW, height: outH }
}

/** @deprecated Browser hint only — use canvas raster path for pixel-art. */
export function plantPixelRasterStep(
  variety: SeededVariety,
  scale: number,
  stage: PlantStage,
): number {
  const { width } = plantPixelViewBox(variety, stage, scale)
  return Math.max(2, Math.round(width / PIXEL_ART_BLOCK_SCREEN_PX))
}
