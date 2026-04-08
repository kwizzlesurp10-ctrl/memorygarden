import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getRelativeTime,
  formatDate,
  formatShortDate,
  formatLongDate,
  formatMonthYear,
  toLocalISODate,
  daysBetween,
  daysSince,
  formatDuration,
  isoWeek,
  quarter,
  daysInMonth,
  startOfDay,
  endOfDay,
  isSameDay,
  isWithinDateRange,
  groupByMonth,
  groupByYear,
  computeStreak,
  computeLongestStreak,
} from '../date-utils'

// ── Reference dates ──────────────────────────────────────────────────────────

// 2024-04-08 12:00:00 UTC (a Monday)
const REF_NOW = new Date('2024-04-08T12:00:00.000Z').getTime()

// ── getRelativeTime ───────────────────────────────────────────────────────────

describe('getRelativeTime', () => {
  it('returns "just now" for less than a minute ago', () => {
    const result = getRelativeTime(REF_NOW - 30_000, REF_NOW)
    expect(result.unit).toBe('just now')
    expect(result.label).toBe('just now')
  })

  it('returns minutes for 2–59 minutes ago', () => {
    const result = getRelativeTime(REF_NOW - 5 * 60_000, REF_NOW)
    expect(result.unit).toBe('minutes ago')
    expect(result.value).toBe(5)
    expect(result.label).toBe('5 minutes ago')
  })

  it('returns singular minute for exactly 1 minute', () => {
    const result = getRelativeTime(REF_NOW - 60_000, REF_NOW)
    expect(result.label).toBe('1 minute ago')
  })

  it('returns hours for 1–23 hours ago', () => {
    const result = getRelativeTime(REF_NOW - 3 * 3600_000, REF_NOW)
    expect(result.unit).toBe('hours ago')
    expect(result.value).toBe(3)
  })

  it('returns "yesterday" for 1–2 days ago', () => {
    const result = getRelativeTime(REF_NOW - 25 * 3600_000, REF_NOW)
    expect(result.unit).toBe('yesterday')
    expect(result.label).toBe('yesterday')
  })

  it('returns days for 2–6 days ago', () => {
    const result = getRelativeTime(REF_NOW - 4 * 86400_000, REF_NOW)
    expect(result.unit).toBe('days ago')
    expect(result.value).toBe(4)
  })

  it('returns weeks for 1–4 weeks ago', () => {
    const result = getRelativeTime(REF_NOW - 14 * 86400_000, REF_NOW)
    expect(result.unit).toBe('weeks ago')
    expect(result.value).toBe(2)
  })

  it('returns months for 1–11 months ago', () => {
    const result = getRelativeTime(REF_NOW - 60 * 86400_000, REF_NOW)
    expect(result.unit).toBe('months ago')
  })

  it('returns years for >= 1 year ago', () => {
    const result = getRelativeTime(REF_NOW - 400 * 86400_000, REF_NOW)
    expect(result.unit).toBe('years ago')
    expect(result.value).toBe(1)
  })

  it('returns singular year for exactly 1 year', () => {
    const result = getRelativeTime(REF_NOW - 365 * 86400_000, REF_NOW)
    expect(result.label).toBe('1 year ago')
  })

  it('accepts a Date object', () => {
    const result = getRelativeTime(new Date(REF_NOW - 60_000), REF_NOW)
    expect(result.unit).toBe('minutes ago')
  })
})

// ── toLocalISODate ────────────────────────────────────────────────────────────

describe('toLocalISODate', () => {
  it('formats a date as YYYY-MM-DD using local time', () => {
    // Use a fixed Date object to avoid timezone issues in tests
    const d = new Date(2024, 3, 8) // April 8, 2024 local time
    const result = toLocalISODate(d)
    expect(result).toBe('2024-04-08')
  })

  it('pads month and day with leading zeros', () => {
    const d = new Date(2024, 0, 5) // January 5, 2024
    expect(toLocalISODate(d)).toBe('2024-01-05')
  })

  it('accepts a string date', () => {
    const result = toLocalISODate('2024-06-15T00:00:00')
    expect(result).toMatch(/2024-06-15/)
  })
})

// ── daysBetween ──────────────────────────────────────────────────────────────

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween(REF_NOW, REF_NOW)).toBe(0)
  })

  it('returns 7 for a week apart', () => {
    expect(daysBetween(REF_NOW, REF_NOW + 7 * 86400_000)).toBe(7)
  })

  it('is symmetric (absolute value)', () => {
    const a = REF_NOW
    const b = REF_NOW + 10 * 86400_000
    expect(daysBetween(a, b)).toBe(daysBetween(b, a))
  })

  it('accepts string dates', () => {
    expect(daysBetween('2024-01-01', '2024-01-11')).toBe(10)
  })
})

