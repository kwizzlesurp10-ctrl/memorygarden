import { getAuthClient } from './neon-auth-client'
import { isNeonAuthConfigured } from './config'

export async function getNeonAuthBearerToken(): Promise<string | null> {
  if (!isNeonAuthConfigured()) return null
  const authClient = getAuthClient()
  if (!authClient) return null
  let token: string | null = null
  try {
    const { error } = await authClient.getSession({
      fetchOptions: {
        onSuccess(ctx) {
          token = ctx.response.headers.get('set-auth-jwt')
        },
      },
    })
    if (error) return null
    return token
  } catch {
    return null
  }
}
