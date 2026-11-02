import { beforeEach, describe, expect, it } from 'vitest'
import type { LocalUser, Memory } from '../types'
import {
  BOND_WINDOW_MS,
  STORAGE_KEY_BONDS,
  hasActiveGardenBond,
  loadGardenBonds,
  recordReciprocalWatering,
  saveGardenBonds,
  tendPlant,
} from '../social-tending'

function makeMockMemory(): Memory {
  return {
    id: 'mem-host-1',
    photoUrl: 'https://example.com/host.jpg',
    text: 'Host Memory in Kyoto',
    date: '2026-06-01',
    plantedAt: '2026-06-01T08:00:00Z',
    position: { x: 500, y: 500 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    plantedBy: {
      id: 'user-host-42',
      login: 'Yuki',
      avatarUrl: '',
    },
    growthMetrics: {
      vitality: 50,
      height: 1.2,
      width: 0.8,
      bloomCount: 3,
      foliageDensity: 0.8,
      rarityScore: 1.0,
      lastInteractionAt: Date.now() - 3600 * 1000,
    },
  }
}

const mockVisitor: LocalUser = {
  id: 'user-visitor-99',
  login: 'GentleDreamer',
  avatarUrl: 'https://example.com/visitor.jpg',
}

describe('social-tending & reciprocal garden bonds', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_BONDS)
  })

  it('tends plant and advances growth metrics via basic tendPlant', () => {
    const mem = makeMockMemory()
    const result = tendPlant(mem, 'GentleDreamer')
    expect(result.growthBoost).toBeGreaterThanOrEqual(1)
    expect(result.message).toContain('GentleDreamer')
  })

  it('records reciprocal visitor watering, replenishes vitality, and establishes bond', () => {
    const mem = makeMockMemory()
    const nowMs = 1780000000000
    const result = recordReciprocalWatering(mem, mockVisitor, nowMs)

    // Vitality boosted by +40% (50 -> 90)
    expect(result.memory.growthMetrics?.vitality).toBe(90)
    expect(result.memory.visitCount).toBe(4)

    // Tend reflection added with attribution
    const lastReflection = result.memory.reflections[result.memory.reflections.length - 1]
    expect(lastReflection.isTend).toBe(true)
    expect(lastReflection.contributorLogin).toBe('GentleDreamer')
    expect(lastReflection.text).toContain('watered this memory with loving care')

    // Initial Garden Bond established
    expect(result.bond.partnerId).toBe('user-host-42')
    expect(result.bond.partnerLogin).toBe('Yuki')
    expect(result.bond.bondLevel).toBe(1)
    expect(result.bond.totalReciprocalTends).toBe(1)
    expect(result.notificationMessage).toContain('GentleDreamer')

    // Bond persisted in storage
    const loaded = loadGardenBonds()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].partnerLogin).toBe('Yuki')
  })

  it('strengthens bond level when watered within the 48-hour rolling window', () => {
    const mem = makeMockMemory()
    const t0 = 1780000000000
    const firstWater = recordReciprocalWatering(mem, mockVisitor, t0)
    expect(firstWater.bond.bondLevel).toBe(1)

    // Watered again 24 hours later (within 48h)
    const t1 = t0 + 24 * 3600 * 1000
    const secondWater = recordReciprocalWatering(firstWater.memory, mockVisitor, t1)
    expect(secondWater.bond.bondLevel).toBe(2)
    expect(secondWater.bond.totalReciprocalTends).toBe(2)

    // Active bond detection
    const bondCheck = hasActiveGardenBond(t1)
    expect(bondCheck.active).toBe(true)
    expect(bondCheck.partnerName).toBe('Yuki')
  })

  it('expires active bond after 48-hour window without reciprocal care', () => {
    const mem = makeMockMemory()
    const t0 = 1780000000000
    recordReciprocalWatering(mem, mockVisitor, t0)

    // Check after 50 hours (past 48h window)
    const tExpired = t0 + 50 * 3600 * 1000
    const check = hasActiveGardenBond(tExpired)
    expect(check.active).toBe(false)
  })
})
