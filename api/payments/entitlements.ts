import { assertLocalUserIdAllowed, resolveRequestAuth } from '../lib/auth-guard'
import { getNeonSql } from '../lib/db'
import { createEmptyEntitlementList, parseEntitlementList } from './lib/entitlements'
import { resolveEntitlementsForQuery } from './lib/entitlements-access'
import { getKvEnv, readEntitlementsRaw } from './lib/kv'

export const config = { runtime: 'edge' }

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization',
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

  const sql = getNeonSql()
  const authResult = await resolveRequestAuth(req, sql)
  if ('error' in authResult) return authResult.error

  const pre = resolveEntitlementsForQuery({ userId, sessionId }, createEmptyEntitlementList())
  if (!pre.ok) {
    return jsonResponse(pre.status, { error: pre.error })
  }

  const gate = await assertLocalUserIdAllowed(authResult, userId as string, sql)
  if (!gate.ok) return jsonResponse(gate.status, { error: gate.error })

  const raw = await readEntitlementsRaw(kv, userId as string)
  const list = raw ? parseEntitlementList(JSON.parse(raw)) : createEmptyEntitlementList()
  const resolved = resolveEntitlementsForQuery({ userId, sessionId }, list)
  if (!resolved.ok) {
    return jsonResponse(resolved.status, { error: resolved.error })
  }

  return jsonResponse(200, {
    entitlements: resolved.entitlements,
    updatedAt: list.updatedAt,
  })
}
