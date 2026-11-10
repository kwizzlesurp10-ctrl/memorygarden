import { describe, expect, it } from 'vitest'
import type { Memory } from '@/lib/types'
import {
  layoutMemoryPlantsForView,
  treeFootprintHalfW,
} from '@/lib/garden/memory-scene-layout'
import { frameMemoryPlantsForMobile, visibleSceneWidthForSlice } from '@/lib/garden/garden-mobile-framing'
import { plantStageToIndex } from '@/lib/garden/stage'

const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

function edgeMemories(): Memory[] {
  return [
    {
      id: 'west',
      photoUrl: photo,
      text: 'West',
      date: '2025-06-01',
      plantedAt: '2025-06-01T12:00:00.000Z',
      position: { x: 148, y: 444 },
      emotionalTone: 'peaceful',
      plantStage: 'bloom',
      plantVariety: 'tree',
      visitCount: 1,
      reflections: [],
      audioRecordings: [],
    },
    {
      id: 'east',
      photoUrl: photo,
      text: 'East',
      date: '2025-06-01',
      plantedAt: '2025-06-01T12:00:00.000Z',
      position: { x: 1040, y: 442 },
      emotionalTone: 'peaceful',
      plantStage: 'elder',
      plantVariety: 'tree',
      visitCount: 1,
      reflections: [],
      audioRecordings: [],
    },
  ]
}

describe('frameMemoryPlantsForMobile', () => {
  it('returns null at tablet width', () => {
    const layout = layoutMemoryPlantsForView(edgeMemories(), 'pond')
    expect(frameMemoryPlantsForMobile(layout, edgeMemories(), { w: 720, h: 500 })).toBeNull()
  })

  it('shrinks spread plants to fit the slice viewport', () => {
    const memories = edgeMemories()
    const layout = layoutMemoryPlantsForView(memories, 'pond')
    const framed = frameMemoryPlantsForMobile(layout, memories, { w: 390, h: 520 })
    expect(framed).not.toBeNull()
    const west = framed!.layout.get('west')!
    const east = framed!.layout.get('east')!
    const westHalf = treeFootprintHalfW(west.plantScale, plantStageToIndex('bloom'))
    const eastHalf = treeFootprintHalfW(east.plantScale, plantStageToIndex('elder'))
    const visible = visibleSceneWidthForSlice({ w: 390, h: 520 })
    expect(east.x + eastHalf - (west.x - westHalf)).toBeLessThanOrEqual(visible + 2)
  })
})
