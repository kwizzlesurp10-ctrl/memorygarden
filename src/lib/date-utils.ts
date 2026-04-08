/**
 * Date utility helpers for MemoryGarden.
 *
 * Centralises all date formatting, relative-time computation, and calendar
 * helpers so UI components never import `date-fns` directly.  This keeps the
 * API surface small and lets us swap the underlying library if needed.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type RelativeTimeUnit =
  | 'just now'
  | 'minutes ago'
  | 'hours ago'
  | 'yesterday'
  | 'days ago'
  | 'weeks ago'
  | 'months ago'
  | 'years ago'

export interface RelativeTime {
  value: number
  unit: RelativeTimeUnit
  /** Full human-readable string, e.g. "3 days ago" */
  label: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const SECOND_MS = 1_000
const MINUTE_MS = 60 * SECOND_MS
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS
const MONTH_MS = 30 * DAY_MS
const YEAR_MS = 365 * DAY_MS

// ── Relative time ────────────────────────────────────────────────────────────

/**
 * Returns a human-readable relative time string for a past date.
 * The result is intentionally approximate — it is meant for display
 * purposes, not for precise time arithmetic.
 *
 * @example
 * getRelativeTime(new Date(Date.now() - 3 * DAY_MS))
 * // → { value: 3, unit: 'days ago', label: '3 days ago' }
 */
export function getRelativeTime(date: Date | string | number, now = Date.now()): RelativeTime {
  const ts = typeof date === 'number' ? date : new Date(date).getTime()
  const delta = now - ts

  if (delta < MINUTE_MS) {
    return { value: 0, unit: 'just now', label: 'just now' }
  }
  if (delta < HOUR_MS) {
    const v = Math.floor(delta / MINUTE_MS)
    return { value: v, unit: 'minutes ago', label: v === 1 ? '1 minute ago' : `${v} minutes ago` }
  }
  if (delta < DAY_MS) {
    const v = Math.floor(delta / HOUR_MS)
    return { value: v, unit: 'hours ago', label: v === 1 ? '1 hour ago' : `${v} hours ago` }
  }
  if (delta < 2 * DAY_MS) {
    return { value: 1, unit: 'yesterday', label: 'yesterday' }
  }
  if (delta < WEEK_MS) {
    const v = Math.floor(delta / DAY_MS)
    return { value: v, unit: 'days ago', label: `${v} days ago` }
  }
  if (delta < MONTH_MS) {
    const v = Math.floor(delta / WEEK_MS)
    return { value: v, unit: 'weeks ago', label: v === 1 ? '1 week ago' : `${v} weeks ago` }
  }
  if (delta < YEAR_MS) {
    const v = Math.floor(delta / MONTH_MS)
    return { value: v, unit: 'months ago', label: v === 1 ? '1 month ago' : `${v} months ago` }
  }
  const v = Math.floor(delta / YEAR_MS)
  return { value: v, unit: 'years ago', label: v === 1 ? '1 year ago' : `${v} years ago` }
}

// ── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a date as a localised, human-friendly string.
 * Falls back gracefully if the Intl API is unavailable.
 *
 * @param date  - Any parseable date value
 * @param style - Intl `dateStyle` option (default: 'medium')
 * @param locale - BCP-47 locale tag (default: browser locale)
 */
export function formatDate(
  date: Date | string | number,
  style: Intl.DateTimeFormatOptions['dateStyle'] = 'medium',
  locale?: string
): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(
      typeof date === 'object' ? date : new Date(date)
    )
  } catch {
    // Graceful fallback for environments without Intl
    return new Date(date).toLocaleDateString()
  }
}

/**
 * Format a date as a short "Apr 8, 2025"-style string.
 */
export function formatShortDate(date: Date | string | number, locale?: string): string {
  return formatDate(date, 'medium', locale)
}

/**
 * Format a date as a full "Wednesday, April 8, 2025"-style string.
 */
export function formatLongDate(date: Date | string | number, locale?: string): string {
  return formatDate(date, 'full', locale)
}

/**
 * Format a date as a compact "Apr 2025"-style month-year string.
 */
