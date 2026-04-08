/**
 * Garden analytics module.
 *
 * Computes aggregated statistics over a user's memory collection.  All
 * functions are pure (no side effects, no I/O) so they are easily testable
 * and safe to call on every render via `useMemo`.
 */

import type {
  Memory,
  EmotionalTone,
  PlantStage,
  PlantVariety,
  Season,
} from './types'
import { daysSince, groupByMonth, isoWeek } from './date-utils'
import { getSeason } from './garden-helpers'

// ── Aggregate stats shape ────────────────────────────────────────────────────

export interface GardenStats {
  /** Total number of memories in the garden */
  totalMemories: number
  /** Total number of reflections across all memories */
  totalReflections: number
  /** Total number of visits across all memories */
  totalVisits: number
  /** Distribution of memories per emotional tone */
  toneDistribution: Record<EmotionalTone, number>
  /** Distribution of memories per plant stage */
  stageDistribution: Record<PlantStage, number>
  /** Distribution of memories per plant variety */
  varietyDistribution: Record<PlantVariety, number>
  /** Distribution of memories per season (based on `plantedAt`) */
  seasonDistribution: Record<Season, number>
  /** Average age of memories in days */
  averageAgeDays: number
  /** Age of the oldest memory in days */
  oldestMemoryDays: number
  /** Age of the youngest memory in days */
  youngestMemoryDays: number
  /** Number of memories planted this week (ISO week) */
  plantedThisWeek: number
  /** Number of memories planted this month (calendar month) */
  plantedThisMonth: number
  /** Memory that has been visited the most */
  mostVisitedMemory: Memory | null
  /** Memory that has the most reflections */
  mostReflectedMemory: Memory | null
  /** Memories per month — useful for a calendar heatmap */
  memoriesPerMonth: Array<{ label: string; count: number }>
  /** Average reflections per memory */
  averageReflectionsPerMemory: number
  /** Fraction of memories that have at least one reflection (0–1) */
  reflectionRate: number
  /** Fraction of memories that have a photo (0–1) */
  photoRate: number
  /** Fraction of memories that have at least one audio recording (0–1) */
  audioRate: number
  /** Total unique locations */
  uniqueLocations: number
  /** Most-used location (or null if none) */
  topLocation: string | null
}

// ── Helper: season from a date ───────────────────────────────────────────────

function seasonFromDate(date: Date | string): Season {
  const month = new Date(date).getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

// ── Core computation ─────────────────────────────────────────────────────────

/**
 * Compute garden-wide aggregate statistics.
 *
 * @param memories - The full list of memories to analyse
 * @param now      - Reference "now" timestamp (default: `Date.now()`).
 *                   Injecting this makes tests deterministic.
 */
export function computeGardenStats(memories: Memory[], now = Date.now()): GardenStats {
  if (memories.length === 0) {
    return emptyStats()
  }

  const toneDistribution = zeroRecord<EmotionalTone>([
    'happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic',
  ])
  const stageDistribution = zeroRecord<PlantStage>([
    'seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder',
  ])
  const varietyDistribution = zeroRecord<PlantVariety>([
    'flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower',
    'ancient_oak', 'eternal_rose', 'phoenix_vine', 'starlight_succulent',
  ])
  const seasonDist = zeroRecord<Season>(['spring', 'summer', 'autumn', 'winter'])
  const locationCounts: Record<string, number> = {}

  let totalReflections = 0
  let totalVisits = 0
  let totalAgeMs = 0
  let oldestMs = 0
  let youngestMs = Infinity
  let plantedThisWeek = 0
  let plantedThisMonth = 0
  let memoriesWithReflections = 0
  let memoriesWithPhotos = 0
  let memoriesWithAudio = 0

  let mostVisited: Memory | null = null
  let mostReflected: Memory | null = null

  const nowDate = new Date(now)
  const currentWeek = isoWeek(nowDate)
  const currentYear = nowDate.getFullYear()
  const currentMonth = nowDate.getMonth()

  for (const m of memories) {
    // Tone
    toneDistribution[m.emotionalTone] = (toneDistribution[m.emotionalTone] || 0) + 1

    // Stage
    stageDistribution[m.plantStage] = (stageDistribution[m.plantStage] || 0) + 1

    // Variety
    varietyDistribution[m.plantVariety] = (varietyDistribution[m.plantVariety] || 0) + 1

    // Season of planting
    const plantedSeason = seasonFromDate(m.plantedAt)
    seasonDist[plantedSeason]++

    // Age
    const ageMs = now - new Date(m.plantedAt).getTime()
    totalAgeMs += ageMs
    if (ageMs > oldestMs) oldestMs = ageMs
    if (ageMs < youngestMs) youngestMs = ageMs

    // This week / this month
    const plantedDate = new Date(m.plantedAt)
    if (
      plantedDate.getFullYear() === currentYear &&
      isoWeek(plantedDate) === currentWeek
    ) {
      plantedThisWeek++
    }
    if (
      plantedDate.getFullYear() === currentYear &&
      plantedDate.getMonth() === currentMonth
    ) {
      plantedThisMonth++
    }

    // Reflections
    const rc = m.reflections.length
    totalReflections += rc
    if (rc > 0) memoriesWithReflections++

    // Visits
    totalVisits += m.visitCount

    // Photo
    if (m.photoUrl && m.photoUrl.trim() !== '') memoriesWithPhotos++

    // Audio
    if (m.audioRecordings && m.audioRecordings.length > 0) memoriesWithAudio++

    // Location
    if (m.location && m.location.trim()) {
      const loc = m.location.trim()
      locationCounts[loc] = (locationCounts[loc] || 0) + 1
    }

    // Most visited
    if (!mostVisited || m.visitCount > mostVisited.visitCount) {
      mostVisited = m
    }

    // Most reflected
    if (!mostReflected || rc > mostReflected.reflections.length) {
      mostReflected = m
    }
  }

  const n = memories.length

  // Top location
  const locationEntries = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])
  const topLocation = locationEntries.length > 0 ? locationEntries[0][0] : null

  // Memories per month
  const memoriesPerMonth = groupByMonth(memories, m => m.plantedAt)
    .map(g => ({ label: g.label, count: g.items.length }))

  return {
    totalMemories: n,
    totalReflections,
    totalVisits,
    toneDistribution,
    stageDistribution,
    varietyDistribution,
    seasonDistribution: seasonDist,
    averageAgeDays: Math.floor(totalAgeMs / n / 86400000),
    oldestMemoryDays: Math.floor(oldestMs / 86400000),
    youngestMemoryDays: Math.floor(youngestMs / 86400000),
    plantedThisWeek,
    plantedThisMonth,
    mostVisitedMemory: mostVisited,
    mostReflectedMemory: mostReflected,
    memoriesPerMonth,
    averageReflectionsPerMemory: totalReflections / n,
    reflectionRate: memoriesWithReflections / n,
    photoRate: memoriesWithPhotos / n,
    audioRate: memoriesWithAudio / n,
    uniqueLocations: Object.keys(locationCounts).length,
    topLocation,
  }
}

