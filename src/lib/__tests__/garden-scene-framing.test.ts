import { describe, expect, it } from 'vitest'
import { frameGardenSceneForViewport, GARDEN_SCENE_ASPECT } from '@/lib/garden/garden-scene-framing'
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
  it('uses meet and an aspect-matched viewBox on wide desktop', () => {
    const memories = edgeMemories()
    const layout = layoutMemoryPlantsForView(memories, 'pond')
    const framed = frameGardenSceneForViewport(layout, memories, { w: 1920, h: 1080 }, 'pond')
    expect(framed.preserveAspectRatio).toBe(GARDEN_SCENE_ASPECT)
    const vb = parseViewBox(framed.viewBox)
    const ar = 1920 / 1080
    expect(vb.w / vb.h).toBeCloseTo(ar, 2)
    expect(vb.x).toBeLessThanOrEqual(80)
    expect(vb.x + vb.w).toBeGreaterThanOrEqual(1100)
  })

  it('includes full scene height band on short laptop viewports', () => {
    const memories = edgeMemories()
    const layout = layoutMemoryPlantsForView(memories, 'lakeside')
    const framed = frameGardenSceneForViewport(layout, memories, { w: 1366, h: 650 }, 'lakeside')
    const vb = parseViewBox(framed.viewBox)
    expect(vb.y).toBeGreaterThanOrEqual(0)
    expect(vb.y + vb.h).toBeLessThanOrEqual(700.5)
  })
})