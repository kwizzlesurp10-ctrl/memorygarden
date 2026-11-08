/**
 * Vercel Edge Function — proxies LLM completions to xAI (Grok) or Anthropic.
 *
 * Prefers XAI_API_KEY (Grok, OpenAI-compatible API) when set, otherwise
 * ANTHROPIC_API_KEY. The client never sees either key. If neither key is
 * set, returns 503 so the client falls back to its no-AI behavior.
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
const XAI_MODEL = 'grok-4.20-0309-non-reasoning'

const SYSTEM_JSON = 'Reply with a single JSON value and no surrounding prose.'
const SYSTEM_TEXT =
  'You are a thoughtful writing companion for a personal memory garden. Be warm, contemplative, and brief.'

async function completeXai(apiKey: string, prompt: string, jsonMode: boolean, maxTokens: number): Promise<Response | string> {
  const upstream = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || XAI_MODEL,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: jsonMode ? SYSTEM_JSON : SYSTEM_TEXT },
        { role: 'user', content: prompt },
      ],
    }),
  })
  if (!upstream.ok) {
    return jsonResponse(upstream.status >= 500 ? 502 : upstream.status, { error: 'Upstream error' })
  }
  const data = (await upstream.json()) as { choices?: Array<{ message?: { content?: string } }> }
  return (data.choices?.[0]?.message?.content ?? '').trim()
}

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

  const xaiKey = process.env.XAI_API_KEY
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!xaiKey && !apiKey) {
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
  // JSON replies (e.g. Dream a Plant genomes with SVG motif paths) need more room.
  const maxTokens = kind === 'classify' ? 32 : jsonMode ? 1200 : 256

  try {
    if (xaiKey) {
      const out = await completeXai(xaiKey, prompt, jsonMode, maxTokens)
      return typeof out === 'string' ? jsonResponse(200, { text: out }) : out
    }
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: jsonMode ? SYSTEM_JSON : SYSTEM_TEXT,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!upstream.ok) {
      return jsonResponse(upstream.status >= 500 ? 502 : upstream.status, { error: 'Upstream error' })
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
