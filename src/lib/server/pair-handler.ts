import { z } from 'zod'
import type { KvStore } from './kv-store'
import {
  applyPairPush,
  createPairRoom,
  generatePairCode,
  joinPairRoom,
  normalizePairCode,
  parseUserId,
  pairDocumentSchema,
  pairRoomKey,
  type PairRoom,
} from '../pair-protocol'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

async function readRoom(store: KvStore, code: string): Promise<PairRoom | null> {
  const raw = await store.get(pairRoomKey(code))
  if (!raw) return null
  try {
    return JSON.parse(raw) as PairRoom
  } catch {
    return null
  }
}

async function writeRoom(store: KvStore, room: PairRoom): Promise<boolean> {
  return store.set(pairRoomKey(room.code), JSON.stringify(room))
}

const createBodySchema = z.object({
  action: z.literal('create'),
  userId: z.string(),
  document: pairDocumentSchema.optional(),
})

const joinBodySchema = z.object({
  action: z.literal('join'),
  userId: z.string(),
  code: z.string(),
})

const pushBodySchema = z.object({
  action: z.literal('push'),
  userId: z.string(),
  code: z.string(),
  revision: z.number().int().nonnegative(),
  document: pairDocumentSchema,
})

export async function handlePairRequest(req: Request, store: KvStore | null): Promise<Response> {
  if (!store) {
    return jsonResponse(503, { error: 'Live pair not configured' })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const codeResult = normalizePairCode(url.searchParams.get('code') ?? '')
    if (!codeResult.ok) {
      return jsonResponse(400, { error: codeResult.error.message })
    }
    const room = await readRoom(store, codeResult.value)
    if (!room) return jsonResponse(404, { error: 'No pair room' })
    return jsonResponse(200, { room })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' })
  }

  if (!raw || typeof raw !== 'object' || !('action' in raw)) {
    return jsonResponse(400, { error: 'action required' })
  }

  const action = (raw as { action: unknown }).action

  if (action === 'create') {
    const parsed = createBodySchema.safeParse(raw)
    if (!parsed.success) {
      return jsonResponse(400, { error: parsed.error.issues[0]?.message ?? 'Invalid create body' })
    }
    const userId = parseUserId(parsed.data.userId)
    if (!userId.ok) return jsonResponse(400, { error: userId.error.message })

    let code = generatePairCode()
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const existing = await readRoom(store, code)
      if (!existing) break
      code = generatePairCode()
    }

    const room = createPairRoom({
      code,
      hostUserId: userId.value,
      document: parsed.data.document,
    })
    const written = await writeRoom(store, room)
    if (!written) return jsonResponse(502, { error: 'KV write failed' })
    return jsonResponse(200, { room })
  }

  if (action === 'join') {
    const parsed = joinBodySchema.safeParse(raw)
    if (!parsed.success) {
      return jsonResponse(400, { error: parsed.error.issues[0]?.message ?? 'Invalid join body' })
    }
    const userId = parseUserId(parsed.data.userId)
    if (!userId.ok) return jsonResponse(400, { error: userId.error.message })
    const code = normalizePairCode(parsed.data.code)
    if (!code.ok) return jsonResponse(400, { error: code.error.message })

    const room = await readRoom(store, code.value)
    if (!room) return jsonResponse(404, { error: 'No pair room' })
    const next = joinPairRoom(room, userId.value)
    const written = await writeRoom(store, next)
    if (!written) return jsonResponse(502, { error: 'KV write failed' })
    return jsonResponse(200, { room: next })
  }

  if (action === 'push') {
    const parsed = pushBodySchema.safeParse(raw)
    if (!parsed.success) {
      return jsonResponse(400, { error: parsed.error.issues[0]?.message ?? 'Invalid push body' })
    }
    const userId = parseUserId(parsed.data.userId)
    if (!userId.ok) return jsonResponse(400, { error: userId.error.message })
    const code = normalizePairCode(parsed.data.code)
    if (!code.ok) return jsonResponse(400, { error: code.error.message })

    const room = await readRoom(store, code.value)
    if (!room) return jsonResponse(404, { error: 'No pair room' })

    const applied = applyPairPush(room, {
      userId: userId.value,
      revision: parsed.data.revision,
      document: parsed.data.document,
    })
    if (!applied.ok) {
      const status = applied.error.code === 'conflict' ? 409 : applied.error.code === 'too_large' ? 413 : 400
      return jsonResponse(status, applied.error)
    }
    const written = await writeRoom(store, applied.value)
    if (!written) return jsonResponse(502, { error: 'KV write failed' })
    return jsonResponse(200, { room: applied.value })
  }

  return jsonResponse(400, { error: 'Unknown action' })
}