export function formatMonthYear(date: Date | string | number, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(
      typeof date === 'object' ? date : new Date(date)
    )
  } catch {
    const d = new Date(date)
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`
  }
}

/**
 * Format a date as an ISO 8601 date-only string (YYYY-MM-DD),
 * using the **local** timezone (not UTC).
 */
export function toLocalISODate(date: Date | string | number): string {
  const d = typeof date === 'object' ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Duration ─────────────────────────────────────────────────────────────────

/**
 * Return the number of whole days between two dates.
 * The result is always non-negative (absolute value of the difference).
 */
export function daysBetween(a: Date | string | number, b: Date | string | number): number {
  const ta = typeof a === 'number' ? a : new Date(a).getTime()
  const tb = typeof b === 'number' ? b : new Date(b).getTime()
  return Math.floor(Math.abs(tb - ta) / DAY_MS)
}

/**
 * Return the number of whole days since a given date (up to now).
 */
export function daysSince(date: Date | string | number, now = Date.now()): number {
  const ts = typeof date === 'number' ? date : new Date(date).getTime()
  return Math.max(0, Math.floor((now - ts) / DAY_MS))
}

/**
 * Format a duration in seconds as "mm:ss" (used for audio player display).
 */
export function formatDuration(seconds: number): string {
  const totalSecs = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// ── Calendar helpers ─────────────────────────────────────────────────────────

/**
 * Return the ISO week number (1–53) for a given date.
 * Uses ISO 8601 week numbering where Monday is the first day.
 */
export function isoWeek(date: Date | string | number): number {
  const d = typeof date === 'object' ? new Date(date) : new Date(date)
  d.setHours(0, 0, 0, 0)
  // Set to nearest Thursday (ISO week belongs to the year containing this Thursday)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)
}

/**
 * Return the calendar quarter (1–4) for a given date.
 */
export function quarter(date: Date | string | number): 1 | 2 | 3 | 4 {
  const month = new Date(date).getMonth() // 0-indexed
  return (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4
}

/**
 * Return an array of ISO date strings for all days in the same calendar month
 * as the provided date.
 */
export function daysInMonth(date: Date | string | number): string[] {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth()
  const count = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: count }, (_, i) =>
    toLocalISODate(new Date(year, month, i + 1))
  )
}

/**
 * Return the start (00:00:00.000) of a given day in local time.
 */
export function startOfDay(date: Date | string | number): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Return the end (23:59:59.999) of a given day in local time.
 */
export function endOfDay(date: Date | string | number): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Check whether two dates fall on the same calendar day (local time).
 */
export function isSameDay(a: Date | string | number, b: Date | string | number): boolean {
  return toLocalISODate(a) === toLocalISODate(b)
}

/**
 * Check whether a date falls within a given inclusive date range.
 * Pass `undefined` for either bound to leave it open.
 */
export function isWithinDateRange(
  date: Date | string | number,
  start?: Date | string | number,
  end?: Date | string | number
): boolean {
  const ts = new Date(date).getTime()
  if (start !== undefined && ts < startOfDay(start).getTime()) return false
  if (end !== undefined && ts > endOfDay(end).getTime()) return false
  return true
}

// ── Grouping helpers ─────────────────────────────────────────────────────────

/**
 * Group an array of items by a calendar label derived from their date.
 * Items are grouped month-year (e.g. "Apr 2025") in reverse chronological order.
 *
 * @param items     - Array of items to group
 * @param getDate   - Accessor that returns the date string/number for an item
 * @param locale    - Optional BCP-47 locale for the label
 */
export function groupByMonth<T>(
  items: T[],
  getDate: (item: T) => string | number | Date,
  locale?: string
): Array<{ label: string; items: T[] }> {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const label = formatMonthYear(getDate(item), locale)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(item)
  }

  // Return in reverse chronological order (most-recent month first)
  return [...groups.entries()]
    .map(([label, grpItems]) => ({ label, items: grpItems }))
    .sort((a, b) => {
      const aDate = new Date(getDate(a.items[0])).getTime()
      const bDate = new Date(getDate(b.items[0])).getTime()
      return bDate - aDate
    })
}

/**
 * Group an array of items by ISO year.
 */
export function groupByYear<T>(
  items: T[],
  getDate: (item: T) => string | number | Date
): Array<{ year: number; items: T[] }> {
  const groups = new Map<number, T[]>()

  for (const item of items) {
    const year = new Date(getDate(item)).getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(item)
  }

  return [...groups.entries()]
    .map(([year, grpItems]) => ({ year, items: grpItems }))
    .sort((a, b) => b.year - a.year)
}

// ── Streaks & patterns ───────────────────────────────────────────────────────

/**
 * Compute the current consecutive-day streak from an array of ISO date strings
 * (e.g. the dates on which a user visited the garden).
 *
 * "Current streak" ends today; if today is not in the list we check yesterday.
 * Returns 0 if there is no recent activity.
 */
export function computeStreak(dateSeen: string[], now = new Date()): number {
  if (dateSeen.length === 0) return 0

  const unique = [...new Set(dateSeen.map(d => toLocalISODate(d)))].sort().reverse()
  const todayStr = toLocalISODate(now)
  const yesterdayStr = toLocalISODate(new Date(now.getTime() - DAY_MS))

  // Streak must include today or yesterday to be "active"
  if (unique[0] !== todayStr && unique[0] !== yesterdayStr) return 0

  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1])
    const curr = new Date(unique[i])
    if (daysBetween(prev, curr) === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Return the longest historical streak from an array of ISO date strings.
 */
export function computeLongestStreak(dateSeen: string[]): number {
  if (dateSeen.length === 0) return 0

  const sorted = [...new Set(dateSeen.map(d => toLocalISODate(d)))].sort()
  let longest = 1
  let current = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    if (daysBetween(prev, curr) === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }
  return longest
}
