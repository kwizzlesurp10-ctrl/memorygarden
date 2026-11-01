import { describe, expect, it } from 'vitest'
import {
  canHarvestMorningDew,
  createInitialStreak,
  evaluateStreakTransition,
  isDawnDewHarvestWindow,
  isNearPond,
  recordTendingAction,
  transmutePondAltarShield,
} from '../gentle-streaks'

describe('gentle-streaks logic', () => {
  it('creates initial streak with compassionate grace shield', () => {
    const streak = createInitialStreak()
    expect(streak.currentStreak).toBe(0)
    expect(streak.longestStreak).toBe(0)
    expect(streak.streakShields).toBe(1)
    expect(streak.maxStreakShields).toBe(3)
    expect(streak.tendedToday).toBe(false)
  })

  it('records first tending action and increments streak to 1', () => {
    const initial = createInitialStreak()
    const result = recordTendingAction(initial, '2026-06-01T10:00:00')
    expect(result.streak.currentStreak).toBe(1)
    expect(result.streak.longestStreak).toBe(1)
    expect(result.streak.lastTendedDate).toBe('2026-06-01')
    expect(result.streak.tendedToday).toBe(true)
    expect(result.shieldEarned).toBe(false)
  })

  it('prevents multiple streak increments on the same day', () => {
    const initial = createInitialStreak()
    const first = recordTendingAction(initial, '2026-06-01T10:00:00')
    const second = recordTendingAction(first.streak, '2026-06-01T15:30:00')

    expect(second.streak.currentStreak).toBe(1)
    expect(second.shieldEarned).toBe(false)
    expect(second.message).toContain('already tended')
  })

  it('advances streak consecutively on the following day', () => {
    const initial = createInitialStreak()
    const day1 = recordTendingAction(initial, '2026-06-01T10:00:00')
    const day2 = recordTendingAction(day1.streak, '2026-06-02T09:00:00')

    expect(day2.streak.currentStreak).toBe(2)
    expect(day2.streak.longestStreak).toBe(2)
    expect(day2.streak.lastTendedDate).toBe('2026-06-02')
  })

  it('awards a Dewdrop of Grace upon reaching a 7-day milestone', () => {
    let streak = createInitialStreak()
    streak.streakShields = 0 // test earning a fresh shield

    for (let i = 1; i <= 7; i++) {
      const dayStr = `2026-06-0${i}T08:00:00`
      const res = recordTendingAction(streak, dayStr)
      streak = res.streak
      if (i === 7) {
        expect(res.shieldEarned).toBe(true)
        expect(streak.streakShields).toBe(1)
        expect(streak.currentStreak).toBe(7)
      }
    }
  })

  it('clamps earned shields to maxStreakShields (3)', () => {
    let streak = createInitialStreak()
    streak.streakShields = 3

    for (let i = 1; i <= 7; i++) {
      const dayStr = `2026-06-0${i}T08:00:00`
      const res = recordTendingAction(streak, dayStr)
      streak = res.streak
    }

    expect(streak.streakShields).toBe(3)
  })

  it('protects an active streak using Dewdrop of Grace when a day is missed', () => {
    let streak = createInitialStreak()
    streak.streakShields = 1
    const day1 = recordTendingAction(streak, '2026-06-01T08:00:00')

    // Day 2 was missed. Now evaluating on Day 3:
    const evalResult = evaluateStreakTransition(day1.streak, '2026-06-03T10:00:00')
    expect(evalResult.shieldConsumed).toBe(true)
    expect(evalResult.streak.currentStreak).toBe(1) // Streak preserved!
    expect(evalResult.streak.streakShields).toBe(0)
    expect(evalResult.streak.lastShieldConsumedDate).toBe('2026-06-03')

    // Tending on Day 3 advances the protected streak
    const day3 = recordTendingAction(evalResult.streak, '2026-06-03T11:00:00')
    expect(day3.streak.currentStreak).toBe(2)
  })

  it('resets streak gently to 0 when a day is missed and no shields remain', () => {
    let streak = createInitialStreak()
    streak.streakShields = 0
    const day1 = recordTendingAction(streak, '2026-06-01T08:00:00')

    // Day 2 was missed. Evaluating on Day 3 with 0 shields:
    const evalResult = evaluateStreakTransition(day1.streak, '2026-06-03T10:00:00')
    expect(evalResult.shieldConsumed).toBe(false)
    expect(evalResult.resetOccurred).toBe(true)
    expect(evalResult.streak.currentStreak).toBe(0)

    // Tending today starts a fresh gentle streak
    const day3 = recordTendingAction(evalResult.streak, '2026-06-03T10:00:00')
    expect(day3.streak.currentStreak).toBe(1)
  })

  it('handles Pond Altar transmutation for Dewdrop of Grace', () => {
    const streak = createInitialStreak()
    streak.streakShields = 1

    // Insufficient currency (< 30)
    const fail1 = transmutePondAltarShield(streak, 20)
    expect(fail1.success).toBe(false)
    expect(fail1.newDew).toBe(20)

    // Sufficient currency
    const success = transmutePondAltarShield(streak, 45)
    expect(success.success).toBe(true)
    expect(success.newStreak.streakShields).toBe(2)
    expect(success.newDew).toBe(15)

    // At max shields (3)
    const atMax = { ...streak, streakShields: 3 }
    const failMax = transmutePondAltarShield(atMax, 100)
    expect(failMax.success).toBe(false)
    expect(failMax.message).toContain('maximum of 3')
  })

  it('checks Dawn Morning Dew harvest hours (05:00 - 09:00)', () => {
    const early = new Date('2026-06-01T04:59:59')
    const dawnStart = new Date('2026-06-01T05:00:00')
    const midDawn = new Date('2026-06-01T07:30:00')
    const dawnEnd = new Date('2026-06-01T08:59:59')
    const noon = new Date('2026-06-01T12:00:00')

    expect(isDawnDewHarvestWindow(early)).toBe(false)
    expect(isDawnDewHarvestWindow(dawnStart)).toBe(true)
    expect(isDawnDewHarvestWindow(midDawn)).toBe(true)
    expect(isDawnDewHarvestWindow(dawnEnd)).toBe(true)
    expect(isDawnDewHarvestWindow(noon)).toBe(false)
  })

  it('determines if morning dew can be harvested today', () => {
    const dawn = new Date('2026-06-01T06:30:00')
    expect(canHarvestMorningDew('', dawn)).toBe(true)
    expect(canHarvestMorningDew('2026-05-31', dawn)).toBe(true)
    expect(canHarvestMorningDew('2026-06-01', dawn)).toBe(false) // already harvested today
  })

  it('detects proximity to the pond', () => {
    expect(isNearPond(0, -5.5)).toBe(true) // exact center
    expect(isNearPond(2.0, -5.5)).toBe(true) // within 4.2m
    expect(isNearPond(10.0, 10.0)).toBe(false) // distant
  })
})
