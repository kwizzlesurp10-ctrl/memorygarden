import { z } from 'zod'
import {
  createEmptyEntitlementList,
  markEntitlementConsumed,
  parseEntitlementList,
} from './lib/entitlements'
import { resolveRequestAuth } from '../lib/auth-guard'
import { resolveLocalUserIdForProtectedRoute } from '../lib/session-user-id'
import { getNeonSql } from '../lib/db'
import { isValidStripeCheckoutSessionId } from '../lib/api-ids'
import { getKvEnv, readEntitlementsRaw, writeEntitlementsRaw } from './lib/kv'

export const config = { runtime: 'edge' }

const bodySchema = z.object({
  userId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  entitlementId: z.string().uuid(),
  /** Optional for backward compatibility with clients deployed before session proof */
  stripeSessionId: z.string().min(16).max(128).optional(),
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  const sql = getNeonSql()
  const authResult = await resolveRequestAuth(req, sql)
  if ('error' in authResult) return authResult.error
  const identity = resolveLocalUserIdForProtectedRoute(authResult, parsed.userId)
  if (!identity.ok) return jsonResponse(identity.status, { error: identity.error })
  const userId = identity.userId
  if (
    parsed.stripeSessionId != null &&
    !isValidStripeCheckoutSessionId(parsed.stripeSessionId)
  ) {
    return jsonResponse(400, { error: 'Invalid stripeSessionId' })
  }

  const raw = await readEntitlementsRaw(kv, userId)
  const list = raw ? parseEntitlementList(JSON.parse(raw)) : createEmptyEntitlementList()
  const target = list.entitlements.find((e) => e.id === parsed.entitlementId)
  if (!target) {
    return jsonResponse(404, { error: 'Entitlement not found' })
  }
  if (parsed.stripeSessionId != null && target.stripeSessionId !== parsed.stripeSessionId) {
    return jsonResponse(403, { error: 'stripeSessionId does not match entitlement' })
  }
  if (target.status === 'consumed') {
    return jsonResponse(200, { ok: true, alreadyConsumed: true })
  }

  const updated = markEntitlementConsumed(list, parsed.entitlementId)
  const saved = await writeEntitlementsRaw(kv, userId, JSON.stringify(updated))
  if (!saved) {
    return jsonResponse(500, { error: 'Failed to update entitlement' })
  }

  return jsonResponse(200, { ok: true })
}
