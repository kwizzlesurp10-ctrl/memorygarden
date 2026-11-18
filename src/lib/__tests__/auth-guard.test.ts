import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertLocalUserIdAllowed } from '../../../api/lib/auth-guard'

describe('assertLocalUserIdAllowed', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows any valid user id in legacy mode when auth cutover is off', async () => {
    vi.stubEnv('NEON_AUTH_BASE_URL', '')
    const result = await assertLocalUserIdAllowed({ mode: 'legacy' }, 'abcdefghijklmnop', null)
    expect(result.ok).toBe(true)
  })

  it('rejects legacy mode when auth cutover is on', async () => {
    vi.stubEnv('NEON_AUTH_BASE_URL', 'https://auth.example.com')
    const result = await assertLocalUserIdAllowed({ mode: 'legacy' }, 'abcdefghijklmnop', null)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(401)
  })

  it('denies unrelated local ids for verified sessions', async () => {
    const result = await assertLocalUserIdAllowed(
      {
        mode: 'verified',
        session: { neonUserId: '860dc360-609f-4b7d-9e70-ec93fe6414d3' },
        linkedLocalUserIds: ['abcdefghijklmnop'],
        primaryLocalUserId: 'abcdefghijklmnop',
      },
      'zzzzzzzzzzzzzzzz',
      null,
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(403)
  })

  it('allows linked local ids for verified sessions', async () => {
    const localId = 'abcdefghijklmnop'
    const result = await assertLocalUserIdAllowed(
      {
        mode: 'verified',
        session: { neonUserId: '860dc360-609f-4b7d-9e70-ec93fe6414d3' },
        linkedLocalUserIds: [localId],
        primaryLocalUserId: localId,
      },
      localId,
      null,
    )
    expect(result.ok).toBe(true)
  })
})
