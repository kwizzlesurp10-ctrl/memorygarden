import { describe, expect, it } from 'vitest'
import { layoutGardenWorld } from '@/lib/open-world/layout'
import type { Memory } from '@/lib/types'
import { STAGE_ROW_CAPTURE_KEY } from '@/lib/open-world/stage-capture-layout'
import { WALK_PLANT_FOCUS_KEY } from '@/lib/open-world/walk-capture-layout'

function memory(overrides: Partial<Memory> & Pick<Memory, 'id'>): Memory {
  return {
    photoUrl: 'data:image/png;base64,',
    text: 'test',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 400, y: 450 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'tree',
    visitCount: 1,
    reflections: [],
    audioRecordings: [],
    ...overrides,
  }
}

describe('walk capture layouts', () => {
  it('pins demo memories for walk-plant-focus captures', () => {
    sessionStorage.setItem(WALK_PLANT_FOCUS_KEY, '1')
  sessionStorage.removeItem(STAGE_ROW_CAPTURE_KEY)
    const world = layoutGardenWorld([
      memory({ id: 'cc0-demo-1', plantVariety: 'flower', plantStage: 'bloom' }),
      memory({ id: 'cc0-demo-2', plantVariety: 'tree', plantStage: 'mature' }),
    ])
    const tree = world.plants.find((p) => p.id === 'cc0-demo-2')
    const flower = world.plants.find((p) => p.id === 'cc0-demo-1')
    expect(tree?.z).toBe(6.2)
    expect(flower?.z).toBe(8.4)
    sessionStorage.removeItem(WALK_PLANT_FOCUS_KEY)
  })

  it('lays out stage rows after clamping and skips filler clutter', () => {
    sessionStorage.setItem(STAGE_ROW_CAPTURE_KEY, '1')
    sessionStorage.removeItem(WALK_PLANT_FOCUS_KEY)
    const world = layoutGardenWorld([
      memory({ id: 'cap-tree-seed', plantVariety: 'tree', plantStage: 'seed' }),
    ])
    expect(world.plants[0]?.x).toBe(-16)
    expect(world.plants[0]?.z).toBe(9)
    expect(world.fillerFlora).toEqual([])
    sessionStorage.removeItem(STAGE_ROW_CAPTURE_KEY)
  })
})
