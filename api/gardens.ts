/**
 * Community Gardens API
 * 
 * Routes:
 *   GET  /api/gardens              → List all public gardens
 *   GET  /api/gardens?id=<id>      → Get single garden with memories
 *   POST /api/gardens/join         → Join a garden
 *   POST /api/gardens/leave        → Leave a garden
 *   POST /api/gardens/plant        → Plant a memory in a garden
 *   POST /api/gardens/water        → Water a memory (increment visit)
 *   POST /api/gardens/reflect      → Add reflection to a memory
 */

import { neon } from '@neondatabase/serverless'
import { isValidUserId, isValidUuid, sanitizeShortLabel } from './lib/api-ids'
import {
  parseGardenAccessBody,
  parseGardenLeaveBody,
  parseMemoryActionBody,
} from './gardens/lib/garden-access'
import {
  sanitizeGardenMemoriesForViewer,
  type CommunityPrivacyMode,
  type RawGardenMemoryRow,
} from './gardens/lib/community-memory-privacy'
import { parseHttpHttpsLinkUrl } from '../src/lib/memory-link'

export const config = { runtime: 'edge' }

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 
      'content-type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) return null
  return neon(url)
}

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  const sql = getDb()
  if (!sql) {
    return jsonResponse(503, { error: 'Database not configured' })
  }

  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(Boolean)
  const action = pathParts[2] // e.g., 'join', 'leave', 'plant', etc.

  try {
    // GET /api/gardens - List all public gardens
    if (req.method === 'GET' && !action) {
      const gardenId = url.searchParams.get('id')
      
      if (gardenId) {
        if (!isValidUuid(gardenId)) {
          return jsonResponse(400, { error: 'Invalid garden id' })
        }
        const viewerId = url.searchParams.get('viewerId')
        if (viewerId && !isValidUserId(viewerId)) {
          return jsonResponse(400, { error: 'Invalid viewerId' })
        }
        const privacyMode = (url.searchParams.get('privacyMode') ?? 'camouflage') as CommunityPrivacyMode

        // Get single garden with memories
        const gardens = await sql`
          SELECT g.*, 
            (SELECT COUNT(*) FROM garden_members WHERE garden_id = g.id) as member_count,
            (SELECT COUNT(*) FROM garden_memories WHERE garden_id = g.id) as memory_count
          FROM gardens g 
          WHERE g.id = ${gardenId}::uuid
        `
        
        if (gardens.length === 0) {
          return jsonResponse(404, { error: 'Garden not found' })
        }

        const garden = gardens[0]
        const isOwner = Boolean(viewerId && garden.owner_id === viewerId)
        
        const rawMemories = await sql`
          SELECT
            id,
            garden_id,
            contributor_id,
            contributor_name,
            contributor_avatar_url,
            photo_url,
            text,
            memory_date,
            location,
            position_x,
            position_y,
            emotional_tone,
            plant_stage,
            plant_variety,
            visit_count,
            last_visited,
            planted_at,
            reflections,
            genetics_seed,
            visibility
          FROM garden_memories 
          WHERE garden_id = ${gardenId}::uuid
          ORDER BY planted_at DESC
        `

        const { memories, privateMemoryIds } = sanitizeGardenMemoriesForViewer({
          rawMemories: rawMemories as RawGardenMemoryRow[],
          isOwner,
          privacyMode,
        })
        
        const rawActivity = await sql`
          SELECT
            id,
            garden_id,
            user_id,
            user_name,
            activity_type,
            memory_id,
            description,
            created_at
          FROM garden_activity 
          WHERE garden_id = ${gardenId}::uuid
          ORDER BY created_at DESC
          LIMIT 20
        `

        const activity = rawActivity.map((act) => {
          if (!isOwner && act.memory_id && privateMemoryIds.has(String(act.memory_id))) {
            return {
              ...act,
              memory_id: null,
              description: `${act.user_name || 'A gardener'} tended a quiet seed in the garden`,
            }
          }
          return act
        })
        
        return jsonResponse(200, { 
          garden, 
          memories,
          activity
        })
      }
      
      // List all public gardens
      const gardens = await sql`
        SELECT g.*, 
          (SELECT COUNT(*) FROM garden_members WHERE garden_id = g.id) as member_count,
          (SELECT COUNT(*) FROM garden_memories WHERE garden_id = g.id) as memory_count
        FROM gardens g 
        WHERE g.is_public = true
        ORDER BY g.created_at DESC
      `
      
      // Get sample memories for each garden (up to 3)
      const gardensWithSamples = await Promise.all(
        gardens.map(async (garden) => {
          const samples = await sql`
            SELECT id, photo_url, text, contributor_name, plant_stage, plant_variety, emotional_tone
            FROM garden_memories 
            WHERE garden_id = ${garden.id}::uuid
            ORDER BY visit_count DESC
            LIMIT 3
          `
          return { ...garden, sample_memories: samples }
        })
      )
      
      return jsonResponse(200, { gardens: gardensWithSamples })
    }

    // POST /api/gardens/join
    if (req.method === 'POST' && action === 'join') {
      const rawBody: unknown = await req.json()
      const parsed = parseGardenAccessBody(rawBody)
      if (!parsed.ok) {
        return jsonResponse(400, { error: parsed.error })
      }
      const { gardenId, userId, userName } = parsed.value
      const userAvatar =
        rawBody && typeof rawBody === 'object' && typeof (rawBody as { userAvatar?: unknown }).userAvatar === 'string'
          ? (rawBody as { userAvatar: string }).userAvatar
          : undefined

      // Check if already a member
      const existing = await sql`
        SELECT id FROM garden_members 
        WHERE garden_id = ${gardenId}::uuid AND user_id = ${userId}
      `
      
      if (existing.length > 0) {
        return jsonResponse(200, { message: 'Already a member', alreadyMember: true })
      }
      
      // Add member
      await sql`
        INSERT INTO garden_members (garden_id, user_id, user_name, user_avatar_url, role)
        VALUES (${gardenId}::uuid, ${userId}, ${userName}, ${userAvatar || null}, 'member')
      `
      
      // Log activity
      await sql`
        INSERT INTO garden_activity (garden_id, user_id, user_name, activity_type, description)
        VALUES (${gardenId}::uuid, ${userId}, ${userName}, 'join', ${userName + ' joined the garden'})
      `
      
      return jsonResponse(200, { message: 'Joined garden successfully' })
    }

    // POST /api/gardens/leave
    if (req.method === 'POST' && action === 'leave') {
      const rawBody: unknown = await req.json()
      const parsed = parseGardenLeaveBody(rawBody)
      if (!parsed.ok) {
        return jsonResponse(400, { error: parsed.error })
      }
      const { gardenId, userId, userName } = parsed

      await sql`
        DELETE FROM garden_members 
        WHERE garden_id = ${gardenId}::uuid AND user_id = ${userId}
      `
      
      // Log activity
      await sql`
        INSERT INTO garden_activity (garden_id, user_id, user_name, activity_type, description)
        VALUES (${gardenId}::uuid, ${userId}, ${userName}, 'leave', ${userName + ' left the garden'})
      `
      
      return jsonResponse(200, { message: 'Left garden successfully' })
    }

    // POST /api/gardens/plant
    if (req.method === 'POST' && action === 'plant') {
      const body = await req.json() as {
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
        emotionalTone: string
        plantVariety: string
        linkUrl?: string
      }
      
      const {
        gardenId, contributorId, contributorName, contributorAvatar,
        photoUrl, text, memoryDate, location, positionX, positionY,
        emotionalTone, plantVariety, linkUrl: bodyLinkUrl,
      } = body

      if (!isValidUuid(gardenId) || !isValidUserId(contributorId)) {
        return jsonResponse(400, { error: 'Invalid gardenId or contributorId' })
      }
      const safeContributorName = sanitizeShortLabel(contributorName, 64)
      if (!safeContributorName || !photoUrl || typeof photoUrl !== 'string' || !text || typeof text !== 'string') {
        return jsonResponse(400, { error: 'Required fields missing' })
      }
      if (text.length > 20_000 || photoUrl.length > 2_000_000) {
        return jsonResponse(400, { error: 'Payload too large' })
      }
      if (bodyLinkUrl !== undefined && bodyLinkUrl !== null && String(bodyLinkUrl).trim() !== '') {
        const parsed = parseHttpHttpsLinkUrl(String(bodyLinkUrl))
        if (!parsed.valid) {
          return jsonResponse(400, { error: parsed.error ?? 'Invalid linkUrl' })
        }
      }
      const geneticsSeed = `${gardenId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
      
      const result = await sql`
        INSERT INTO garden_memories (
          garden_id, contributor_id, contributor_name, contributor_avatar_url,
          photo_url, text, memory_date, location, position_x, position_y,
          emotional_tone, plant_variety, genetics_seed
        )
        VALUES (
          ${gardenId}::uuid, ${contributorId}, ${safeContributorName}, ${contributorAvatar || null},
          ${photoUrl}, ${text}, ${memoryDate || null}::date, ${location || null}, ${positionX}, ${positionY},
          ${emotionalTone || 'peaceful'}, ${plantVariety || 'flower'}, ${geneticsSeed}
        )
        RETURNING id
      `
      
      // Log activity
      await sql`
        INSERT INTO garden_activity (garden_id, user_id, user_name, activity_type, memory_id, description)
        VALUES (${gardenId}::uuid, ${contributorId}, ${safeContributorName}, 'plant', ${result[0].id}::uuid, ${safeContributorName + ' planted a new memory'})
      `
      
      return jsonResponse(200, { message: 'Memory planted', memoryId: result[0].id })
    }

    // POST /api/gardens/water
    if (req.method === 'POST' && action === 'water') {
      const rawBody: unknown = await req.json()
      const parsed = parseMemoryActionBody(rawBody)
      if (!parsed.ok) {
        return jsonResponse(400, { error: parsed.error })
      }
      const { memoryId, userId, userName } = parsed

      const result = await sql`
        UPDATE garden_memories 
        SET visit_count = visit_count + 1, last_visited = NOW()
        WHERE id = ${memoryId}::uuid
        RETURNING garden_id, visit_count
      `
      
      if (result.length === 0) {
        return jsonResponse(404, { error: 'Memory not found' })
      }
      
      // Check for stage evolution based on visits
      const visitCount = result[0].visit_count
      let newStage = null
      if (visitCount >= 50) newStage = 'bloom'
      else if (visitCount >= 30) newStage = 'flowering'
      else if (visitCount >= 15) newStage = 'mature'
      else if (visitCount >= 8) newStage = 'young'
      else if (visitCount >= 4) newStage = 'seedling'
      else if (visitCount >= 2) newStage = 'sprout'
      
      if (newStage) {
        await sql`
          UPDATE garden_memories SET plant_stage = ${newStage} WHERE id = ${memoryId}::uuid
        `
      }
      
      if (userId && userName) {
        await sql`
          INSERT INTO garden_activity (garden_id, user_id, user_name, activity_type, memory_id, description)
          VALUES (${result[0].garden_id}::uuid, ${userId}, ${userName}, 'water', ${memoryId}::uuid, ${userName + ' watered a memory'})
        `
      }
      
      return jsonResponse(200, { message: 'Memory watered', visitCount, newStage })
    }

    // POST /api/gardens/reflect
    if (req.method === 'POST' && action === 'reflect') {
      const rawBody: unknown = await req.json()
      const parsed = parseMemoryActionBody(rawBody)
      if (!parsed.ok) {
        return jsonResponse(400, { error: parsed.error })
      }
      const { memoryId, userId, userName } = parsed
      const reflection =
        rawBody && typeof rawBody === 'object' && typeof (rawBody as { reflection?: unknown }).reflection === 'string'
          ? (rawBody as { reflection: string }).reflection.trim()
          : ''
      if (!reflection || reflection.length > 4_000) {
        return jsonResponse(400, { error: 'Invalid reflection' })
      }

      const memory = await sql`
        SELECT reflections, garden_id FROM garden_memories WHERE id = ${memoryId}::uuid
      `
      
      if (memory.length === 0) {
        return jsonResponse(404, { error: 'Memory not found' })
      }
      
      const currentReflections = memory[0].reflections || []
      const newReflection = {
        id: `ref-${Date.now()}`,
        userId,
        userName,
        text: reflection,
        createdAt: new Date().toISOString(),
        isTend: true,
      }
      
      await sql`
        UPDATE garden_memories 
        SET reflections = ${JSON.stringify([...currentReflections, newReflection])}::jsonb
        WHERE id = ${memoryId}::uuid
      `
      
      // Log activity
      await sql`
        INSERT INTO garden_activity (garden_id, user_id, user_name, activity_type, memory_id, description)
        VALUES (${memory[0].garden_id}::uuid, ${userId}, ${userName}, 'reflect', ${memoryId}::uuid, ${userName + ' added a reflection'})
      `
      
      return jsonResponse(200, { message: 'Reflection added', reflection: newReflection })
    }

    return jsonResponse(404, { error: 'Not found' })
  } catch (error) {
    console.error('Gardens API error:', error)
    return jsonResponse(500, { error: 'Internal server error' })
  }
}
