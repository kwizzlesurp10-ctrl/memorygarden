import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isServerAuthCutoverEnabled,
  resolveLocalUserIdForProtectedRoute,
} from '../../../api/lib/session-user-id'
import type { RequestAuth } from '../../../api/lib/auth-guard'

const verified: RequestAuth = {
  mode: 'verified',
  session: { neonUserId: '860dc360-609f-4b7d-9e70-ec93fe6414d3' },
  linkedLocalUserIds: ['abcdefghijklmnop'],
  primaryLocalUserId: 'abcdefghijklmnop',
}

describe('session-user-id', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects spoofed userId when auth cutover is enabled', () => {
    vi.stubEnv('NEON_AUTH_BASE_URL', 'https://auth.example.com')
    expect(isServerAuthCutoverEnabled()).toBe(true)

    const withoutToken = resolveLocalUserIdForProtectedRoute({ mode: 'legacy' }, 'abcdefghijklmnop')
    expect(withoutToken.ok).toBe(false)
    if (!withoutToken.ok) expect(withoutToken.status).toBe(401)

    const spoofed = resolveLocalUserIdForProtectedRoute(verified, 'attacker-supplied-id-12345678')
    expect(spoofed.ok).toBe(false)
    if (!spoofed.ok) expect(spoofed.status).toBe(403)
  })

  it('derives userId from session when cutover is enabled', () => {
    vi.stubEnv('NEON_AUTH_BASE_URL', 'https://auth.example.com')
    const resolved = resolveLocalUserIdForProtectedRoute(verified, 'abcdefghijklmnop')
    expect(resolved).toEqual({ ok: true, userId: 'abcdefghijklmnop', source: 'session' })

    const omitted = resolveLocalUserIdForProtectedRoute(verified, null)
    expect(omitted).toEqual({ ok: true, userId: 'abcdefghijklmnop', source: 'session' })
  })

  it('allows legacy client userId when cutover is disabled', () => {
    vi.stubEnv('NEON_AUTH_BASE_URL', '')
    const resolved = resolveLocalUserIdForProtectedRoute({ mode: 'legacy' }, 'abcdefghijklmnop')
    expect(resolved).toEqual({ ok: true, userId: 'abcdefghijklmnop', source: 'legacy_client' })
  })
})