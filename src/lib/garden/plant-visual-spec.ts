import type { PlantStage, PlantVariety } from '@/lib/types'
import { lerpHex } from './color'
import type { ScenePalette } from './palettes'

/** Palette fields used for plant surface colors (2D hybrid palette is a subset). */
export type PlantColorPalette = Pick<
  ScenePalette,
  'sil' | 'silSoft' | 'rim' | 'glow' | 'accent' | 'bank' | 'hills' | 'plantDimBlend'
>
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

export function plantDimBlendAmount(palette: PlantColorPalette): number {
  return Math.max(0, Math.min(1, palette.plantDimBlend ?? 0))
}

function canopyNightFill(tone: CanopyTone, palette: PlantColorPalette): string {
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
export function plantFoliageColor(tone: CanopyTone, palette: PlantColorPalette): string {
  const blend = plantDimBlendAmount(palette)
  if (blend <= 0) return CANOPY_DAY[tone]
  return lerpHex(CANOPY_DAY[tone], canopyNightFill(tone, palette), blend)
}

/** Trunk / stem bark tone aligned with 2D tree trunk gradients. */
export function plantTrunkColor(palette: PlantColorPalette): string {
  const blend = plantDimBlendAmount(palette)
  const night = lerpHex(palette.bank, palette.sil, 0.42)
  return lerpHex(TRUNK_DAY, night, blend)
}

export function plantFoliageAccent(palette: PlantColorPalette): string {
  return lerpHex(plantFoliageColor('light', palette), palette.glow, 0.1)
}

/** 3D mesh albedo — keeps dusk readable (2D can stay darker as silhouettes). */
export function plantMeshFoliageColor(tone: CanopyTone, palette: PlantColorPalette): string {
  const scene = plantFoliageColor(tone, palette)
  const blend = plantDimBlendAmount(palette)
  const toneLift = tone === 'light' || tone === 'highlight' ? 0.12 : tone === 'mid' ? 0.06 : 0
  const lift = Math.min(0.92, 0.44 + blend * 0.58 + toneLift)
  return lerpHex(scene, CANOPY_DAY[tone], lift)
}

export function plantMeshTrunkColor(palette: PlantColorPalette): string {
  const scene = plantTrunkColor(palette)
  const blend = plantDimBlendAmount(palette)
  return lerpHex(scene, TRUNK_DAY, Math.min(0.82, 0.38 + blend * 0.38))
}

const ELDER_TREE = TREE_STAGE_METRICS[7]
const ELDER_FLOWER_H = FLOWER_STAGE_HEIGHT[7]

export interface TreeMeshMetrics {
  stemHeight: number
  trunkRadius: number
  canopyRadius: number
  canopyLift: number
  blobCount: number
}

export function treeMeshMetrics(stage: PlantStage, worldHeight: number): TreeMeshMetrics {
  const idx = plantStageToIndex(stage)
  const st = TREE_STAGE_METRICS[idx] ?? ELDER_TREE
  const hRatio = ELDER_TREE.H > 0 ? st.H / ELDER_TREE.H : 0
  const cwRatio = ELDER_TREE.cw > 0 ? st.cw / ELDER_TREE.cw : 0
  const bwRatio = ELDER_TREE.bw > 0 ? Math.max(0.12, st.bw / ELDER_TREE.bw) : 0.12
  const lateHeight =
    idx >= 7 ? 1.28 : idx >= 6 ? 1.14 : idx >= 5 ? 1.06 : 1
  const lateCanopy =
    idx >= 7 ? 1.92 : idx >= 6 ? 1.52 : idx >= 5 ? 1.08 : idx >= 4 ? 1.03 : 1
  const stemHeight = Math.max(0.08, worldHeight * hRatio * lateHeight)
  const canopyRadius =
    cwRatio > 0
      ? Math.max(0.14, worldHeight * 0.52 * cwRatio * lateCanopy)
      : Math.max(0.08, worldHeight * 0.1)
  const trunkRadius = Math.max(0.028, worldHeight * 0.052 * bwRatio)
  const canopyLift =
    st.ch > 0 && ELDER_TREE.ch > 0
      ? stemHeight * (0.58 + (st.ch / ELDER_TREE.ch) * 0.3)
      : stemHeight * 0.82
  return {
    stemHeight,
    trunkRadius,
    canopyRadius,
    canopyLift,
    blobCount: st.blobs,
  }
}

export function flowerMeshMetrics(
  stage: PlantStage,
  worldHeight: number,
): { stemHeight: number; canopyRadius: number } {
  const idx = plantStageToIndex(stage)
  const hRef = FLOWER_STAGE_HEIGHT[idx] ?? ELDER_FLOWER_H
  const hRatio = hRef / ELDER_FLOWER_H
  return {
    stemHeight: Math.max(0.08, worldHeight * hRatio),
    canopyRadius: Math.max(0.1, worldHeight * 0.26 * (0.2 + hRatio * 0.85)),
  }
}
