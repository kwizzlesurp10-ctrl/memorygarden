import type { WorldPlant } from './types'

export const WALK_PLANT_FOCUS_KEY = 'mg:walk-plant-focus'

export function isWalkPlantFocusCapture(): boolean {
  return (
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem(WALK_PLANT_FOCUS_KEY) === '1'
  )
}

const WALK_V2_PIN: Record<string, { x: number; z: number }> = {
  'tree-mature-walk': { x: 0.2, z: 7.8 },
  'tree-elder-walk': { x: 2.6, z: 6.5 },
  'flower-bloom-walk': { x: -3.3, z: 7.6 },
  'mushroom-walk': { x: 1.8, z: 9.2 },
  'sprout-walk': { x: 1.0, z: 6.4 },
}

/** Place seeded demo memories in front of spawn for screenshot framing. */
export function applyWalkCaptureFocus(plants: WorldPlant[]): void {
  const byId = new Map(plants.map((p) => [p.id, p]))
  for (const [id, pos] of Object.entries(WALK_V2_PIN)) {
    const plant = byId.get(id)
    if (plant) {
      plant.x = pos.x
      plant.z = pos.z
    }
  }
  const tree =
    byId.get('cc0-demo-2') ?? plants.find((p) => p.variety === 'tree' && !WALK_V2_PIN[p.id])
  const flower =
    byId.get('cc0-demo-1') ?? plants.find((p) => p.variety === 'flower' && !WALK_V2_PIN[p.id])
  const mushroom =
    byId.get('mushroom-walk') ??
    plants.find((p) => p.variety === 'mushroom' && !WALK_V2_PIN[p.id])
  if (tree && !WALK_V2_PIN[tree.id]) {
    tree.x = 1.8
    tree.z = 6.2
  }
  if (flower && !WALK_V2_PIN[flower.id]) {
    flower.x = -2.4
    flower.z = 8.4
  }
  if (mushroom && !WALK_V2_PIN[mushroom.id]) {
    mushroom.x = 3.4
    mushroom.z = 7.2
  }
}
