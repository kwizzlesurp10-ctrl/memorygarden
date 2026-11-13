import type { PlantStage } from '@/lib/types'
import type { SeededVariety } from '@/components/plants/types'
import { plantStageToIndex } from '@/lib/garden/stage'

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

/** Target columns across the silhouette (~3–6 screen px/cell at 960px garden width). */
const TARGET_COLS: Partial<Record<SeededVariety, number>> = {
  flower: 22,
  wildflower: 24,
  tree: 26,
  mushroom: 16,
  vine: 20,
  fern: 22,
  succulent: 20,
  herb: 22,
  lotus: 22,
}

/** feMorphology radius in userSpace (half ≈ one pixel cell edge). */
export function plantPixelCellRadius(
  variety: SeededVariety,
  stage: PlantStage,
  scale: number,
): number {
  const stageT = plantStageToIndex(stage) / 7
  const approx = (APPROX_WIDTH[variety] ?? 64) * Math.max(0.4, scale) * (0.55 + stageT * 0.5)
  const cols = (TARGET_COLS[variety] ?? 20) * (0.88 + stageT * 0.2)
  const cell = approx / cols
  return Math.max(2.4, Math.min(6.8, cell * 0.52))
}

/** @deprecated Resvg ignores CSS scale pixelation; kept for in-browser canvas preview hints only. */
export function plantPixelRasterStep(
  variety: SeededVariety,
  scale: number,
  stage: PlantStage,
): number {
  const r = plantPixelCellRadius(variety, stage, scale)
  return Math.max(2, Math.min(7, Math.round((r / 2.4) * 4) / 4))
}
