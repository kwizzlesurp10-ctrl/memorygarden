import { readRaw, StorageQuotaExceededError, writeRaw } from '@/lib/storage'
import type { Candle, PlantedHybrid, ShedSeed, ShedStyle, StorageShedData } from '@/lib/types'
import { sanitizeGenome } from './hybrid-sanitize'

const SHED_STYLES: ShedStyle[] = ['antique', 'storybook', 'glass', 'modern']
const MAX_SEEDS = 60
const MAX_NOTE = 400
const MAX_IDEA = 240

export { StorageQuotaExceededError } from '@/lib/storage'

export type SaveShedResult = { ok: true } | { ok: false; error: 'quota' }

function shedKey(userId: string): string {
  return `${userId}:storage-shed`
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function sanitizeShedSeed(raw: unknown): ShedSeed | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<ShedSeed>
  const idea = String(o.idea ?? '').trim().slice(0, MAX_IDEA)
  const genome = sanitizeGenome(o.g, idea || undefined)
  if (!genome) return null
  const id = String(o.id ?? '').trim().slice(0, 80)
  if (!id) return null
  const when = Number.isFinite(Number(o.when)) ? Math.round(Number(o.when)) : Date.now()
  const weeklyIsoWeek =
    typeof o.weeklyIsoWeek === 'string' && /^\d{4}-W\d{2}$/.test(o.weeklyIsoWeek)
      ? o.weeklyIsoWeek
      : undefined
  const source = o.source === 'weekly' || o.source === 'dream' ? o.source : weeklyIsoWeek ? 'weekly' : 'dream'
  const lineage =
    o.lineage && typeof o.lineage === 'object'
      ? {
          evolvedFromName: String((o.lineage as ShedSeed['lineage'])?.evolvedFromName ?? '').slice(0, 40) || undefined,
          parentWeek: String((o.lineage as ShedSeed['lineage'])?.parentWeek ?? '').slice(0, 12) || undefined,
        }
      : undefined

  return {
    id,
    idea: idea || genome.name,
    note: String(o.note ?? '').slice(0, MAX_NOTE),
    when,
    g: genome,
    source,
    weeklyIsoWeek,
    lineage: lineage && (lineage.evolvedFromName || lineage.parentWeek) ? lineage : undefined,
  }
}

function sanitizePlanted(raw: unknown): PlantedHybrid | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Partial<PlantedHybrid>
  const g = sanitizeGenome(p.g)
  if (!g) return null
  return {
    g,
    seedId: typeof p.seedId === 'string' ? p.seedId.slice(0, 80) : null,
    x: clamp(Number(p.x) || 0, 0, 2000),
    y: clamp(Number(p.y) || 500, 0, 2000),
    sc: clamp(Number(p.sc) || 1, 0.2, 4),
  }
}

function sanitizeCandle(raw: unknown): Candle | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as Partial<Candle>
  const id = String(c.id ?? '').trim()
  const date = String(c.date ?? '').trim()
  if (!id || !date) return null
  return {
    id: id.slice(0, 80),
    date: date.slice(0, 32),
    note: String(c.note ?? '').slice(0, MAX_NOTE),
    x: clamp(Number(c.x) || 100, 60, 1140),
    y: clamp(Number(c.y) || 520, 505, 650),
  }
}

export function validateShedData(raw: unknown): StorageShedData {
  const j = (raw && typeof raw === 'object' ? raw : {}) as Partial<StorageShedData>
  const seeds: ShedSeed[] = []
  if (Array.isArray(j.seeds)) {
    for (const entry of j.seeds) {
      const sd = sanitizeShedSeed(entry)
      if (sd) seeds.push(sd)
    }
  }
  const planted: PlantedHybrid[] = []
  if (Array.isArray(j.planted)) {
    for (const entry of j.planted) {
      const p = sanitizePlanted(entry)
      if (p) planted.push(p)
    }
  }
  const candles: Candle[] = []
  if (Array.isArray(j.candles)) {
    for (const entry of j.candles) {
      const c = sanitizeCandle(entry)
      if (c) candles.push(c)
    }
  }
  const shedStyle = SHED_STYLES.includes(j.shedStyle as ShedStyle) ? (j.shedStyle as ShedStyle) : 'antique'

  return {
    v: 1,
    seeds: seeds.slice(0, MAX_SEEDS),
    planted,
    shedStyle,
    candles,
  }
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

export function saveShed(userId: string, data: StorageShedData): SaveShedResult {
  const safe = validateShedData(data)
  try {
    writeRaw(shedKey(userId), safe)
    return { ok: true }
  } catch (err) {
    if (err instanceof StorageQuotaExceededError) return { ok: false, error: 'quota' }
    throw err
  }
}

export function mergeStorageShed(local: StorageShedData, remote: StorageShedData): StorageShedData {
  const seedById = new Map<string, ShedSeed>()
  for (const s of [...remote.seeds, ...local.seeds]) seedById.set(s.id, s)
  const plantedIds = new Set<string>()
  const planted: PlantedHybrid[] = []
  for (const p of [...local.planted, ...remote.planted]) {
    const key = `${p.x}:${p.y}:${p.seedId ?? ''}`
    if (plantedIds.has(key)) continue
    plantedIds.add(key)
    planted.push(p)
  }
  return validateShedData({
    v: 1,
    seeds: [...seedById.values()],
    planted,
    shedStyle: local.shedStyle,
    candles: local.candles.length ? local.candles : remote.candles,
  })
}

/** Size-limited shed for cloud sync payload (optional field). */
export function sanitizeShedForSync(raw: unknown): StorageShedData | null {
  const shed = validateShedData(raw)
  const serialized = JSON.stringify(shed)
  const MAX_BYTES = 380_000
  if (serialized.length <= MAX_BYTES) return shed
  return validateShedData({
    ...shed,
    seeds: shed.seeds.slice(0, Math.max(12, Math.floor(shed.seeds.length / 2))),
    planted: shed.planted.slice(0, 40),
  })
}
