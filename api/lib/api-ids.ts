/**
 * Shared caller-id validation for Edge API routes.
 */

const USER_ID_RE = /^[a-zA-Z0-9-]{8,64}$/
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STRIPE_SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]+$/
const ENTITLEMENT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUserId(id: unknown): id is string {
  return typeof id === 'string' && USER_ID_RE.test(id)
}

export function isValidUuid(id: unknown): id is string {
  return typeof id === 'string' && UUID_RE.test(id)
}

export function isValidStripeCheckoutSessionId(id: unknown): id is string {
  return typeof id === 'string' && id.length >= 16 && id.length <= 128 && STRIPE_SESSION_RE.test(id)
}

export function isValidEntitlementId(id: unknown): id is string {
  return typeof id === 'string' && ENTITLEMENT_UUID_RE.test(id)
}

export function sanitizeShortLabel(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLen) return null
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(trimmed)) return null
  return trimmed
}
