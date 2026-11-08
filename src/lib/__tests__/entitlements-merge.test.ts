import { describe, expect, it } from 'vitest'
import { mergeEntitlementLists } from '../../../api/payments/lib/entitlements-merge'
import { createEmptyEntitlementList, type StoredEntitlement } from '@/lib/payments/entitlements'

function ent(id: string, status: 'active' | 'consumed'): StoredEntitlement {
  return {
    id,
    sku: 'cosmetic-starlight-pack',
    status,
    stripeSessionId: 'cs_test_abc',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('mergeEntitlementLists', () => {
  it('dedupes by entitlement id and prefers active over consumed', () => {
    const a = createEmptyEntitlementList()
    a.entitlements = [ent('11111111-1111-4111-8111-111111111111', 'consumed')]
    const b = createEmptyEntitlementList()
    b.entitlements = [ent('11111111-1111-4111-8111-111111111111', 'active')]
    const merged = mergeEntitlementLists([a, b])
    expect(merged.entitlements).toHaveLength(1)
    expect(merged.entitlements[0]?.status).toBe('active')
  })
})
