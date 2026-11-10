import { describe, expect, it } from 'vitest'
import { layoutGardenWorld } from '@/lib/open-world/layout'
import type { Memory } from '@/lib/types'
import {
  buildCc0Placements,
  canPlaceScenery,
  cc0ShowcaseCapturePose,
  cc0ShowcaseFillScale,
  minDistanceToPaths,
} from '@/lib/open-world/cc0-placement'

function mem(id: string): Memory {
  return {
    id,
    photoUrl: '',
    text: 'A quiet memory among roses.',
    date: '2026-01-01',
    plantedAt: '2026-01-02T00:00:00.000Z',
    position: { x: 400, y: 450 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 0,
    reflections: [],
    audioRecordings: [],
  }
}

describe('cc0-placement', () => {
  it('keeps scatter off the central path and pond', () => {
    const world = layoutGardenWorld([mem('a'), mem('b')])
    const pathDist = minDistanceToPaths(0, 10, world.paths)
    expect(pathDist).toBeLessThan(1.5)
    expect(canPlaceScenery(world, 0, 10, 0.5)).toBe(false)
    expect(canPlaceScenery(world, world.pond.x, world.pond.z, 0.5)).toBe(false)
  })

  it('is deterministic for placement seed', () => {
    const world = layoutGardenWorld([mem('x'), mem('y')])
    const a = buildCc0Placements(world, 4242, { scatterMultiplier: 1 })
    const b = buildCc0Placements(world, 4242, { scatterMultiplier: 1 })
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(10)
  })

  it('frames showcase shots by model height', () => {
    expect(cc0ShowcaseFillScale(8.4)).toBeLessThan(cc0ShowcaseFillScale(0.62))
    expect(cc0ShowcaseCapturePose(8.4).z).toBeGreaterThan(cc0ShowcaseCapturePose(0.62).z)
  })
})
