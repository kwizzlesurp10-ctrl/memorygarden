import type { KvStore } from './kv-store'
import { parseUserId } from '../pair-protocol'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function userKey(id: string): string {
  return `mg:user:${id}`
}

export async function handleSyncRequest(req: Request, store: KvStore | null): Promise<Response> {
  if (!store) {
    return jsonResponse(503, { error: 'Cloud sync not configured' })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const userId = parseUserId(url.searchParams.get('userId'))
    if (!userId.ok) {
      return jsonResponse(400, { error: userId.error.message })
    }
    const raw = await store.get(userKey(userId.value))
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
    const userId = parseUserId(body.userId)
    if (!userId.ok) {
      return jsonResponse(400, { error: userId.error.message })
    }
    if (!body.document || typeof body.document !== 'object') {
      return jsonResponse(400, { error: 'Document required' })
    }
    const updatedAt = new Date().toISOString()
    const payload = { ...(body.document as Record<string, unknown>), updatedAt }
    const serialized = JSON.stringify(payload)
    if (serialized.length > 1_000_000) {
      return jsonResponse(413, { error: 'Document too large' })
    }
    const okWrite = await store.set(userKey(userId.value), serialized)
    if (!okWrite) return jsonResponse(502, { error: 'KV write failed' })
    return jsonResponse(200, { updatedAt })
  }

  return jsonResponse(405, { error: 'Method not allowed' })
}
