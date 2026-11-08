import {
  applyCosmeticPackToUnlockState,
  cosmeticPackIdForSku,
  type StoredEntitlement,
} from '@/lib/payments/entitlements'
import type { UnlockState } from '@/lib/types'
import { ensureUnlockState } from '@/lib/unlock-system'
import { fetchRestoredEntitlements } from './account-api'
import { isNeonAuthConfigured } from './config'
import { getNeonAuthBearerToken } from './session-token'

export function applyRestoredEntitlementsToUnlockState(
  state: UnlockState | undefined,
  entitlements: StoredEntitlement[],
): UnlockState {
  let next = ensureUnlockState(state)
  for (const ent of entitlements) {
    if (ent.status !== 'active' && ent.status !== 'consumed') continue
    const packId = cosmeticPackIdForSku(ent.sku)
    if (packId) {
      next = applyCosmeticPackToUnlockState(next, packId)
    }
  }
  return next
}

export async function restorePurchasesForSignedInUser(): Promise<StoredEntitlement[]> {
  if (!isNeonAuthConfigured()) return []
  const token = await getNeonAuthBearerToken()
  if (!token) return []
  const { entitlements } = await fetchRestoredEntitlements()
  return entitlements
}
