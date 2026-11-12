import type { PlantStage } from '@/lib/types'
import type { SeededVariety } from '@/components/plants/types'
import { plantStageToIndex } from '@/lib/garden/stage'

/** Target pixel columns across the plant silhouette (SVG user units). */
const TARGET_ACROSS: Partial<Record<SeededVariety, number>> = {
  flower: 26,
  wildflower: 28,
  tree: 46,
  mushroom: 22,
  vine: 30,
  fern: 34,
  succulent: 24,
  herb: 26,
  lotus: 30,
}

/** Approximate horizontal extent at bloom / mature in user units before scene scale. */
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

/**
 * Downscale factor for 2D pixel-art: rasterizes to ~16–48 px across, then scales up with pixelated edges.
 * Returns 0 when pixel art should not rasterize (caller skips wrapper).
 */
export function plantPixelRasterStep(
  variety: SeededVariety,
  scale: number,
  stage: PlantStage,
): number {
  const stageT = plantStageToIndex(stage) / 7
  const target = TARGET_ACROSS[variety] ?? 24
  let approx = APPROX_WIDTH[variety] ?? 64
  approx *= 0.55 + stageT * 0.55
  const across = target * (0.7 + stageT * 0.35)
  const raw = (approx * Math.max(0.35, scale)) / across
  const step = Math.round(raw * 4) / 4
  return Math.max(2, Math.min(7, step))
}
