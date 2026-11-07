/**
 * Vercel Edge function — cloud sync for MemoryGarden.
 *
 * Reads/writes a per-user blob to Upstash-compatible Redis (Vercel KV).
 * Required env vars:
 *   KV_REST_API_URL
 *   KV_REST_API_TOKEN
 *
 * If either is missing the route returns 503 and the client falls back
 * to local-only mode.
 *
 * Data stored is a single JSON doc per user keyed by `mg:user:<id>`:
 *   {
 *     memories: Memory[],
 *     preferences: UserPreferences,
 *     updatedAt: ISO string
 *   }
 *
 * Last-write-wins. Photos in `Memory.photoUrl` are NOT synced — they
 * stay on each device's IndexedDB. Reflections, text, position,
 * traits, etc. all sync.
 *
 * Routes:
 *   GET  /api/sync?userId=<id>      → 200 { document } | 404 | 503
 *   POST /api/sync   { userId, document }  → 200 { updatedAt }
 */

import { isValidUserId } from './lib/api-ids'
import { validateMemory } from '../src/lib/validation'

export const config = { runtime: 'edge' }

interface SyncEnv {
  url: string
  token: string
}

function getEnv(): SyncEnv | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return { url, token }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function userKey(id: string): string {
  return `mg:user:${id}`
}

async function kvGet(env: SyncEnv, key: string): Promise<string | null> {
  const res = await fetch(`${env.url}/get/${encodeURIComponent(key)}`, {
    headers: { authorization: `Bearer ${env.token}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { result?: string | null }
  return data.result ?? null
}

async function kvSet(env: SyncEnv, key: string, value: string): Promise<boolean> {
  const res = await fetch(`${env.url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(value),
  })
  return res.ok
}

export default async function handler(req: Request): Promise<Response> {
  const env = getEnv()
  if (!env) {
    return jsonResponse(503, { error: 'Cloud sync not configured' })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    if (!isValidUserId(userId)) {
      return jsonResponse(400, { error: 'Invalid userId' })
    }
    const raw = await kvGet(env, userKey(userId))
    if (!raw) return jsonResponse(404, { error: 'No document' })
    try {
      return jsonResponse(200, { document: JSON.parse(raw) })
    } catch {
      return jsonResponse(500, { error: 'Stored document is corrupt' })
    }
  }

  if (req.method === 'POST') {
    let body: { userId?: unknown; document?: unknown }
    try {
      body = (await req.json()) as { userId?: unknown; document?: unknown }
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON' })
    }
    if (!isValidUserId(body.userId)) {
      return jsonResponse(400, { error: 'Invalid userId' })
    }
    if (!body.document || typeof body.document !== 'object') {
      return jsonResponse(400, { error: 'Document required' })
    }
    const doc = body.document as { memories?: unknown }
    if (Array.isArray(doc.memories)) {
      for (let i = 0; i < doc.memories.length; i++) {
        const checked = validateMemory(doc.memories[i])
        if (!checked.ok) {
          return jsonResponse(400, {
            error: 'Invalid memory in sync document',
            index: i,
            details: checked.errors,
          })
        }
      }
    }
    const updatedAt = new Date().toISOString()
    const payload = { ...(body.document as Record<string, unknown>), updatedAt }
    const serialized = JSON.stringify(payload)
    if (serialized.length > 1_000_000) {
      return jsonResponse(413, { error: 'Document too large' })
    }
    const ok = await kvSet(env, userKey(body.userId), serialized)
    if (!ok) return jsonResponse(502, { error: 'KV write failed' })
    return jsonResponse(200, { updatedAt })
  }

  return jsonResponse(405, { error: 'Method not allowed' })
}
