import { describe, expect, it } from 'vitest'
import { sanitizeGardenMemoriesForViewer } from '../../../api/gardens/lib/community-memory-privacy'

const baseRow = {
  id: '11111111-1111-1111-1111-111111111111',
  garden_id: '22222222-2222-2222-2222-222222222222',
  contributor_id: 'user-a',
  contributor_name: 'Alice',
  contributor_avatar_url: null,
  photo_url: 'data:image/png;base64,abc',
  text: 'Secret journal entry',
  memory_date: '2025-01-01',
  location: null,
  position_x: 1,
  position_y: 2,
  emotional_tone: 'peaceful',
  plant_stage: 'sprout',
  plant_variety: 'flower',
  visit_count: 1,
  last_visited: null,
  planted_at: '2025-01-01T12:00:00Z',
  reflections: [],
  visibility: 'private',
}

describe('sanitizeGardenMemoriesForViewer', () => {
  it('hides private memory text from non-owners in camouflage mode', () => {
    const { memories, privateMemoryIds } = sanitizeGardenMemoriesForViewer({
      rawMemories: [baseRow],
      isOwner: false,
      privacyMode: 'camouflage',
    })
    expect(memories).toHaveLength(0)
    expect(privateMemoryIds.size).toBe(1)
  })

  it('shows sleeping_seed placeholder for private memories when requested', () => {
    const { memories } = sanitizeGardenMemoriesForViewer({
      rawMemories: [baseRow],
      isOwner: false,
      privacyMode: 'sleeping_seed',
    })
    expect(memories).toHaveLength(1)
    expect(memories[0].text).toContain('quiet memory')
    expect(memories[0].photo_url).toBe('')
  })

  it('returns full private memory to garden owner', () => {
    const { memories } = sanitizeGardenMemoriesForViewer({
      rawMemories: [baseRow],
      isOwner: true,
      privacyMode: 'camouflage',
    })
    expect(memories).toHaveLength(1)
    expect(memories[0].text).toBe('Secret journal entry')
  })
})
