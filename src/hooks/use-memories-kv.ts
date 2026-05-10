/**
 * useMemoriesKV — drop-in replacement for `useKV<Memory[]>` that keeps
 * photo bytes out of localStorage by persisting them to IndexedDB and
 * storing only `idb://<id>` references in the serialized array.
 *
 * The hook materializes references back into data URLs in-memory, so
 * the rest of the app sees the same `Memory.photoUrl` shape it always
 * has. Persistence happens through the existing localStorage layer.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Memory } from '@/lib/types'
import { getPhoto, putPhoto, isPhotoRef, deletePhoto } from '@/lib/photo-store'
import { readRaw, writeRaw } from '@/lib/storage'

type Updater = Memory[] | ((current: Memory[]) => Memory[])

async function materialize(memories: Memory[]): Promise<Memory[]> {
  return Promise.all(
    memories.map(async (m) => {
      if (!isPhotoRef(m.photoUrl)) return m
      const resolved = await getPhoto(m.photoUrl)
      return { ...m, photoUrl: resolved ?? '' }
    }),
  )
}

async function persist(key: string, prev: Memory[], next: Memory[]): Promise<Memory[]> {
  const prevById = new Map(prev.map((m) => [m.id, m]))
  const persisted = await Promise.all(
    next.map(async (m) => {
      const photoRef = await putPhoto(m.id, m.photoUrl)
      return { ...m, photoUrl: photoRef }
    }),
  )
  // Best-effort cleanup of photos belonging to removed memories.
  const nextIds = new Set(next.map((m) => m.id))
  for (const old of prevById.values()) {
    if (!nextIds.has(old.id) && isPhotoRef(old.photoUrl)) {
      void deletePhoto(old.photoUrl)
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
  stateRef.current = state

  // On mount: materialize photo refs from IDB into the in-memory copy.
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