// ── Growth trend ─────────────────────────────────────────────────────────────

export interface GrowthTrend {
  /** ISO date of the data point */
  date: string
  /** Number of memories planted on this date */
  planted: number
  /** Running total of memories up to and including this date */
  total: number
  /** Total new reflections written on this date */
  reflections: number
}

/**
 * Compute a daily growth trend for the last `days` days.
 * Useful for rendering a sparkline / area chart.
 *
 * @param memories - Full memory list
 * @param days     - Number of days to look back (default: 30)
 * @param now      - Reference timestamp
 */
export function computeGrowthTrend(
  memories: Memory[],
  days = 30,
  now = Date.now()
): GrowthTrend[] {
  const buckets = new Map<string, { planted: number; reflections: number }>()
  const cutoff = now - days * 86400000

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    buckets.set(key, { planted: 0, reflections: 0 })
  }

  for (const m of memories) {
    const plantedTs = new Date(m.plantedAt).getTime()
    if (plantedTs >= cutoff) {
      const d = new Date(m.plantedAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const bucket = buckets.get(key)
      if (bucket) bucket.planted++
    }

    for (const r of m.reflections) {
      const rTs = new Date(r.createdAt).getTime()
      if (rTs >= cutoff) {
        const d = new Date(r.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const bucket = buckets.get(key)
        if (bucket) bucket.reflections++
      }
    }
  }

  let running = memories.filter(m => new Date(m.plantedAt).getTime() < cutoff).length

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => {
      running += data.planted
      return { date, planted: data.planted, total: running, reflections: data.reflections }
    })
}

// ── Per-memory age profile ───────────────────────────────────────────────────

export interface AgeProfile {
  memoryId: string
  ageDays: number
  visitCount: number
  reflectionCount: number
  /** Engagement ratio: reflections per visit (or per day if no visits) */
  engagementRatio: number
}

/**
 * Build an age/engagement profile for every memory.
 * Useful for identifying neglected or thriving memories.
 */
export function buildAgeProfiles(memories: Memory[], now = Date.now()): AgeProfile[] {
  return memories.map(m => {
    const ageDays = daysSince(m.plantedAt, now)
    const visitCount = m.visitCount
    const reflectionCount = m.reflections.length
    const engagementRatio = visitCount > 0
      ? reflectionCount / visitCount
      : (ageDays > 0 ? reflectionCount / ageDays : 0)
    return { memoryId: m.id, ageDays, visitCount, reflectionCount, engagementRatio }
  })
}

// ── Neglect detection ────────────────────────────────────────────────────────

/**
 * Return memories that haven't been visited in `thresholdDays` days.
 * These are candidates to surface in a "tend your garden" nudge.
 */
export function findNeglectedMemories(
  memories: Memory[],
  thresholdDays = 14,
  now = Date.now()
): Memory[] {
  return memories.filter(m => {
    const lastInteraction = m.lastVisited ?? m.plantedAt
    return daysSince(lastInteraction, now) >= thresholdDays
  })
}

// ── Tone velocity ────────────────────────────────────────────────────────────

