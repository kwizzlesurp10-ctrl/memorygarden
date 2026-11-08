import type { HybridPalette } from '@/lib/types'
import { paletteFromHue } from './hybrid-semantic'

export interface WeeklyThemeSpec {
  motifKey: string
  /** Dominant hue in degrees */
  hue: number
  mood: string[]
  sat?: number
}

/** One spec per theme in WEEKLY_PLANT_THEMES — intentional hue + motif. */
export const WEEKLY_THEME_SPECS: WeeklyThemeSpec[] = [
  { motifKey: 'snowflake', hue: 205, mood: ['calm', 'peaceful'] },
  { motifKey: 'flame', hue: 22, mood: ['cozy'] },
  { motifKey: 'rose', hue: 4, mood: ['love', 'joyful'] },
  { motifKey: 'flower', hue: 320, mood: ['joyful'] },
  { motifKey: 'rain', hue: 278, mood: ['calm'] },
  { motifKey: 'flower', hue: 48, mood: ['joyful'] },
  { motifKey: 'flower', hue: 335, mood: ['joyful'] },
  { motifKey: 'leaf', hue: 128, mood: ['peaceful'] },
  { motifKey: 'sun', hue: 52, mood: ['joyful'] },
  { motifKey: 'flower', hue: 286, mood: ['calm'] },
  { motifKey: 'flower', hue: 200, mood: ['peaceful'] },
  { motifKey: 'cherry', hue: 350, mood: ['joyful'] },
  { motifKey: 'flower', hue: 44, mood: ['joyful'] },
  { motifKey: 'star', hue: 268, mood: ['spooky'] },
  { motifKey: 'wave', hue: 178, mood: ['calm'] },
  { motifKey: 'leaf', hue: 118, mood: ['peaceful'] },
  { motifKey: 'apple', hue: 8, mood: ['joyful'] },
  { motifKey: 'leaf', hue: 36, mood: ['calm'] },
  { motifKey: 'flower', hue: 95, mood: ['calm'] },
  { motifKey: 'flame', hue: 30, mood: ['joyful'] },
  { motifKey: 'leaf', hue: 16, mood: ['calm'] },
  { motifKey: 'moon', hue: 285, mood: ['spooky'] },
  { motifKey: 'gift', hue: 32, mood: ['joyful'] },
  { motifKey: 'coffee cup', hue: 28, mood: ['cozy', 'calm'] },
  { motifKey: 'tree', hue: 198, mood: ['calm'] },
  { motifKey: 'heart', hue: 2, mood: ['love'] },
  { motifKey: 'flame', hue: 38, mood: ['cozy'] },
  { motifKey: 'star', hue: 225, mood: ['peaceful'] },
  { motifKey: 'star', hue: 212, mood: ['joyful'] },
  { motifKey: 'leaf', hue: 142, mood: ['calm'] },
  { motifKey: 'bird', hue: 208, mood: ['joyful'] },
  { motifKey: 'star', hue: 55, mood: ['joyful'] },
  { motifKey: 'rain', hue: 305, mood: ['joyful'] },
  { motifKey: 'bee', hue: 50, mood: ['joyful'] },
  { motifKey: 'wave', hue: 218, mood: ['calm'] },
  { motifKey: 'butterfly', hue: 312, mood: ['joyful'] },
  { motifKey: 'moon', hue: 282, mood: ['peaceful'] },
  { motifKey: 'leaf', hue: 26, mood: ['calm'] },
  { motifKey: 'leaf', hue: 20, mood: ['calm'] },
  { motifKey: 'cloud', hue: 258, mood: ['sad', 'calm'] },
  { motifKey: 'gift', hue: 356, mood: ['love', 'joyful'] },
  { motifKey: 'cherry', hue: 348, mood: ['cozy'] },
  { motifKey: 'wave', hue: 168, mood: ['peaceful'] },
  { motifKey: 'sun', hue: 18, mood: ['joyful'] },
  { motifKey: 'rain', hue: 172, mood: ['calm'] },
  { motifKey: 'mountain', hue: 132, mood: ['peaceful'] },
  { motifKey: 'bird', hue: 202, mood: ['joyful'] },
  { motifKey: 'guitar', hue: 288, mood: ['calm'] },
  { motifKey: 'house', hue: 24, mood: ['cozy'] },
  { motifKey: 'rocket', hue: 258, mood: ['joyful'] },
  { motifKey: 'heart', hue: 124, mood: ['love'] },
  { motifKey: 'flower', hue: 224, mood: ['peaceful'] },
  { motifKey: 'flower', hue: 98, mood: ['peaceful'] },
]

export function weeklySpecForIndex(weekIndex: number): WeeklyThemeSpec {
  return WEEKLY_THEME_SPECS[weekIndex % WEEKLY_THEME_SPECS.length]!
}

export function weeklyPaletteForSpec(spec: WeeklyThemeSpec): HybridPalette {
  return paletteFromHue(spec.hue, spec.mood)
}
