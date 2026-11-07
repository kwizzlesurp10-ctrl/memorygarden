import { isValidUserId, isValidUuid, sanitizeShortLabel } from '../../lib/api-ids'

export interface GardenAccessContext {
  gardenId: string
  userId: string
  userName: string
}

export function parseGardenAccessBody(
  body: unknown,
): { ok: true; value: GardenAccessContext } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid JSON body' }
  }
  const record = body as Record<string, unknown>
  const gardenId = record.gardenId
  const userId = record.userId
  const userName = sanitizeShortLabel(record.userName, 64)
  if (!isValidUuid(gardenId)) return { ok: false, error: 'Invalid gardenId' }
  if (!isValidUserId(userId)) return { ok: false, error: 'Invalid userId' }
  if (!userName) return { ok: false, error: 'Invalid userName' }
  return { ok: true, value: { gardenId, userId, userName } }
}

export function parseGardenLeaveBody(
  body: unknown,
): { ok: true; gardenId: string; userId: string; userName: string } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid JSON body' }
  }
  const record = body as Record<string, unknown>
  if (!isValidUuid(record.gardenId)) return { ok: false, error: 'Invalid gardenId' }
  if (!isValidUserId(record.userId)) return { ok: false, error: 'Invalid userId' }
  const userName = sanitizeShortLabel(record.userName, 64) ?? 'Someone'
  return {
    ok: true,
    gardenId: record.gardenId,
    userId: record.userId,
    userName,
  }
}

export function parseMemoryActionBody(
  body: unknown,
  options?: { requireUserId?: boolean },
): { ok: true; memoryId: string; userId: string; userName: string } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid JSON body' }
  }
  const record = body as Record<string, unknown>
  const memoryId = record.memoryId
  const userId = record.userId
  const userName = sanitizeShortLabel(record.userName ?? 'Gardener', 64) ?? 'Gardener'
  if (!isValidUuid(memoryId)) return { ok: false, error: 'Invalid memoryId' }
  if (options?.requireUserId) {
    if (!isValidUserId(userId)) return { ok: false, error: 'Invalid userId' }
    return { ok: true, memoryId, userId, userName }
  }
  if (typeof userId === 'string' && userId.length > 0 && !isValidUserId(userId)) {
    return { ok: false, error: 'Invalid userId' }
  }
  const resolvedUserId = typeof userId === 'string' && isValidUserId(userId) ? userId : ''
  return { ok: true, memoryId, userId: resolvedUserId, userName }
}

type SqlTag = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>
}

export async function isGardenMember(
  sql: SqlTag,
  gardenId: string,
  userId: string,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM garden_members
    WHERE garden_id = ${gardenId}::uuid AND user_id = ${userId}
    LIMIT 1
  `
  return rows.length > 0
}

export async function isGardenOwner(sql: SqlTag, gardenId: string, userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM gardens
    WHERE id = ${gardenId}::uuid AND owner_id = ${userId}
    LIMIT 1
  `
  return rows.length > 0
}

export async function canAccessCommunityGarden(
  sql: SqlTag,
  gardenId: string,
): Promise<'ok' | 'not_found' | 'closed'> {
  const rows = await sql`
    SELECT is_public FROM gardens WHERE id = ${gardenId}::uuid LIMIT 1
  `
  if (rows.length === 0) return 'not_found'
  const isPublic = Boolean((rows[0] as { is_public?: boolean }).is_public)
  return isPublic ? 'ok' : 'closed'
}

export async function memoryGardenId(sql: SqlTag, memoryId: string): Promise<string | null> {
  const rows = await sql`
    SELECT garden_id::text AS garden_id FROM garden_memories WHERE id = ${memoryId}::uuid LIMIT 1
  `
  if (rows.length === 0) return null
  return String((rows[0] as { garden_id: string }).garden_id)
}

export async function assertMemberCanMutateGarden(
  sql: SqlTag,
  gardenId: string,
  userId: string,
): Promise<{ allowed: true } | { allowed: false; status: number; error: string }> {
  const member = await isGardenMember(sql, gardenId, userId)
  const owner = await isGardenOwner(sql, gardenId, userId)
  if (!member && !owner) {
    return { allowed: false, status: 403, error: 'Not a garden member' }
  }
  return { allowed: true }
}
