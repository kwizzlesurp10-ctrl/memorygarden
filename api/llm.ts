/**
 * Vercel Edge Function — garden LLM via the Vercel AI SDK / AI Gateway.
 *
 * Request:  POST /api/llm  body: { prompt: string, kind?: 'classify' | 'reflect', jsonMode?: boolean }
 * Response: 200 { text: string }
 *           503 { error: 'AI not configured' }
 */

import { completeWithAiSdk } from '../src/lib/server/ai-complete'
import { handleLlmRequest, isLlmConfigured } from '../src/lib/server/llm-handler'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  return handleLlmRequest(req, {
    configured: isLlmConfigured(),
    complete: completeWithAiSdk,
  })
}
