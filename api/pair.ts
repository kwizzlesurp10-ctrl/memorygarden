/**
 * Vercel Edge function — live pair rooms for two gardeners on one garden.
 *
 * Reuses the same KV as /api/sync. In local Vite, an in-memory store is used
 * so two browser tabs on the same dev server can pair without Upstash.
 *
 *   GET  /api/pair?code=ABC123
 *   POST /api/pair  { action: 'create' | 'join' | 'push', ... }
 */

import { handlePairRequest } from '../src/lib/server/pair-handler'
import { kvFromEnv } from '../src/lib/server/kv-store'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  return handlePairRequest(req, kvFromEnv())
}
