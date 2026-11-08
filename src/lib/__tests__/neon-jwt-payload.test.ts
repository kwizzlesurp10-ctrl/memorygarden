import { describe, expect, it } from 'vitest'
import { neonUserIdFromPayload } from '../../../api/lib/neon-jwt'

describe('neonUserIdFromPayload', () => {
  it('reads sub claim', () => {
    expect(neonUserIdFromPayload({ sub: 'user-1' })).toBe('user-1')
  })

  it('falls back to id claim', () => {
    expect(neonUserIdFromPayload({ id: 'user-2' })).toBe('user-2')
  })
})
