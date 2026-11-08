import type { HybridBaseVariety, HybridGenome } from '@/lib/types'
import { lerpHex } from './color'
import { hybridVarieties, semanticLocalGenome } from './hybrid'
import { WEEKLY_PLANT_THEMES } from './plant-of-week-themes'

export { WEEKLY_PLANT_THEMES } from './plant-of-week-themes'

export interface PlantOfWeek {
  isoWeek: string
  theme: string
  daysLeft: number
  genome: HybridGenome
  evolvedFromName: string | null
  parentWeek: string | null
}

const GRAFT_PAIR_MUTATE: Record<HybridBaseVariety, HybridBaseVariety> = {
  flower: 'vine',
  tree: 'lotus',
  succulent: 'fern',
  vine: 'wildflower',
  herb: 'fern',
  wildflower: 'herb',
  fern: 'vine',
  mushroom: 'lotus',
  lotus: 'herb',
}

export function isoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function daysLeftInIsoWeek(date = new Date()): number {
  const day = date.getUTCDay()
  return day === 0 ? 0 : 7 - day
}

function weekIndexFromKey(key: string): number {
  const [y, w] = key.split('-W')
  return Number(y) * 53 + Number(w)
}

const WEEKLY_ANCHOR = '2020-W01'

function isoWeekToUtcDate(key: string): Date {
  const [year, week] = key.split('-W').map((part) => Number(part))
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const day = jan4.getUTCDay() || 7
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7)
  return monday
}

function shiftIsoWeekKey(key: string, weeks: number): string {
  const d = isoWeekToUtcDate(key)
  d.setUTCDate(d.getUTCDate() + weeks * 7)
  return isoWeekKey(d)
}

function previousIsoWeekKey(key: string): string {
  return shiftIsoWeekKey(key, -1)
}

function themeForWeekKey(key: string): string {
  return WEEKLY_PLANT_THEMES[weekIndexFromKey(key) % WEEKLY_PLANT_THEMES.length]!
}

function mutateWeeklyGenome(prev: HybridGenome, next: HybridGenome, evolvedFromName: string): HybridGenome {
  const graft =
    prev.graft === next.graft
      ? GRAFT_PAIR_MUTATE[next.base]
      : next.graft
  const adornments = ['motes', 'fireflies', 'rings', 'halo', 'none'] as const
  const adornIdx = adornments.indexOf(next.adornment)
  const adornment =
    prev.adornment === next.adornment
      ? adornments[(adornIdx + 1) % adornments.length]!
      : next.adornment

  return {
    ...next,
    graft,
    adornment,
    palette: {
      sil: lerpHex(prev.palette.sil, next.palette.sil, 0.38),
      rim: lerpHex(prev.palette.rim, next.palette.rim, 0.62),
      glow: lerpHex(prev.palette.glow, next.palette.glow, 0.65),
      accent: lerpHex(prev.palette.accent, next.palette.accent, 0.58),
    },
    glowIntensity: Math.max(0.35, Math.min(1, (prev.glowIntensity + next.glowIntensity) / 2 + 0.06)),
    seed: ((prev.seed + next.seed) % 9998) + 1,
    essence: `Evolved from ${evolvedFromName}. ${next.essence}`.slice(0, 180),
  }
}

export function buildWeeklyGenome(isoWeek: string, theme: string, prev: HybridGenome | null): HybridGenome {
  const fresh = semanticLocalGenome(theme, hybridVarieties())
  fresh.essence = `This week's shared garden dream: ${fresh.essence}`.slice(0, 180)
  if (!prev) return fresh
  return mutateWeeklyGenome(prev, fresh, prev.name)
}

/** Genome for an ISO week — deterministic worldwide (UTC). */
export function weeklyGenomeForIsoWeek(isoWeek: string): HybridGenome {
  if (weekIndexFromKey(isoWeek) <= weekIndexFromKey(WEEKLY_ANCHOR)) {
    return buildWeeklyGenome(isoWeek, themeForWeekKey(isoWeek), null)
  }
  let cursor = WEEKLY_ANCHOR
  let genome = semanticLocalGenome(themeForWeekKey(cursor), hybridVarieties())
  let guard = 0
  while (cursor !== isoWeek && guard < 520) {
    guard++
    cursor = shiftIsoWeekKey(cursor, 1)
    const theme = themeForWeekKey(cursor)
    genome = buildWeeklyGenome(cursor, theme, genome)
  }
  return genome
}

export function getPlantOfWeek(now = new Date()): PlantOfWeek {
  const isoWeek = isoWeekKey(now)
  const theme = themeForWeekKey(isoWeek)
  const parentWeek = previousIsoWeekKey(isoWeek)
  const prev = weeklyGenomeForIsoWeek(parentWeek)
  const genome = weeklyGenomeForIsoWeek(isoWeek)
  return {
    isoWeek,
    theme,
    daysLeft: daysLeftInIsoWeek(now),
    genome,
    evolvedFromName: prev.name,
    parentWeek,
  }
}

export function getUpcomingWeeklyPlants(count: number, from = new Date()): PlantOfWeek[] {
  const out: PlantOfWeek[] = []
  let cursor = from
  for (let i = 0; i < count; i++) {
    out.push(getPlantOfWeek(cursor))
    cursor = new Date(cursor.getTime() + 7 * 86400000)
  }
  return out
}

export function hasWeeklySeedForWeek(
  seeds: { weeklyIsoWeek?: string }[],
  isoWeek: string,
): boolean {
  return seeds.some((s) => s.weeklyIsoWeek === isoWeek)
}
