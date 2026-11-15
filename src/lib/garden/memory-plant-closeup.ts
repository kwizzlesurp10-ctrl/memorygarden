import type { Memory, PlantStage } from '@/lib/types'
import { getPlantStage, PLANT_STAGE_VITALITY_FLOOR } from '@/lib/garden-helpers'
import { maxPlantStage, plantStageToIndex } from '@/lib/garden/stage'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'

/** Stage shown in close-up: matches 2D canvas (`plantStage`) and growth metrics. */
export function closeupPlantStage(memory: Memory): PlantStage {
  return maxPlantStage(memory.plantStage, getPlantStage(memory))
}

export interface MemoryPlantStageProgress {
  stage: PlantStage
  nextStage: PlantStage | null
  /** 0–1 progress from current stage floor toward next stage threshold. */
  progress01: number
}

export function memoryHasDisplayPhoto(memory: Memory): boolean {
  const url = memory.photoUrl?.trim()
  if (!url) return false
  return !(url.startsWith('data:image') && url.length < 256)
}

export function memoryPlantStageProgress(memory: Memory): MemoryPlantStageProgress {
  const stage = closeupPlantStage(memory)
  const index = plantStageToIndex(stage)
  const nextStage = index < PLANT_STAGES_ORDER.length - 1 ? PLANT_STAGES_ORDER[index + 1] : null
  if (!nextStage) {
    return { stage, nextStage: null, progress01: 1 }
  }
  const floor = PLANT_STAGE_VITALITY_FLOOR[stage]
  const ceiling = PLANT_STAGE_VITALITY_FLOOR[nextStage]
  const vitality = memory.growthMetrics?.vitality ?? floor
  const span = Math.max(1, ceiling - floor)
  const progress01 = Math.max(0, Math.min(1, (vitality - floor) / span))
  return { stage, nextStage, progress01 }
}

export function memoryLastTendedLabel(memory: Memory): string | null {
  if (memory.lastVisited) {
    try {
      return new Date(memory.lastVisited).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return memory.lastVisited
    }
  }
  const tendReflection = [...memory.reflections]
    .reverse()
    .find((r) => r.isTend)
  if (tendReflection?.createdAt) {
    try {
      return new Date(tendReflection.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return tendReflection.createdAt
    }
  }
  return null
}