export interface ToneVelocity {
  tone: EmotionalTone
  /** Number of memories with this tone planted in the recent window */
  recentCount: number
  /** Number of memories with this tone planted before the window */
  historicalCount: number
  /** Positive = growing, negative = declining */
  delta: number
}

/**
 * Compute the "velocity" of each emotional tone — whether it is becoming
 * more or less common recently compared to the historic baseline.
 *
 * @param memories      - Full memory list
 * @param windowDays    - "Recent" window in days (default: 30)
 * @param now           - Reference timestamp
 */
export function computeToneVelocity(
  memories: Memory[],
  windowDays = 30,
  now = Date.now()
): ToneVelocity[] {
  const cutoff = now - windowDays * 86400000
  const recent: Partial<Record<EmotionalTone, number>> = {}
  const historical: Partial<Record<EmotionalTone, number>> = {}

  for (const m of memories) {
    const ts = new Date(m.plantedAt).getTime()
    const bucket = ts >= cutoff ? recent : historical
    bucket[m.emotionalTone] = (bucket[m.emotionalTone] ?? 0) + 1
  }

  const tones: EmotionalTone[] = ['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']
  return tones.map(tone => {
    const r = recent[tone] ?? 0
    const h = historical[tone] ?? 0
    return { tone, recentCount: r, historicalCount: h, delta: r - h }
  })
}

// ── Cluster-affinity heatmap ─────────────────────────────────────────────────

export interface PositionCluster {
  centerX: number
  centerY: number
  radius: number
  memoryIds: string[]
}

/**
 * Identify spatial clusters of memories on the canvas using a simple
 * grid-based density approach (no external dep required).
 *
 * @param memories   - Memories with position data
 * @param cellSize   - Grid cell size in canvas units (default: 200)
 */
export function computePositionClusters(
  memories: Memory[],
  cellSize = 200
): PositionCluster[] {
  const cells = new Map<string, Memory[]>()

  for (const m of memories) {
    const cx = Math.floor(m.position.x / cellSize)
    const cy = Math.floor(m.position.y / cellSize)
    const key = `${cx},${cy}`
    if (!cells.has(key)) cells.set(key, [])
    cells.get(key)!.push(m)
  }

  const clusters: PositionCluster[] = []
  for (const [, group] of cells) {
    if (group.length < 2) continue
    const avgX = group.reduce((s, m) => s + m.position.x, 0) / group.length
    const avgY = group.reduce((s, m) => s + m.position.y, 0) / group.length
    const radius = Math.max(
      ...group.map(m => Math.hypot(m.position.x - avgX, m.position.y - avgY))
    )
    clusters.push({
      centerX: avgX,
      centerY: avgY,
      radius: Math.max(radius, cellSize / 2),
      memoryIds: group.map(m => m.id),
    })
  }

  return clusters.sort((a, b) => b.memoryIds.length - a.memoryIds.length)
}

// ── Summary sentence ─────────────────────────────────────────────────────────

/**
 * Generate a single human-readable summary sentence for the garden's current state.
 * Useful for an "at a glance" dashboard widget.
 */
export function gardenSummary(stats: GardenStats): string {
  if (stats.totalMemories === 0) {
    return 'Your garden is empty — plant your first memory to begin.'
  }

  const season = getSeason()
  const toneEntry = Object.entries(stats.toneDistribution)
    .sort((a, b) => b[1] - a[1])[0]
  const dominantTone = toneEntry?.[0] ?? 'peaceful'

  const stageEntry = Object.entries(stats.stageDistribution)
    .sort((a, b) => b[1] - a[1])[0]
  const dominantStage = stageEntry?.[0] ?? 'bloom'

  return (
    `This ${season}, your garden holds ${stats.totalMemories} ` +
    `${stats.totalMemories === 1 ? 'memory' : 'memories'} — mostly ${dominantTone}, ` +
    `with many plants at the ${dominantStage} stage. ` +
    `You have tended it ${stats.totalReflections} ` +
    `${stats.totalReflections === 1 ? 'time' : 'times'}.`
  )
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function zeroRecord<K extends string>(keys: K[]): Record<K, number> {
  const rec = {} as Record<K, number>
  for (const k of keys) rec[k] = 0
  return rec
}

function emptyStats(): GardenStats {
  return {
    totalMemories: 0,
    totalReflections: 0,
    totalVisits: 0,
    toneDistribution: zeroRecord(['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic']),
    stageDistribution: zeroRecord(['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']),
    varietyDistribution: zeroRecord([
      'flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower',
      'ancient_oak', 'eternal_rose', 'phoenix_vine', 'starlight_succulent',
    ]),
    seasonDistribution: zeroRecord(['spring', 'summer', 'autumn', 'winter']),
    averageAgeDays: 0,
    oldestMemoryDays: 0,
    youngestMemoryDays: 0,
    plantedThisWeek: 0,
    plantedThisMonth: 0,
    mostVisitedMemory: null,
    mostReflectedMemory: null,
    memoriesPerMonth: [],
    averageReflectionsPerMemory: 0,
    reflectionRate: 0,
    photoRate: 0,
    audioRate: 0,
    uniqueLocations: 0,
    topLocation: null,
  }
}
