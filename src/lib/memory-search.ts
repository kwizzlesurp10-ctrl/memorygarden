/**
 * Advanced memory search with relevance scoring.
 *
 * Provides a ranked full-text search over the memory collection that goes
 * beyond the basic substring filter in `garden-helpers.filterMemories`.
 * Results are ranked by a composite score that weighs title matches more
 * heavily than reflection content, and boosts recent memories slightly.
 *
 * All functions are pure — no side effects, no I/O.
 */

import type { Memory, EmotionalTone, PlantStage } from './types'
import { daysSince } from './date-utils'

// ── Result type ──────────────────────────────────────────────────────────────

export interface SearchHit {
  memory: Memory
  /** Composite relevance score (higher = more relevant) */
  score: number
  /** Which fields the query matched */
  matchedFields: MatchedField[]
  /** Highlighted snippets per matched field (key = field name) */
  highlights: Record<string, string>
}

export type MatchedField = 'text' | 'location' | 'reflection' | 'date'

// ── Scoring weights ──────────────────────────────────────────────────────────

const WEIGHT = {
  /** Exact case-insensitive phrase match in main text */
  textExact: 30,
  /** Each token found in main text */
  textToken: 5,
  /** Token found in location */
  locationToken: 3,
  /** Token found in any reflection */
  reflectionToken: 2,
  /** Date string match (YYYY-MM-DD) */
  dateMatch: 10,
  /** Recency boost per stage above seed */
  recencyBoostPerStage: 1,
  /** Boost for visited memories */
  visitBoost: 0.1,
} as const

// ── Tokeniser ────────────────────────────────────────────────────────────────

/**
 * Split a query string into individual tokens, filtering out very short ones.
 * Returns an array of lower-cased tokens.
 */
