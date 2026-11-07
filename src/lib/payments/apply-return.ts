import {
  boostLevelForEntitlement,
  cosmeticPackIdForSku,
} from '@/lib/payments/entitlements'
import {
  consumeEntitlement,
  waitForSessionEntitlement,
} from '@/lib/payments/client'
import { PAYMENT_SKUS, type FertilizerBoostLevel } from '@/lib/payments/catalog'

export type CheckoutApplyResult =
  | { kind: 'fertilizer'; memoryId: string; boostLevel: FertilizerBoostLevel; entitlementId: string }
  | { kind: 'cosmetic_pack'; packId: string; entitlementId: string }
  | { kind: 'none' }
  | { kind: 'pending' }

export async function resolvePaidCheckoutSession(params: {
  userId: string
  sessionId: string
}): Promise<CheckoutApplyResult> {
  const entitlement = await waitForSessionEntitlement({
    userId: params.userId,
    sessionId: params.sessionId,
  })

  if (!entitlement) {
    return { kind: 'pending' }
  }

  const skuDef = PAYMENT_SKUS[entitlement.sku]
  if (skuDef.kind === 'fertilizer') {
    const boostLevel = boostLevelForEntitlement(entitlement)
    if (!boostLevel || !entitlement.memoryId) {
      return { kind: 'none' }
    }
    await consumeEntitlement({
      userId: params.userId,
      entitlementId: entitlement.id,
      stripeSessionId: params.sessionId,
    })
    return {
      kind: 'fertilizer',
      memoryId: entitlement.memoryId,
      boostLevel,
      entitlementId: entitlement.id,
    }
  }

  if (skuDef.kind === 'cosmetic_pack') {
    const packId = cosmeticPackIdForSku(entitlement.sku)
    if (!packId) return { kind: 'none' }
    await consumeEntitlement({
      userId: params.userId,
      entitlementId: entitlement.id,
      stripeSessionId: params.sessionId,
    })
    return { kind: 'cosmetic_pack', packId, entitlementId: entitlement.id }
  }

  return { kind: 'none' }
}
