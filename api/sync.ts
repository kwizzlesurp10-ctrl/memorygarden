/**
 * Vercel Edge function — cloud sync for MemoryGarden.
 *
 * Required env vars (Upstash-compatible Redis / Vercel KV):
 *   KV_REST_API_URL
 *   KV_REST_API_TOKEN
 *
 * If either is missing the route returns 503 and the client stays local-only.
 */

import { handleSyncRequest } from '../src/lib/server/sync-handler'
import { kvFromEnv } from '../src/lib/server/kv-store'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  return handleSyncRequest(req, kvFromEnv())
}
