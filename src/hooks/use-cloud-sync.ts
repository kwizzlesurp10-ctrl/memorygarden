/**
 * useCloudSync — wires memories + preferences to the cloud sync API.
 *
 * The hook is a pure side-effect: it pulls once on mount (when sync
 * is enabled and the server is reachable) and pushes a debounced
 * snapshot whenever the inputs change. Returns a status object so
 * the UI can show "Synced 2 minutes ago" or surface errors.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Memory, UserPreferences } from '@/lib/types'
import { isSyncAvailable, pullDocument, pushDocument, mergePulledMemories } from '@/lib/cloud-sync'

export type SyncStatus =
  | { kind: 'disabled' }
  | { kind: 'unavailable' }
  | { kind: 'idle'; lastSyncAt: string | null }
  | { kind: 'syncing' }
  | { kind: 'error'; message: string }

interface Options {
  enabled: boolean
  userId: string
  memories: Memory[]
  preferences: UserPreferences
  onPulled: (memories: Memory[], preferences: UserPreferences) => void
}

const PUSH_DEBOUNCE_MS = 1500

export function useCloudSync(opts: Options): SyncStatus {
  const { enabled, userId, memories, preferences, onPulled } = opts
  const [status, setStatus] = useState<SyncStatus>({ kind: 'disabled' })
  const memoriesRef = useRef(memories)
  const pullDoneRef = useRef(false)

  useLayoutEffect(() => {
    memoriesRef.current = memories
  }, [memories])

  // Probe availability + pull initial document on enable.
  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => {
        setStatus({ kind: 'disabled' })
        pullDoneRef.current = false
      })
      return
    }
    let cancelled = false
    void (async () => {
      const available = await isSyncAvailable()
      if (cancelled) return
      if (!available) {
        setStatus({ kind: 'unavailable' })
        return
      }
      setStatus({ kind: 'syncing' })
      try {
        const doc = await pullDocument(userId)
        if (cancelled) return
        if (doc) {
          const merged = mergePulledMemories(memoriesRef.current, doc.memories)
          onPulled(merged, doc.preferences)
        }
        pullDoneRef.current = true
        setStatus({ kind: 'idle', lastSyncAt: doc?.updatedAt ?? null })
      } catch (err) {
        setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Pull failed' })
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId])

  // Debounced push whenever data changes — but only after the initial
  // pull has settled, so we don't blow away the cloud copy with an
  // empty local snapshot.
  useEffect(() => {
    if (!enabled || !pullDoneRef.current) return
    if (status.kind !== 'idle' && status.kind !== 'error') return
    const handle = setTimeout(() => {
      void (async () => {
        setStatus({ kind: 'syncing' })
        try {
          const updatedAt = await pushDocument(userId, memories, preferences)
          setStatus({ kind: 'idle', lastSyncAt: updatedAt })
        } catch (err) {
          setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Push failed' })
        }
      })()
    }, PUSH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, memories, preferences, userId])

  return status
}
