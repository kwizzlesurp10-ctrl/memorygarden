import { isValidUserId } from './api-ids'
import type { RequestAuth } from './auth-guard'

/** Production cutover: verified Neon Auth required for sync writes and payments. */
export function isServerAuthCutoverEnabled(): boolean {
  return Boolean(process.env.NEON_AUTH_BASE_URL?.trim())
}

export type ResolvedLocalUserId =
  | { ok: true; userId: string; source: 'session' | 'legacy_client' }
  | { ok: false; status: number; error: string }

/**
 * Resolves the KV user id for sync and payments.
 * When cutover is enabled, userId is always the signed-in account's primary linked local id.
 */
export function resolveLocalUserIdForProtectedRoute(
  auth: RequestAuth,
  clientUserId: string | null | undefined,
): ResolvedLocalUserId {
  const cutover = isServerAuthCutoverEnabled()

  if (cutover) {
    if (auth.mode !== 'verified') {
      return { ok: false, status: 401, error: 'Sign-in required' }
    }
    const userId = auth.primaryLocalUserId
    if (!userId || !isValidUserId(userId)) {
      return {
        ok: false,
        status: 403,
        error: 'Link this browser profile to your account before continuing',
      }
    }
    if (clientUserId && clientUserId !== userId) {
      return { ok: false, status: 403, error: 'userId does not match signed-in account' }
    }
    return { ok: true, userId, source: 'session' }
  }

  if (auth.mode === 'verified') {
    const primary = auth.primaryLocalUserId
    if (clientUserId && isValidUserId(clientUserId)) {
      if (
        auth.linkedLocalUserIds.includes(clientUserId) ||
        clientUserId === primary
      ) {
        return { ok: true, userId: clientUserId, source: 'session' }
      }
      return { ok: false, status: 403, error: 'userId is not linked to this signed-in account' }
    }
    if (primary && isValidUserId(primary)) {
      return { ok: true, userId: primary, source: 'session' }
    }
  }

  if (!clientUserId || !isValidUserId(clientUserId)) {
    return { ok: false, status: 400, error: 'Invalid userId' }
  }
  return { ok: true, userId: clientUserId, source: 'legacy_client' }
}