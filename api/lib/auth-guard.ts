import {
  extractBearerToken,
  verifyNeonAuthJwt,
  type VerifiedNeonSession,
} from './neon-jwt'
import { findNeonUserForLocalId, loadAccountLinkSnapshot, type SqlTag } from './account-linking'

export type RequestAuth =
  | { mode: 'legacy' }
  | { mode: 'verified'; session: VerifiedNeonSession; linkedLocalUserIds: string[]; primaryLocalUserId: string | null }

export async function resolveRequestAuth(
  req: Request,
  sql: SqlTag | null,
): Promise<RequestAuth | { error: Response }> {
  const token = extractBearerToken(req)
  if (!token) return { mode: 'legacy' }

  const session = await verifyNeonAuthJwt(token)
  if (!session) {
    return {
      error: new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    }
  }

  if (!sql) {
    return {
      error: new Response(JSON.stringify({ error: 'Account linking database not configured' }), {
        status: 503,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    }
  }

  const snapshot = await loadAccountLinkSnapshot(sql, session.neonUserId)
  return {
    mode: 'verified',
    session,
    linkedLocalUserIds: snapshot?.linkedLocalUserIds ?? [],
    primaryLocalUserId: snapshot?.primaryLocalUserId ?? null,
  }
}

export async function assertLocalUserIdAllowed(
  auth: RequestAuth,
  localUserId: string,
  sql: SqlTag | null,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (auth.mode === 'legacy') return { ok: true }

  if (auth.linkedLocalUserIds.includes(localUserId)) {
    return { ok: true }
  }

  if (!sql) {
    return { ok: false, status: 403, error: 'localUserId is not linked to this account' }
  }

  const owner = await findNeonUserForLocalId(sql, localUserId)
  if (owner === auth.session.neonUserId) {
    return { ok: true }
  }

  return {
    ok: false,
    status: 403,
    error: 'localUserId is not linked to this signed-in account',
  }
}
