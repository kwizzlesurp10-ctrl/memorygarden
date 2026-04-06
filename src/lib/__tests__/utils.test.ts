import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('merges multiple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters falsy values', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts – last wins', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('handles conditional objects', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })

  it('handles arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('returns empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })
})
