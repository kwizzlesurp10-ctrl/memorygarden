import { authFetch } from '@/lib/auth/auth-fetch'
import type { PaymentSkuId } from '@/lib/payments/catalog'
import type { StoredEntitlement } from '@/lib/payments/entitlements'

export interface CreateCheckoutSessionRequest {
  userId: string
  sku: PaymentSkuId
  memoryId?: string
  /** Path-only return location, e.g. `/` or `/garden` */
  returnPath?: string
}

export interface CreateCheckoutSessionResponse {
  url: string
  sessionId: string
}

export interface EntitlementsResponse {
  entitlements: StoredEntitlement[]
  updatedAt: string
}

export async function createCheckoutSession(
  body: CreateCheckoutSessionRequest,
): Promise<CreateCheckoutSessionResponse> {
  const res = await authFetch('/api/payments/create-checkout-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { url?: string; sessionId?: string; error?: string }
  if (!res.ok || !data.url || !data.sessionId) {
    throw new Error(data.error ?? 'Could not start checkout')
  }
  return { url: data.url, sessionId: data.sessionId }
}

export async function fetchEntitlements(params: {
  userId: string
  sessionId?: string
}): Promise<EntitlementsResponse> {
  const search = new URLSearchParams({ userId: params.userId })
  if (params.sessionId) search.set('sessionId', params.sessionId)
  const res = await authFetch(`/api/payments/entitlements?${search.toString()}`)
  const data = (await res.json()) as EntitlementsResponse & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not load entitlements')
  }
  return data
}

export async function consumeEntitlement(params: {
  userId: string
  entitlementId: string
  stripeSessionId: string
}): Promise<void> {
  const res = await authFetch('/api/payments/consume', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = (await res.json()) as { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? 'Could not consume entitlement')
  }
}

export async function redirectToCheckout(body: CreateCheckoutSessionRequest): Promise<void> {
  const { url } = await createCheckoutSession(body)
  window.location.assign(url)
}

export async function waitForSessionEntitlement(params: {
  userId: string
  sessionId: string
  attempts?: number
  delayMs?: number
}): Promise<StoredEntitlement | null> {
  const attempts = params.attempts ?? 12
  const delayMs = params.delayMs ?? 1500
  for (let i = 0; i < attempts; i += 1) {
    const { entitlements } = await fetchEntitlements({
      userId: params.userId,
      sessionId: params.sessionId,
    })
    const match = entitlements.find((e) => e.stripeSessionId === params.sessionId && e.status === 'active')
    if (match) return match
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return null
}
