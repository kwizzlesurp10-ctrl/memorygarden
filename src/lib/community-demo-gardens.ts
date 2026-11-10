import type { PublicGarden } from '@/lib/community-gardens-api'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Featured community gardens served without production DB writes (synthetic only). */
export const COMMUNITY_DEMO_GARDENS: PublicGarden[] = [
  {
    id: 'b1111111-1111-4111-8111-111111111111',
    name: 'The Little Wild',
    description: 'Moss paths, fern walls, and handwritten wishes on birch bark.',
    owner_name: 'Juniper',
    member_count: 14,
    memory_count: 22,
    created_at: '2025-07-01T12:00:00.000Z',
    viewer_is_member: false,
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    name: 'Ocean Whispers',
    description: 'Salt air, driftwood markers, and memories tied with sea glass.',
    owner_name: 'Marin',
    member_count: 19,
    memory_count: 41,
    created_at: '2025-08-15T09:30:00.000Z',
    viewer_is_member: false,
  },
  {
    id: 'b3333333-3333-4333-8333-333333333333',
    name: 'Sakura Reflections',
    description: 'Cherry petals on still water — quiet reflections at dusk.',
    owner_name: 'Hana',
    member_count: 27,
    memory_count: 58,
    created_at: '2025-09-20T16:00:00.000Z',
    viewer_is_member: false,
  },
]

const DEMO_BY_ID = new Map(COMMUNITY_DEMO_GARDENS.map((g) => [g.id, g]))

/** Legacy production ids that fail UUID version validation (synthetic remap by garden name). */
const LEGACY_ID_BY_NAME: Record<string, string> = {
  'The Little Wild': 'b1111111-1111-4111-8111-111111111111',
  'Ocean Whispers': 'b2222222-2222-4222-8222-222222222222',
  'Sakura Reflections': 'b3333333-3333-4333-8333-333333333333',
}

export function isValidCommunityGardenUuid(id: string): boolean {
  return UUID_RE.test(id)
}

export function normalizePublicGardenIds(gardens: PublicGarden[]): PublicGarden[] {
  const seen = new Set<string>()
  const normalized: PublicGarden[] = []

  for (const garden of gardens) {
    let id = garden.id
    if (!isValidCommunityGardenUuid(id)) {
      const mapped = LEGACY_ID_BY_NAME[garden.name]
      if (mapped) id = mapped
    }
    if (!isValidCommunityGardenUuid(id) || seen.has(id)) continue
    seen.add(id)
    normalized.push({ ...garden, id })
  }

  for (const demo of COMMUNITY_DEMO_GARDENS) {
    if (!seen.has(demo.id)) {
      normalized.push(demo)
      seen.add(demo.id)
    }
  }

  return normalized
}

export function getDemoGardenDetail(gardenId: string): {
  garden: PublicGarden
  memories: Array<{
    id: string
    garden_id: string
    photo_url: string
    text: string
    contributor_name: string
    plant_stage: string
    plant_variety: string
    emotional_tone: string
    position_x: number
    position_y: number
    visit_count: number
    planted_at: string
  }>
  activity: Array<{
    id: string
    activity_type: 'join' | 'water' | 'reflect' | 'plant'
    description: string
    created_at: string
    user_name: string
  }>
} | null {
  const garden = DEMO_BY_ID.get(gardenId)
  if (!garden) return null
  const now = new Date().toISOString()
  return {
    garden,
    memories: [
      {
        id: `${gardenId}-mem-1`,
        garden_id: gardenId,
        photo_url:
          'data:image/svg+xml,' +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#e8f0e4" width="200" height="200"/><text x="100" y="110" text-anchor="middle" font-size="14" fill="#3d5c45">Shared bloom</text></svg>`,
          ),
        text: 'A shared memory from the community garden (synthetic preview).',
        contributor_name: garden.owner_name ?? 'Gardener',
        plant_stage: 'bloom',
        plant_variety: 'flower',
        emotional_tone: 'peaceful',
        position_x: 120,
        position_y: 340,
        visit_count: 3,
        planted_at: now,
      },
    ],
    activity: [
      {
        id: `${gardenId}-act-1`,
        activity_type: 'join',
        description: `${garden.owner_name ?? 'Someone'} tends this garden`,
        created_at: now,
        user_name: garden.owner_name ?? 'Gardener',
      },
    ],
  }
}
