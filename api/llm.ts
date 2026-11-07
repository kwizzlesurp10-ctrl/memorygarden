/**
 * Vercel Edge Function — proxies LLM completions to Anthropic.
 *
 * Reads ANTHROPIC_API_KEY from the environment. The client never sees
 * the key. If the key is absent, returns 503 so the client falls back
 * to its no-AI behavior.
 *
 * Request:  POST /api/llm  body: { prompt: string, kind?: 'classify' | 'reflect', jsonMode?: boolean }
 * Response: 200 { text: string }
 *           503 { error: 'AI not configured' }
 *           5xx { error: string }
 */

import { assertLlmRateLimit } from './llm-rate-limit'

export const config = { runtime: 'edge' }

interface RequestBody {
  prompt?: unknown
  kind?: unknown
  jsonMode?: unknown
}

const MODEL_FAST = 'claude-haiku-4-5-20251001'
const MODEL_RICH = 'claude-sonnet-4-6'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'POST required' })
  }

  const rateLimited = await assertLlmRateLimit(req)
  if (rateLimited) {
    return rateLimited
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return jsonResponse(503, { error: 'AI not configured' })
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' })
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt : ''
  if (!prompt || prompt.length > 4000) {
    return jsonResponse(400, { error: 'Prompt missing or too long' })
  }

  const kind = body.kind === 'classify' ? 'classify' : 'reflect'
  const jsonMode = body.jsonMode === true
  const model = kind === 'classify' ? MODEL_FAST : MODEL_RICH
  const maxTokens = kind === 'classify' ? 32 : 256

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: jsonMode
          ? 'Reply with a single JSON value and no surrounding prose.'
          : 'You are a thoughtful writing companion for a personal memory garden. Be warm, contemplative, and brief.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      return jsonResponse(upstream.status, { error: 'Upstream error', detail: detail.slice(0, 500) })
    }

    const data = (await upstream.json()) as { content?: Array<{ type: string; text?: string }> }
    const text = (data.content ?? [])
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text!.trim())
      .join('\n')
      .trim()

    return jsonResponse(200, { text })
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
