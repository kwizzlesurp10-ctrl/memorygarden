import type { PaymentSkuId } from './catalog'

export type EntitlementStatus = 'active' | 'consumed'

export interface StoredEntitlement {
  id: string
  stripeSessionId: string
  sku: PaymentSkuId
  status: EntitlementStatus
  createdAt: string
  consumedAt?: string
  memoryId?: string
}

export interface EntitlementList {
  entitlements: StoredEntitlement[]
  updatedAt: string
}

export function createEmptyEntitlementList(): EntitlementList {
  return { entitlements: [], updatedAt: new Date().toISOString() }
}

export function parseEntitlementList(raw: unknown): EntitlementList {
  if (!raw || typeof raw !== 'object') return createEmptyEntitlementList()
  const obj = raw as Partial<EntitlementList>
  const entitlements = Array.isArray(obj.entitlements)
    ? obj.entitlements.filter(isStoredEntitlement)
    : []
  return {
    entitlements,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
  }
}

function isStoredEntitlement(value: unknown): value is StoredEntitlement {
  if (!value || typeof value !== 'object') return false
  const e = value as Partial<StoredEntitlement>
  return (
    typeof e.id === 'string' &&
    typeof e.stripeSessionId === 'string' &&
    typeof e.sku === 'string' &&
    (e.status === 'active' || e.status === 'consumed') &&
    typeof e.createdAt === 'string'
  )
}

export function appendEntitlementIfNew(
  list: EntitlementList,
  entitlement: StoredEntitlement,
): EntitlementList {
  if (list.entitlements.some((e) => e.stripeSessionId === entitlement.stripeSessionId)) {
    return list
  }
  return {
    entitlements: [...list.entitlements, entitlement],
    updatedAt: new Date().toISOString(),
  }
}

export function markEntitlementConsumed(
  list: EntitlementList,
  entitlementId: string,
): EntitlementList {
  const now = new Date().toISOString()
  return {
    entitlements: list.entitlements.map((e) =>
      e.id === entitlementId && e.status === 'active'
        ? { ...e, status: 'consumed' as const, consumedAt: now }
        : e,
    ),
    updatedAt: now,
  }
}