export function tokenise(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.replace(/[^\w'-]/g, ''))
    .filter(t => t.length >= 2)
}

// ── Highlight ─────────────────────────────────────────────────────────────────

/**
 * Wrap matching tokens in a field value with `<mark>` tags.
 * Returns the original string if no tokens match.
 *
 * The result is intentionally HTML — components should render it safely
 * (e.g. via `dangerouslySetInnerHTML` after sanitising the *source* field,
 * not the highlight output).
 */
export function highlightTokens(text: string, tokens: string[]): string {
  if (tokens.length === 0) return text
  const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  return text.replace(pattern, '<mark>$1</mark>')
}

/**
 * Extract a short snippet (up to `maxLength` chars) around the first match.
 */
export function extractSnippet(text: string, tokens: string[], maxLength = 140): string {
  if (tokens.length === 0) return text.slice(0, maxLength)
  const lower = text.toLowerCase()
  let firstMatch = text.length
  for (const token of tokens) {
    const idx = lower.indexOf(token)
    if (idx !== -1 && idx < firstMatch) firstMatch = idx
  }
  if (firstMatch === text.length) return text.slice(0, maxLength)
  const start = Math.max(0, firstMatch - 20)
  const end = Math.min(text.length, start + maxLength)
  const snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
  return snippet
}

// ── Scoring ──────────────────────────────────────────────────────────────────

const STAGE_INDEX: Record<PlantStage, number> = {
  seed: 0, sprout: 1, seedling: 2, young: 3,
  bud: 4, bloom: 5, mature: 6, elder: 7,
}

function scoreMemory(
  memory: Memory,
  tokens: string[],
  rawQuery: string,
  now: number
): { score: number; matchedFields: MatchedField[]; highlights: Record<string, string> } {
  let score = 0
  const matchedFields: MatchedField[] = []
  const highlights: Record<string, string> = {}

  const textLower = memory.text.toLowerCase()
  const queryLower = rawQuery.toLowerCase().trim()

  // ── Exact phrase bonus ────────────────────────────────────────────────────
  if (queryLower && textLower.includes(queryLower)) {
    score += WEIGHT.textExact
    if (!matchedFields.includes('text')) matchedFields.push('text')
  }

  // ── Token scoring on main text ────────────────────────────────────────────
  let textTokenHits = 0
  for (const token of tokens) {
    if (textLower.includes(token)) textTokenHits++
  }
  if (textTokenHits > 0) {
    score += textTokenHits * WEIGHT.textToken
    if (!matchedFields.includes('text')) matchedFields.push('text')
    const snippet = extractSnippet(memory.text, tokens)
    highlights['text'] = highlightTokens(snippet, tokens)
  }

  // ── Location ──────────────────────────────────────────────────────────────
  if (memory.location) {
    const locLower = memory.location.toLowerCase()
    let locHits = 0
    for (const token of tokens) {
      if (locLower.includes(token)) locHits++
    }
    if (locHits > 0) {
      score += locHits * WEIGHT.locationToken
      matchedFields.push('location')
      highlights['location'] = highlightTokens(memory.location, tokens)
    }
  }

  // ── Reflections ───────────────────────────────────────────────────────────
  let reflectionHits = 0
  for (const r of memory.reflections) {
    const rLower = r.text.toLowerCase()
    for (const token of tokens) {
      if (rLower.includes(token)) reflectionHits++
    }
  }
  if (reflectionHits > 0) {
    score += reflectionHits * WEIGHT.reflectionToken
    matchedFields.push('reflection')
    // Find first matching reflection for highlight
    const firstMatchingReflection = memory.reflections.find(r =>
      tokens.some(t => r.text.toLowerCase().includes(t))
    )
    if (firstMatchingReflection) {
      highlights['reflection'] = highlightTokens(
        extractSnippet(firstMatchingReflection.text, tokens),
        tokens
      )
    }
  }

  // ── Date match ────────────────────────────────────────────────────────────
  if (tokens.some(t => memory.date.includes(t) || memory.plantedAt.includes(t))) {
    score += WEIGHT.dateMatch
    matchedFields.push('date')
    highlights['date'] = memory.date
  }

  // ── Recency / vitality boost (only applied when there is at least one match) ──
  // Unconditional boosts would cause unrelated memories to appear in results.
  if (matchedFields.length > 0) {
    const stageIdx = STAGE_INDEX[memory.plantStage] ?? 0
    score += stageIdx * WEIGHT.recencyBoostPerStage
    score += Math.min(memory.visitCount * WEIGHT.visitBoost, 5)
  }

  return { score, matchedFields, highlights }
}

// ── Public search API ────────────────────────────────────────────────────────

export interface SearchOptions {
  /** Maximum number of results to return (default: 50) */
  limit?: number
  /** Minimum relevance score to include in results (default: 1) */
  minScore?: number
  /** If provided, pre-filter by these emotional tones before scoring */
  tones?: EmotionalTone[]
  /** If provided, pre-filter by these plant stages before scoring */
  stages?: PlantStage[]
  /** If provided, only return memories from this location */
  location?: string
  /** Reference timestamp for recency scoring (default: Date.now()) */
  now?: number
}

/**
 * Perform a ranked full-text search over a list of memories.
 *
 * Returns an array of `SearchHit` objects sorted by descending score.
 * If `query` is blank, returns all memories sorted by most-recently-planted.
 *
 * @param memories - Memory collection to search
 * @param query    - Free-text search query
 * @param options  - Optional search tuning parameters
 */
export function searchMemories(
  memories: Memory[],
  query: string,
  options: SearchOptions = {}
): SearchHit[] {
  const {
    limit = 50,
    minScore = 1,
    tones,
    stages,
    location,
    now = Date.now(),
  } = options

  // Pre-filter
  let candidates = memories
  if (tones && tones.length > 0) {
    candidates = candidates.filter(m => tones.includes(m.emotionalTone))
  }
  if (stages && stages.length > 0) {
    candidates = candidates.filter(m => stages.includes(m.plantStage))
  }
  if (location) {
    candidates = candidates.filter(
      m => m.location?.toLowerCase().includes(location.toLowerCase())
    )
  }

  const trimmedQuery = query.trim()

  // Empty query — return all pre-filtered memories by most recent
  if (!trimmedQuery) {
    return candidates
      .slice()
      .sort((a, b) => new Date(b.plantedAt).getTime() - new Date(a.plantedAt).getTime())
      .slice(0, limit)
      .map(m => ({
        memory: m,
        score: 0,
        matchedFields: [],
        highlights: {},
      }))
  }

  const tokens = tokenise(trimmedQuery)

  const hits: SearchHit[] = []
  for (const m of candidates) {
    const { score, matchedFields, highlights } = scoreMemory(m, tokens, trimmedQuery, now)
    if (score >= minScore) {
      hits.push({ memory: m, score, matchedFields, highlights })
    }
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Convenience: return only the matched memories (no scoring metadata).
 * Equivalent to `searchMemories(...).map(h => h.memory)`.
 */
export function searchMemoriesSimple(
  memories: Memory[],
  query: string,
  options?: SearchOptions
): Memory[] {
  return searchMemories(memories, query, options).map(h => h.memory)
}

// ── Suggestions ──────────────────────────────────────────────────────────────

/**
 * Return up to `n` suggested search terms from the memory collection.
 * Suggestions are generated from significant words in memory texts.
 */
export function getSearchSuggestions(memories: Memory[], n = 8): string[] {
  const freq = new Map<string, number>()
  const STOPWORDS = new Set([
    'the', 'and', 'that', 'this', 'was', 'for', 'are', 'but', 'not',
    'you', 'all', 'can', 'had', 'her', 'she', 'he', 'they', 'his',
    'have', 'from', 'one', 'our', 'out', 'with', 'been', 'into',
  ])

  for (const m of memories) {
    const tokens = tokenise(m.text).filter(t => t.length >= 4 && !STOPWORDS.has(t))
    for (const t of tokens) {
      freq.set(t, (freq.get(t) ?? 0) + 1)
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term]) => term)
}
