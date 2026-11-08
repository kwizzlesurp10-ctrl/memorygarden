import { describe, expect, it } from 'vitest'
import { applyRestoredEntitlementsToUnlockState } from '@/lib/auth/restore-purchases'
import { createDefaultUnlockState } from '@/lib/unlock-system'
import type { StoredEntitlement } from '@/lib/payments/entitlements'

describe('applyRestoredEntitlementsToUnlockState', () => {
  it('applies cosmetic pack unlocks from stored entitlements', () => {
    const entitlements: StoredEntitlement[] = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        sku: 'cosmetic-starlight-pack',
        status: 'consumed',
        stripeSessionId: 'cs_test_abc',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    const next = applyRestoredEntitlementsToUnlockState(createDefaultUnlockState(), entitlements)
    expect(next.unlockedPalettes.length).toBeGreaterThan(createDefaultUnlockState().unlockedPalettes.length)
  })
})
