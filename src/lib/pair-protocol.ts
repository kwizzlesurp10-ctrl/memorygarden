import { z } from 'zod'
import { err, ok, type Result } from './result'
import type { UserPreferences } from './types'

export const PAIR_CODE_PATTERN = /^[A-Z0-9]{6}$/
export const PAIR_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const pairUserIdSchema = z.string().regex(/^[a-zA-Z0-9-]{8,64}$/)

export const pairDocumentSchema = z.object({
  memories: z.array(z.unknown()),
  preferences: z.unknown().optional(),
})

export type PairDocument = {
  memories: unknown[]
  preferences?: unknown
}

export type PairRoom = {
  code: string
  hostUserId: string
  guestUserIds: string[]
  memories: unknown[]
  preferences: unknown | null
  revision: number
  updatedAt: string
}

export type PairError =
  | { code: 'invalid_code'; message: string }
  | { code: 'invalid_user'; message: string }
  | { code: 'not_found'; message: string }
  | { code: 'conflict'; message: string; revision: number }
  | { code: 'too_large'; message: string }

const MAX_SERIALIZED_BYTES = 1_000_000

export function generatePairCode(random: () => number = Math.random): string {
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    const index = Math.floor(random() * PAIR_CODE_ALPHABET.length)
    code += PAIR_CODE_ALPHABET[index]
  }
  return code
}

export function normalizePairCode(raw: string): Result<string, PairError> {
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!PAIR_CODE_PATTERN.test(code)) {
    return err({ code: 'invalid_code', message: 'Pair code must be 6 letters or digits' })
  }
  return ok(code)
}

export function parseUserId(raw: unknown): Result<string, PairError> {
  const parsed = pairUserIdSchema.safeParse(raw)
  if (!parsed.success) {
    return err({ code: 'invalid_user', message: 'Invalid userId' })
  }
  return ok(parsed.data)
}

export function createPairRoom(input: {
  code: string
  hostUserId: string
  document?: PairDocument
  now?: string
}): PairRoom {
  return {
    code: input.code,
    hostUserId: input.hostUserId,
    guestUserIds: [],
    memories: input.document?.memories ?? [],
    preferences: input.document?.preferences ?? null,
    revision: 1,
    updatedAt: input.now ?? new Date().toISOString(),
  }
}

export function joinPairRoom(room: PairRoom, userId: string): PairRoom {
  if (userId === room.hostUserId || room.guestUserIds.includes(userId)) {
    return room
  }
  return {
    ...room,
    guestUserIds: [...room.guestUserIds, userId],
  }
}

export function applyPairPush(
  room: PairRoom,
  input: {
    userId: string
    revision: number
    document: PairDocument
    now?: string
  },
): Result<PairRoom, PairError> {
  if (input.revision !== room.revision) {
    return err({
      code: 'conflict',
      message: 'Stale revision — pull and merge before pushing',
      revision: room.revision,
    })
  }

  const next: PairRoom = {
    ...joinPairRoom(room, input.userId),
    memories: input.document.memories,
    preferences: input.document.preferences ?? room.preferences,
    revision: room.revision + 1,
    updatedAt: input.now ?? new Date().toISOString(),
  }

  const serialized = JSON.stringify(next)
  if (serialized.length > MAX_SERIALIZED_BYTES) {
    return err({ code: 'too_large', message: 'Pair document is too large' })
  }

  return ok(next)
}

export type TimedMemory = {
  id: string
  lastVisited?: string
  plantedAt?: string
  photoUrl?: string
  audioRecordings?: unknown[]
}

/**
 * Union two memory lists by id. Newer lastVisited (fallback plantedAt) wins.
 * Local blobs (photoUrl, audio) are preserved when the winner is missing them.
 */
export function unionMemoriesByRecency<T extends TimedMemory>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>()

  const stamp = (m: T): number => {
    const raw = m.lastVisited || m.plantedAt || ''
    const t = Date.parse(raw)
    return Number.isFinite(t) ? t : 0
  }

  const merge = (a: T, b: T): T => {
    const newer = stamp(a) >= stamp(b) ? a : b
    const older = newer === a ? b : a
    return {
      ...newer,
      photoUrl: newer.photoUrl || older.photoUrl,
      audioRecordings:
        (Array.isArray(newer.audioRecordings) && newer.audioRecordings.length > 0
          ? newer.audioRecordings
          : older.audioRecordings) ?? [],
    }
  }

  for (const m of remote) map.set(m.id, m)
  for (const m of local) {
    const existing = map.get(m.id)
    map.set(m.id, existing ? merge(m, existing) : m)
  }
  return [...map.values()]
}

export function pairRoomKey(code: string): string {
  return `mg:pair:${code}`
}

export type PairPreferences = Pick<UserPreferences, 'hasCompletedOnboarding' | 'soundEnabled' | 'lastVisit'> &
  Partial<UserPreferences>
