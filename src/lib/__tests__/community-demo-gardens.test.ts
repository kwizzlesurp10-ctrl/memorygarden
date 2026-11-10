import { describe, expect, it } from 'vitest'
import {
  COMMUNITY_DEMO_GARDENS,
  getDemoGardenDetail,
  isValidCommunityGardenUuid,
  normalizePublicGardenIds,
} from '@/lib/community-demo-gardens'

describe('community demo gardens', () => {
  it('uses valid v4 UUIDs for featured gardens', () => {
    for (const garden of COMMUNITY_DEMO_GARDENS) {
      expect(isValidCommunityGardenUuid(garden.id)).toBe(true)
    }
  })

  it('remaps invalid api ids by garden name and serves synthetic detail', () => {
    const normalized = normalizePublicGardenIds([
      {
        id: 'c3d4e5f6-a7b8-9012-cdef-0123456789ab',
        name: 'The Little Wild',
        created_at: new Date().toISOString(),
      },
    ])
    const littleWild = normalized.find((g) => g.name === 'The Little Wild')
    expect(littleWild?.id).toBe(COMMUNITY_DEMO_GARDENS[0]?.id)
    const detail = getDemoGardenDetail(COMMUNITY_DEMO_GARDENS[0]!.id)
    expect(detail?.memories.length).toBeGreaterThan(0)
  })
})
