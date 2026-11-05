import type { UnlockState, PaletteId, AdornmentId, PatternId } from '../types'
import { ensureUnlockState } from '../unlock-system'
import {
  COSMETIC_PACKS,
  type PaymentSkuId,
  PAYMENT_SKUS,
  type FertilizerBoostLevel,
} from './catalog'

export type {
  EntitlementStatus,
  StoredEntitlement,
  EntitlementList,
} from '../../../api/payments/lib/entitlements'

export {
  createEmptyEntitlementList,
  parseEntitlementList,
  appendEntitlementIfNew,
  markEntitlementConsumed,
} from '../../../api/payments/lib/entitlements'

import type {
  EntitlementList,
  StoredEntitlement,
} from '../../../api/payments/lib/entitlements'

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
    (e) => e.status === 'active' && e.sku === sku && e.memoryId === memoryId,
  )
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
