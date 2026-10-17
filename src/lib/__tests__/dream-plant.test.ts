import { describe, expect, it, beforeEach } from 'vitest'
import { dreamPlant } from '../garden/dream-plant'
import { resetLLMProvider, setLLMProvider, type LLMProvider } from '../llm-client'

function mockProvider(complete: LLMProvider['complete']): LLMProvider {
  return {
    prompt: (strings, ...values) => strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    complete,
    available: true,
  }
}

describe('dreamPlant', () => {
  beforeEach(() => {
    resetLLMProvider()
  })

  it('falls back to a local genome when the LLM is unavailable', async () => {
    setLLMProvider({
      prompt: (s, ...v) => s.reduce((acc, str, i) => acc + str + (v[i] ?? ''), ''),
      complete: async () => '',
      available: false,
    })
    const result = await dreamPlant('grandmother\'s teapot')
    expect(result.source).toBe('local')
    expect(result.genome.name.length).toBeGreaterThan(0)
  })

  it('uses a parsed AI genome when the model returns JSON', async () => {
    setLLMProvider(mockProvider(async () => JSON.stringify({
      name: 'Teapot Vine',
      essence: 'Steam curling into morning light.',
      base: 'vine',
      graft: 'flower',
      palette: { sil: '#150a22', rim: '#ffb877', glow: '#ffd9a0', accent: '#ff8f5e' },
      glowIntensity: 0.6,
      adornment: 'motes',
      seed: 42,
      motif: { label: 'tiny teapot', paths: [{ d: 'M 4 12 L 20 12', fill: 'glow', stroke: 'none', sw: 0 }] },
    })))
    const result = await dreamPlant('grandmother\'s teapot')
    expect(result.source).toBe('ai')
    expect(result.genome.name).toBe('Teapot Vine')
    expect(result.genome.base).toBe('vine')
  })
})
