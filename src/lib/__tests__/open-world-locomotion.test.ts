import { describe, expect, it } from 'vitest'
import type { Memory } from '../types'
import { layoutGardenWorld } from '../open-world/layout'
import {
  circleBlocked,
  createPlayer,
  findNearestPlant,
  positionBlocked,
  stepPlayer,
} from '../open-world/locomotion'
import { EYE_HEIGHT, INTERACT_RADIUS } from '../open-world/constants'
import type { LocomotionInput } from '../open-world/types'

function mem(id: string, x = 200): Memory {
  return {
    id,
    photoUrl: '',
    text: id,
    date: '2026-01-01',
    plantedAt: '2026-01-01',
    position: { x, y: 450 },
    emotionalTone: 'reflective',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 0,
    reflections: [],
    audioRecordings: [],
  }
}

function idle(): LocomotionInput {
  return { forward: 0, strafe: 0, yawDelta: 0, pitchDelta: 0, turn: 0, sprint: false }
}

describe('locomotion', () => {
  it('walks forward along -Z when yaw is 0', () => {
    const world = layoutGardenWorld([])
    const player = { ...createPlayer(world), yaw: 0 }
    const next = stepPlayer(player, { ...idle(), forward: 1 }, 0.25, world)
    expect(next.z).toBeLessThan(player.z)
    expect(next.x).toBeCloseTo(player.x, 5)
    expect(next.y).toBe(EYE_HEIGHT)
  })

  it('does not walk through the pond', () => {
    const world = layoutGardenWorld([])
    const player = {
      ...createPlayer(world),
      x: world.pond.x,
      z: world.pond.z + world.pond.radius + 0.5,
      yaw: 0,
    }
    const next = stepPlayer(player, { ...idle(), forward: 1 }, 1, world)
    expect(positionBlocked(next.x, next.z, world)).toBe(false)
    expect(circleBlocked(next.x, next.z, 0.42, world.pond.x, world.pond.z, world.pond.radius * 0.92)).toBe(false)
  })

  it('stops at the fence', () => {
    const world = layoutGardenWorld([])
    const player = { ...createPlayer(world), x: world.bounds.maxX - 0.8, yaw: -Math.PI / 2 }
    const next = stepPlayer(player, { ...idle(), forward: 1 }, 2, world)
    expect(next.x).toBeLessThan(world.bounds.maxX - 0.3)
  })

  it('clamps pitch', () => {
    const world = layoutGardenWorld([])
    const player = createPlayer(world)
    const next = stepPlayer(player, { ...idle(), pitchDelta: 40 }, 0.016, world)
    expect(next.pitch).toBeLessThanOrEqual(0.92)
  })

  it('finds the nearest plant within interact range', () => {
    const world = layoutGardenWorld([mem('near', 100), mem('far', 1100)])
    const target = world.plants[0]
    const found = findNearestPlant(target.x + 0.4, target.z, world.plants, INTERACT_RADIUS)
    expect(found?.id).toBe(target.id)
    expect(findNearestPlant(0, 0, [], INTERACT_RADIUS)).toBeNull()
  })
})
