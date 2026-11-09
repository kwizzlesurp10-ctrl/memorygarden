import { z } from 'zod'
import { authFetch } from '@/lib/auth/auth-fetch'
import type { CommunityPrivacyMode } from '../../api/gardens/lib/community-memory-privacy'
import type { EmotionalTone, Memory, PlantVariety } from '@/lib/types'

export type ApiResult<T> = { ok: true; value: T } | { ok: false; error: string }

const gardenSampleSchema = z.object({
  id: z.string(),
  photo_url: z.string(),
  text: z.string(),
  contributor_name: z.string().nullable().optional(),
  plant_stage: z.string(),
  plant_variety: z.string(),
  emotional_tone: z.string(),
})

const publicGardenSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  owner_name: z.string().nullable().optional(),
  owner_avatar_url: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  member_count: z.coerce.number().optional(),
  memory_count: z.coerce.number().optional(),
  created_at: z.string(),
  sample_memories: z.array(gardenSampleSchema).optional(),
  viewer_is_member: z.boolean().optional(),
})

export type PublicGarden = z.infer<typeof publicGardenSchema>

const gardenDetailSchema = publicGardenSchema.extend({
  allow_reflections: z.boolean().optional(),
  owner_id: z.string().optional(),
  viewer_is_member: z.boolean().optional(),
})

export type CommunityGardenDetail = z.infer<typeof gardenDetailSchema>

const gardenMemorySchema = z.object({
  id: z.string(),
  garden_id: z.string(),
  contributor_id: z.string().nullable().optional(),
  contributor_name: z.string().nullable().optional(),
  contributor_avatar_url: z.string().nullable().optional(),
  photo_url: z.string(),
  text: z.string(),
  memory_date: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  planted_at: z.string(),
  position_x: z.coerce.number(),
  position_y: z.coerce.number(),
  emotional_tone: z.string(),
  plant_stage: z.string(),
  plant_variety: z.string(),
  visit_count: z.coerce.number(),
  reflections: z
    .array(
      z.object({
        id: z.string(),
        userId: z.string().optional(),
        userName: z.string().optional(),
        text: z.string(),
        createdAt: z.string(),
      }),
    )
    .optional(),
})

export type GardenMemory = z.infer<typeof gardenMemorySchema>

const activitySchema = z.object({
  id: z.string(),
  user_name: z.string().nullable().optional(),
  activity_type: z.enum(['plant', 'water', 'reflect', 'join', 'leave']),
  description: z.string(),
  created_at: z.string(),
})

export type GardenActivity = z.infer<typeof activitySchema>

function gardensActionUrl(action: string): string {
  return `/api/gardens/${action}`
}

