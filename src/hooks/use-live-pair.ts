/**
 * useLivePair — two gardeners share one garden document through /api/pair.
 *
 * Polls while a pair code is set. Pushes a debounced snapshot after local
 * edits. On 409 conflict, pulls, unions memories by recency, then retries.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Memory, UserPreferences } from '@/lib/types'
import {
  createPairRoom,
  isPairAvailable,
  joinPairRoom,
  mergePairMemories,
  pullPairRoom,
  pushPairRoom,
} from '@/lib/pair-client'
import type { PairRoom } from '@/lib/pair-protocol'
import { err, ok, type Result } from '@/lib/result'

export type LivePairStatus =
  | { kind: 'idle' }
  | { kind: 'unavailable' }
  | { kind: 'connecting' }
  | { kind: 'live'; code: string; revision: number; lastSyncAt: string }
  | { kind: 'error'; message: string }

interface Options {
  code: string | null
  userId: string
  memories: Memory[]
  preferences: UserPreferences
  onPulled: (memories: Memory[], preferences: UserPreferences) => void
}

const PUSH_DEBOUNCE_MS = 900
const POLL_MS = 2000

export async function startLivePair(
  userId: string,
  memories: Memory[],
  preferences: UserPreferences,
): Promise<Result<PairRoom, string>> {
  const available = await isPairAvailable()
  if (!available) return err('Live pair is not available in this environment')
  const created = await createPairRoom(userId, memories, preferences)
  return created.ok ? ok(created.value) : err(created.error.message)
}

export async function enterLivePair(userId: string, code: string): Promise<Result<PairRoom, string>> {
  const available = await isPairAvailable()
  if (!available) return err('Live pair is not available in this environment')
  const joined = await joinPairRoom(userId, code)
  return joined.ok ? ok(joined.value) : err(joined.error.message)
}

export function useLivePair(opts: Options): LivePairStatus {
  const { code, userId, memories, preferences, onPulled } = opts
  const [status, setStatus] = useState<LivePairStatus>({ kind: 'idle' })
  const memoriesRef = useRef(memories)
  const preferencesRef = useRef(preferences)
  const revisionRef = useRef(0)
  const onPulledRef = useRef(onPulled)
  const liveRef = useRef(false)

  useLayoutEffect(() => {
    memoriesRef.current = memories
    preferencesRef.current = preferences
    onPulledRef.current = onPulled
  }, [memories, preferences, onPulled])

  useEffect(() => {
    if (!code) {
      queueMicrotask(() => setStatus({ kind: 'idle' }))
      revisionRef.current = 0
      liveRef.current = false
      return
    }

    let cancelled = false
    liveRef.current = false
    queueMicrotask(() => {
      if (!cancelled) setStatus({ kind: 'connecting' })
    })

    const applyRoom = (room: PairRoom) => {
      revisionRef.current = room.revision
      liveRef.current = true
      const merged = mergePairMemories(memoriesRef.current, room.memories)
      const prefs = (room.preferences as UserPreferences | null) ?? preferencesRef.current
      onPulledRef.current(merged, { ...prefs, livePairCode: code })
      setStatus({ kind: 'live', code, revision: room.revision, lastSyncAt: room.updatedAt })
    }

    void (async () => {
      const available = await isPairAvailable()
      if (cancelled) return
      if (!available) {
        setStatus({ kind: 'unavailable' })
        return
      }
      const pulled = await pullPairRoom(code)
      if (cancelled) return
      if (!pulled.ok) {
        setStatus({ kind: 'error', message: pulled.error.message })
        return
      }
      if (!pulled.value) {
        setStatus({ kind: 'error', message: 'That pair garden could not be found' })
        return
      }
      applyRoom(pulled.value)
    })()

    const poll = window.setInterval(() => {
      void (async () => {
        const pulled = await pullPairRoom(code)
        if (cancelled || !pulled.ok || !pulled.value) return
        if (pulled.value.revision === revisionRef.current) return
        applyRoom(pulled.value)
      })()
    }, POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [code, userId])

  useEffect(() => {
    if (!code || !liveRef.current) return
    const handle = window.setTimeout(() => {
      void (async () => {
        const pushed = await pushPairRoom(
          userId,
          code,
          revisionRef.current,
          memories,
          preferences,
        )
        if (pushed.ok) {
          revisionRef.current = pushed.value.revision
          setStatus({
            kind: 'live',
            code,
            revision: pushed.value.revision,
            lastSyncAt: pushed.value.updatedAt,
          })
          return
        }
        if (pushed.error.status === 409) {
          const pulled = await pullPairRoom(code)
          if (!pulled.ok || !pulled.value) return
          const merged = mergePairMemories(memoriesRef.current, pulled.value.memories)
          onPulledRef.current(merged, {
            ...((pulled.value.preferences as UserPreferences | null) ?? preferencesRef.current),
            livePairCode: code,
          })
          revisionRef.current = pulled.value.revision
          const retry = await pushPairRoom(userId, code, pulled.value.revision, merged, preferencesRef.current)
          if (retry.ok) {
            revisionRef.current = retry.value.revision
            setStatus({
              kind: 'live',
              code,
              revision: retry.value.revision,
              lastSyncAt: retry.value.updatedAt,
            })
          }
          return
        }
        setStatus({ kind: 'error', message: pushed.error.message })
      })()
    }, PUSH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [code, memories, preferences, userId])

  return status
}
