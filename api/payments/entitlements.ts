import { createEmptyEntitlementList, parseEntitlementList } from './lib/entitlements'
import { getKvEnv, isValidUserId, readEntitlementsRaw } from './lib/kv'

export const config = { runtime: 'edge' }

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const kv = getKvEnv()
  if (!kv) {
    return jsonResponse(503, { error: 'Entitlement storage is not configured' })
  }

  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  const sessionId = url.searchParams.get('sessionId')

  if (!isValidUserId(userId)) {
    return jsonResponse(400, { error: 'Invalid userId' })
  }

  const raw = await readEntitlementsRaw(kv, userId)
  const list = raw ? parseEntitlementList(JSON.parse(raw)) : createEmptyEntitlementList()

  let entitlements = list.entitlements
  if (sessionId) {
    entitlements = entitlements.filter((e) => e.stripeSessionId === sessionId)
  }

  return jsonResponse(200, {
    entitlements,
    updatedAt: list.updatedAt,
  })
}
