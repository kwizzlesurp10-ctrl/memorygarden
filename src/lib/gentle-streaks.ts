import type { GardenStreak } from './types'
import { toLocalISODate } from './date-utils'

export const MAX_STREAK_SHIELDS = 3
export const DEW_TRANSMUTE_COST = 30
export const POND_CENTER = { x: 0, z: -5.5 }
export const POND_HARVEST_RADIUS = 4.2
const ONE_DAY_MS = 86_400_000

export const STORAGE_KEY_STREAK = 'memorygarden_garden_streak'
export const STORAGE_KEY_DEW = 'memorygarden_dew_currency'
export const STORAGE_KEY_DEW_HARVEST = 'memorygarden_last_dew_harvest'

/**
 * Creates the initial user streak record.
 * Compassionately grants 1 Dewdrop of Grace protective shield from day one.
 */
export function createInitialStreak(): GardenStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastTendedDate: '',
    streakShields: 1,
    maxStreakShields: 3,
    tendedToday: false,
  }
}

/**
 * Evaluates whether the streak transitioned to a new day, consumed a protective shield,
 * or gracefully reset if no shields remained.
 */
export function evaluateStreakTransition(
  streak: GardenStreak,
  nowInput: Date | string | number = new Date(),
): { streak: GardenStreak; shieldConsumed: boolean; isNewDay: boolean; resetOccurred: boolean } {
  const now = typeof nowInput === 'object' ? nowInput : new Date(nowInput)
  const todayStr = toLocalISODate(now)

  if (!streak.lastTendedDate) {
    return {
      streak: { ...streak, tendedToday: false },
      shieldConsumed: false,
      isNewDay: true,
      resetOccurred: false,
    }
  }

  if (streak.lastTendedDate === todayStr) {
    return {
      streak: { ...streak, tendedToday: true },
      shieldConsumed: false,
      isNewDay: false,
      resetOccurred: false,
    }
  }

  // If a shield was already consumed today to bridge missed days, the streak is active for today
  if (streak.lastShieldConsumedDate === todayStr) {
    return {
      streak: { ...streak, tendedToday: false },
      shieldConsumed: false,
      isNewDay: true,
      resetOccurred: false,
    }
  }

  const yesterdayDate = new Date(now.getTime() - ONE_DAY_MS)
  const yesterdayStr = toLocalISODate(yesterdayDate)

  // Tended yesterday: streak is unbroken and awaiting today's tending
  if (streak.lastTendedDate === yesterdayStr) {
    return {
      streak: { ...streak, tendedToday: false },
      shieldConsumed: false,
      isNewDay: true,
      resetOccurred: false,
    }
  }

  // More than 1 day has passed without tending: check for Dewdrop of Grace shield protection
  if (streak.streakShields > 0) {
    const updatedShields = Math.max(0, streak.streakShields - 1)
    return {
      streak: {
        ...streak,
        streakShields: updatedShields,
        lastShieldConsumedDate: todayStr,
        // The streak is safely preserved through grace!
        tendedToday: false,
      },
      shieldConsumed: true,
      isNewDay: true,
      resetOccurred: false,
    }
  }

  // No shields available: gentle reset to 0 days pending today's activity
  return {
    streak: {
      ...streak,
      currentStreak: 0,
      tendedToday: false,
    },
    shieldConsumed: false,
    isNewDay: true,
    resetOccurred: true,
  }
}

/**
 * Records a mindful daily tending action (such as in-world watering or reflection).
 * Advances current streak, updates records, and awards +1 Dewdrop of Grace every 7 days.
 */
export function recordTendingAction(
  streak: GardenStreak,
  nowInput: Date | string | number = new Date(),
): { streak: GardenStreak; shieldEarned: boolean; message: string } {
  const now = typeof nowInput === 'object' ? nowInput : new Date(nowInput)
  const todayStr = toLocalISODate(now)

  // First process any pending day roll / shield check
  const transition = evaluateStreakTransition(streak, now)
  let workingStreak = transition.streak

  if (workingStreak.tendedToday && workingStreak.lastTendedDate === todayStr) {
    return {
      streak: workingStreak,
      shieldEarned: false,
      message: 'You have already tended your garden today!',
    }
  }

  const newStreakCount = workingStreak.currentStreak + 1
  const newLongest = Math.max(workingStreak.longestStreak, newStreakCount)

  // Award a Dewdrop of Grace upon achieving a 7-day milestone
  let newShields = workingStreak.streakShields
  let shieldEarned = false

  if (newStreakCount > 0 && newStreakCount % 7 === 0 && workingStreak.streakShields < workingStreak.maxStreakShields) {
    newShields = Math.min(workingStreak.maxStreakShields, workingStreak.streakShields + 1)
    shieldEarned = true
  }

  const updatedStreak: GardenStreak = {
    ...workingStreak,
    currentStreak: newStreakCount,
    longestStreak: newLongest,
    lastTendedDate: todayStr,
    streakShields: newShields,
    tendedToday: true,
  }

  let message = `Daily streak: ${newStreakCount} day${newStreakCount === 1 ? '' : 's'}!`
  if (shieldEarned) {
    message += ' A sacred Dewdrop of Grace has blessed your garden.'
  }

  return {
    streak: updatedStreak,
    shieldEarned,
    message,
  }
}

