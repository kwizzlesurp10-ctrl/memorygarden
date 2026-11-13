import type { WorldPlant } from './types'

export const WALK_PLANT_FOCUS_KEY = 'mg:walk-plant-focus'

export function isWalkPlantFocusCapture(): boolean {
  return (
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem(WALK_PLANT_FOCUS_KEY) === '1'
  )
}

/** Place seeded demo memories in front of spawn for screenshot framing. */
export function applyWalkCaptureFocus(plants: WorldPlant[]): void {
  const byId = new Map(plants.map((p) => [p.id, p]))
  const tree =
    byId.get('cc0-demo-2') ?? plants.find((p) => p.variety === 'tree') ?? byId.get('tree-elder-walk')
  const flower =
    byId.get('cc0-demo-1') ?? plants.find((p) => p.variety === 'flower') ?? byId.get('flower-bloom-walk')
  const mushroom = byId.get('mushroom-walk') ?? plants.find((p) => p.variety === 'mushroom')
  if (tree) {
    tree.x = 1.8
    tree.z = 6.2
  }
  if (flower) {
    flower.x = -2.4
    flower.z = 8.4
  }
  if (mushroom) {
    mushroom.x = 3.4
    mushroom.z = 7.2
  }
}
