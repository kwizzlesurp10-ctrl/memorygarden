import { describe, expect, it } from 'vitest'
import type { Memory } from '../types'
import { layoutGardenWorld, plantRadius, worldToMinimap } from '../open-world/layout'
import { PLAYER_RADIUS, WORLD_HALF } from '../open-world/constants'

function mem(
  id: string,
  extra: Partial<Memory> = {},
): Memory {
  return {
    id,
    photoUrl: `https://example.test/${id}.jpg`,
    text: extra.text ?? `Memory ${id} about a quiet afternoon in the garden.`,
    date: '2026-04-01',
    plantedAt: '2026-04-02T00:00:00.000Z',
    position: extra.position ?? { x: 400, y: 450 },
    emotionalTone: extra.emotionalTone ?? 'peaceful',
    plantStage: extra.plantStage ?? 'bloom',
    plantVariety: extra.plantVariety ?? 'flower',
    visitCount: 0,
    reflections: [],
    audioRecordings: [],
    ...extra,
  }
}

describe('layoutGardenWorld', () => {
  it('is deterministic for the same memories', () => {
    const memories = [
      mem('a', { emotionalTone: 'happy', position: { x: 100, y: 450 } }),
      mem('b', { emotionalTone: 'peaceful', position: { x: 900, y: 460 } }),
      mem('c', { emotionalTone: 'bittersweet' }),
    ]
    const once = layoutGardenWorld(memories)
    const twice = layoutGardenWorld(memories)
    expect(once.plants.map((p) => [p.id, p.x, p.z])).toEqual(
      twice.plants.map((p) => [p.id, p.x, p.z]),
    )
    expect(once.spawn).toEqual(twice.spawn)
  })

  it('keeps every plant inside the fence', () => {
    const memories = Array.from({ length: 40 }, (_, i) =>
      mem(`p${i}`, {
        emotionalTone: (['happy', 'peaceful', 'reflective', 'nostalgic', 'bittersweet'] as const)[i % 5],
        plantStage: (['seed', 'sprout', 'bloom', 'mature', 'elder'] as const)[i % 5],
        position: { x: (i * 97) % 1200, y: 440 },
      }),
    )
    const world = layoutGardenWorld(memories)
    for (const p of world.plants) {
      expect(p.x).toBeGreaterThan(-WORLD_HALF + 0.5)
      expect(p.x).toBeLessThan(WORLD_HALF - 0.5)
      expect(p.z).toBeGreaterThan(-WORLD_HALF + 0.5)
      expect(p.z).toBeLessThan(WORLD_HALF - 0.5)
    }
    expect(world.plants).toHaveLength(40)
  })

  it('does not spawn the player inside a plant', () => {
    const world = layoutGardenWorld([
      mem('gate-blocker', { position: { x: 600, y: 450 }, plantStage: 'elder', plantVariety: 'tree' }),
    ])
    for (const p of world.plants) {
      const d = Math.hypot(world.spawn.x - p.x, world.spawn.z - p.z)
      expect(d).toBeGreaterThan(p.radius + PLAYER_RADIUS)
    }
  })

  it('spreads different tones into different beds', () => {
    const world = layoutGardenWorld([
      mem('h', { emotionalTone: 'happy' }),
      mem('p', { emotionalTone: 'peaceful' }),
    ])
    const happy = world.plants.find((p) => p.id === 'h')
    const peaceful = world.plants.find((p) => p.id === 'p')
    expect(happy && peaceful).toBeTruthy()
    expect(Math.hypot(happy!.x - peaceful!.x, happy!.z - peaceful!.z)).toBeGreaterThan(8)
  })

  it('maps world coords onto the minimap', () => {
    const world = layoutGardenWorld([mem('a')])
    const origin = worldToMinimap(world.bounds.minX, world.bounds.minZ, world.bounds, 100)
    const far = worldToMinimap(world.bounds.maxX, world.bounds.maxZ, world.bounds, 100)
    expect(origin).toEqual({ x: 0, y: 0 })
    expect(far.x).toBeCloseTo(100)
    expect(far.y).toBeCloseTo(100)
  })
})

describe('plantRadius', () => {
  it('grows with stage and trees occupy more ground', () => {
    expect(plantRadius('seed', 'flower')).toBeLessThan(plantRadius('elder', 'flower'))
    expect(plantRadius('bloom', 'tree')).toBeGreaterThan(plantRadius('bloom', 'flower'))
  })
})
