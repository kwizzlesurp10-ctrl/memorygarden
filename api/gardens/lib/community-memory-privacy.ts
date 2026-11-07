/**
 * Pure helpers for filtering community garden memories by visibility.
 * Extracted for regression tests — keep in sync with GET /api/gardens?id= handler.
 */

export type CommunityPrivacyMode = 'camouflage' | 'sleeping_seed'

export interface RawGardenMemoryRow {
  id: string | number
  garden_id: string
  contributor_id: string | null
  contributor_name: string | null
  contributor_avatar_url: string | null
  photo_url: string
  text: string
  memory_date: string | null
  location: string | null
  position_x: number
  position_y: number
  emotional_tone: string
  plant_stage: string
  plant_variety: string
  visit_count: number
  last_visited: string | null
  planted_at: string
  reflections: unknown
  visibility?: string
}

export interface SanitizedGardenMemory extends RawGardenMemoryRow {
  reflections: Array<{ isTend?: boolean; userId?: string; text?: string }>
}

export function sanitizeGardenMemoriesForViewer(params: {
  rawMemories: RawGardenMemoryRow[]
  isOwner: boolean
  privacyMode: CommunityPrivacyMode
}): { memories: SanitizedGardenMemory[]; privateMemoryIds: Set<string> } {
  const { rawMemories, isOwner, privacyMode } = params
  const privateMemoryIds = new Set<string>()
  const memories: SanitizedGardenMemory[] = []
  let privIdx = 0

  for (const m of rawMemories) {
    const isPrivate = m.visibility === 'private'
    if (isPrivate && !isOwner) {
      privateMemoryIds.add(String(m.id))
      if (privacyMode === 'sleeping_seed') {
        const theta = (2 * Math.PI * privIdx) / Math.max(1, rawMemories.length)
        privIdx++
        memories.push({
          id: m.id,
          garden_id: m.garden_id,
          contributor_id: null,
          contributor_name: 'A Quiet Gardener',
          contributor_avatar_url: null,
          photo_url: '',
          text: 'A quiet memory rests here in gentle contemplation',
          memory_date: null,
          location: null,
          position_x: 7.2 * Math.cos(theta),
          position_y: -5.5 + 7.2 * Math.sin(theta),
          emotional_tone: 'peaceful',
          plant_stage: 'sprout',
          plant_variety: 'flower',
          visit_count: m.visit_count,
          last_visited: m.last_visited,
          planted_at: m.planted_at,
          reflections: [],
          visibility: 'private',
        })
      }
      continue
    }

    const rawReflections = Array.isArray(m.reflections)
      ? (m.reflections as Array<{ isTend?: boolean; userId?: string }>)
      : []
    const filteredReflections = isOwner
      ? rawReflections
      : rawReflections.filter(
          (r) => r.isTend === true || (r.userId && r.userId !== m.contributor_id),
        )

    memories.push({
      ...m,
      reflections: filteredReflections,
    })
  }

  return { memories, privateMemoryIds }
}