async function readApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error ?? `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

export async function fetchPublicGardens(viewerId?: string): Promise<ApiResult<PublicGarden[]>> {
  try {
    const search = new URLSearchParams()
    if (viewerId) search.set('viewerId', viewerId)
    const qs = search.toString()
    const res = await authFetch(`/api/gardens${qs ? `?${qs}` : ''}`)
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const json = (await res.json()) as { gardens?: unknown[] }
    const parsed = z.array(publicGardenSchema).safeParse(json.gardens ?? [])
    if (!parsed.success) return { ok: false, error: 'Invalid gardens response' }
    return { ok: true, value: parsed.data }
  } catch {
    return { ok: false, error: 'Could not reach community gardens' }
  }
}

export async function fetchGardenDetail(
  gardenId: string,
  options?: { viewerId?: string; privacyMode?: CommunityPrivacyMode },
): Promise<
  ApiResult<{
    garden: CommunityGardenDetail
    memories: GardenMemory[]
    activity: GardenActivity[]
  }>
> {
  try {
    const search = new URLSearchParams({ id: gardenId })
    if (options?.viewerId) search.set('viewerId', options.viewerId)
    if (options?.privacyMode) search.set('privacyMode', options.privacyMode)
    const res = await authFetch(`/api/gardens?${search.toString()}`)
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const json = (await res.json()) as {
      garden?: unknown
      memories?: unknown[]
      activity?: unknown[]
    }
    const gardenParsed = gardenDetailSchema.safeParse(json.garden)
    const memoriesParsed = z.array(gardenMemorySchema).safeParse(json.memories ?? [])
    const activityParsed = z.array(activitySchema).safeParse(json.activity ?? [])
    if (!gardenParsed.success || !memoriesParsed.success || !activityParsed.success) {
      return { ok: false, error: 'Invalid garden detail response' }
    }
    return {
      ok: true,
      value: {
        garden: gardenParsed.data,
        memories: memoriesParsed.data,
        activity: activityParsed.data,
      },
    }
  } catch {
    return { ok: false, error: 'Could not load this garden' }
  }
}

export async function joinCommunityGarden(params: {
  gardenId: string
  userId: string
  userName: string
  userAvatar?: string
}): Promise<ApiResult<{ alreadyMember?: boolean }>> {
  try {
    const res = await authFetch(gardensActionUrl('join'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const data = (await res.json()) as { alreadyMember?: boolean }
    return { ok: true, value: { alreadyMember: data.alreadyMember } }
  } catch {
    return { ok: false, error: 'Could not join garden' }
  }
}

export async function leaveCommunityGarden(params: {
  gardenId: string
  userId: string
  userName: string
}): Promise<ApiResult<void>> {
  try {
    const res = await authFetch(gardensActionUrl('leave'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    return { ok: true, value: undefined }
  } catch {
    return { ok: false, error: 'Could not leave garden' }
  }
}

export async function waterGardenMemory(params: {
  memoryId: string
  userId: string
  userName: string
}): Promise<ApiResult<{ visitCount: number; newStage: string | null }>> {
  try {
    const res = await authFetch(gardensActionUrl('water'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const data = (await res.json()) as { visitCount?: number; newStage?: string | null }
    return {
      ok: true,
      value: {
        visitCount: data.visitCount ?? 0,
        newStage: data.newStage ?? null,
      },
    }
  } catch {
    return { ok: false, error: 'Could not water this memory' }
  }
}

export async function reflectOnGardenMemory(params: {
  memoryId: string
  userId: string
  userName: string
  reflection: string
}): Promise<ApiResult<{ reflection: { id: string; text: string; createdAt: string; userName?: string } }>> {
  try {
    const res = await authFetch(gardensActionUrl('reflect'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const data = (await res.json()) as {
      reflection?: { id: string; text: string; createdAt: string; userName?: string }
    }
    if (!data.reflection) return { ok: false, error: 'Invalid reflection response' }
    return { ok: true, value: { reflection: data.reflection } }
  } catch {
    return { ok: false, error: 'Could not add reflection' }
  }
}

export interface PlantInGardenPayload {
  gardenId: string
  contributorId: string
  contributorName: string
  contributorAvatar?: string
  photoUrl: string
  text: string
  memoryDate?: string
  location?: string
  positionX: number
  positionY: number
  emotionalTone: EmotionalTone | string
  plantVariety: PlantVariety | string
  linkUrl?: string
  visibility?: 'public' | 'private'
}

export async function plantMemoryInGarden(
  payload: PlantInGardenPayload,
): Promise<ApiResult<{ memoryId: string }>> {
  try {
    const res = await authFetch(gardensActionUrl('plant'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const data = (await res.json()) as { memoryId?: string }
    if (!data.memoryId) return { ok: false, error: 'Invalid plant response' }
    return { ok: true, value: { memoryId: data.memoryId } }
  } catch {
    return { ok: false, error: 'Could not plant memory' }
  }
}

/** Placeholder blossom when the user writes a text-only community memory. */
export const COMMUNITY_TEXT_ONLY_PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#e8f5e9" width="400" height="400"/><circle cx="200" cy="180" r="48" fill="#81c784"/><text x="200" y="280" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#2e7d32">Shared memory</text></svg>`,
  )

export function randomGardenPlantPosition(): { x: number; y: number } {
  return {
    x: 180 + Math.floor(Math.random() * 520),
    y: 160 + Math.floor(Math.random() * 380),
  }
}

export function memoryToPlantPayload(
  memory: Memory,
  gardenId: string,
  contributor: { id: string; name: string; avatar?: string },
  visibility: 'public' | 'private',
): PlantInGardenPayload {
  const { x, y } = randomGardenPlantPosition()
  return {
    gardenId,
    contributorId: contributor.id,
    contributorName: contributor.name,
    contributorAvatar: contributor.avatar,
    photoUrl: memory.photoUrl || COMMUNITY_TEXT_ONLY_PHOTO,
    text: memory.text,
    memoryDate: memory.date,
    location: memory.location,
    positionX: x,
    positionY: y,
    emotionalTone: memory.emotionalTone,
    plantVariety: memory.plantVariety ?? 'flower',
    linkUrl: memory.linkUrl,
    visibility,
  }
}
