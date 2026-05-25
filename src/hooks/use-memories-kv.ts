/**
 * useMemoriesKV — drop-in replacement for `useKV<Memory[]>` that keeps
 * large blobs (photos, audio recordings) out of localStorage by
 * persisting them to IndexedDB and storing only `idb://<id>` references
 * in the serialized array.
 *
 * The hook materializes references back into data URLs in-memory, so
 * the rest of the app sees the same `Memory.photoUrl` and
 * `Memory.audioRecordings[].dataUrl` shapes they always have.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Memory, AudioRecording } from '@/lib/types'
import { getBlob, putBlob, isBlobRef, deleteBlob } from '@/lib/blob-store'
import { readRaw, writeRaw } from '@/lib/storage'

type Updater = Memory[] | ((current: Memory[]) => Memory[])

function audioBlobKey(memoryId: string, recordingId: string): string {
  return `${memoryId}:audio:${recordingId}`
}

async function materializeAudio(
  memoryId: string,
  recordings: AudioRecording[] | undefined,
): Promise<AudioRecording[] | undefined> {
  if (!recordings || recordings.length === 0) return recordings
  return Promise.all(
    recordings.map(async (r) => {
      if (!isBlobRef(r.dataUrl)) return r
      const resolved = await getBlob(r.dataUrl)
      return { ...r, dataUrl: resolved ?? '' }
    }),
  )
}

async function persistAudio(
  memoryId: string,
  recordings: AudioRecording[] | undefined,
): Promise<AudioRecording[] | undefined> {
  if (!recordings || recordings.length === 0) return recordings
  return Promise.all(
    recordings.map(async (r) => {
      const ref = await putBlob(audioBlobKey(memoryId, r.id), r.dataUrl)
      return { ...r, dataUrl: ref }
    }),
  )
}

async function materialize(memories: Memory[]): Promise<Memory[]> {
  return Promise.all(
    memories.map(async (m) => {
      const photoUrl = isBlobRef(m.photoUrl) ? ((await getBlob(m.photoUrl)) ?? '') : m.photoUrl
      const audioRecordings = await materializeAudio(m.id, m.audioRecordings)
      return { ...m, photoUrl, audioRecordings: audioRecordings ?? m.audioRecordings }
    }),
  )
}

async function persist(key: string, prev: Memory[], next: Memory[]): Promise<Memory[]> {
  const persisted = await Promise.all(
    next.map(async (m) => {
      const photoUrl = await putBlob(m.id, m.photoUrl)
      const audioRecordings = await persistAudio(m.id, m.audioRecordings)
      return { ...m, photoUrl, audioRecordings: audioRecordings ?? m.audioRecordings }
    }),
  )

  // Best-effort cleanup of blobs belonging to removed memories or
  // audio recordings the user has deleted.
  const nextById = new Map(next.map((m) => [m.id, m]))
  for (const old of prev) {
    const survivor = nextById.get(old.id)
    if (!survivor) {
      if (isBlobRef(old.photoUrl)) void deleteBlob(old.photoUrl)
      for (const r of old.audioRecordings ?? []) {
        if (isBlobRef(r.dataUrl)) void deleteBlob(r.dataUrl)
      }
      continue
    }
    const survivingAudioIds = new Set((survivor.audioRecordings ?? []).map((r) => r.id))
    for (const r of old.audioRecordings ?? []) {
      if (!survivingAudioIds.has(r.id) && isBlobRef(r.dataUrl)) {
        void deleteBlob(r.dataUrl)
      }
    }
  }

  writeRaw(key, persisted)
  return persisted
}

export function useMemoriesKV(
  scopedKey: string,
  defaultValue: Memory[] = [],
): [Memory[], (updater: Updater) => void, { hydrated: boolean }] {
  const initial = readRaw<Memory[]>(scopedKey) ?? defaultValue
  const [state, setState] = useState<Memory[]>(initial)
  const [hydrated, setHydrated] = useState(false)
  const stateRef = useRef<Memory[]>(initial)
  useLayoutEffect(() => {
    stateRef.current = state
  }, [state])

  // On mount: materialize blob refs from IDB into the in-memory copy.
  useEffect(() => {
    let cancelled = false
    void materialize(initial).then((resolved) => {
      if (cancelled) return
      stateRef.current = resolved
      setState(resolved)
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedKey])

  const setMemories = useCallback(
    (updater: Updater) => {
      const prev = stateRef.current
      const next = typeof updater === 'function' ? (updater as (c: Memory[]) => Memory[])(prev) : updater
      // Optimistic update so the UI is responsive.
      stateRef.current = next
      setState(next)
      void persist(scopedKey, prev, next).catch(() => {
        // Persistence errors are silent — same as the old useKV behavior.
      })
    },
    [scopedKey],
  )

  return [state, setMemories, { hydrated }]
}
