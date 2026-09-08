import { parseLlmRequest, kindFromLegacyModel, type LlmKind, type LlmRequest } from '../llm-request'

export type LlmCompleter = (input: LlmRequest) => Promise<string>

export interface LlmHandlerDeps {
  configured: boolean
  complete: LlmCompleter
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export function isLlmConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(
    env.AI_GATEWAY_API_KEY ||
      env.ANTHROPIC_API_KEY ||
      env.VERCEL_OIDC_TOKEN,
  )
}

export async function handleLlmRequest(req: Request, deps: LlmHandlerDeps): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'POST required' })
  }
  if (!deps.configured) {
    return jsonResponse(503, { error: 'AI not configured' })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' })
  }

  const parsed = parseLlmRequest(raw)
  if (!parsed.ok) {
    return jsonResponse(parsed.error.status, { error: parsed.error.message })
  }

  const kind: LlmKind = kindFromLegacyModel(parsed.value.model, parsed.value.kind)
  const request: LlmRequest = { ...parsed.value, kind }

  try {
    const text = (await deps.complete(request)).trim()
    return jsonResponse(200, { text })
  } catch (error) {
    return jsonResponse(500, { error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
