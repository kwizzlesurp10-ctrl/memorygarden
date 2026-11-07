/**
 * Best-effort LLM rate limiting using the same Vercel KV store as sync/payments.
 * When KV is not configured, requests are allowed (documented limitation).
 */

interface KvEnv {
  url: string
  token: string
}

const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 60

function getKvEnv(): KvEnv | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return { url, token }
}

function rateLimitKey(clientKey: string, windowId: number): string {
  return `mg:llm:rate:${clientKey}:${windowId}`
}

function hashClientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || req.headers.get('x-real-ip') || 'anonymous'
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    hash = (hash * 31 + ip.charCodeAt(i)) >>> 0
  }
  return hash.toString(36)
}

async function kvGet(env: KvEnv, key: string): Promise<string | null> {
  const res = await fetch(`${env.url}/get/${encodeURIComponent(key)}`, {
    headers: { authorization: `Bearer ${env.token}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { result?: string | null }
  return data.result ?? null
}

async function kvSet(env: KvEnv, key: string, value: string): Promise<void> {
  await fetch(`${env.url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(value),
  })
}

export async function assertLlmRateLimit(req: Request): Promise<Response | null> {
  const env = getKvEnv()
  if (!env) return null

  const windowId = Math.floor(Date.now() / WINDOW_MS)
  const clientKey = hashClientKey(req)
  const key = rateLimitKey(clientKey, windowId)

  const raw = await kvGet(env, key)
  const count = raw ? Number.parseInt(raw, 10) : 0
  if (Number.isFinite(count) && count >= MAX_REQUESTS_PER_WINDOW) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  await kvSet(env, key, String((Number.isFinite(count) ? count : 0) + 1))
  return null
}
