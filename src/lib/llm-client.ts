/**
 * Unified LLM client abstraction.
 *
 * The default provider in production calls our own /api/llm Edge
 * function, which proxies to Anthropic. In environments where that
 * route returns 503 (no API key configured), or where window/fetch
 * is unavailable, we fall back to a static no-network provider so
 * the app never breaks.
 *
 * Tests can swap the provider via setLLMProvider().
 */

export interface LLMProvider {
  /** Build a prompt string from a template literal. */
  prompt(strings: TemplateStringsArray, ...values: unknown[]): string
  /** Send a prompt to the model and return the completion text. */
  complete(prompt: string, model?: string, jsonMode?: boolean): Promise<string>
  /** Whether the provider is available in the current environment. */
  readonly available: boolean
}

function tagged(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}

// ── HTTP provider (Vercel Edge proxy → Anthropic) ──────────────────────────

function getHttpProvider(): LLMProvider | null {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null
  // Tracks whether the /api/llm route is missing or unconfigured. After a
  // first failed request we stop hammering it for the session.
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

// ── Spark fallback (legacy) ─────────────────────────────────────────────────

interface SparkSDK {
  llmPrompt: (s: TemplateStringsArray, ...v: unknown[]) => string
  llm: (p: string, m?: string, j?: boolean) => Promise<string>
}

function getSparkProvider(): LLMProvider | null {
  if (typeof window === 'undefined') return null
  const spark = (window as unknown as Record<string, unknown>).spark as SparkSDK | undefined
  if (!spark) return null
  return {
    prompt: (strings, ...values) => spark.llmPrompt(strings, ...values),
    complete: (p, m, j) => spark.llm(p, m, j),
    available: true,
  }
}

// ── Static fallback (no network) ────────────────────────────────────────────

const fallbackProvider: LLMProvider = {
  prompt: tagged,
  async complete(): Promise<string> {
    return ''
  },
  available: false,
}

// ── Singleton ───────────────────────────────────────────────────────────────

let _instance: LLMProvider | null = null

export function getLLMProvider(): LLMProvider {
  if (_instance) return _instance
  _instance = getHttpProvider() ?? getSparkProvider() ?? fallbackProvider
  return _instance
}

export function setLLMProvider(provider: LLMProvider): void {
  _instance = provider
}

export function resetLLMProvider(): void {
  _instance = null
}
