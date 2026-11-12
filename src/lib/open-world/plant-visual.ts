import type { EmotionalTone, PlantStage, PlantVariety } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { plantStageToIndex } from '@/lib/garden/stage'
import {
  PLANT_KIND_BY_VARIETY,
  type PlantVisualKind,
  plantFoliageAccent,
  plantMeshFoliageColor,
  plantMeshTrunkColor,
  treeMeshMetrics,
  flowerMeshMetrics,
} from '@/lib/garden/plant-visual-spec'
import { TONE_DOT } from './constants'

export type PlantKind = PlantVisualKind

export interface PlantVisualRecipe {
  kind: PlantKind
  stemHeight: number
  stemRadius: number
  canopyRadius: number
  canopyLift: number
  bloomCount: number
  canopyBlobs: number
  stem: string
  foliage: string
  foliageAlt: string
  bloom: string
  emissive: string
  emissiveIntensity: number
  rimLit: string
}

export function plantKind(variety: PlantVariety): PlantKind {
  return PLANT_KIND_BY_VARIETY[variety] ?? 'flower'
}

function stageT(stage: PlantStage): number {
  return plantStageToIndex(stage) / 7
}

export function plantRecipe(
  variety: PlantVariety,
  stage: PlantStage,
  tone: EmotionalTone,
  palette: ScenePalette,
  height: number,
  hybrid: boolean,
): PlantVisualRecipe {
  const t = stageT(stage)
  const kind = plantKind(variety)
  const bloom = hybrid ? palette.accent : (TONE_DOT[tone] ?? palette.accent)
  const foliage = plantMeshFoliageColor('mid', palette)
  const foliageAlt = plantMeshFoliageColor('shadow', palette)
  const stem = plantMeshTrunkColor(palette)
  const twilight = (palette.plantDimBlend ?? 0) > 0.4 || (palette.starAlpha ?? 0) > 0.2
  const glow =
    variety === 'starlight_succulent' || variety === 'eternal_rose' || hybrid
      ? 0.45 + t * 0.45
      : twilight
        ? 0.32 + t * 0.35
        : 0.18 + t * 0.22

  let stemHeight = Math.max(0.08, height * (kind === 'mushroom' || kind === 'succulent' ? 0.45 : 0.62))
  let stemRadius = kind === 'tree' ? 0.12 + t * 0.16 : kind === 'mushroom' ? 0.04 + t * 0.03 : 0.048 + t * 0.05
  let canopyRadius = Math.max(0.12, height * (kind === 'tree' ? 0.42 : 0.28))
  let canopyLift = stemHeight
  let canopyBlobs = kind === 'flower' ? 1 + Math.round(t * 5) : kind === 'bush' ? 3 + Math.round(t * 4) : 1

  if (kind === 'tree') {
    const tree = treeMeshMetrics(stage, height)
    stemHeight = tree.stemHeight
    stemRadius = tree.trunkRadius
    canopyRadius = tree.canopyRadius
    canopyLift = tree.canopyLift
    canopyBlobs = tree.blobCount
  } else if (kind === 'flower') {
    const flower = flowerMeshMetrics(stage, height)
    stemHeight = flower.stemHeight
    stemRadius = 0.028 + t * 0.038
    canopyRadius = flower.canopyRadius
    canopyBlobs = stage === 'bloom' || stage === 'mature' || stage === 'elder' ? 5 + Math.round(t * 3) : 1
  }

  return {
    kind,
    stemHeight,
    stemRadius,
    canopyRadius,
    canopyLift,
    bloomCount: kind === 'flower' ? 1 + Math.round(t * 5) : kind === 'bush' ? 3 + Math.round(t * 4) : 1,
    canopyBlobs,
    stem,
    foliage,
    foliageAlt,
    bloom,
    emissive: plantFoliageAccent(palette),
    emissiveIntensity: glow,
    rimLit: palette.rim,
  }
}
