import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'
import { getNeonAuthUrl, isNeonAuthConfigured } from './config'

export type MemoryGardenAuthClient = ReturnType<typeof createAuthClient>

let client: MemoryGardenAuthClient | null = null

export function getAuthClient(): MemoryGardenAuthClient | null {
  if (!isNeonAuthConfigured()) return null
  if (client) return client
  const baseUrl = getNeonAuthUrl()
  if (!baseUrl) return null
  client = createAuthClient(baseUrl, {
    adapter: BetterAuthReactAdapter({
      fetchOptions: { credentials: 'include' },
    }),
  })
  return client
}
