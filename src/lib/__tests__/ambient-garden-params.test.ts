import { describe, expect, it } from 'vitest'
import { computeAmbientGardenParams } from '../ambient-garden-params'

describe('computeAmbientGardenParams', () => {
  it('returns stable ordering across seasons at midday sunny', () => {
    const w = 'sunny' as const
    const p = 'day' as const
    const spring = computeAmbientGardenParams('spring', p, w, 0.5)
    const winter = computeAmbientGardenParams('winter', p, w, 0.5)
    expect(spring.rootHz).toBeGreaterThan(winter.rootHz)
    expect(spring.masterLinear).toBeGreaterThan(0)
  })

  it('quiets at night', () => {
    const day = computeAmbientGardenParams('summer', 'day', 'sunny', 0.5)
    const night = computeAmbientGardenParams('summer', 'night', 'sunny', 0.5)
    expect(night.masterLinear).toBeLessThan(day.masterLinear)
    expect(night.lowpassHz).toBeLessThan(day.lowpassHz)
  })

  it('adds noise for rain', () => {
    const sunny = computeAmbientGardenParams('autumn', 'day', 'sunny', 0.4)
    const rain = computeAmbientGardenParams('autumn', 'day', 'rain', 0.4)
    expect(rain.noiseGain).toBeGreaterThan(sunny.noiseGain)
    expect(rain.toneGain).toBeLessThan(sunny.toneGain)
  })

  it('clamps intensity contribution', () => {
    const low = computeAmbientGardenParams('spring', 'dusk', 'mist', 0)
    const high = computeAmbientGardenParams('spring', 'dusk', 'mist', 1)
    expect(high.masterLinear).toBeGreaterThanOrEqual(low.masterLinear)
  })
})
