import { describe, expect, it } from 'vitest'
import {
  frameGardenSceneForViewport,
  GARDEN_SCENE_ASPECT,
  parseSceneViewBox,
} from '@/lib/garden/garden-scene-framing'
import { layoutMemoryPlantsForView } from '@/lib/garden/memory-scene-layout'
import type { Memory } from '@/lib/types'

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

describe('frameGardenSceneForViewport', () => {
  it('fits edge plants inside viewBox on wide desktop', () => {
    const memories = edgeMemories()
    const layout = layoutMemoryPlantsForView(memories, 'pond')
    const framed = frameGardenSceneForViewport(layout, memories, { w: 1440, h: 900 }, 'pond')
    expect(framed.preserveAspectRatio).toBe(GARDEN_SCENE_ASPECT)
    expect(framed.layout).toBe(layout)
    const vb = parseSceneViewBox(framed.viewBox)
    expect(vb.h).toBe(700)
    for (const memory of memories) {
      const pos = layout.get(memory.id)!
      const half = memory.plantVariety === 'tree' ? 40 : 14
      expect(pos.x - half).toBeGreaterThanOrEqual(vb.x + 8)
      expect(pos.x + half).toBeLessThanOrEqual(vb.x + vb.w - 8)
    }
  })

  it('keeps pond reference zoom width on every landscape tab (desktop)', () => {
    const memories = edgeMemories()
    const vp = { w: 1440, h: 900 }
    const pondW = parseSceneViewBox(
      frameGardenSceneForViewport(
        layoutMemoryPlantsForView(memories, 'pond'),
        memories,
        vp,
        'pond',
      ).viewBox,
    ).w
    for (const view of ['lakeside', 'meadow', 'garden_path'] as const) {
      const otherW = parseSceneViewBox(
        frameGardenSceneForViewport(
          layoutMemoryPlantsForView(memories, view),
          memories,
          vp,
          view,
        ).viewBox,
      ).w
      expect(otherW).toBe(pondW)
    }
  })

  it('fills mobile with full scene height (no vertical letterbox window)', () => {
    const memories = edgeMemories()
    const layout = layoutMemoryPlantsForView(memories, 'lakeside')
    const framed = frameGardenSceneForViewport(layout, memories, { w: 390, h: 844 }, 'lakeside')
    const vb = parseSceneViewBox(framed.viewBox)
    expect(vb.y).toBe(0)
    expect(vb.h).toBe(700)
  })
})