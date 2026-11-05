import type { UnlockState, PaletteId, AdornmentId, PatternId } from '@/lib/types'
import { ensureUnlockState } from '@/lib/unlock-system'
import {
  COSMETIC_PACKS,
  type PaymentSkuId,
  PAYMENT_SKUS,
  type FertilizerBoostLevel,
} from '@/lib/payments/catalog'

export type EntitlementStatus = 'active' | 'consumed'

export interface StoredEntitlement {
  id: string
  stripeSessionId: string
  sku: PaymentSkuId
  status: EntitlementStatus
  createdAt: string
  consumedAt?: string
  /** Target memory for fertilizer SKUs */
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

export function findActiveEntitlementBySession(
  list: EntitlementList,
  stripeSessionId: string,
): StoredEntitlement | undefined {
  return list.entitlements.find(
    (e) => e.stripeSessionId === stripeSessionId && e.status === 'active',
  )
}

export function findActiveFertilizerEntitlement(
  list: EntitlementList,
  memoryId: string,
  boostLevel: FertilizerBoostLevel,
): StoredEntitlement | undefined {
  const sku = boostLevel === 'premium' ? 'fertilizer-premium' : 'fertilizer-legendary'
  return list.entitlements.find(
    (e) =>
      e.status === 'active' &&
      e.sku === sku &&
      e.memoryId === memoryId,
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

export function boostLevelForEntitlement(
  entitlement: StoredEntitlement,
): FertilizerBoostLevel | null {
  const sku = PAYMENT_SKUS[entitlement.sku]
  if (!sku || sku.kind !== 'fertilizer' || !sku.boostLevel) return null
  return sku.boostLevel
}

export function applyCosmeticPackToUnlockState(
  state: UnlockState | undefined,
  packId: string,
): UnlockState {
  const pack = COSMETIC_PACKS[packId]
  const base = ensureUnlockState(state)
  if (!pack) return base

  const mergeUnique = <T extends string>(current: T[], additions: T[]): T[] =>
    [...new Set([...current, ...additions])]

  return {
    ...base,
    unlockedPalettes: mergeUnique(base.unlockedPalettes, pack.palettes as PaletteId[]),
    unlockedPatterns: mergeUnique(base.unlockedPatterns, pack.patterns as PatternId[]),
    unlockedAdornments: mergeUnique(base.unlockedAdornments, pack.adornments as AdornmentId[]),
  }
}

export function cosmeticPackIdForSku(sku: PaymentSkuId): string | null {
  const def = PAYMENT_SKUS[sku]
  if (def.kind !== 'cosmetic_pack' || !def.cosmeticPackId) return null
  return def.cosmeticPackId
}
