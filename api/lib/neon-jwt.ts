import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

export interface VerifiedNeonSession {
  neonUserId: string
  email?: string
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null
let cachedJwksBaseUrl: string | null = null

export function getNeonAuthBaseUrl(): string | null {
  const base = process.env.NEON_AUTH_BASE_URL?.trim()
  return base || null
}

export function getNeonAuthOrigin(baseUrl: string): string {
  return new URL(baseUrl).origin
}

function getJwks(baseUrl: string) {
  if (cachedJwks && cachedJwksBaseUrl === baseUrl) return cachedJwks
  const jwksUrl =
    process.env.NEON_AUTH_JWKS_URL?.trim() || `${baseUrl.replace(/\/$/, '')}/.well-known/jwks.json`
  cachedJwks = createRemoteJWKSet(new URL(jwksUrl))
  cachedJwksBaseUrl = baseUrl
  return cachedJwks
}

export function neonUserIdFromPayload(payload: JWTPayload): string | null {
  const id = payload.sub ?? payload.id
  if (typeof id !== 'string' || id.length === 0) return null
  return id
}

export async function verifyNeonAuthJwt(token: string): Promise<VerifiedNeonSession | null> {
  const baseUrl = getNeonAuthBaseUrl()
  if (!baseUrl) return null
  try {
    const origin = getNeonAuthOrigin(baseUrl)
    const { payload } = await jwtVerify(token, getJwks(baseUrl), {
      algorithms: ['EdDSA'],
      issuer: origin,
      audience: origin,
    })
    const neonUserId = neonUserIdFromPayload(payload)
    if (!neonUserId) return null
    const email = typeof payload.email === 'string' ? payload.email : undefined
    return { neonUserId, email }
  } catch {
    return null
  }
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}
