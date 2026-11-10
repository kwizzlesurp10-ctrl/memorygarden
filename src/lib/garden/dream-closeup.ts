import type { PlantStage } from '@/lib/types'
import { plantStageToIndex } from '@/lib/garden/stage'

/** Default stage when previewing a freshly dreamed hybrid (motif + adornment visible). */
export const DREAM_CLOSEUP_DEFAULT_STAGE: PlantStage = 'bloom'

export const DREAM_CLOSEUP_DEFAULT_STAGE_INDEX = plantStageToIndex(DREAM_CLOSEUP_DEFAULT_STAGE)

export function clampCloseupStageIndex(index: number): number {
  return Math.max(0, Math.min(7, index))
}
