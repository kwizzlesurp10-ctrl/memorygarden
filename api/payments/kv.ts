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

export function isValidUserId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(id)
}

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
  const data = (await res.json()) as { result?: string | null }
  return data.result ?? null
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
