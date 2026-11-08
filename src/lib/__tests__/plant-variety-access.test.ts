import { describe, expect, it } from 'vitest'
import type { Memory, UnlockState } from '@/lib/types'
import { createDefaultUnlockState } from '@/lib/unlock-system'
import {
  canSelectPlantVarietyForEdit,
  isPlantVarietyUnlockedForUser,
} from '@/lib/garden/plant-variety-access'

const baseMemory = (overrides: Partial<Memory> = {}): Memory => ({
  id: 'm-1',
  photoUrl: '',
  text: 'hello',
  date: '2024-01-01',
  plantedAt: '2024-01-01T00:00:00.000Z',
  position: { x: 400, y: 450 },
  emotionalTone: 'peaceful',
  plantStage: 'sprout',
  plantVariety: 'flower',
  visitCount: 0,
  reflections: [],
  audioRecordings: [],
  ...overrides,
})

describe('isPlantVarietyUnlockedForUser', () => {
  it('allows base varieties', () => {
    expect(isPlantVarietyUnlockedForUser('flower', createDefaultUnlockState())).toBe(true)
  })

  it('locks extended varieties until planting milestone', () => {
    const locked = createDefaultUnlockState()
    expect(isPlantVarietyUnlockedForUser('fern', locked)).toBe(false)
    const unlocked: UnlockState = {
      ...locked,
      counters: { ...locked.counters, totalMemoriesPlanted: 6 },
    }
    expect(isPlantVarietyUnlockedForUser('fern', unlocked)).toBe(true)
  })
})

describe('canSelectPlantVarietyForEdit', () => {
  it('always allows keeping current variety even when locked', () => {
    const memory = baseMemory({ plantVariety: 'ancient_oak' })
    expect(canSelectPlantVarietyForEdit('ancient_oak', memory, createDefaultUnlockState())).toBe(true)
  })

  it('blocks choosing locked legendary variety on another plant', () => {
    const memory = baseMemory({ plantVariety: 'flower' })
    expect(canSelectPlantVarietyForEdit('starlight_succulent', memory, createDefaultUnlockState())).toBe(false)
  })
})
