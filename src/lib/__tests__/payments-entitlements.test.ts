import { describe, expect, it } from 'vitest'
import {
  shouldFulfillCheckoutSession,
  parseCheckoutSessionMetadata,
  fulfillCheckoutIntoEntitlements,
} from '@/lib/payments/stripe-fulfillment'
import {
  applyCosmeticPackToUnlockState,
  createEmptyEntitlementList,
  findActiveFertilizerEntitlement,
} from '@/lib/payments/entitlements'
import { createDefaultUnlockState } from '@/lib/unlock-system'
import { isPaidFertilizerLevel, skuForFertilizerLevel } from '@/lib/payments/catalog'

describe('shouldFulfillCheckoutSession', () => {
  it('fulfills completed sessions only when paid', () => {
    expect(shouldFulfillCheckoutSession('checkout.session.completed', 'paid')).toBe(true)
    expect(shouldFulfillCheckoutSession('checkout.session.completed', 'unpaid')).toBe(false)
    expect(shouldFulfillCheckoutSession('checkout.session.completed', null)).toBe(false)
  })

  it('fulfills async success when paid', () => {
    expect(shouldFulfillCheckoutSession('checkout.session.async_payment_succeeded', 'paid')).toBe(
      true,
    )
    expect(shouldFulfillCheckoutSession('checkout.session.async_payment_succeeded', 'unpaid')).toBe(
      false,
    )
  })

  it('ignores unrelated events', () => {
    expect(shouldFulfillCheckoutSession('payment_intent.succeeded', 'paid')).toBe(false)
  })
})

describe('parseCheckoutSessionMetadata', () => {
  it('requires memoryId for fertilizer SKUs', () => {
    expect(
      parseCheckoutSessionMetadata({
        userId: 'abc12345-aaaa-bbbb-cccc-ddddeeeeffff',
        sku: 'fertilizer-premium',
        memoryId: '',
      }),
    ).toBeNull()
  })

  it('accepts cosmetic pack without memoryId', () => {
    const parsed = parseCheckoutSessionMetadata({
      userId: 'abc12345-aaaa-bbbb-cccc-ddddeeeeffff',
      sku: 'cosmetic-starlight-pack',
      memoryId: '',
    })
    expect(parsed?.sku).toBe('cosmetic-starlight-pack')
  })
})

describe('entitlement storage helpers', () => {
  it('dedupes by stripe session id', () => {
    const base = createEmptyEntitlementList()
    const first = fulfillCheckoutIntoEntitlements(base, 'cs_test_1', {
      userId: 'user-12345678',
      sku: 'cosmetic-starlight-pack',
    })
    const second = fulfillCheckoutIntoEntitlements(first, 'cs_test_1', {
      userId: 'user-12345678',
      sku: 'cosmetic-starlight-pack',
    })
    expect(second.entitlements).toHaveLength(1)
  })

  it('finds active fertilizer entitlement for memory', () => {
    const list = fulfillCheckoutIntoEntitlements(createEmptyEntitlementList(), 'cs_test_2', {
      userId: 'user-12345678',
      sku: 'fertilizer-legendary',
      memoryId: 'memory-abc',
    })
    const match = findActiveFertilizerEntitlement(list, 'memory-abc', 'legendary')
    expect(match?.sku).toBe('fertilizer-legendary')
  })
})

describe('applyCosmeticPackToUnlockState', () => {
  it('merges starlight pack unlocks without removing defaults', () => {
    const next = applyCosmeticPackToUnlockState(createDefaultUnlockState(), 'starlight')
    expect(next.unlockedPalettes).toContain('earthy')
    expect(next.unlockedPalettes).toContain('midnight')
    expect(next.unlockedAdornments).toContain('fireflies')
    expect(next.unlockedPatterns).toContain('gradient')
  })
})

describe('fertilizer SKU mapping', () => {
  it('marks premium and legendary as paid', () => {
    expect(isPaidFertilizerLevel('standard')).toBe(false)
    expect(isPaidFertilizerLevel('premium')).toBe(true)
    expect(skuForFertilizerLevel('premium')).toBe('fertilizer-premium')
  })
})
