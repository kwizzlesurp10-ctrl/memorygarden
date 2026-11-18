import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readRaw, writeRaw } from '@/lib/storage'
import {
  DEFAULT_PERSONAL_GARDEN_ID,
  activePersonalGardenMemoriesKey,
  archiveActiveAndStartNewGarden,
  ensurePersonalGardensMigrated,
  personalGardenMemoriesKey,
  personalGardenShedKey,
  readPersonalGardenRegistry,
  selectPersonalGarden,
} from '@/lib/garden/personal-gardens'
import type { Memory, StorageShedData } from '@/lib/types'
import { loadShed, saveShed } from '@/lib/garden/shed-storage'
import { mergePulledMemories } from '@/lib/cloud-sync'

const userId = 'test-user-personal-gardens'

const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const sampleMemory: Memory = {
  id: 'mem-1',
  photoUrl: photo,
  text: 'Original',
  date: '2025-01-01',
  plantedAt: '2025-01-01T12:00:00.000Z',
  position: { x: 500, y: 440 },
  emotionalTone: 'peaceful',
  plantStage: 'bloom',
  plantVariety: 'flower',
  visitCount: 1,
  reflections: [],
  audioRecordings: [],
}

function clearUserStorage() {
  const keys = Object.keys(localStorage).filter((k) => k.includes(userId))
  for (const k of keys) localStorage.removeItem(k)
}

describe('personal gardens', () => {
  beforeEach(() => {
    clearUserStorage()
  })

  afterEach(() => {
    clearUserStorage()
  })

  it('migrates legacy memories into the default garden', () => {
    writeRaw(`${userId}:memories`, [sampleMemory])
    const registry = ensurePersonalGardensMigrated(userId)
    expect(registry.activeGardenId).toBe(DEFAULT_PERSONAL_GARDEN_ID)
    const migrated = readRaw<Memory[]>(personalGardenMemoriesKey(userId, DEFAULT_PERSONAL_GARDEN_ID))
    expect(migrated?.[0]?.id).toBe('mem-1')
    expect(activePersonalGardenMemoriesKey(userId)).toBe(
      personalGardenMemoriesKey(userId, DEFAULT_PERSONAL_GARDEN_ID),
    )
  })

  it('creates an empty new garden and archives the prior one', () => {
    writeRaw(personalGardenMemoriesKey(userId, DEFAULT_PERSONAL_GARDEN_ID), [sampleMemory])
    writePersonalRegistry(userId)
    const next = archiveActiveAndStartNewGarden(userId)
    expect(next.gardens.length).toBe(2)
    const archived = next.gardens.find((g) => g.id === DEFAULT_PERSONAL_GARDEN_ID)
    expect(archived?.archivedAt).toBeTruthy()
    const newMemories = readRaw<Memory[]>(personalGardenMemoriesKey(userId, next.activeGardenId))
    expect(newMemories).toEqual([])
    const oldMemories = readRaw<Memory[]>(personalGardenMemoriesKey(userId, DEFAULT_PERSONAL_GARDEN_ID))
    expect(oldMemories?.[0]?.text).toBe('Original')
  })

  it('switches back to the original garden memories intact', () => {
    writeRaw(personalGardenMemoriesKey(userId, DEFAULT_PERSONAL_GARDEN_ID), [sampleMemory])
    writePersonalRegistry(userId)
    const created = archiveActiveAndStartNewGarden(userId)
    const switched = selectPersonalGarden(userId, DEFAULT_PERSONAL_GARDEN_ID)
    expect(switched.activeGardenId).toBe(DEFAULT_PERSONAL_GARDEN_ID)
    const memories = readRaw<Memory[]>(personalGardenMemoriesKey(userId, DEFAULT_PERSONAL_GARDEN_ID))
    expect(memories?.[0]?.text).toBe('Original')
    expect(created.activeGardenId).not.toBe(DEFAULT_PERSONAL_GARDEN_ID)
  })
})

function writePersonalRegistry(uid: string) {
  writeRaw(`${uid}:personal-gardens`, {
    v: 1 as const,
    activeGardenId: DEFAULT_PERSONAL_GARDEN_ID,
    gardens: [{ id: DEFAULT_PERSONAL_GARDEN_ID, name: 'My Garden', createdAt: '2025-01-01T00:00:00.000Z' }],
  })
}

describe('personal gardens cloud sync round-trip', () => {
  beforeEach(() => {
    clearUserStorage()
  })

  afterEach(() => {
    clearUserStorage()
  })

  it('merges pulled memories while active garden shed stays scoped', () => {
    writePersonalRegistry(userId)
    const shed: StorageShedData = {
      v: 1,
      seeds: [],
      planted: [],
      shedStyle: 'glass',
      candles: [],
    }
    saveShed(userId, shed, DEFAULT_PERSONAL_GARDEN_ID)

    const pulled = mergePulledMemories([sampleMemory], [{ ...sampleMemory, text: 'From cloud' }])
    expect(pulled[0].text).toBe('From cloud')
    expect(pulled[0].photoUrl).toBe(photo)
    expect(loadShed(userId, DEFAULT_PERSONAL_GARDEN_ID).shedStyle).toBe('glass')
    expect(readPersonalGardenRegistry(userId).activeGardenId).toBe(DEFAULT_PERSONAL_GARDEN_ID)
  })
})