import { describe, it, expect, beforeEach } from 'vitest'
import { getLLMProvider, setLLMProvider, resetLLMProvider, type LLMProvider } from '../llm-client'

describe('LLM Client', () => {
  beforeEach(() => {
    resetLLMProvider()
  })

  it('returns a fallback provider when window.spark is unavailable', () => {
    const provider = getLLMProvider()
    expect(provider.available).toBe(false)
  })

  it('fallback provider returns unavailable message', async () => {
    const provider = getLLMProvider()
    const result = await provider.complete('test prompt')
    expect(result).toBe('AI reflection is not available in this environment.')
  })

  it('fallback provider.prompt concatenates template literal', () => {
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
    // Both will be fallback but they should be fresh instances
    expect(p1.available).toBe(false)
    expect(p2.available).toBe(false)
  })
})
