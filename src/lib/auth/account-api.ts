import { authFetch } from './auth-fetch'
import type { StoredEntitlement } from '@/lib/payments/entitlements'

export interface AccountLinkResponse {
  neonUserId: string
  primaryLocalUserId: string
  linkedLocalUserIds: string[]
}

export async function linkLocalUserToAccount(localUserId: string): Promise<AccountLinkResponse> {
  const res = await authFetch('/api/auth/link-local', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ localUserId }),
  })
  const data = (await res.json()) as AccountLinkResponse & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not link browser profile to account')
  }
  return data
}

export async function fetchRestoredEntitlements(): Promise<{
  entitlements: StoredEntitlement[]
  updatedAt: string
}> {
  const res = await authFetch('/api/auth/restore-entitlements')
  const data = (await res.json()) as {
    entitlements?: StoredEntitlement[]
    updatedAt?: string
    error?: string
  }
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not restore purchases')
  }
  return {
    entitlements: data.entitlements ?? [],
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  }
}
