import { beforeEach, describe, expect, it } from 'vitest'
import type { Memory } from '../types'
import { layoutGardenWorld } from '../open-world/layout'
import { STORAGE_KEY_BONDS, saveGardenBonds } from '../social-tending'

function makeMockMemory(id: string, opts?: Partial<Memory>): Memory {
  return {
    id,
    photoUrl: 'https://example.com/p.jpg',
    text: `Memory ${id}`,
    date: '2026-06-01',
    plantedAt: '2026-06-01T08:00:00Z',
    position: { x: 500, y: 500 },
    emotionalTone: 'happy',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    growthMetrics: {
      vitality: 80,
      height: 1.2,
      width: 0.8,
      bloomCount: 3,
      foliageDensity: 0.8,
      rarityScore: 1.0,
      lastInteractionAt: Date.now(),
    },
    ...opts,
  }
}

describe('The Sanctuary Circle & Collaborative Layout', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_BONDS)
  })

  it('allocates Sanctuary Circle at (0, -25) with radius 7.0 in GardenWorld', () => {
    const world = layoutGardenWorld([])
    expect(world.sanctuaryCircle).toBeDefined()
    expect(world.sanctuaryCircle?.x).toBe(0)
    expect(world.sanctuaryCircle?.z).toBe(-25)
    expect(world.sanctuaryCircle?.radius).toBe(7.0)
  })

  it('connects walking paths straight to the Sanctuary Circle and around its perimeter', () => {
    const world = layoutGardenWorld([])
    const spine = world.paths[0]
    const lastSpinePt = spine.points[spine.points.length - 1]
    expect(lastSpinePt).toEqual({ x: 0, z: -25 })

    // Check for the perimeter ring path surrounding (0, -25)
    const ringPath = world.paths.find(
      (p) => p.points.length > 5 && p.points.some((pt) => Math.abs(pt.z - -25) < 8),
    )
    expect(ringPath).toBeDefined()
  })

  it('positions collaborative memories (isSharedPlot / circle) inside Sanctuary Circle', () => {
    const normalMem = makeMockMemory('normal-1', { emotionalTone: 'happy' })
    const sharedMem = makeMockMemory('shared-1', {
      isSharedPlot: true,
      plantedBy: { id: 'user-2', login: 'SakuraKeeper', avatarUrl: '' },
    })

    const world = layoutGardenWorld([normalMem, sharedMem])
    const pShared = world.plants.find((p) => p.id === 'shared-1')!
    const pNormal = world.plants.find((p) => p.id === 'normal-1')!

    expect(pShared.isSanctuaryCircle).toBe(true)
    expect(pShared.plantedBy?.login).toBe('SakuraKeeper')

    // Distance to Sanctuary Circle center (0, -25)
    const distToCenter = Math.hypot(pShared.x - 0, pShared.z - -25)
    expect(distToCenter).toBeLessThanOrEqual(7.0)

    // Normal plant is outside Sanctuary Circle (or pushed clear)
    const normalDistToCenter = Math.hypot(pNormal.x - 0, pNormal.z - -25)
    expect(normalDistToCenter).toBeGreaterThan(6.0)
  })

  it('detects active Garden Bond and passes bond partner name into world state', () => {
    saveGardenBonds([
      {
        partnerId: 'user-buddy',
        partnerLogin: 'Yuki',
        lastReciprocalWaterAt: new Date().toISOString(),
        bondLevel: 2,
        totalReciprocalTends: 3,
      },
    ])

    const world = layoutGardenWorld([])
    expect(world.hasGardenBonds).toBe(true)
    expect(world.bondPartnerName).toBe('Yuki')
  })
})
