import { describe, expect, it } from 'vitest'
import {
  canQuickWater,
  calculateNurtureScore,
  computeCurrentMoisture,
  computeWiltingFactor,
  evaluateStageProgression,
  getHealthStatus,
  waterPlant,
} from '../tending-logic'

describe('computeCurrentMoisture', () => {
  const oneHourMs = 3600 * 1000
  const now = 1700000000000

  it('handles zero elapsed time safely', () => {
    const m = computeCurrentMoisture(100.0, now, 'flower', 'spring', 'sun', now)
    expect(m).toBe(100.0)
  })

  it('protects against clock skew with future timestamps', () => {
    const future = now + 10000
    const m = computeCurrentMoisture(80.0, future, 'flower', 'spring', 'sun', now)
    expect(m).toBe(80.0)
  })

  it('depletes succulents slower than flowers', () => {
    const hours = 24
    const past = now - hours * oneHourMs
    const succulentMoisture = computeCurrentMoisture(100.0, past, 'succulent', 'spring', 'sun', now)
    const flowerMoisture = computeCurrentMoisture(100.0, past, 'flower', 'spring', 'sun', now)
    expect(succulentMoisture).toBeGreaterThan(flowerMoisture)
  })

  it('clamps lower bound to 0.0 without going negative', () => {
    const longAgo = now - 1000 * oneHourMs // 1000 hours ago
    const m = computeCurrentMoisture(100.0, longAgo, 'flower', 'spring', 'sun', now)
    expect(m).toBe(0.0)
  })

  it('accounts for rain slowing moisture loss', () => {
    const past = now - 20 * oneHourMs
    const rainMoisture = computeCurrentMoisture(100.0, past, 'flower', 'spring', 'rain', now)
    const sunMoisture = computeCurrentMoisture(100.0, past, 'flower', 'spring', 'sun', now)
    expect(rainMoisture).toBeGreaterThan(sunMoisture)
  })
})

describe('computeWiltingFactor', () => {
  it('returns 0.0 for thriving moisture levels', () => {
    expect(computeWiltingFactor(100.0)).toBe(0.0)
    expect(computeWiltingFactor(75.0)).toBe(0.0)
    expect(computeWiltingFactor(30.0)).toBe(0.0)
  })

  it('linearly ramps between 30% and 0%', () => {
    expect(computeWiltingFactor(15.0)).toBeCloseTo(0.5, 2)
    expect(computeWiltingFactor(0.0)).toBe(1.0)
    expect(computeWiltingFactor(-5.0)).toBe(1.0)
  })
})

describe('getHealthStatus', () => {
  it('correctly maps all 5 contiguous moisture partitions', () => {
    expect(getHealthStatus(100)).toBe('thriving')
    expect(getHealthStatus(75)).toBe('thriving')
    expect(getHealthStatus(74.9)).toBe('healthy')
    expect(getHealthStatus(30)).toBe('healthy')
    expect(getHealthStatus(29.9)).toBe('thirsty')
    expect(getHealthStatus(10)).toBe('thirsty')
    expect(getHealthStatus(9.9)).toBe('wilting')
    expect(getHealthStatus(0.1)).toBe('wilting')
    expect(getHealthStatus(0.0)).toBe('dormant')
    expect(getHealthStatus(-10)).toBe('dormant')
  })
})

describe('waterPlant and canQuickWater', () => {
  it('disallows watering satiated plants (M >= 75%)', () => {
    expect(canQuickWater(75.0)).toBe(false)
    expect(canQuickWater(90.0)).toBe(false)
    const res = waterPlant(85.0, 'quick')
    expect(res.success).toBe(false)
    expect(res.newMoisture).toBe(85.0)
    expect(res.message).toBe('Soil is rich and moist')
  })

  it('allows quick-watering hungry plants (0% < M < 75%) adding 25%', () => {
    expect(canQuickWater(40.0)).toBe(true)
    const res = waterPlant(40.0, 'quick')
    expect(res.success).toBe(true)
    expect(res.newMoisture).toBe(65.0)
    expect(res.healthStatus).toBe('healthy')
    expect(res.awakened).toBe(false)
  })

  it('clamps quick-watering additions to 100%', () => {
    const res = waterPlant(70.0, 'quick')
    expect(res.success).toBe(true)
    expect(res.newMoisture).toBe(95.0)
  })

  it('awakens dormant plants immediately to 80% on quick-water', () => {
    const res = waterPlant(0.0, 'quick')
    expect(res.success).toBe(true)
    expect(res.newMoisture).toBe(80.0)
    expect(res.healthStatus).toBe('thriving')
    expect(res.wiltingFactor).toBe(0.0)
    expect(res.awakened).toBe(true)
  })

  it('awakens dormant plants to 100% on full reflection water', () => {
    const res = waterPlant(0.0, 'full')
    expect(res.success).toBe(true)
    expect(res.newMoisture).toBe(100.0)
    expect(res.healthStatus).toBe('thriving')
  })
})

describe('Stage Progression & Strict Monotonicity', () => {
  it('never demotes stages (strict monotonicity)', () => {
    const result = evaluateStageProgression('elder', {
      nurtureScore: 0,
      daysSincePlanted: 0,
      reflectionsCount: 0,
      wateringsCount: 0,
      currentMoisture: 0,
    })
    expect(result).toBe('elder')
  })

  it('advances stages when thresholds are satisfied', () => {
    const advance = evaluateStageProgression('seed', {
      nurtureScore: 15,
      daysSincePlanted: 2,
      reflectionsCount: 0,
      wateringsCount: 1,
      currentMoisture: 30,
    })
    expect(advance).toBe('sprout')
  })

  it('prevents stage advancement if moisture is below gate', () => {
    const gated = evaluateStageProgression('seed', {
      nurtureScore: 100,
      daysSincePlanted: 10,
      reflectionsCount: 5,
      wateringsCount: 5,
      currentMoisture: 10, // below 20% gate
    })
    expect(gated).toBe('seed')
  })

  it('calculates exploit-resistant nurture score with day caps', () => {
    const score = calculateNurtureScore({
      uniqueVisitDays: 100, // exceeds days since planted
      daysSincePlanted: 5,
      reflectionsCount: 2,
      wateringsCount: 3,
      giftsCount: 1,
    })
    // vDays is clamped to min(5+1, 100) = 6. 6 * 1.5 = 9.
    // 2 * 10 = 20. 3 * 4 = 12. 5 * 1 = 5. 1 * 5 = 5. Total = 9 + 20 + 12 + 5 + 5 = 51.
    expect(score).toBe(51.0)
  })
})
