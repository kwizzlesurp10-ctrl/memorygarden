import type { Season, WeatherType } from './types'

export type DayPeriod = 'dawn' | 'day' | 'dusk' | 'night'

export interface AmbientGardenParams {
  rootHz: number
  harmonicHz: number
  noiseGain: number
  toneGain: number
  lowpassHz: number
  masterLinear: number
}

const SEASON_ROOTS: Record<Season, [number, number]> = {
  spring: [196.0, 293.66],
  summer: [220.0, 329.63],
  autumn: [174.61, 261.63],
  winter: [146.83, 220.0],
}

const WEATHER_NOISE: Record<WeatherType, number> = {
  sunny: 0.85,
  mist: 1.25,
  rain: 2.1,
  'rain-sun': 1.7,
  'golden-haze': 0.95,
  'partly-cloudy': 1.0,
}

const WEATHER_TONE: Record<WeatherType, number> = {
  sunny: 1.08,
  mist: 0.92,
  rain: 0.62,
  'rain-sun': 0.78,
  'golden-haze': 1.05,
  'partly-cloudy': 1.0,
}

const WEATHER_LOWPASS: Record<WeatherType, number> = {
  sunny: 1.08,
  mist: 1.12,
  rain: 0.78,
  'rain-sun': 0.88,
  'golden-haze': 0.98,
  'partly-cloudy': 1.0,
}

/**
 * Maps season, time of day, derived weather, and garden “aliveness” into
 * calm Web Audio gain/frequency targets — no I/O, safe for tests.
 */
export function computeAmbientGardenParams(
  season: Season,
  period: DayPeriod,
  weather: WeatherType,
  intensity01: number,
): AmbientGardenParams {
  const [root, harm] = SEASON_ROOTS[season]
  const t = Math.min(1, Math.max(0, intensity01))

  let noiseGain = 0.035 * WEATHER_NOISE[weather]
  let toneGain = 0.024 * WEATHER_TONE[weather]
  let lowpassHz = 2400 * WEATHER_LOWPASS[weather]
  let master = 0.14 + t * 0.1

  if (period === 'dawn') {
    lowpassHz *= 1.05
    master *= 0.88
    toneGain *= 1.05
  } else if (period === 'day') {
    lowpassHz *= 1.02
  } else if (period === 'dusk') {
    lowpassHz *= 0.92
    master *= 0.9
    noiseGain *= 1.08
  } else {
    lowpassHz *= 0.72
    master *= 0.62
    toneGain *= 0.85
    noiseGain *= 1.12
  }

  let harmonicHz = harm
  if (weather === 'golden-haze') {
    harmonicHz *= 1.01
  }

  return {
    rootHz: root,
    harmonicHz,
    noiseGain: clamp(noiseGain, 0.012, 0.12),
    toneGain: clamp(toneGain, 0.008, 0.06),
    lowpassHz: clamp(lowpassHz, 420, 6200),
    masterLinear: clamp(master, 0.06, 0.28),
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}
