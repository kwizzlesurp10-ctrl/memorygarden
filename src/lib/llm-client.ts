/**
 * Unified LLM client abstraction.
 *
 * Wraps the Spark SDK `window.spark.llm` behind a provider-agnostic
 * interface so callers never reference the global directly.  Swap
 * the implementation here (e.g. local model, REST API) without
 * touching UI code.
 */

export interface LLMProvider {
  /** Build a prompt string from a template literal. */
  prompt(strings: TemplateStringsArray, ...values: unknown[]): string
  /** Send a prompt to the model and return the completion text. */
  complete(prompt: string, model?: string, jsonMode?: boolean): Promise<string>
  /** Whether the provider is available in the current environment. */
  readonly available: boolean
}

// ── Spark-backed provider ───────────────────────────────────────────────────

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

// ── Fallback (keyword-based, no network) ────────────────────────────────────

const fallbackProvider: LLMProvider = {
  prompt(strings: TemplateStringsArray, ...values: unknown[]): string {
    return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
  },
  async complete(): Promise<string> {
    return 'AI reflection is not available in this environment.'
  },
  available: false,
}

// ── Singleton ───────────────────────────────────────────────────────────────

let _instance: LLMProvider | null = null

/**
 * Returns the current LLM provider.
 * Resolves to the Spark provider when the SDK is loaded, otherwise
 * a safe fallback that never throws.
 */
export function getLLMProvider(): LLMProvider {
  if (_instance) return _instance
  _instance = getSparkProvider() ?? fallbackProvider
  return _instance
}

/**
 * Override the provider (useful for testing or swapping to a local model).
 */
export function setLLMProvider(provider: LLMProvider): void {
  _instance = provider
}

/**
 * Reset the provider so the next `getLLMProvider()` re-detects.
 */
export function resetLLMProvider(): void {
  _instance = null
}
