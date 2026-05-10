/**
 * Client-side wrapper for the /api/sync Edge function.
 *
 * Cloud sync is opt-in: the user toggles it from the header dropdown.
 * When enabled, this module pulls a remote document on app load and
 * pushes a debounced snapshot whenever memories or preferences change.
 *
 * Photos and audio recordings are deliberately stripped from the
 * synced payload — they live in IndexedDB on each device. The cloud
 * holds memory text, reflections, position, traits, etc.
 */

import type { Memory, UserPreferences } from '@/lib/types'

interface SyncDocument {
  memories: SyncMemory[]
  preferences: UserPreferences
  updatedAt?: string
}

type SyncMemory = Omit<Memory, 'photoUrl' | 'audioRecordings'> & {
  photoUrl?: undefined
  audioRecordings?: undefined
}

let _availabilityProbe: Promise<boolean> | null = null

/**
 * Probes the /api/sync route once per session to see whether the
 * server has KV configured. Cached so the toggle UI can show
 * disabled+tooltip without re-checking on every render.
 */
export function isSyncAvailable(): Promise<boolean> {
  if (_availabilityProbe) return _availabilityProbe
  _availabilityProbe = (async () => {
    if (typeof fetch === 'undefined') return false
    try {
      const res = await fetch('/api/sync?userId=__probe__', { method: 'GET' })
      // 400 (invalid id) means the route exists and KV is configured.
      // 503 means env vars missing. 404 wouldn't happen for the probe id.
      return res.status !== 503 && res.status !== 404
    } catch {
      return false
    }
  })()
  return _availabilityProbe
}

function stripBlobs(memories: Memory[]): SyncMemory[] {
  return memories.map(({ photoUrl: _p, audioRecordings: _a, ...rest }) => rest as SyncMemory)
}

export async function pullDocument(userId: string): Promise<SyncDocument | null> {
  const res = await fetch(`/api/sync?userId=${encodeURIComponent(userId)}`)
  if (res.status === 404 || res.status === 503) return null
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`)
  const data = (await res.json()) as { document?: SyncDocument }
  return data.document ?? null
}

export async function pushDocument(
  userId: string,
  memories: Memory[],
  preferences: UserPreferences,
): Promise<string | null> {
  const document: SyncDocument = {
    memories: stripBlobs(memories),
    preferences,
  }
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId, document }),
  })
  if (res.status === 503) return null
  if (!res.ok) throw new Error(`Push failed: ${res.status}`)
  const data = (await res.json()) as { updatedAt?: string }
  return data.updatedAt ?? null
}

/**
 * Merges a pulled document with the local memories. Local photos and
 * audio (which never made the trip to the cloud) are re-attached by
 * memory id. New memories from the cloud get empty photoUrl/audio.
 */
export function mergePulledMemories(local: Memory[], pulled: SyncMemory[]): Memory[] {
  const localById = new Map(local.map((m) => [m.id, m]))
  return pulled.map((p) => {
    const localCopy = localById.get(p.id)
    return {
      ...p,
      photoUrl: localCopy?.photoUrl ?? '',
      audioRecordings: localCopy?.audioRecordings ?? [],
    } as Memory
  })
}
