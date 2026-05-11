import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('isSyncAvailable', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('GETs /api/sync?probe=1 and returns true on 200', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const { isSyncAvailable } = await import('../cloud-sync')
    await expect(isSyncAvailable()).resolves.toBe(true)
    expect(fetchSpy).toHaveBeenCalledWith('/api/sync?probe=1', { method: 'GET' })
  })

  it('returns false when probe responds 503', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Cloud sync not configured' }), { status: 503 }),
    )
    const { isSyncAvailable } = await import('../cloud-sync')
    await expect(isSyncAvailable()).resolves.toBe(false)
  })

  it('returns false when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
    const { isSyncAvailable } = await import('../cloud-sync')
    await expect(isSyncAvailable()).resolves.toBe(false)
  })

  it('returns false for non-200 success shapes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }))
    const { isSyncAvailable } = await import('../cloud-sync')
    await expect(isSyncAvailable()).resolves.toBe(false)
  })
})
