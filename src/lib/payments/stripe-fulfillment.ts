import {
  isPaymentSkuId,
  PAYMENT_SKUS,
  type PaymentSkuId,
} from './catalog'
import {
  appendEntitlementIfNew,
  type EntitlementList,
  type StoredEntitlement,
} from './entitlements'

export function shouldFulfillCheckoutSession(
  eventType: string,
  paymentStatus: string | null | undefined,
): boolean {
  if (eventType !== 'checkout.session.completed' && eventType !== 'checkout.session.async_payment_succeeded') {
    return false
  }
  return paymentStatus === 'paid'
}

export interface CheckoutSessionMetadata {
  userId: string
  sku: PaymentSkuId
  memoryId?: string
}

export function parseCheckoutSessionMetadata(
  metadata: Record<string, string> | null | undefined,
): CheckoutSessionMetadata | null {
  if (!metadata) return null
  const userId = metadata.userId?.trim()
  const skuRaw = metadata.sku?.trim()
  if (!userId || !skuRaw || !isPaymentSkuId(skuRaw)) return null
  const memoryId = metadata.memoryId?.trim()
  const skuDef = PAYMENT_SKUS[skuRaw]
  if (skuDef.kind === 'fertilizer' && !memoryId) return null
  return { userId, sku: skuRaw, memoryId: memoryId || undefined }
}

export function buildEntitlementFromCheckout(params: {
  stripeSessionId: string
  metadata: CheckoutSessionMetadata
}): StoredEntitlement {
  return {
    id: crypto.randomUUID(),
    stripeSessionId: params.stripeSessionId,
    sku: params.metadata.sku,
    status: 'active',
    createdAt: new Date().toISOString(),
    memoryId: params.metadata.memoryId,
  }
}

export function fulfillCheckoutIntoEntitlements(
  list: EntitlementList,
  stripeSessionId: string,
  metadata: CheckoutSessionMetadata,
): EntitlementList {
  const entitlement = buildEntitlementFromCheckout({ stripeSessionId, metadata })
  return appendEntitlementIfNew(list, entitlement)
}
