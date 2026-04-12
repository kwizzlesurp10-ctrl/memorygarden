import { describe, it, expect } from 'vitest'
import { escapeHtml, stripHtml, sanitizeUrl } from '../sanitize'

describe('escapeHtml', () => {
  it('escapes all dangerous characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    )
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s')
  })

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('leaves safe text unchanged', () => {
    expect(escapeHtml('Hello world 123')).toBe('Hello world 123')
  })
})

describe('stripHtml', () => {
  it('removes all HTML tags', () => {
    expect(stripHtml('<b>bold</b> and <i>italic</i>')).toBe('bold and italic')
  })

  it('removes self-closing tags', () => {
    expect(stripHtml('line<br/>break')).toBe('linebreak')
  })

  it('handles nested tags', () => {
    expect(stripHtml('<div><span>text</span></div>')).toBe('text')
  })

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('')
  })
})

describe('sanitizeUrl', () => {
  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path')
  })

  it('allows mailto URLs', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com')
  })

  it('allows app protocol URLs', () => {
    expect(sanitizeUrl('web+plantmemory://new')).toBe('web+plantmemory://new')
    expect(sanitizeUrl('web+viewmemory://abc')).toBe('web+viewmemory://abc')
    expect(sanitizeUrl('web+memorygarden://home')).toBe('web+memorygarden://home')
  })

  it('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
  })

  it('blocks data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<h1>xss</h1>')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeUrl('')).toBe('')
    expect(sanitizeUrl('   ')).toBe('')
  })

  it('blocks vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('')
  })
})
