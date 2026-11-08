import { describe, expect, it } from 'vitest'
import { assertLocalUserIdAllowed } from '../../../api/lib/auth-guard'

describe('assertLocalUserIdAllowed', () => {
  it('allows any valid user id in legacy mode', async () => {
    const result = await assertLocalUserIdAllowed({ mode: 'legacy' }, 'abcdefghijklmnop', null)
    expect(result.ok).toBe(true)
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
