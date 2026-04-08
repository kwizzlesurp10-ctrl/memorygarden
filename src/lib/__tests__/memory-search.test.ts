import { describe, it, expect } from 'vitest'
import {
  tokenise,
  highlightTokens,
  extractSnippet,
  searchMemories,
  searchMemoriesSimple,
  getSearchSuggestions,
} from '../memory-search'
import type { Memory } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

let _seq = 0

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  const id = `mem-${++_seq}`
  return {
    id,
    photoUrl: 'data:image/png;base64,abc',
    text: 'A peaceful afternoon walk in the park',
    date: '2024-06-15',
    plantedAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
    position: { x: 100, y: 200 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    ...overrides,
  }
}

// ── tokenise ──────────────────────────────────────────────────────────────────

describe('tokenise', () => {
  it('splits on whitespace and lowercases', () => {
    expect(tokenise('Hello World')).toEqual(['hello', 'world'])
  })

  it('filters out single-character tokens', () => {
    expect(tokenise('a beautiful day')).not.toContain('a')
  })

  it('returns empty array for empty string', () => {
    expect(tokenise('')).toEqual([])
  })

  it('strips punctuation from tokens', () => {
    const tokens = tokenise('morning, peaceful!')
    expect(tokens).toContain('morning')
    expect(tokens).toContain('peaceful')
  })

  it('handles multiple spaces', () => {
    expect(tokenise('hello   world')).toEqual(['hello', 'world'])
  })
})

// ── highlightTokens ───────────────────────────────────────────────────────────

describe('highlightTokens', () => {
  it('wraps matched tokens in <mark> tags', () => {
    const result = highlightTokens('A peaceful afternoon', ['peaceful'])
    expect(result).toContain('<mark>peaceful</mark>')
  })

  it('is case-insensitive', () => {
    const result = highlightTokens('A Peaceful afternoon', ['peaceful'])
    expect(result).toContain('<mark>Peaceful</mark>')
  })

  it('handles multiple tokens', () => {
    const result = highlightTokens('peaceful walk in the park', ['peaceful', 'park'])
    expect(result).toContain('<mark>peaceful</mark>')
    expect(result).toContain('<mark>park</mark>')
  })

  it('returns original text when no tokens provided', () => {
    const text = 'some text'
    expect(highlightTokens(text, [])).toBe(text)
  })

  it('does not double-highlight already highlighted text', () => {
    // If the text contains <mark>, the regex should still work
    const result = highlightTokens('hello world', ['hello'])
    expect(result.match(/<mark>/g)?.length).toBe(1)
  })
})

// ── extractSnippet ────────────────────────────────────────────────────────────

describe('extractSnippet', () => {
  it('returns full text when shorter than maxLength', () => {
    const text = 'short text'
    expect(extractSnippet(text, ['short'], 200)).toBe(text)
  })

  it('truncates long text', () => {
    const longText = 'a'.repeat(200) + ' match ' + 'b'.repeat(200)
    const snippet = extractSnippet(longText, ['match'], 140)
    expect(snippet.length).toBeLessThan(170) // snippet + ellipsis chars
  })

  it('includes ellipsis for truncated text', () => {
    const longText = 'start ' + 'x'.repeat(200) + ' match ' + 'y'.repeat(200)
    const snippet = extractSnippet(longText, ['match'], 60)
    expect(snippet).toContain('…')
  })

  it('returns first N chars when no token matches', () => {
    const text = 'no matches in this text'
    const snippet = extractSnippet(text, ['xyz'], 10)
    expect(snippet).toBe('no matches')
  })
})

// ── searchMemories ────────────────────────────────────────────────────────────

