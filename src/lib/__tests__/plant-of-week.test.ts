import { describe, expect, it } from 'vitest'
import {
  buildWeeklyGenome,
  getPlantOfWeek,
  hasWeeklySeedForWeek,
  isoWeekKey,
  weeklyGenomeForIsoWeek,
} from '@/lib/garden/plant-of-week'
import { hybridVarieties, semanticLocalGenome } from '@/lib/garden/hybrid'

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
})