// ── daysSince ────────────────────────────────────────────────────────────────

describe('daysSince', () => {
  it('returns 0 for now', () => {
    expect(daysSince(REF_NOW, REF_NOW)).toBe(0)
  })

  it('returns correct days for past date', () => {
    expect(daysSince(REF_NOW - 5 * 86400_000, REF_NOW)).toBe(5)
  })

  it('returns 0 for a future date (clamped)', () => {
    expect(daysSince(REF_NOW + 86400_000, REF_NOW)).toBe(0)
  })
})

// ── formatDuration ────────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats zero seconds as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00')
  })

  it('formats 65 seconds as 01:05', () => {
    expect(formatDuration(65)).toBe('01:05')
  })

  it('formats 3600 seconds as 60:00', () => {
    expect(formatDuration(3600)).toBe('60:00')
  })

  it('handles negative values by clamping to 0', () => {
    expect(formatDuration(-10)).toBe('00:00')
  })

  it('floors fractional seconds', () => {
    expect(formatDuration(90.9)).toBe('01:30')
  })
})

// ── isoWeek ──────────────────────────────────────────────────────────────────

describe('isoWeek', () => {
  it('returns week 1 for first week of January', () => {
    // Jan 1 2024 is a Monday — ISO week 1
    expect(isoWeek(new Date(2024, 0, 1))).toBe(1)
  })

  it('returns week 15 for mid-April 2024', () => {
    // April 8 2024 is ISO week 15
    expect(isoWeek(new Date(2024, 3, 8))).toBe(15)
  })

  it('returns a number between 1 and 53', () => {
    const week = isoWeek(new Date())
    expect(week).toBeGreaterThanOrEqual(1)
    expect(week).toBeLessThanOrEqual(53)
  })
})

// ── quarter ──────────────────────────────────────────────────────────────────

describe('quarter', () => {
  it('returns 1 for January', () => {
    expect(quarter(new Date(2024, 0, 15))).toBe(1)
  })

  it('returns 2 for April', () => {
    expect(quarter(new Date(2024, 3, 15))).toBe(2)
  })

  it('returns 3 for July', () => {
    expect(quarter(new Date(2024, 6, 15))).toBe(3)
  })

  it('returns 4 for October', () => {
    expect(quarter(new Date(2024, 9, 15))).toBe(4)
  })
})

// ── daysInMonth ──────────────────────────────────────────────────────────────

describe('daysInMonth', () => {
  it('returns 31 days for January', () => {
    expect(daysInMonth(new Date(2024, 0, 1))).toHaveLength(31)
  })

  it('returns 29 days for February 2024 (leap year)', () => {
    expect(daysInMonth(new Date(2024, 1, 1))).toHaveLength(29)
  })

  it('returns 28 days for February 2023 (non-leap)', () => {
    expect(daysInMonth(new Date(2023, 1, 1))).toHaveLength(28)
  })

  it('returns ISO date strings in YYYY-MM-DD format', () => {
    const days = daysInMonth(new Date(2024, 0, 1))
    expect(days[0]).toBe('2024-01-01')
    expect(days[30]).toBe('2024-01-31')
  })
})

// ── startOfDay / endOfDay ─────────────────────────────────────────────────────

describe('startOfDay', () => {
  it('returns midnight (00:00:00.000)', () => {
    const d = startOfDay(new Date(2024, 3, 8, 14, 30, 45, 500))
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
    expect(d.getMilliseconds()).toBe(0)
  })
})

describe('endOfDay', () => {
  it('returns 23:59:59.999', () => {
    const d = endOfDay(new Date(2024, 3, 8, 0, 0, 0, 0))
    expect(d.getHours()).toBe(23)
    expect(d.getMinutes()).toBe(59)
    expect(d.getSeconds()).toBe(59)
    expect(d.getMilliseconds()).toBe(999)
  })
})

// ── isSameDay ─────────────────────────────────────────────────────────────────

describe('isSameDay', () => {
  it('returns true for same day at different times', () => {
    const a = new Date(2024, 3, 8, 8, 0, 0)
    const b = new Date(2024, 3, 8, 22, 0, 0)
    expect(isSameDay(a, b)).toBe(true)
  })

  it('returns false for different days', () => {
    const a = new Date(2024, 3, 8)
    const b = new Date(2024, 3, 9)
    expect(isSameDay(a, b)).toBe(false)
  })
})

// ── isWithinDateRange ────────────────────────────────────────────────────────

