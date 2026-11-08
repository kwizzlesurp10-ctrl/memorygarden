import type { Season } from '@/lib/types'
import { lerpHex, lerpPal } from './color'
import { getTodKeyframes, type ScenePalette } from './palettes'

export function piecewise(pts: [number, number][], t: number): number {
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const f = (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0] || 1)
      return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f
    }
  }
  return pts[pts.length - 1][1]
}

export function todPalette(t: number, season: Season): ScenePalette {
  const kf = getTodKeyframes(season)
  let C = kf[kf.length - 1][1]
  for (let i = 1; i < kf.length; i++) {
    if (t <= kf[i][0]) {
      C = lerpPal(kf[i - 1][1], kf[i][1], (t - kf[i - 1][0]) / (kf[i][0] - kf[i - 1][0] || 1))
      break
    }
  }

  const palette: ScenePalette = {
    ...C,
    stars: 120,
    starAlpha: piecewise([[0, 1], [4.8, 1], [7, 0.15], [8.5, 0], [16.5, 0], [18, 0.2], [19.5, 0.6], [20.5, 1], [24, 1]], t),
    fireAlpha: piecewise([[0, 1], [3.8, 1], [5.2, 0], [18.4, 0], [19.6, 0.5], [20.6, 1], [24, 1]], t),
    fireN: 16,
    shootAlpha: piecewise([[0, 1], [3.5, 1], [4.8, 0], [21, 0], [22, 0.8], [24, 1]], t),
    plantDimBlend: piecewise(
      [
        [0, 1],
        [5.4, 1],
        [6.6, 0.55],
        [7.4, 0],
        [16.6, 0],
        [17.4, 0.25],
        [18.2, 0.55],
        [19, 0.82],
        [20, 1],
        [24, 1],
      ],
      t,
    ),
    mistAlpha: piecewise([[0, 0], [4.4, 0], [5.4, 0.9], [7.6, 0.7], [9.2, 0], [24, 0]], t),
    buttAlpha: piecewise([[0, 0], [8.5, 0], [10, 1], [16, 1], [17.8, 0], [24, 0]], t),
    leafAlpha: piecewise([[0, 0], [16.2, 0], [17.5, 1], [19.8, 0.4], [21, 0], [24, 0]], t),
    birdAlpha: piecewise([[0, 0], [5.2, 0], [6.3, 0.7], [8.5, 1], [17.5, 1], [19.2, 0.5], [20.2, 0], [24, 0]], t),
  }

  const daylight = piecewise([[0, 0], [5.5, 0], [8, 1], [17, 1], [19.5, 0], [24, 0]], t)

  if (season === 'spring') {
    palette.petalAlpha = daylight
  }
  if (season === 'autumn') {
    palette.leafAlpha = Math.max(palette.leafAlpha ?? 0, daylight * 0.95)
    palette.buttAlpha = (palette.buttAlpha ?? 0) * 0.3
    palette.birdAlpha = (palette.birdAlpha ?? 0) * 0.7
  }
  if (season === 'winter') {
    palette.snowAlpha = 0.5 + daylight * 0.45
    palette.buttAlpha = 0
    palette.leafAlpha = 0
    palette.fireAlpha = 0
    palette.birdAlpha = (palette.birdAlpha ?? 0) * 0.3
    palette.lotusDormant = true
    palette.mistAlpha = Math.max(palette.mistAlpha ?? 0, daylight * 0.25)
  }

  if (t >= 5.6 && t <= 18.9) {
    const p = (t - 5.6) / 13.3
    const hf = 1 - Math.sin(p * Math.PI)
    palette.sun = {
      x: 110 + p * 980,
      y: 462 - Math.sin(p * Math.PI) * 385,
      r: 40,
      disk: lerpHex('#fff6d8', '#ffd9a0', hf),
      glow: lerpHex('#ffe9a8', '#ff9d5c', hf),
    }
  }

  if (t >= 18.8 || t <= 5.8) {
    const pn = t >= 18.8 ? (t - 18.8) / 11 : (t + 5.2) / 11
    palette.moon = {
      x: 110 + pn * 980 + 155,
      y: 455 - Math.sin(pn * Math.PI) * 330 - 72,
      r: 30,
    }
  }

  return palette
}

export function todName(t: number): string {
  const names: [number, string][] = [
    [0, 'night'],
    [5, 'dawn'],
    [7.5, 'morning'],
    [11, 'midday'],
    [15.5, 'afternoon'],
    [17.5, 'golden hour'],
    [18.8, 'dusk'],
    [20.6, 'night'],
  ]
  let n = 'night'
  for (const [tt, nm] of names) {
    if (t >= tt) n = nm
  }
  return n
}

export function getClockTime(t: number): string {
  const hh = Math.floor(t)
  const mm = Math.floor((t % 1) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** Real clock hour as 0–24 float (e.g. 17:30 → 17.5). */
export function realClockTod(): number {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
}

/** Map continuous time to legacy day-period buckets (ambient audio, etc.). */
export function todToDayPeriod(t: number): 'dawn' | 'day' | 'dusk' | 'night' {
  const h = ((t % 24) + 24) % 24
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}