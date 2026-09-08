import { describe, expect, it } from 'vitest'
import {
  gatewayModelForKind,
  kindFromLegacyModel,
  parseLlmRequest,
} from '../llm-request'

describe('parseLlmRequest', () => {
  it('accepts a valid classify prompt', () => {
    const parsed = parseLlmRequest({ prompt: 'a quiet morning in the garden', kind: 'classify' })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.value.kind).toBe('classify')
      expect(parsed.value.jsonMode).toBe(false)
    }
  })

  it('rejects an empty prompt', () => {
    const parsed = parseLlmRequest({ prompt: '   ' })
    expect(parsed.ok).toBe(false)
  })

  it('rejects oversized prompts', () => {
    const parsed = parseLlmRequest({ prompt: 'x'.repeat(4001) })
    expect(parsed.ok).toBe(false)
  })

  it('defaults kind to reflect', () => {
    const parsed = parseLlmRequest({ prompt: 'hello from the shed' })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.value.kind).toBe('reflect')
  })
})

describe('kindFromLegacyModel', () => {
  it('maps gpt-4o-mini and haiku to classify', () => {
    expect(kindFromLegacyModel('gpt-4o-mini', 'reflect')).toBe('classify')
    expect(kindFromLegacyModel('haiku', 'reflect')).toBe('classify')
    expect(kindFromLegacyModel('gpt-4o', 'reflect')).toBe('reflect')
  })
})

describe('gatewayModelForKind', () => {
  it('uses haiku for classify and sonnet for reflect', () => {
    expect(gatewayModelForKind('classify')).toContain('haiku')
    expect(gatewayModelForKind('reflect')).toContain('sonnet')
  })
})