/**
 * Transmutes 30 common Dew Currency into 1 protective Dewdrop of Grace at the Pond Altar.
 */
export function transmutePondAltarShield(
  streak: GardenStreak,
  currentDew: number,
): { success: boolean; newStreak: GardenStreak; newDew: number; message: string } {
  if (currentDew < DEW_TRANSMUTE_COST) {
    return {
      success: false,
      newStreak: streak,
      newDew: currentDew,
      message: `Pond altar requires ${DEW_TRANSMUTE_COST} Dew Currency (you have ${currentDew}).`,
    }
  }

  if (streak.streakShields >= streak.maxStreakShields) {
    return {
      success: false,
      newStreak: streak,
      newDew: currentDew,
      message: `Your garden is already protected by the maximum of ${streak.maxStreakShields} Dewdrops of Grace.`,
    }
  }

  const newStreak: GardenStreak = {
    ...streak,
    streakShields: Math.min(streak.maxStreakShields, streak.streakShields + 1),
  }
  const newDew = currentDew - DEW_TRANSMUTE_COST

  return {
    success: true,
    newStreak,
    newDew,
    message: 'Transmutation complete: 1 Dewdrop of Grace infused into your sanctuary!',
  }
}

/**
 * Checks if the current time falls within the Dawn Morning Dew window (05:00 - 09:00 local time).
 */
export function isDawnDewHarvestWindow(date = new Date()): boolean {
  const hour = date.getHours()
  return hour >= 5 && hour < 9
}

/**
 * Checks whether the user can harvest Morning Dew from the pond today.
 */
export function canHarvestMorningDew(lastHarvestDate?: string, date = new Date()): boolean {
  if (!isDawnDewHarvestWindow(date)) return false
  const todayStr = toLocalISODate(date)
  return lastHarvestDate !== todayStr
}

/**
 * Proximity helper: determines if coordinate (x, z) is near the pond.
 */
export function isNearPond(x: number, z: number, threshold = POND_HARVEST_RADIUS): boolean {
  const dx = x - POND_CENTER.x
  const dz = z - POND_CENTER.z
  return Math.hypot(dx, dz) <= threshold
}

// ── Persistence Helpers ──────────────────────────────────────────────────────

export function loadGardenStreak(): GardenStreak {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STREAK)
    if (!raw) return createInitialStreak()
    const parsed = JSON.parse(raw) as Partial<GardenStreak>
    return {
      currentStreak: parsed.currentStreak ?? 0,
      longestStreak: parsed.longestStreak ?? 0,
      lastTendedDate: parsed.lastTendedDate ?? '',
      streakShields: Math.min(3, Math.max(0, parsed.streakShields ?? 1)),
      maxStreakShields: 3,
      lastShieldConsumedDate: parsed.lastShieldConsumedDate,
      tendedToday: Boolean(parsed.tendedToday),
    }
  } catch {
    return createInitialStreak()
  }
}

export function saveGardenStreak(streak: GardenStreak): void {
  try {
    localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(streak))
  } catch {
    // localStorage may be disabled or quota reached
  }
}

export function loadDewCurrency(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEW)
    if (!raw) return 5 // Welcome gift: 5 Dew
    const parsed = parseInt(raw, 10)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 5
  } catch {
    return 5
  }
}

export function saveDewCurrency(amount: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEW, String(Math.max(0, amount)))
  } catch {
    // localStorage may be disabled
  }
}

export function loadLastDewHarvestDate(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_DEW_HARVEST) || ''
  } catch {
    return ''
  }
}

export function saveLastDewHarvestDate(dateStr: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEW_HARVEST, dateStr)
  } catch {
    // localStorage may be disabled
  }
}
