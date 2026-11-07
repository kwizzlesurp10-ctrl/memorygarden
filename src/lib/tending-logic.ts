import type { EmotionalTone, Memory, PlantStage, PlantVariety, Season, WeatherType } from './types'

export type PlantHealthStatus = 'thriving' | 'healthy' | 'thirsty' | 'wilting' | 'dormant'

export interface WateringResult {
  success: boolean
  previousMoisture: number
  newMoisture: number
  healthStatus: PlantHealthStatus
  wiltingFactor: number
  awakened: boolean
  message: string
}

/**
 * Hourly moisture depletion rates (% per hour) per botanical variety.
 * Drought-hardy species deplete slower; delicate flowers deplete faster.
 */
export const VARIETY_DEPLETION_RATES: Record<PlantVariety, number> = {
  succulent: 0.65,
  starlight_succulent: 0.65,
  lotus: 0.90,
  tree: 1.10,
  ancient_oak: 1.10,
  herb: 1.30,
  fern: 1.50,
  vine: 1.60,
  phoenix_vine: 1.60,
  mushroom: 1.75,
  flower: 2.00,
  wildflower: 2.00,
  eternal_rose: 1.20,
}

export const SEASONAL_FACTORS: Record<Season, number> = {
  spring: 0.95,
  summer: 0.80, // Summer solstice extended retention
  autumn: 1.00,
  winter: 1.10,
}

export const WEATHER_FACTORS: Record<WeatherType, number> = {
  sunny: 1.0,
  mist: 0.6,
  rain: 0.2,
  'rain-sun': 0.75,
  'golden-haze': 0.95,
  'partly-cloudy': 0.85,
}

/** Diurnal transpiration factor (slowed nighttime evaporation). */
const DIURNAL_FACTOR = 0.90

/** Maximum simulated time delta in hours (30 days) to prevent clock drift absurdity. */
const MAX_ELAPSED_HOURS = 720.0

/**
 * Calculates current moisture level based on continuous physical decay.
 * Bounded strictly within [0.0, 100.0].
 */
export function computeCurrentMoisture(
  initialMoisture = 100.0,
  lastWateredAt: string | number | undefined,
  variety: PlantVariety = 'flower',
  season: Season = 'spring',
  weather: WeatherType = 'sunny',
  nowMs: number = Date.now(),
): number {
  if (lastWateredAt === undefined || lastWateredAt === null) {
    return initialMoisture
  }

  const lastWateredMs = typeof lastWateredAt === 'string' ? new Date(lastWateredAt).getTime() : lastWateredAt
  if (Number.isNaN(lastWateredMs)) return initialMoisture

  const elapsedMs = Math.max(0, nowMs - lastWateredMs)
  const elapsedHours = Math.min(MAX_ELAPSED_HOURS, elapsedMs / (1000 * 60 * 60))

  const baseRate = VARIETY_DEPLETION_RATES[variety] ?? 2.00
  const seasonFactor = SEASONAL_FACTORS[season] ?? 1.00
  const weatherFactor = WEATHER_FACTORS[weather] ?? 1.00
  const envMultiplier = seasonFactor * weatherFactor * DIURNAL_FACTOR

  const decay = elapsedHours * baseRate * envMultiplier
  const moisture = Math.max(0.0, Math.min(100.0, initialMoisture - decay))
  return Number(moisture.toFixed(2))
}

/**
 * Maps moisture [0.0, 100.0] to a continuous wilting factor [0.0, 1.0].
 * Moisture >= 30.0% produces 0.0 (full erect turgor).
 * Moisture <= 0.0% produces 1.0 (full dormant/wilting posture).
 */
export function computeWiltingFactor(moistureLevel: number): number {
  if (moistureLevel >= 30.0) return 0.0
  if (moistureLevel <= 0.0) return 1.0
  return Number(((30.0 - moistureLevel) / 30.0).toFixed(3))
}

/**
 * Closed contiguous partition of moisture levels into discrete health statuses.
 */
export function getHealthStatus(moistureLevel: number): PlantHealthStatus {
  if (moistureLevel >= 75.0) return 'thriving'
  if (moistureLevel >= 30.0) return 'healthy'
  if (moistureLevel >= 10.0) return 'thirsty'
  if (moistureLevel > 0.0) return 'wilting'
  return 'dormant'
}

/**
 * Checks if a plant can receive micro-tending (Quick-Water).
 * Satiated plants (M >= 75%) are protected against over-saturation.
 */
export function canQuickWater(moistureLevel: number): boolean {
  return moistureLevel < 75.0
}

/**
 * Applies watering action (either in-world quick micro-tending or deep reflection watering).
 * - Satiated plants (M >= 75%): No-op ("Soil is rich and moist")
 * - Active plants (0% < M < 75%): Quick adds +25%, clamped to 100%
 * - Dormant plants (M <= 0%): Quick restores to 80% (thriving bloom), Full restores to 100%
 */
