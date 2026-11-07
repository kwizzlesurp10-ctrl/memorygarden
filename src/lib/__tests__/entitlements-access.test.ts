import { describe, expect, it } from 'vitest'
import {
  resolveEntitlementsForQuery,
  validateEntitlementsQuery,
} from '../../../api/payments/lib/entitlements-access'
import { createEmptyEntitlementList, type StoredEntitlement } from '@/lib/payments/entitlements'

const userId = 'abcdefghijklmnop'
const sessionA = 'cs_test_sessAAAAAAAAAA'
const sessionB = 'cs_test_sessBBBBBBBBBB'

function entitlement(partial: Partial<StoredEntitlement>): StoredEntitlement {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    sku: 'cosmetic-starlight-pack',
    status: 'active',
    stripeSessionId: sessionA,
    createdAt: new Date().toISOString(),
    ...partial,
  }
}

describe('entitlements-access', () => {
  it('allows userId-only lookup for backward compatibility', () => {
    const result = validateEntitlementsQuery({ userId, sessionId: null })
    expect(result.ok).toBe(true)
  })

  it('returns all entitlements when sessionId is omitted', () => {
    const list = createEmptyEntitlementList()
    list.entitlements = [
      entitlement({ stripeSessionId: sessionA }),
      entitlement({
        id: '22222222-2222-4222-8222-222222222222',
        stripeSessionId: sessionB,
      }),
    ]
    const resolved = resolveEntitlementsForQuery({ userId, sessionId: null }, list)
    expect(resolved.ok).toBe(true)
    if (resolved.ok) {
      expect(resolved.entitlements).toHaveLength(2)
    }
  })

  it('rejects invalid session id format when provided', () => {
    const result = validateEntitlementsQuery({ userId, sessionId: 'not_a_session' })
    expect(result.ok).toBe(false)
  })

  it('filters entitlements when sessionId is provided', () => {
    const list = createEmptyEntitlementList()
    list.entitlements = [
      entitlement({ stripeSessionId: sessionA }),
      entitlement({
        id: '22222222-2222-4222-8222-222222222222',
        stripeSessionId: sessionB,
      }),
    ]
    const resolved = resolveEntitlementsForQuery({ userId, sessionId: sessionA }, list)
    expect(resolved.ok).toBe(true)
    if (resolved.ok) {
      expect(resolved.entitlements).toHaveLength(1)
      expect(resolved.entitlements[0]?.stripeSessionId).toBe(sessionA)
    }
  })
})
