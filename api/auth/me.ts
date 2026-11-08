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

  const snapshot = await loadAccountLinkSnapshot(sql, session.neonUserId)
  return jsonResponse(200, {
    neonUserId: session.neonUserId,
    email: session.email ?? null,
    primaryLocalUserId: snapshot?.primaryLocalUserId ?? null,
    linkedLocalUserIds: snapshot?.linkedLocalUserIds ?? [],
  })
}
