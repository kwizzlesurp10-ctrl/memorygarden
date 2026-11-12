import type { PlantStage, PlantVariety } from '@/lib/types'
import { lerpHex } from './color'
import type { ScenePalette } from './palettes'
import { plantStageToIndex } from './stage'

/** Shared growth metrics for trees — same indices as `plantStageToIndex` (0…7). */
export const TREE_STAGE_METRICS = [
  { H: 0, bw: 0, cw: 0, ch: 0, blobs: 0 },
  { H: 11, bw: 1, cw: 0, ch: 0, blobs: 0 },
  { H: 22, bw: 1.7, cw: 7, ch: 5.5, blobs: 2 },
  { H: 32, bw: 2.4, cw: 10, ch: 7.5, blobs: 3 },
  { H: 42, bw: 3.1, cw: 13, ch: 9.5, blobs: 4 },
  { H: 52, bw: 3.9, cw: 16, ch: 11.5, blobs: 5 },
  { H: 66, bw: 4.9, cw: 20, ch: 14, blobs: 7 },
  { H: 84, bw: 6.6, cw: 27, ch: 18.5, blobs: 10 },
] as const

/** Flower stem heights in SVG units — aligned with `buildFlower` in seeded-builders. */
export const FLOWER_STAGE_HEIGHT = [0, 13, 25, 38, 50, 58, 66, 72] as const

/** 2D ↔ 3D variety kind mapping (single source of truth). */
export type PlantVisualKind =
  | 'tree'
  | 'flower'
  | 'bush'
  | 'mushroom'
  | 'vine'
  | 'lotus'
  | 'succulent'
  | 'fern'

export const PLANT_KIND_BY_VARIETY: Record<PlantVariety, PlantVisualKind> = {
  flower: 'flower',
  tree: 'tree',
  succulent: 'succulent',
  vine: 'vine',
  herb: 'bush',
  wildflower: 'flower',
  fern: 'fern',
  mushroom: 'mushroom',
  lotus: 'lotus',
  ancient_oak: 'tree',
  eternal_rose: 'flower',
  phoenix_vine: 'vine',
  starlight_succulent: 'succulent',
}

export type CanopyTone = 'deep' | 'shadow' | 'mid' | 'light' | 'highlight'

export const CANOPY_DAY: Record<CanopyTone, string> = {
  deep: '#1F3D2C',
  shadow: '#2A4534',
  mid: '#3E6B3F',
  light: '#7FA05A',
  highlight: '#9DBE6E',
}

export const TRUNK_DAY = '#3D2817'

export function plantDimBlendAmount(palette: ScenePalette): number {
  return Math.max(0, Math.min(1, palette.plantDimBlend ?? 0))
}

function canopyNightFill(tone: CanopyTone, palette: ScenePalette): string {
  switch (tone) {
    case 'deep':
      return palette.sil
    case 'shadow':
      return palette.silSoft
    case 'mid':
      return lerpHex(palette.hills[1] ?? palette.silSoft, palette.silSoft, 0.55)
    case 'light':
      return lerpHex(palette.hills[0] ?? palette.silSoft, palette.silSoft, 0.65)
    case 'highlight':
      return lerpHex(palette.hills[0] ?? palette.glow, palette.glow, 0.08)
    default: {
      const _exhaustive: never = tone
      return _exhaustive
    }
  }
}

/** Foliage fill aligned with 2D `canopyFill` in facing-art. */
export function plantFoliageColor(tone: CanopyTone, palette: ScenePalette): string {
  const blend = plantDimBlendAmount(palette)
  if (blend <= 0) return CANOPY_DAY[tone]
  return lerpHex(CANOPY_DAY[tone], canopyNightFill(tone, palette), blend)
}

/** Trunk / stem bark tone aligned with 2D tree trunk gradients. */
export function plantTrunkColor(palette: ScenePalette): string {
  const blend = plantDimBlendAmount(palette)
  const night = lerpHex(palette.bank, palette.sil, 0.42)
  return lerpHex(TRUNK_DAY, night, blend)
}

export function plantFoliageAccent(palette: ScenePalette): string {
  return lerpHex(plantFoliageColor('light', palette), palette.glow, 0.1)
}

const TREE_REF_HEIGHT = TREE_STAGE_METRICS[7].H

export interface TreeMeshMetrics {
  stemHeight: number
  trunkRadius: number
  canopyRadius: number
  canopyLift: number
  blobCount: number
}

export function treeMeshMetrics(stage: PlantStage, worldHeight: number): TreeMeshMetrics {
  const idx = plantStageToIndex(stage)
  const st = TREE_STAGE_METRICS[idx] ?? TREE_STAGE_METRICS[7]
  const scale = worldHeight / TREE_REF_HEIGHT
  const canopyRadius = Math.max(0.08, st.cw * scale * 0.045)
  const trunkRadius = Math.max(0.04, st.bw * scale * 0.032)
  const stemHeight = Math.max(0.06, st.H * scale * 0.95)
  const canopyLift = st.ch > 0 ? st.ch * scale * 0.38 : stemHeight * 0.92
  return {
    stemHeight,
    trunkRadius,
    canopyRadius,
    canopyLift,
    blobCount: st.blobs,
  }
}

export function flowerMeshStemHeight(stage: PlantStage, worldHeight: number): number {
  const idx = plantStageToIndex(stage)
  const ref = FLOWER_STAGE_HEIGHT[idx] ?? FLOWER_STAGE_HEIGHT[7]
  const scale = worldHeight / FLOWER_STAGE_HEIGHT[7]
  return Math.max(0.08, ref * scale * 0.95)
}
