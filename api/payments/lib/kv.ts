interface SyncEnv {
  url: string
  token: string
}

export function getKvEnv(): SyncEnv | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return { url, token }
}

export { isValidUserId } from '../../lib/api-ids'

function entitlementsKey(userId: string): string {
  return `mg:entitlements:${userId}`
}

function stripeEventKey(eventId: string): string {
  return `mg:stripe:event:${eventId}`
}

export async function kvGet(env: SyncEnv, key: string): Promise<string | null> {
  const res = await fetch(`${env.url}/get/${encodeURIComponent(key)}`, {
    headers: { authorization: `Bearer ${env.token}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { result?: unknown }
  const result = data.result
  if (result == null) return null
  if (typeof result !== 'string') return JSON.stringify(result)
  // kvSet JSON.stringifies the value, so a JSON document is stored as a string.
  // Unwrap once so callers can JSON.parse the document itself.
  try {
    const once = JSON.parse(result) as unknown
    if (typeof once === 'string') return once
  } catch {
    // result is already plain text, such as the event marker "1"
  }
  return result
}

export async function kvSet(env: SyncEnv, key: string, value: string): Promise<boolean> {
  const res = await fetch(`${env.url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(value),
  })
  return res.ok
}

export async function readEntitlementsRaw(env: SyncEnv, userId: string): Promise<string | null> {
  return kvGet(env, entitlementsKey(userId))
}

export async function writeEntitlementsRaw(env: SyncEnv, userId: string, value: string): Promise<boolean> {
  return kvSet(env, entitlementsKey(userId), value)
}

export async function hasProcessedStripeEvent(env: SyncEnv, eventId: string): Promise<boolean> {
  const raw = await kvGet(env, stripeEventKey(eventId))
  return raw === '1'
}

export async function markStripeEventProcessed(env: SyncEnv, eventId: string): Promise<void> {
  await kvSet(env, stripeEventKey(eventId), '1')
}
