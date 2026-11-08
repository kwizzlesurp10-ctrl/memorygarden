import { describe, expect, it } from 'vitest'
import {
  buildWeeklyGenome,
  dominantHueBucket,
  getPlantOfWeek,
  hasWeeklySeedForWeek,
  isoWeekKey,
  weeklyGenomeForIsoWeek,
  weeklyHueSpreadOverWeeks,
} from '@/lib/garden/plant-of-week'
import { hybridVarieties, paletteDominantHue, semanticLocalGenome } from '@/lib/garden/hybrid'
import { WEEKLY_THEME_SPECS } from '@/lib/garden/plant-of-week-specs'
import { WEEKLY_PLANT_THEMES } from '@/lib/garden/plant-of-week-themes'
import { MOTIF_GLYPHS } from '@/lib/garden/hybrid-motifs'

describe('plant of the week', () => {
  it('returns the same genome for the same ISO week worldwide', () => {
    const a = getPlantOfWeek(new Date('2026-11-03T12:00:00Z'))
    const b = getPlantOfWeek(new Date('2026-11-05T18:00:00Z'))
    expect(a.isoWeek).toBe(b.isoWeek)
    expect(a.genome).toEqual(b.genome)
  })

  it('evolves consecutive weeks but keeps relationship', () => {
    const w1 = isoWeekKey(new Date('2026-11-03T12:00:00Z'))
    const w2 = isoWeekKey(new Date('2026-11-10T12:00:00Z'))
    const g1 = weeklyGenomeForIsoWeek(w1)
    const g2 = weeklyGenomeForIsoWeek(w2)
    expect(g1).not.toEqual(g2)
    expect(g2.essence.toLowerCase()).toContain('evolved from')
    expect(g2.graft).toBeTruthy()
  })

  it('hasWeeklySeedForWeek prevents duplicate weekly saves', () => {
    const week = '2026-W45'
    const seeds = [{ weeklyIsoWeek: week, id: '1', idea: 'x', note: '', when: 1, g: semanticLocalGenome('a', hybridVarieties()) }]
    expect(hasWeeklySeedForWeek(seeds, week)).toBe(true)
    expect(hasWeeklySeedForWeek(seeds, '2026-W46')).toBe(false)
  })

  it('buildWeeklyGenome mutates hue and adornment from previous', () => {
    const prev = semanticLocalGenome('golden sunflower', hybridVarieties())
    const next = semanticLocalGenome('blue rain fern', hybridVarieties())
    const evolved = buildWeeklyGenome('2026-W10', 'blue rain fern', prev)
    expect(evolved.palette).not.toEqual(prev.palette)
    expect(evolved.palette).not.toEqual(next.palette)
  })

  it('has one weekly spec per curated theme with valid motif glyphs', () => {
    expect(WEEKLY_THEME_SPECS.length).toBe(WEEKLY_PLANT_THEMES.length)
    for (const spec of WEEKLY_THEME_SPECS) {
      expect(MOTIF_GLYPHS[spec.motifKey]).toBeDefined()
    }
  })

  it('keeps at least five distinct hue bands across any eight-week window', () => {
    const starts = ['2020-W01', '2024-W18', '2026-W40']
    for (const start of starts) {
      const hues = weeklyHueSpreadOverWeeks(start, 8)
      const bands = new Set(hues.map(dominantHueBucket))
      expect(bands.size).toBeGreaterThanOrEqual(5)
    }
  })

  it('makes consecutive weeks visibly different in dominant hue', () => {
    const hues = weeklyHueSpreadOverWeeks('2026-W01', 12)
    let distinctPairs = 0
    for (let i = 1; i < hues.length; i++) {
      const diff = Math.abs(hues[i]! - hues[i - 1]!)
      const bandDiff = dominantHueBucket(hues[i]!) !== dominantHueBucket(hues[i - 1]!)
      if (diff >= 12 || bandDiff) distinctPairs++
    }
    expect(distinctPairs).toBeGreaterThanOrEqual(9)
  })

  it('assigns storybook cottage week a house motif (not diamond)', () => {
    const idx = WEEKLY_PLANT_THEMES.indexOf('storybook cottage vine')
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(WEEKLY_THEME_SPECS[idx]!.motifKey).toBe('house')
    const seeded = buildWeeklyGenome('2099-W01', 'storybook cottage vine', null)
    expect(seeded.motif.label).toBe('house')
    expect(seeded.motif.label).not.toBe('diamond')
    void paletteDominantHue(seeded.palette)
  })
})
