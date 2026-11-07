import type { PlantStage } from '@/lib/types'

const STAGE_INDEX: Record<PlantStage, number> = {
  seed: 0,
  sprout: 1,
  seedling: 2,
  young: 3,
  bud: 4,
  bloom: 5,
  mature: 6,
  elder: 7,
}

const INDEX_STAGE: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']

export function plantStageToIndex(stage: PlantStage): number {
  return STAGE_INDEX[stage] ?? 0
}

export function indexToPlantStage(index: number): PlantStage {
  return INDEX_STAGE[Math.max(0, Math.min(7, index))] ?? 'seed'
}

export function maxPlantStage(a: PlantStage, b: PlantStage): PlantStage {
  return plantStageToIndex(a) >= plantStageToIndex(b) ? a : b
}