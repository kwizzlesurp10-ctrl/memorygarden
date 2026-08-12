import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getLLMProvider, setLLMProvider, resetLLMProvider, type LLMProvider } from '../llm-client'

describe('LLM Client', () => {
  beforeEach(() => {
    resetLLMProvider()
    vi.restoreAllMocks()
  })

  it('returns the HTTP provider in a browser-like environment', () => {
    const provider = getLLMProvider()
    expect(provider.available).toBe(true)
  })

  it('HTTP provider posts to /api/llm and returns the text', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ text: 'hello back' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const provider = getLLMProvider()
    const result = await provider.complete('hi')
    expect(result).toBe('hello back')
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/llm',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('HTTP provider throws when the route returns 503 (no API key)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503 }),
    )
    const provider = getLLMProvider()
    await expect(provider.complete('hi')).rejects.toThrow(/not configured/i)
  })

  it('prompt() concatenates template literals', () => {
    const provider = getLLMProvider()
    const result = provider.prompt`Hello ${'world'}, count: ${42}`
    expect(result).toBe('Hello world, count: 42')
  })

  it('allows overriding the provider via setLLMProvider', async () => {
    const mockProvider: LLMProvider = {
      prompt: (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
      complete: async (prompt) => `Mock response for: ${prompt}`,
      available: true,
    }

    setLLMProvider(mockProvider)
    const provider = getLLMProvider()

    expect(provider.available).toBe(true)
    const result = await provider.complete('test')
    expect(result).toBe('Mock response for: test')
  })

  it('caches the provider on first call', () => {
    const p1 = getLLMProvider()
    const p2 = getLLMProvider()
    expect(p1).toBe(p2)
  })

  it('resetLLMProvider causes re-detection', () => {
    const p1 = getLLMProvider()
    resetLLMProvider()
    const p2 = getLLMProvider()
    expect(p1).not.toBe(p2)
  })
})
