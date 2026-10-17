export interface KvStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<boolean>
}

export function createMemoryKv(initial?: Map<string, string>): KvStore {
  const map = initial ?? new Map<string, string>()
  return {
    async get(key: string): Promise<string | null> {
      return map.get(key) ?? null
    },
    async set(key: string, value: string): Promise<boolean> {
      map.set(key, value)
      return true
    },
  }
}

export function createUpstashKv(url: string, token: string): KvStore {
  const base = url.replace(/\/$/, '')
  return {
    async get(key: string): Promise<string | null> {
      const res = await fetch(`${base}/get/${encodeURIComponent(key)}`, {
        headers: { authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      const data = (await res.json()) as { result?: string | null }
      return data.result ?? null
    },
    async set(key: string, value: string): Promise<boolean> {
      const res = await fetch(`${base}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(value),
      })
      return res.ok
    },
  }
}

export function kvFromEnv(env: Record<string, string | undefined> = process.env): KvStore | null {
  const url = env.KV_REST_API_URL
  const token = env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return createUpstashKv(url, token)
}
