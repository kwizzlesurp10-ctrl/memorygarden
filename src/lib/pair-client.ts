import { err, ok, type Result } from './result'
import type { Memory, UserPreferences } from './types'
import { unionMemoriesByRecency, type PairRoom } from './pair-protocol'

export type PairClientError = {
  status: number
  message: string
  revision?: number
}

type SyncMemory = Omit<Memory, 'photoUrl' | 'audioRecordings'> & {
  photoUrl?: undefined
  audioRecordings?: undefined
}

export type PairDocumentPayload = {
  memories: SyncMemory[]
  preferences: UserPreferences
}

function stripBlobs(memories: Memory[]): SyncMemory[] {
  return memories.map(({ photoUrl: _p, audioRecordings: _a, ...rest }) => rest as SyncMemory)
}

async function readJson(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}))
}

function failFromResponse(res: Response, body: unknown): PairClientError {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const message =
    typeof record.message === 'string'
      ? record.message
      : typeof record.error === 'string'
        ? record.error
        : `Pair request failed: ${res.status}`
  const revision = typeof record.revision === 'number' ? record.revision : undefined
  return { status: res.status, message, revision }
}

export function isPairAvailable(): Promise<boolean> {
  return (async () => {
    if (typeof fetch === 'undefined') return false
    try {
      const res = await fetch('/api/pair?code=______', { method: 'GET' })
      return res.status !== 503 && res.status !== 404
    } catch {
      return false
    }
  })()
}

export async function createPairRoom(
  userId: string,
  memories: Memory[],
  preferences: UserPreferences,
): Promise<Result<PairRoom, PairClientError>> {
  const res = await fetch('/api/pair', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      userId,
      document: { memories: stripBlobs(memories), preferences },
    }),
  })
  const body = await readJson(res)
  if (!res.ok) return err(failFromResponse(res, body))
  const room = (body as { room?: PairRoom }).room
  if (!room) return err({ status: 500, message: 'Create succeeded without a room' })
  return ok(room)
}

export async function joinPairRoom(
  userId: string,
  code: string,
): Promise<Result<PairRoom, PairClientError>> {
  const res = await fetch('/api/pair', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'join', userId, code }),
  })
  const body = await readJson(res)
  if (!res.ok) return err(failFromResponse(res, body))
  const room = (body as { room?: PairRoom }).room
  if (!room) return err({ status: 500, message: 'Join succeeded without a room' })
  return ok(room)
}

export async function pullPairRoom(code: string): Promise<Result<PairRoom | null, PairClientError>> {
  const res = await fetch(`/api/pair?code=${encodeURIComponent(code)}`)
  if (res.status === 404) return ok(null)
  const body = await readJson(res)
  if (!res.ok) return err(failFromResponse(res, body))
  const room = (body as { room?: PairRoom }).room
  return ok(room ?? null)
}

export async function pushPairRoom(
  userId: string,
  code: string,
  revision: number,
  memories: Memory[],
  preferences: UserPreferences,
): Promise<Result<PairRoom, PairClientError>> {
  const res = await fetch('/api/pair', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      action: 'push',
      userId,
      code,
      revision,
      document: { memories: stripBlobs(memories), preferences } satisfies PairDocumentPayload,
    }),
  })
  const body = await readJson(res)
  if (!res.ok) return err(failFromResponse(res, body))
  const room = (body as { room?: PairRoom }).room
  if (!room) return err({ status: 500, message: 'Push succeeded without a room' })
  return ok(room)
}

export function mergePairMemories(local: Memory[], pulled: unknown[]): Memory[] {
  const remote = pulled as Memory[]
  return unionMemoriesByRecency(local, remote).map((memory) => {
    const localCopy = local.find((m) => m.id === memory.id)
    return {
      ...memory,
      photoUrl: memory.photoUrl || localCopy?.photoUrl || '',
      audioRecordings:
        (memory.audioRecordings && memory.audioRecordings.length > 0
          ? memory.audioRecordings
          : localCopy?.audioRecordings) ?? [],
    }
  })
}