describe('isWithinDateRange', () => {
  const mid = new Date(2024, 3, 8)
  const before = new Date(2024, 2, 1)
  const after = new Date(2024, 4, 1)
  const start = new Date(2024, 0, 1)
  const end = new Date(2024, 11, 31)

  it('returns true when within range', () => {
    expect(isWithinDateRange(mid, start, end)).toBe(true)
  })

  it('returns false when before start', () => {
    expect(isWithinDateRange(before, mid, end)).toBe(false)
  })

  it('returns false when after end', () => {
    expect(isWithinDateRange(after, start, mid)).toBe(false)
  })

  it('returns true when no bounds provided', () => {
    expect(isWithinDateRange(mid)).toBe(true)
  })

  it('returns true when only start provided and date is after', () => {
    expect(isWithinDateRange(after, mid)).toBe(true)
  })

  it('returns false when only start provided and date is before', () => {
    expect(isWithinDateRange(before, mid)).toBe(false)
  })
})

// ── groupByMonth ─────────────────────────────────────────────────────────────

describe('groupByMonth', () => {
  const items = [
    { date: '2024-01-15', value: 'a' },
    { date: '2024-01-20', value: 'b' },
    { date: '2024-02-10', value: 'c' },
    { date: '2023-12-25', value: 'd' },
  ]

  it('groups items by month-year label', () => {
    const groups = groupByMonth(items, i => i.date)
    const labels = groups.map(g => g.label)
    expect(labels).toContain('Jan 2024')
    expect(labels).toContain('Feb 2024')
    expect(labels).toContain('Dec 2023')
  })

  it('groups January correctly with 2 items', () => {
    const groups = groupByMonth(items, i => i.date)
    const jan = groups.find(g => g.label === 'Jan 2024')
    expect(jan?.items).toHaveLength(2)
  })

  it('returns groups in reverse chronological order', () => {
    const groups = groupByMonth(items, i => i.date)
    const dates = groups.map(g => new Date(g.items[0].date).getTime())
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i])
    }
  })
})

// ── groupByYear ──────────────────────────────────────────────────────────────

describe('groupByYear', () => {
  const items = [
    { date: '2024-01-15' },
    { date: '2024-06-20' },
    { date: '2023-11-10' },
    { date: '2022-08-05' },
  ]

  it('groups by year', () => {
    const groups = groupByYear(items, i => i.date)
    expect(groups.map(g => g.year).sort()).toEqual([2022, 2023, 2024])
  })

  it('returns groups in reverse chronological order', () => {
    const groups = groupByYear(items, i => i.date)
    expect(groups[0].year).toBe(2024)
    expect(groups[2].year).toBe(2022)
  })

  it('2024 group has 2 items', () => {
    const groups = groupByYear(items, i => i.date)
    expect(groups.find(g => g.year === 2024)?.items).toHaveLength(2)
  })
})

// ── computeStreak ─────────────────────────────────────────────────────────────

describe('computeStreak', () => {
  it('returns 0 for empty dates', () => {
    expect(computeStreak([])).toBe(0)
  })

  it('returns 1 for single entry today', () => {
    const today = toLocalISODate(new Date())
    expect(computeStreak([today])).toBe(1)
  })

  it('returns 0 when last visit was more than 1 day ago', () => {
    // Use dates clearly in the past
    const dates = ['2020-01-01', '2020-01-02', '2020-01-03']
    expect(computeStreak(dates, new Date())).toBe(0)
  })

  it('computes a consecutive streak correctly', () => {
    const now = new Date('2024-04-08T10:00:00Z')
    const dates = [
      toLocalISODate(new Date('2024-04-06T10:00:00Z')),
      toLocalISODate(new Date('2024-04-07T10:00:00Z')),
      toLocalISODate(new Date('2024-04-08T10:00:00Z')),
    ]
    expect(computeStreak(dates, now)).toBe(3)
  })

  it('deduplicates same-day entries', () => {
    const now = new Date('2024-04-08T10:00:00Z')
    const today = toLocalISODate(now)
    const yesterday = toLocalISODate(new Date('2024-04-07T10:00:00Z'))
    expect(computeStreak([today, today, yesterday], now)).toBe(2)
  })
})

// ── computeLongestStreak ─────────────────────────────────────────────────────

describe('computeLongestStreak', () => {
  it('returns 0 for empty dates', () => {
    expect(computeLongestStreak([])).toBe(0)
  })

  it('returns 1 for single entry', () => {
    expect(computeLongestStreak(['2024-01-01'])).toBe(1)
  })

  it('returns the longest consecutive run', () => {
    const dates = [
      '2024-01-01', '2024-01-02', '2024-01-03', // streak of 3
      '2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13', '2024-01-14', // streak of 5
    ]
    expect(computeLongestStreak(dates)).toBe(5)
  })

  it('handles gaps correctly', () => {
    const dates = ['2024-01-01', '2024-01-03'] // gap on Jan 2
    expect(computeLongestStreak(dates)).toBe(1)
  })
})
