import { readRaw, writeRaw } from '@/lib/storage'
import type { GardenLandscapeView, Memory, StorageShedData } from '@/lib/types'
import { defaultStorageShedData } from '@/lib/garden/shed-storage'

export const DEFAULT_PERSONAL_GARDEN_ID = 'default'
const REGISTRY_VERSION = 1 as const

export interface PersonalGardenEntry {
  id: string
  name: string
  createdAt: string
  archivedAt?: string | null
  landscapeView?: GardenLandscapeView
}

export interface PersonalGardenRegistry {
  v: typeof REGISTRY_VERSION
  activeGardenId: string
  gardens: PersonalGardenEntry[]
}

export function personalGardensRegistryKey(userId: string): string {
  return `${userId}:personal-gardens`
}

export function personalGardenMemoriesKey(userId: string, gardenId: string): string {
  return `${userId}:garden:${gardenId}:memories`
}

export function personalGardenShedKey(userId: string, gardenId: string): string {
  return `${userId}:garden:${gardenId}:storage-shed`
}

function legacyMemoriesKey(userId: string): string {
  return `${userId}:memories`
}

function legacyShedKey(userId: string): string {
  return `${userId}:storage-shed`
}

function isRegistry(value: unknown): value is PersonalGardenRegistry {
  if (!value || typeof value !== 'object') return false
  const reg = value as PersonalGardenRegistry
  return reg.v === REGISTRY_VERSION && typeof reg.activeGardenId === 'string' && Array.isArray(reg.gardens)
}

export function ensurePersonalGardensMigrated(userId: string): PersonalGardenRegistry {
  const registryKey = personalGardensRegistryKey(userId)
  const existing = readRaw<PersonalGardenRegistry>(registryKey)
  if (isRegistry(existing)) {
    return existing
  }

  const defaultMemKey = personalGardenMemoriesKey(userId, DEFAULT_PERSONAL_GARDEN_ID)
  const defaultShedKey = personalGardenShedKey(userId, DEFAULT_PERSONAL_GARDEN_ID)

  const legacyMemories = readRaw<Memory[]>(legacyMemoriesKey(userId))
  if (legacyMemories != null && readRaw(defaultMemKey) == null) {
    writeRaw(defaultMemKey, legacyMemories)
  }

  const legacyShed = readRaw<StorageShedData>(legacyShedKey(userId))
  if (legacyShed != null && readRaw(defaultShedKey) == null) {
    writeRaw(defaultShedKey, legacyShed)
  }

  const now = new Date().toISOString()
  const registry: PersonalGardenRegistry = {
    v: REGISTRY_VERSION,
    activeGardenId: DEFAULT_PERSONAL_GARDEN_ID,
    gardens: [
      {
        id: DEFAULT_PERSONAL_GARDEN_ID,
        name: 'My Garden',
        createdAt: now,
      },
    ],
  }
  writeRaw(registryKey, registry)
  return registry
}

export function readPersonalGardenRegistry(userId: string): PersonalGardenRegistry {
  const registry = readRaw<PersonalGardenRegistry>(personalGardensRegistryKey(userId))
  if (isRegistry(registry)) return registry
  return ensurePersonalGardensMigrated(userId)
}

export function writePersonalGardenRegistry(userId: string, registry: PersonalGardenRegistry): void {
  writeRaw(personalGardensRegistryKey(userId), registry)
}

export function activePersonalGardenMemoriesKey(userId: string): string {
  const registry = readPersonalGardenRegistry(userId)
  return personalGardenMemoriesKey(userId, registry.activeGardenId)
}

export function activePersonalGardenId(userId: string): string {
  return readPersonalGardenRegistry(userId).activeGardenId
}

export function selectPersonalGarden(userId: string, gardenId: string): PersonalGardenRegistry {
  const registry = readPersonalGardenRegistry(userId)
  if (!registry.gardens.some((g) => g.id === gardenId)) {
    return registry
  }
  const next: PersonalGardenRegistry = { ...registry, activeGardenId: gardenId }
  writePersonalGardenRegistry(userId, next)
  return next
}

function nextGardenLabel(registry: PersonalGardenRegistry): string {
  const ordinal = registry.gardens.length + 1
  return `Garden ${ordinal}`
}

export function archiveActiveAndStartNewGarden(userId: string): PersonalGardenRegistry {
  const registry = readPersonalGardenRegistry(userId)
  const now = new Date().toISOString()
  const gardens = registry.gardens.map((g) =>
    g.id === registry.activeGardenId ? { ...g, archivedAt: now } : g,
  )
  const newId = crypto.randomUUID()
  gardens.push({
    id: newId,
    name: nextGardenLabel(registry),
    createdAt: now,
  })
  writeRaw(personalGardenMemoriesKey(userId, newId), [])
  writeRaw(personalGardenShedKey(userId, newId), defaultStorageShedData())
  const next: PersonalGardenRegistry = {
    v: REGISTRY_VERSION,
    activeGardenId: newId,
    gardens,
  }
  writePersonalGardenRegistry(userId, next)
  return next
}