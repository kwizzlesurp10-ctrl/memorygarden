/**
 * Unified LLM client.
 *
 * Production and Vite both POST to /api/llm. That route is served by the
 * Vercel AI SDK (AI Gateway) on Vercel, and by the same handler via the
 * Vite garden API plugin locally. If the route returns 503, we stop
 * retrying for the rest of the session and callers use their fallbacks.
 */

export interface LLMProvider {
  prompt(strings: TemplateStringsArray, ...values: unknown[]): string
  complete(prompt: string, model?: string, jsonMode?: boolean): Promise<string>
  readonly available: boolean
}

function tagged(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}

function getHttpProvider(): LLMProvider | null {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null
  let disabled = false
  return {
    prompt: tagged,
    available: true,
    async complete(promptText: string, model?: string, jsonMode?: boolean): Promise<string> {
      if (disabled) throw new Error('LLM disabled for this session')
      const kind = model === 'gpt-4o-mini' || model === 'haiku' ? 'classify' : 'reflect'
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, kind, jsonMode }),
      })
      if (res.status === 503 || res.status === 404) {
        disabled = true
        throw new Error('LLM not configured')
      }
      if (!res.ok) {
        throw new Error(`LLM request failed: ${res.status}`)
      }
      const data = (await res.json()) as { text?: string }
      return (data.text ?? '').trim()
    },
  }
}

const fallbackProvider: LLMProvider = {
  prompt: tagged,
  async complete(): Promise<string> {
    return ''
  },
  available: false,
}

let _instance: LLMProvider | null = null

export function getLLMProvider(): LLMProvider {
  if (_instance) return _instance
  _instance = getHttpProvider() ?? fallbackProvider
  return _instance
}

export function setLLMProvider(provider: LLMProvider): void {
  _instance = provider
}

export function resetLLMProvider(): void {
  _instance = null
}
