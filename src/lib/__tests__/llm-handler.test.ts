import { describe, expect, it } from 'vitest'
import { handleLlmRequest, isLlmConfigured } from '../server/llm-handler'

describe('handleLlmRequest', () => {
  it('rejects non-POST', async () => {
    const res = await handleLlmRequest(new Request('http://g.test/api/llm'), {
      configured: true,
      complete: async () => 'nope',
    })
    expect(res.status).toBe(405)
  })

  it('returns 503 when unconfigured', async () => {
    const res = await handleLlmRequest(
      new Request('http://g.test/api/llm', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'hello there friend' }),
      }),
      { configured: false, complete: async () => 'nope' },
    )
    expect(res.status).toBe(503)
  })

  it('returns completion text', async () => {
    const res = await handleLlmRequest(
      new Request('http://g.test/api/llm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'a gentle memory of rain', kind: 'reflect' }),
      }),
      { configured: true, complete: async (req) => `echo:${req.kind}:${req.prompt.slice(0, 6)}` },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { text: string }
    expect(body.text).toBe('echo:reflect:a gent')
  })

  it('maps gpt-4o-mini to classify', async () => {
    const res = await handleLlmRequest(
      new Request('http://g.test/api/llm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'birthday candles on a quiet night', model: 'gpt-4o-mini' }),
      }),
      { configured: true, complete: async (req) => req.kind },
    )
    const body = (await res.json()) as { text: string }
    expect(body.text).toBe('classify')
  })
})

describe('isLlmConfigured', () => {
  it('accepts Anthropic or Gateway credentials, not stray OIDC', () => {
    expect(isLlmConfigured({})).toBe(false)
    expect(isLlmConfigured({ ANTHROPIC_API_KEY: 'sk' })).toBe(true)
    expect(isLlmConfigured({ AI_GATEWAY_API_KEY: 'gw' })).toBe(true)
    expect(isLlmConfigured({ VERCEL_OIDC_TOKEN: 'oidc' })).toBe(false)
    expect(isLlmConfigured({ VERCEL: '1', VERCEL_OIDC_TOKEN: 'oidc' })).toBe(true)
  })
})
