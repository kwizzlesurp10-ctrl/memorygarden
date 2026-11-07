import { isValidStripeCheckoutSessionId, isValidUserId } from '../../lib/api-ids'
import type { EntitlementList } from './entitlements'

export interface EntitlementsQueryInput {
  userId: string | null
  sessionId: string | null
}

export type EntitlementsQueryResult =
  | { ok: true; entitlements: EntitlementList['entitlements'] }
  | { ok: false; status: number; error: string }

export function validateEntitlementsQuery(
  input: EntitlementsQueryInput,
): { ok: true } | { ok: false; status: number; error: string } {
  if (!isValidUserId(input.userId)) {
    return { ok: false, status: 400, error: 'Invalid userId' }
  }
  if (!input.sessionId || !isValidStripeCheckoutSessionId(input.sessionId)) {
    return {
      ok: false,
      status: 400,
      error: 'sessionId is required (Stripe Checkout session from your purchase)',
    }
  }
  return { ok: true }
}

export function resolveEntitlementsForQuery(
  input: EntitlementsQueryInput,
  list: EntitlementList,
): EntitlementsQueryResult {
  const valid = validateEntitlementsQuery(input)
  if (!valid.ok) return valid
  const entitlements = list.entitlements.filter((e) => e.stripeSessionId === input.sessionId)
  return { ok: true, entitlements }
}
