import type { ActivityEvent, GardenMember, Memory } from '@/lib/types'

/**
 * Derive the social activity stream from the synced memory set.
 *
 * Because `Memory` (and its `reflections[]`) is the only entity that propagates
 * across gardeners via cloud sync, the feed/leaderboard/notifications are all
 * computed from it rather than from a viewer-local event log. Each memory yields
 * a `plant` event (from `plantedBy` + `plantedAt`) and one `reflect` event per
 * reflection that carries contributor attribution. Events are sorted newest
 * first. Reactions are intentionally excluded — they carry no per-action
 * timestamp, so they can't be ordered in a chronological feed.
 */
export function deriveActivityFromMemories(memories: Memory[]): ActivityEvent[] {
  const events: ActivityEvent[] = []

  for (const memory of memories) {
    if (memory.plantedBy) {
      events.push({
        id: `plant-${memory.id}`,
        type: 'plant',
        userId: memory.plantedBy.id,
        userLogin: memory.plantedBy.login,
        memoryId: memory.id,
        description: 'planted a new memory',
        createdAt: memory.plantedAt,
      })
    }

    for (const reflection of memory.reflections) {
      if (!reflection.contributorId || !reflection.contributorLogin) continue
      const planterLogin = memory.plantedBy?.login
      const description =
        reflection.isTend && planterLogin
          ? `tended ${planterLogin}'s memory`
          : 'left a reflection'
      events.push({
        id: `reflect-${reflection.id}`,
        type: 'reflect',
        userId: reflection.contributorId,
        userLogin: reflection.contributorLogin,
        memoryId: memory.id,
        description,
        createdAt: reflection.createdAt,
      })
    }
  }

  return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Count activity events newer than `lastSeenIso` that were NOT performed by the
 * current user — i.e. unread activity from other gardeners. A viewer's own
 * actions never count as unread.
 */
export function countUnreadActivity(
  events: ActivityEvent[],
  lastSeenIso: string | undefined,
  currentUserId: string | undefined,
): number {
  const lastSeen = lastSeenIso ? new Date(lastSeenIso).getTime() : 0
  return events.reduce((count, e) => {
    if (currentUserId && e.userId === currentUserId) return count
    return new Date(e.createdAt).getTime() > lastSeen ? count + 1 : count
  }, 0)
}

export interface ContributorStat {
  userId: string
  login: string
  avatarUrl?: string
  plants: number
  reflections: number
  boosts: number
  /** plants + reflections + boosts — used for ranking. */
  total: number
}

/**
 * Aggregate plant/reflect/boost counts per contributor from a garden's activity
 * stream, ranked by total contributions descending. Member metadata (login,
 * avatar) is preferred over the event snapshot when available.
 */
export function computeLeaderboard(
  events: ActivityEvent[],
  members: GardenMember[],
): ContributorStat[] {
  const byUser = new Map<string, ContributorStat>()
  const memberById = new Map(members.map((m) => [m.userId, m]))

  for (const e of events) {
    if (e.type !== 'plant' && e.type !== 'reflect' && e.type !== 'boost') continue
    let stat = byUser.get(e.userId)
    if (!stat) {
      const member = memberById.get(e.userId)
      stat = {
        userId: e.userId,
        login: member?.login || e.userLogin,
        avatarUrl: member?.avatarUrl,
        plants: 0,
        reflections: 0,
        boosts: 0,
        total: 0,
      }
      byUser.set(e.userId, stat)
    }
    if (e.type === 'plant') stat.plants += 1
    else if (e.type === 'reflect') stat.reflections += 1
    else stat.boosts += 1
    stat.total += 1
  }

  return Array.from(byUser.values()).sort((a, b) => b.total - a.total)
}
