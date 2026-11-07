import { describe, expect, it } from 'vitest'
import {
  isValidEntitlementId,
  isValidStripeCheckoutSessionId,
  isValidUserId,
  isValidUuid,
  sanitizeShortLabel,
} from '../../../api/lib/api-ids'

describe('api-ids', () => {
  const userId = 'abcdefghijklmnop'
  const uuid = '11111111-1111-4111-8111-111111111111'

  it('accepts canonical user ids', () => {
    expect(isValidUserId(userId)).toBe(true)
    expect(isValidUserId('short')).toBe(false)
  })

  it('validates UUID v4-ish garden and memory ids', () => {
    expect(isValidUuid(uuid)).toBe(true)
    expect(isValidUuid('not-a-uuid')).toBe(false)
  })

  it('validates Stripe checkout session ids', () => {
    expect(isValidStripeCheckoutSessionId('cs_test_abc123XYZ')).toBe(true)
    expect(isValidStripeCheckoutSessionId('pi_not_checkout')).toBe(false)
  })

  it('validates entitlement ids as UUIDs', () => {
    expect(isValidEntitlementId(uuid)).toBe(true)
    expect(isValidEntitlementId('legacy-id')).toBe(false)
  })

  it('sanitizes display labels', () => {
    expect(sanitizeShortLabel('  Alice  ', 64)).toBe('Alice')
    expect(sanitizeShortLabel('\u0001bad', 64)).toBe(null)
    expect(sanitizeShortLabel('x'.repeat(100), 64)).toBe(null)
  })
})
