import type { EmotionalTone, PlantStage, PlantVariety } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { TONE_DOT } from './constants'

export type PlantKind =
  | 'tree'
  | 'flower'
  | 'bush'
  | 'mushroom'
  | 'vine'
  | 'lotus'
  | 'succulent'
  | 'fern'

export interface PlantVisualRecipe {
  kind: PlantKind
  stemHeight: number
  stemRadius: number
  canopyRadius: number
  bloomCount: number
  stem: string
  foliage: string
  bloom: string
  emissive: string
  emissiveIntensity: number
}

const KIND_BY_VARIETY: Record<PlantVariety, PlantKind> = {
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

function stageT(stage: PlantStage): number {
  const order: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
  const i = order.indexOf(stage)
  return (i < 0 ? 4 : i) / 7
}

export function plantKind(variety: PlantVariety): PlantKind {
  return KIND_BY_VARIETY[variety] ?? 'flower'
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
  const foliage = palette.silSoft
  const stem = palette.sil
  const glow = variety === 'starlight_succulent' || variety === 'eternal_rose' || hybrid
    ? 0.35 + t * 0.4
    : t * 0.12
  return {
    kind,
    stemHeight: Math.max(0.08, height * (kind === 'mushroom' || kind === 'succulent' ? 0.45 : 0.62)),
    stemRadius: kind === 'tree' ? 0.12 + t * 0.14 : 0.035 + t * 0.04,
    canopyRadius: Math.max(0.12, height * (kind === 'tree' ? 0.42 : 0.28)),
    bloomCount: kind === 'flower' ? 1 + Math.round(t * 5) : kind === 'bush' ? 3 + Math.round(t * 4) : 1,
    stem,
    foliage,
    bloom,
    emissive: palette.glow,
    emissiveIntensity: glow,
  }
}
