import type { Memory, PlantVariety, UnlockState } from '@/lib/types'
import { ensureUnlockState } from '@/lib/unlock-system'

/** Varieties gated behind tending milestones (same rules as planting extras). */
export const EXTENDED_PLANT_VARIETIES: readonly PlantVariety[] = ['fern', 'mushroom', 'lotus']

/** Legendary varieties — only after Elder Grove achievement unless already on a memory. */
export const LEGENDARY_PLANT_VARIETIES: readonly PlantVariety[] = [
  'ancient_oak',
  'eternal_rose',
  'phoenix_vine',
  'starlight_succulent',
]

const EXTENDED_UNLOCK_PLANT_COUNT = 5
const LEGENDARY_ACHIEVEMENT_ID = 'elder-grove'

export function isPlantVarietyUnlockedForUser(
  variety: PlantVariety,
  unlockState?: UnlockState,
): boolean {
  if (!(EXTENDED_PLANT_VARIETIES as readonly string[]).includes(variety) &&
      !(LEGENDARY_PLANT_VARIETIES as readonly string[]).includes(variety)) {
    return true
  }

  const state = ensureUnlockState(unlockState)

  if ((EXTENDED_PLANT_VARIETIES as readonly string[]).includes(variety)) {
    return state.counters.totalMemoriesPlanted >= EXTENDED_UNLOCK_PLANT_COUNT
  }

  return state.achievements.some((a) => a.id === LEGENDARY_ACHIEVEMENT_ID)
}

/** Whether the user may pick this variety when editing a memory. */
export function canSelectPlantVarietyForEdit(
  variety: PlantVariety,
  memory: Memory,
  unlockState?: UnlockState,
): boolean {
  if (memory.plantVariety === variety) return true
  return isPlantVarietyUnlockedForUser(variety, unlockState)
}
