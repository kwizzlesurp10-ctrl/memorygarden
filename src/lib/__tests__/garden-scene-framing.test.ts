import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCENE_VIEWBOX,
  frameGardenSceneForViewport,
  GARDEN_SCENE_ASPECT,
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

function parseViewBox(viewBox: string): { x: number; y: number; w: number; h: number } {
  const parts = viewBox.split(/\s+/).map(Number)
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] }
}

describe('frameGardenSceneForViewport', () => {
  it('uses default full-scene viewBox on wide desktop (pond matches main)', () => {
    const memories = edgeMemories()
    const layout = layoutMemoryPlantsForView(memories, 'pond')
    const framed = frameGardenSceneForViewport(layout, memories, { w: 1920, h: 1080 }, 'pond')
    expect(framed.preserveAspectRatio).toBe(GARDEN_SCENE_ASPECT)
    expect(framed.viewBox).toBe(DEFAULT_SCENE_VIEWBOX)
    expect(framed.layout).toBe(layout)
  })

  it('keeps the same viewBox for every landscape tab (pond reference zoom)', () => {
    const memories = edgeMemories()
    const vp = { w: 1440, h: 900 }
    const pond = frameGardenSceneForViewport(
      layoutMemoryPlantsForView(memories, 'pond'),
      memories,
      vp,
      'pond',
    ).viewBox
    for (const view of ['lakeside', 'meadow', 'garden_path'] as const) {
      const other = frameGardenSceneForViewport(
        layoutMemoryPlantsForView(memories, view),
        memories,
        vp,
        view,
      ).viewBox
      expect(other).toBe(pond)
    }
  })

  it('fills mobile with full scene height (no vertical letterbox window)', () => {
    const memories = edgeMemories()
    const layout = layoutMemoryPlantsForView(memories, 'lakeside')
    const framed = frameGardenSceneForViewport(layout, memories, { w: 390, h: 844 }, 'lakeside')
    const vb = parseViewBox(framed.viewBox)
    expect(vb.y).toBe(0)
    expect(vb.h).toBe(700)
  })
})