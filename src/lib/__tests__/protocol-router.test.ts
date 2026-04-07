import { describe, it, expect } from 'vitest'
import { parseProtocolUrl, resolveFromLocation, buildProtocolUrl, type ProtocolAction } from '../protocol-router'

// ── parseProtocolUrl ────────────────────────────────────────────────────────

describe('parseProtocolUrl', () => {
  it('parses web+plantmemory:// with data', () => {
    expect(parseProtocolUrl('web+plantmemory://some-data')).toEqual({
      type: 'plant-memory',
      data: 'some-data',
    })
  })

  it('parses web+plantmemory:// without data', () => {
    expect(parseProtocolUrl('web+plantmemory://')).toEqual({
      type: 'plant-memory',
      data: undefined,
    })
  })

  it('parses web+viewmemory:// with id', () => {
    expect(parseProtocolUrl('web+viewmemory://memory-123')).toEqual({
      type: 'view-memory',
      id: 'memory-123',
    })
  })

  it('returns none for web+viewmemory:// without id', () => {
    expect(parseProtocolUrl('web+viewmemory://')).toEqual({ type: 'none' })
  })

  it('parses web+memorygarden:// paths', () => {
    expect(parseProtocolUrl('web+memorygarden://settings')).toEqual({
      type: 'garden',
      path: 'settings',
    })
  })

  it('returns none for empty string', () => {
    expect(parseProtocolUrl('')).toEqual({ type: 'none' })
  })

  it('returns none for unrecognized scheme', () => {
    expect(parseProtocolUrl('https://example.com')).toEqual({ type: 'none' })
  })

  it('handles encoded characters in data', () => {
    const encoded = 'web+plantmemory://' + encodeURIComponent('hello world')
    expect(parseProtocolUrl(encoded)).toEqual({
      type: 'plant-memory',
      data: 'hello world',
    })
  })

  it('handles encoded characters in memory id', () => {
    const encoded = 'web+viewmemory://' + encodeURIComponent('id-with spaces')
    expect(parseProtocolUrl(encoded)).toEqual({
      type: 'view-memory',
      id: 'id-with spaces',
    })
  })

  it('returns none for null/undefined', () => {
    expect(parseProtocolUrl(null as unknown as string)).toEqual({ type: 'none' })
    expect(parseProtocolUrl(undefined as unknown as string)).toEqual({ type: 'none' })
  })
})

// ── resolveFromLocation ─────────────────────────────────────────────────────

describe('resolveFromLocation', () => {
  it('resolves /plant path to plant-memory action', () => {
    const url = new URL('http://localhost/plant')
    expect(resolveFromLocation(url)).toEqual({ type: 'plant-memory', data: undefined })
  })

  it('resolves /plant?data=xyz to plant-memory with data', () => {
    const url = new URL('http://localhost/plant?data=xyz')
    expect(resolveFromLocation(url)).toEqual({ type: 'plant-memory', data: 'xyz' })
  })

  it('resolves /memory?id=abc to view-memory action', () => {
    const url = new URL('http://localhost/memory?id=abc')
    expect(resolveFromLocation(url)).toEqual({ type: 'view-memory', id: 'abc' })
  })

  it('returns none for /memory without id', () => {
    const url = new URL('http://localhost/memory')
    expect(resolveFromLocation(url)).toEqual({ type: 'none' })
  })

  it('resolves /handle?protocol=web+plantmemory:// via redirect', () => {
    const protocol = encodeURIComponent('web+plantmemory://data')
    const url = new URL(`http://localhost/handle?protocol=${protocol}`)
    expect(resolveFromLocation(url)).toEqual({ type: 'plant-memory', data: 'data' })
  })

  it('resolves /handle?protocol=web+viewmemory://id via redirect', () => {
    const protocol = encodeURIComponent('web+viewmemory://memory-42')
    const url = new URL(`http://localhost/handle?protocol=${protocol}`)
    expect(resolveFromLocation(url)).toEqual({ type: 'view-memory', id: 'memory-42' })
  })

  it('returns none for /handle without protocol param', () => {
    const url = new URL('http://localhost/handle')
    expect(resolveFromLocation(url)).toEqual({ type: 'none' })
  })

  it('returns none for unrecognized paths', () => {
    const url = new URL('http://localhost/')
    expect(resolveFromLocation(url)).toEqual({ type: 'none' })
  })

  it('returns none for random paths', () => {
    const url = new URL('http://localhost/settings')
    expect(resolveFromLocation(url)).toEqual({ type: 'none' })
  })
})

// ── buildProtocolUrl ────────────────────────────────────────────────────────

describe('buildProtocolUrl', () => {
  it('builds plant-memory URL without data', () => {
    expect(buildProtocolUrl({ type: 'plant-memory' })).toBe('web+plantmemory://')
  })

  it('builds plant-memory URL with data', () => {
    const url = buildProtocolUrl({ type: 'plant-memory', data: 'hello world' })
    expect(url).toBe('web+plantmemory://hello%20world')
  })

  it('builds view-memory URL', () => {
    expect(buildProtocolUrl({ type: 'view-memory', id: 'mem-1' })).toBe('web+viewmemory://mem-1')
  })

  it('builds garden URL', () => {
    expect(buildProtocolUrl({ type: 'garden', path: 'settings' })).toBe('web+memorygarden://settings')
  })

  it('returns null for none action', () => {
    expect(buildProtocolUrl({ type: 'none' })).toBeNull()
  })

  it('round-trips plant-memory URL', () => {
    const action: ProtocolAction = { type: 'plant-memory', data: 'some data' }
    const url = buildProtocolUrl(action)!
    expect(parseProtocolUrl(url)).toEqual(action)
  })

  it('round-trips view-memory URL', () => {
    const action: ProtocolAction = { type: 'view-memory', id: 'memory-123' }
    const url = buildProtocolUrl(action)!
    expect(parseProtocolUrl(url)).toEqual(action)
  })
})
