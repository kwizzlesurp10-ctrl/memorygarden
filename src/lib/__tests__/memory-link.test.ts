import { describe, expect, it } from 'vitest'
import {
  getLinkPlatformLabel,
  memoryHasPlantableContent,
  parseHttpHttpsLinkUrl,
} from '../memory-link'

describe('parseHttpHttpsLinkUrl', () => {
  it('accepts https URLs', () => {
    const result = parseHttpHttpsLinkUrl('https://example.com/post/1')
    expect(result.valid).toBe(true)
    expect(result.normalized).toBe('https://example.com/post/1')
  })

  it('rejects javascript: URLs', () => {
    const result = parseHttpHttpsLinkUrl('javascript:alert(1)')
    expect(result.valid).toBe(false)
  })

  it('rejects data: URLs', () => {
    const result = parseHttpHttpsLinkUrl('data:text/html,<h1>hi</h1>')
    expect(result.valid).toBe(false)
  })

  it('rejects scheme-less URLs', () => {
    expect(parseHttpHttpsLinkUrl('example.com').valid).toBe(false)
  })
})

describe('memoryHasPlantableContent', () => {
  it('requires at least one of text, photo, or link', () => {
    expect(memoryHasPlantableContent({ text: '', photoUrl: '', linkUrl: '' })).toBe(false)
    expect(memoryHasPlantableContent({ text: 'hello' })).toBe(true)
    expect(memoryHasPlantableContent({ photoFile: true })).toBe(true)
    expect(memoryHasPlantableContent({ linkUrl: 'https://youtu.be/abc' })).toBe(true)
  })
})

describe('getLinkPlatformLabel', () => {
  it('labels well-known hosts', () => {
    expect(getLinkPlatformLabel('www.youtube.com')).toBe('YouTube')
    expect(getLinkPlatformLabel('x.com')).toBe('X')
  })
})
