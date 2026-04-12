/**
 * Generic retry utility with exponential backoff.
 *
 * Used to wrap flaky or network-dependent operations (e.g. LLM calls)
 * so they automatically retry transient failures without burdening callers.
 */

export interface RetryOptions {
  /** Maximum number of attempts (including the first). Default: 3 */
  maxAttempts?: number
  /** Initial delay in ms before the first retry. Default: 500 */
  initialDelayMs?: number
  /** Multiplier applied to the delay after each retry. Default: 2 */
  backoffFactor?: number
  /** Maximum delay in ms (cap for exponential growth). Default: 5000 */
  maxDelayMs?: number
  /** Optional predicate — return `false` to stop retrying early. */
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffFactor: 2,
  maxDelayMs: 5000,
}

/**
 * Execute `fn` with automatic retries on failure.
 *
 * ```ts
 * const result = await withRetry(() => fetch('/api/data'), { maxAttempts: 3 })
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts,
    initialDelayMs,
    backoffFactor,
    maxDelayMs,
  } = { ...DEFAULT_OPTIONS, ...options }

  let lastError: unknown
  let delay = initialDelayMs

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxAttempts) break

      if (options.shouldRetry && !options.shouldRetry(error, attempt)) break

      await sleep(delay)
      delay = Math.min(delay * backoffFactor, maxDelayMs)
    }
  }

  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
