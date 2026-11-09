import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchPublicGardens,
  joinCommunityGarden,
  memoryToPlantPayload,
} from '@/lib/community-gardens-api'
import type { Memory } from '@/lib/types'

vi.mock('@/lib/auth/auth-fetch', () => ({
  authFetch: vi.fn(),
}))

import { authFetch } from '@/lib/auth/auth-fetch'

const gardenId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

describe('community-gardens-api client', () => {
  beforeEach(() => {
    vi.mocked(authFetch).mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lists public gardens from GET /api/gardens', async () => {
    vi.mocked(authFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          gardens: [
            {
              id: gardenId,
              name: 'Sakura Reflections',
              description: 'Quiet',
              created_at: new Date().toISOString(),
              member_count: 2,
              memory_count: 1,
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const result = await fetchPublicGardens()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value[0]?.name).toBe('Sakura Reflections')
    }
    expect(vi.mocked(authFetch)).toHaveBeenCalledWith('/api/gardens')
  })

  it('posts join to /api/gardens/join', async () => {
    vi.mocked(authFetch).mockResolvedValue(new Response(JSON.stringify({ message: 'ok' }), { status: 200 }))

    await joinCommunityGarden({
      gardenId,
      userId: 'abcdefghijklmnop',
      userName: 'Ada',
    })

    expect(vi.mocked(authFetch)).toHaveBeenCalledWith(
      '/api/gardens/join',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('builds plant payload with explicit public visibility for private memories', () => {
    const memory = {
      id: 'mem-1',
      text: 'Secret tea',
      photoUrl: 'data:image/png;base64,abc',
      emotionalTone: 'peaceful',
      plantVariety: 'flower',
      visibility: 'private',
      position: { x: 1, y: 2 },
    } as Memory

    const payload = memoryToPlantPayload(
      memory,
      gardenId,
      { id: 'abcdefghijklmnop', name: 'Ada' },
      'public',
    )

    expect(payload.visibility).toBe('public')
    expect(payload.gardenId).toBe(gardenId)
    expect(payload.text).toBe('Secret tea')
  })
})
