import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../retry'

describe('withRetry', () => {
  it('returns result on first successful call', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and eventually succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting all attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent'))

    await expect(
      withRetry(fn, { maxAttempts: 2, initialDelayMs: 1 }),
    ).rejects.toThrow('persistent')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('respects shouldRetry predicate', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fatal'))

    await expect(
      withRetry(fn, {
        maxAttempts: 5,
        initialDelayMs: 1,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('fatal')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('applies exponential backoff delay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok')

    const start = Date.now()
    await withRetry(fn, { maxAttempts: 2, initialDelayMs: 50 })
    const elapsed = Date.now() - start

    expect(elapsed).toBeGreaterThanOrEqual(40) // allow slight timing variance
  })

  it('caps delay at maxDelayMs', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockRejectedValueOnce(new Error('3'))
      .mockResolvedValue('ok')

    const start = Date.now()
    await withRetry(fn, {
      maxAttempts: 4,
      initialDelayMs: 10,
      backoffFactor: 100,
      maxDelayMs: 20,
    })
    const elapsed = Date.now() - start

    // 10 + 20 + 20 = 50ms theoretical max (capped at 20)
    expect(elapsed).toBeLessThan(200)
    expect(fn).toHaveBeenCalledTimes(4)
  })

  it('passes attempt number to shouldRetry', async () => {
    const shouldRetry = vi.fn().mockReturnValue(true)
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok')

    await withRetry(fn, { maxAttempts: 3, initialDelayMs: 1, shouldRetry })
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1)
  })

  it('defaults to 3 max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    await expect(withRetry(fn, { initialDelayMs: 1 })).rejects.toThrow('fail')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