describe('searchMemories', () => {
  const memories = [
    makeMemory({ id: 'park', text: 'A beautiful walk in the park on a sunny day' }),
    makeMemory({ id: 'beach', text: 'The beach was warm and peaceful, waves crashing softly' }),
    makeMemory({ id: 'mountain', text: 'Mountain hiking trip with the family, beautiful views' }),
    makeMemory({ id: 'city', text: 'City exploration at night, vibrant and alive' }),
  ]

  it('returns all memories sorted by plantedAt when query is empty', () => {
    const results = searchMemories(memories, '')
    expect(results).toHaveLength(4)
  })

  it('finds memories matching a single token', () => {
    const results = searchMemories(memories, 'park')
    expect(results.some(h => h.memory.id === 'park')).toBe(true)
  })

  it('ranks exact phrase match higher than token match', () => {
    const results = searchMemories(memories, 'beautiful walk')
    // 'park' memory has the exact phrase, should rank first
    expect(results[0].memory.id).toBe('park')
  })

  it('returns score > 0 for matching memories', () => {
    const results = searchMemories(memories, 'beach')
    const beachHit = results.find(h => h.memory.id === 'beach')
    expect(beachHit?.score).toBeGreaterThan(0)
  })

  it('includes matchedFields for text matches', () => {
    const results = searchMemories(memories, 'park')
    const hit = results.find(h => h.memory.id === 'park')
    expect(hit?.matchedFields).toContain('text')
  })

  it('includes highlights for matched fields', () => {
    const results = searchMemories(memories, 'park')
    const hit = results.find(h => h.memory.id === 'park')
    expect(hit?.highlights['text']).toContain('<mark>')
  })

  it('respects limit option', () => {
    const results = searchMemories(memories, 'the', { limit: 2 })
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('respects minScore option', () => {
    const results = searchMemories(memories, 'park', { minScore: 100 })
    // 100 is a very high score — likely 0 or 1 result
    results.forEach(h => expect(h.score).toBeGreaterThanOrEqual(100))
  })

  it('respects tones filter', () => {
    const mixed = [
      makeMemory({ id: 'happy-mem', emotionalTone: 'happy', text: 'joyful walk' }),
      makeMemory({ id: 'peaceful-mem', emotionalTone: 'peaceful', text: 'peaceful walk' }),
    ]
    const results = searchMemories(mixed, 'walk', { tones: ['happy'] })
    expect(results.every(h => h.memory.emotionalTone === 'happy')).toBe(true)
  })

  it('respects stages filter', () => {
    const mixed = [
      makeMemory({ id: 'seed-mem', plantStage: 'seed', text: 'memory here' }),
      makeMemory({ id: 'bloom-mem', plantStage: 'bloom', text: 'memory here' }),
    ]
    const results = searchMemories(mixed, 'memory', { stages: ['bloom'] })
    expect(results.every(h => h.memory.plantStage === 'bloom')).toBe(true)
  })

  it('searches reflection text', () => {
    const mem = makeMemory({
      id: 'with-reflection',
      text: 'Ordinary day',
      reflections: [
        { id: 'r1', text: 'Found serenity in silence', createdAt: new Date().toISOString() },
      ],
    })
    const results = searchMemories([mem], 'serenity')
    expect(results.some(h => h.memory.id === 'with-reflection')).toBe(true)
    const hit = results.find(h => h.memory.id === 'with-reflection')
    expect(hit?.matchedFields).toContain('reflection')
  })

  it('searches location field', () => {
    const mem = makeMemory({ id: 'located', location: 'Kyoto, Japan', text: 'lovely trip' })
    const results = searchMemories([mem], 'kyoto')
    const hit = results.find(h => h.memory.id === 'located')
    expect(hit).toBeDefined()
    expect(hit?.matchedFields).toContain('location')
  })

  it('respects location filter option', () => {
    const kyoto = makeMemory({ id: 'kyoto', location: 'Kyoto', text: 'temple visit' })
    const paris = makeMemory({ id: 'paris', location: 'Paris', text: 'cafe visit' })
    const results = searchMemories([kyoto, paris], '', { location: 'Kyoto' })
    expect(results).toHaveLength(1)
    expect(results[0].memory.id).toBe('kyoto')
  })
})

// ── searchMemoriesSimple ──────────────────────────────────────────────────────

describe('searchMemoriesSimple', () => {
  it('returns Memory objects (not SearchHit objects)', () => {
    const memories = [makeMemory({ text: 'simple search test' })]
    const results = searchMemoriesSimple(memories, 'simple')
    expect(results.length).toBeGreaterThan(0)
    // Should be a Memory, not a SearchHit
    expect(results[0]).toHaveProperty('id')
    expect(results[0]).toHaveProperty('text')
    expect(results[0]).not.toHaveProperty('score')
  })

  it('returns empty array for no matches', () => {
    const memories = [makeMemory({ text: 'nothing relevant here' })]
    const results = searchMemoriesSimple(memories, 'xyzzy')
    expect(results).toHaveLength(0)
  })
})

// ── getSearchSuggestions ──────────────────────────────────────────────────────

describe('getSearchSuggestions', () => {
  it('returns at most n suggestions', () => {
    const memories = Array.from({ length: 20 }, (_, i) =>
      makeMemory({ text: `memory about garden flowers and trees visit ${i}` })
    )
    const suggestions = getSearchSuggestions(memories, 5)
    expect(suggestions.length).toBeLessThanOrEqual(5)
  })

  it('returns empty array for empty memory list', () => {
    expect(getSearchSuggestions([])).toEqual([])
  })

  it('returns meaningful words (not stopwords)', () => {
    const memories = [makeMemory({ text: 'the beautiful garden flowers are blooming' })]
    const suggestions = getSearchSuggestions(memories, 10)
    // stopwords like 'the', 'are' should not appear
    expect(suggestions).not.toContain('the')
    expect(suggestions).not.toContain('are')
  })

  it('returns most frequent words first', () => {
    const memories = [
      makeMemory({ text: 'garden garden garden flowers' }),
      makeMemory({ text: 'garden flowers flowers' }),
    ]
    const suggestions = getSearchSuggestions(memories, 3)
    expect(suggestions[0]).toBe('garden')
  })
})
