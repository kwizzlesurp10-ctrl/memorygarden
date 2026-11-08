import { isValidUserId } from '../lib/api-ids'
import { linkLocalUserToNeonAccount } from '../lib/account-linking'
import { getNeonSql } from '../lib/db'
import { extractBearerToken, verifyNeonAuthJwt } from '../lib/neon-jwt'

export const config = { runtime: 'edge' }

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

  let body: { localUserId?: unknown }
  try {
    body = (await req.json()) as { localUserId?: unknown }
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' })
  }

  if (!isValidUserId(body.localUserId)) {
    return jsonResponse(400, { error: 'Invalid localUserId' })
  }

  const result = await linkLocalUserToNeonAccount(sql, session.neonUserId, body.localUserId)
  if (!result.ok) {
    return jsonResponse(result.status, { error: result.error })
  }

  return jsonResponse(200, {
    neonUserId: result.snapshot.neonUserId,
    primaryLocalUserId: result.snapshot.primaryLocalUserId,
    linkedLocalUserIds: result.snapshot.linkedLocalUserIds,
  })
}
