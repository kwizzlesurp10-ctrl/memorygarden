import { describe, expect, it } from 'vitest'
import { err, isOk, ok, unwrapOr } from '../result'

describe('Result', () => {
  it('wraps success and failure', () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 })
    expect(err('nope')).toEqual({ ok: false, error: 'nope' })
  })

  it('narrows with isOk', () => {
    const result = ok('garden')
    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.value).toBe('garden')
    }
  })

  it('unwrapOr returns the value or fallback', () => {
    expect(unwrapOr(ok(1), 9)).toBe(1)
    expect(unwrapOr(err('x'), 9)).toBe(9)
  })
})
