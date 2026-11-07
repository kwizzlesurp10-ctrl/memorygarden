import { createEmptyEntitlementList, parseEntitlementList } from './lib/entitlements'
import { validateEntitlementsQuery } from './lib/entitlements-access'
import { getKvEnv, readEntitlementsRaw } from './lib/kv'

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

  const validated = validateEntitlementsQuery({ userId, sessionId })
  if (!validated.ok) {
    return jsonResponse(validated.status, { error: validated.error })
  }

  const raw = await readEntitlementsRaw(kv, userId as string)
  const list = raw ? parseEntitlementList(JSON.parse(raw)) : createEmptyEntitlementList()
  const entitlements = list.entitlements.filter((e) => e.stripeSessionId === sessionId)

  return jsonResponse(200, {
    entitlements,
    updatedAt: list.updatedAt,
  })
}
