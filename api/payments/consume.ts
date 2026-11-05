import { z } from 'zod'
import {
  createEmptyEntitlementList,
  markEntitlementConsumed,
  parseEntitlementList,
} from '../../src/lib/payments/entitlements'
import { getKvEnv, isValidUserId, readEntitlementsRaw, writeEntitlementsRaw } from './kv'

export const config = { runtime: 'edge' }

const bodySchema = z.object({
  userId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  entitlementId: z.string().uuid(),
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const kv = getKvEnv()
  if (!kv) {
    return jsonResponse(503, { error: 'Entitlement storage is not configured' })
  }

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch (err) {
    const message = err instanceof z.ZodError ? err.issues[0]?.message : 'Invalid body'
    return jsonResponse(400, { error: message ?? 'Invalid body' })
  }

  if (!isValidUserId(parsed.userId)) {
    return jsonResponse(400, { error: 'Invalid userId' })
  }

  const raw = await readEntitlementsRaw(kv, parsed.userId)
  const list = raw ? parseEntitlementList(JSON.parse(raw)) : createEmptyEntitlementList()
  const target = list.entitlements.find((e) => e.id === parsed.entitlementId)
  if (!target) {
    return jsonResponse(404, { error: 'Entitlement not found' })
  }
  if (target.status === 'consumed') {
    return jsonResponse(200, { ok: true, alreadyConsumed: true })
  }

  const updated = markEntitlementConsumed(list, parsed.entitlementId)
  const saved = await writeEntitlementsRaw(kv, parsed.userId, JSON.stringify(updated))
  if (!saved) {
    return jsonResponse(500, { error: 'Failed to update entitlement' })
  }

  return jsonResponse(200, { ok: true })
}
