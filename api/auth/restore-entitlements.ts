import { readMergedEntitlementsForLocalIds } from '../payments/lib/entitlements-merge'
import { getKvEnv } from '../payments/lib/kv'
import { loadAccountLinkSnapshot } from '../lib/account-linking'
import { getNeonSql } from '../lib/db'
import { extractBearerToken, verifyNeonAuthJwt } from '../lib/neon-jwt'

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
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization',
      },
    })
  }

  if (req.method !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const token = extractBearerToken(req)
  if (!token) {
    return jsonResponse(401, { error: 'Authorization required' })
  }

  const session = await verifyNeonAuthJwt(token)
  if (!session) {
    return jsonResponse(401, { error: 'Invalid or expired session' })
  }

  const sql = getNeonSql()
  if (!sql) {
    return jsonResponse(503, { error: 'Account linking database not configured' })
  }

  const kv = getKvEnv()
  if (!kv) {
    return jsonResponse(503, { error: 'Entitlement storage is not configured' })
  }

  const snapshot = await loadAccountLinkSnapshot(sql, session.neonUserId)
  const localIds = snapshot?.linkedLocalUserIds ?? []
  if (localIds.length === 0) {
    return jsonResponse(200, { entitlements: [], updatedAt: new Date().toISOString() })
  }

  const merged = await readMergedEntitlementsForLocalIds(kv, localIds)
  return jsonResponse(200, merged)
}
