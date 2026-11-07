import { describe, expect, it } from 'vitest'
import { sanitizeMemoryLinkUrlFields, sanitizeSyncDocument } from '../sync-document'

describe('sanitizeSyncDocument (legacy-safe cloud sync)', () => {
  const legacyMemory = {
    id: 'legacy-1',
    photoUrl: 'data:image/png;base64,legacy',
    text: '',
    date: '2019-01-01',
    plantedAt: '2019-01-01T00:00:00.000Z',
    position: { x: 1, y: 2 },
    emotionalTone: 'peaceful',
    plantStage: 'sprout',
    plantVariety: 'flower',
  }

  it('passes through legacy-shaped memories unchanged', () => {
    const doc = {
      memories: [legacyMemory, { ...legacyMemory, id: 'legacy-2', visitCount: 4, isHybrid: true }],
      preferences: { hasCompletedOnboarding: true },
    }
    const sanitized = sanitizeSyncDocument(doc)
    expect(sanitized.memories).toEqual(doc.memories)
  })

  it('strips invalid linkUrl from one memory without affecting siblings', () => {
    const doc = {
      memories: [
        {
          ...legacyMemory,
          id: 'good',
          linkUrl: 'https://example.com/ok',
        },
        {
          ...legacyMemory,
          id: 'bad',
          linkUrl: 'javascript:alert(1)',
        },
        legacyMemory,
      ],
    }
    const sanitized = sanitizeSyncDocument(doc) as { memories: Record<string, unknown>[] }
    expect(sanitized.memories[0].linkUrl).toBe('https://example.com/ok')
    expect('linkUrl' in sanitized.memories[1]).toBe(false)
    expect(sanitized.memories[2]).toEqual(legacyMemory)
  })

  it('normalizes valid linkUrl and removes non-string linkUrl', () => {
    const rows = sanitizeMemoryLinkUrlFields([
      { id: 'a', linkUrl: 'https://Example.com/path' },
      { id: 'b', linkUrl: 42 },
    ]) as Record<string, unknown>[]
    expect(rows[0].linkUrl).toBe('https://example.com/path')
    expect('linkUrl' in rows[1]).toBe(false)
  })
})
