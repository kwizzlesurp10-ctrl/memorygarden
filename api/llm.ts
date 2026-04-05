/**
 * Vercel serverless function that proxies LLM requests to OpenAI.
 * Requires the OPENAI_API_KEY environment variable to be set in Vercel.
 *
 * POST /api/llm
 * Body: { prompt: string, model?: string, jsonMode?: boolean }
 * Response: { result: string }
 */

import type { IncomingMessage, ServerResponse } from 'http'

interface ParsedBody {
  prompt?: string
  model?: string
  jsonMode?: boolean
}

function readBody(req: IncomingMessage): Promise<ParsedBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()))
      } catch {
        resolve({})
      }
    })
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return json(res, 503, { error: 'OPENAI_API_KEY not configured' })
  }

  const { prompt, model = 'gpt-4o', jsonMode = false } = await readBody(req)

  if (!prompt || typeof prompt !== 'string') {
    return json(res, 400, { error: 'Missing or invalid prompt' })
  }

  try {
    const body: Record<string, unknown> = {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }

    if (jsonMode) {
      body.response_format = { type: 'json_object' }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return json(res, 502, { error: 'LLM provider error' })
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content ?? ''

    return json(res, 200, { result })
  } catch (error) {
    console.error('LLM proxy error:', error)
    return json(res, 500, { error: 'Internal server error' })
  }
}
