import { linkLocalUserToAccount } from './account-api'
import type { StoredEntitlement } from '@/lib/payments/entitlements'
import { restorePurchasesForSignedInUser } from './restore-purchases'

export async function completeSignInLinking(localUserId: string): Promise<StoredEntitlement[]> {
  await linkLocalUserToAccount(localUserId)
  return restorePurchasesForSignedInUser()
}