export function waterPlant(
  currentMoisture: number,
  actionType: 'quick' | 'full' = 'quick',
): WateringResult {
  if (currentMoisture >= 75.0) {
    return {
      success: false,
      previousMoisture: currentMoisture,
      newMoisture: currentMoisture,
      healthStatus: getHealthStatus(currentMoisture),
      wiltingFactor: computeWiltingFactor(currentMoisture),
      awakened: false,
      message: 'Soil is rich and moist',
    }
  }

  const isDormant = currentMoisture <= 0.0
  let newMoisture: number

  if (isDormant) {
    newMoisture = actionType === 'quick' ? 80.0 : 100.0
  } else {
    newMoisture = actionType === 'quick' ? Math.min(100.0, currentMoisture + 25.0) : 100.0
  }

  const healthStatus = getHealthStatus(newMoisture)
  const wiltingFactor = computeWiltingFactor(newMoisture)

  return {
    success: true,
    previousMoisture: currentMoisture,
    newMoisture,
    healthStatus,
    wiltingFactor,
    awakened: isDormant,
    message: isDormant ? 'Awakened with fresh spring vitality!' : 'Nourished with cool water (+25%)',
  }
}

/** Stage Progression Order (strictly monotonic). */
export const STAGE_ORDER: PlantStage[] = [
  'seed',
  'sprout',
  'seedling',
  'young',
  'bud',
  'bloom',
  'mature',
  'elder',
]

export interface StageThreshold {
  minScore: number
  minDays: number
  minReflections: number
  minWaterings: number
  gateMoisture: number
}

export const STAGE_THRESHOLDS: Record<PlantStage, StageThreshold> = {
  seed: { minScore: 0, minDays: 0, minReflections: 0, minWaterings: 0, gateMoisture: 0 },
  sprout: { minScore: 10, minDays: 1, minReflections: 0, minWaterings: 1, gateMoisture: 20 },
  seedling: { minScore: 25, minDays: 2, minReflections: 0, minWaterings: 2, gateMoisture: 25 },
  young: { minScore: 50, minDays: 4, minReflections: 1, minWaterings: 4, gateMoisture: 30 },
  bud: { minScore: 90, minDays: 7, minReflections: 2, minWaterings: 7, gateMoisture: 30 },
  bloom: { minScore: 140, minDays: 10, minReflections: 3, minWaterings: 10, gateMoisture: 35 },
  mature: { minScore: 220, minDays: 18, minReflections: 5, minWaterings: 15, gateMoisture: 40 },
  elder: { minScore: 350, minDays: 30, minReflections: 7, minWaterings: 20, gateMoisture: 50 },
}

/**
 * Calculates exploit-resistant Nurture Score (Sn).
 * Visits only count once per unique calendar day.
 */
export function calculateNurtureScore(params: {
  uniqueVisitDays: number
  reflectionsCount: number
  wateringsCount: number
  daysSincePlanted: number
  giftsCount?: number
}): number {
  const vDays = Math.min(params.daysSincePlanted + 1, Math.max(0, params.uniqueVisitDays))
  const r = Math.max(0, params.reflectionsCount)
  const w = Math.max(0, params.wateringsCount)
  const d = Math.max(0, params.daysSincePlanted)
  const g = Math.max(0, params.giftsCount ?? 0)

  const score = vDays * 1.5 + r * 10.0 + w * 4.0 + d * 1.0 + g * 5.0
  return Number(score.toFixed(1))
}

/**
 * Evaluates whether a plant qualifies for stage advancement.
 * STRICT MONOTONICITY GUARANTEE: Never returns a stage earlier than currentStage.
 */
export function evaluateStageProgression(
  currentStage: PlantStage,
  metrics: {
    nurtureScore: number
    daysSincePlanted: number
    reflectionsCount: number
    wateringsCount: number
    currentMoisture: number
  },
): PlantStage {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex < 0) return currentStage

  let eligibleIndex = currentIndex
  for (let i = currentIndex + 1; i < STAGE_ORDER.length; i++) {
    const candidateStage = STAGE_ORDER[i]
    const threshold = STAGE_THRESHOLDS[candidateStage]
    if (
      metrics.nurtureScore >= threshold.minScore &&
      metrics.daysSincePlanted >= threshold.minDays &&
      metrics.reflectionsCount >= threshold.minReflections &&
      metrics.wateringsCount >= threshold.minWaterings &&
      metrics.currentMoisture >= threshold.gateMoisture
    ) {
      eligibleIndex = i
    } else {
      break // Stages must advance sequentially
    }
  }

  return STAGE_ORDER[eligibleIndex]
}
