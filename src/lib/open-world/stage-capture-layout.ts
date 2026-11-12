import type { PlantStage, PlantVariety } from '@/lib/types'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'
import type { WorldPlant } from './types'

export const STAGE_ROW_CAPTURE_KEY = 'mg:stage-row-capture'

/** Default walk camera for stage-row screenshots (south of row, looking north). */
export const STAGE_ROW_CAMERA_POSE = { x: 0, z: 10.2, yaw: 0, pitch: 0.2 } as const

export function isStageRowCapture(): boolean {
  return (
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem(STAGE_ROW_CAPTURE_KEY) === '1'
  )
}

/** Line plants along +X for screenshot capture (runtime only; does not touch saved memory positions). */
export function applyStageRowLayout(plants: WorldPlant[], variety: PlantVariety, rowZ: number): void {
  for (const stage of PLANT_STAGES_ORDER) {
    const plant = plants.find((p) => p.variety === variety && p.stage === stage)
    if (!plant) continue
    const i = PLANT_STAGES_ORDER.indexOf(stage)
    plant.x = -16 + i * 4.6
    plant.z = rowZ
  }
}

export function applyDualStageRowCapture(plants: WorldPlant[]): void {
  applyStageRowLayout(plants, 'tree', 9)
  applyStageRowLayout(plants, 'flower', 10.6)
}
