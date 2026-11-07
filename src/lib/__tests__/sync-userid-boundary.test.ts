import { describe, expect, it } from 'vitest'

/** Mirrors api/sync.ts and api/payments/lib/kv.ts validation. */
function isValidUserId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(id)
}

describe('sync/payments userId boundary', () => {
  it('accepts browser-local UUIDs', () => {
    expect(isValidUserId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(true)
  })

  it('rejects short or injected ids', () => {
    expect(isValidUserId('short')).toBe(false)
    expect(isValidUserId('../etc/passwd')).toBe(false)
    expect(isValidUserId('')).toBe(false)
  })

  it('does not authenticate ownership — caller supplies id only', () => {
    // Documented limitation: server trusts any well-formed userId until a real identity layer is added.
    expect(isValidUserId('attacker-supplied-id-12345678')).toBe(true)
  })
})
