import { readRaw, writeRaw } from '@/lib/storage'
import type { Candle, PlantedHybrid, ShedSeed, ShedStyle, StorageShedData } from '@/lib/types'

const SHED_STYLES: ShedStyle[] = ['antique', 'storybook', 'glass', 'modern']

function shedKey(userId: string): string {
  return `${userId}:storage-shed`
}

function validateShedData(raw: unknown): StorageShedData {
  const j = (raw && typeof raw === 'object' ? raw : {}) as Partial<StorageShedData>
  const seeds = Array.isArray(j.seeds)
    ? j.seeds.filter((sd): sd is ShedSeed => !!(sd && sd.g && sd.g.base))
    : []
  const planted = Array.isArray(j.planted)
    ? j.planted.filter((p): p is PlantedHybrid => !!(p && p.g && p.g.base))
    : []
  const candles = (Array.isArray(j.candles)
    ? j.candles.filter((c): c is Candle => !!(c && c.date && typeof c.x === 'number'))
    : []
  ).map((c) => ({
    ...c,
    x: Math.max(60, Math.min(1140, c.x)),
    y: Math.max(505, Math.min(650, c.y)),
  }))
  const shedStyle = SHED_STYLES.includes(j.shedStyle as ShedStyle) ? (j.shedStyle as ShedStyle) : 'antique'

  return { v: 1, seeds, planted, shedStyle, candles }
}

export function loadShed(userId: string): StorageShedData {
  const raw = readRaw<unknown>(shedKey(userId))
  if (!raw) {
    return { v: 1, seeds: [], planted: [], shedStyle: 'antique', candles: [] }
  }
  try {
    return validateShedData(raw)
  } catch {
    return { v: 1, seeds: [], planted: [], shedStyle: 'antique', candles: [] }
  }
}

export function saveShed(userId: string, data: StorageShedData): void {
  writeRaw(shedKey(userId), data)
}