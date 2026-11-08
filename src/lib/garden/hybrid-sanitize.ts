import type {
  HybridAdornment,
  HybridBaseVariety,
  HybridGenome,
  HybridMotif,
  HybridPalette,
  MotifPath,
} from '@/lib/types'
import { lerpHex } from './color'
import { applyIdeaFidelity } from './hybrid-semantic'
import { motifFromKey } from './hybrid-motifs'

const HYBRID_BASES = ['flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower', 'fern', 'mushroom', 'lotus'] as const
const LIB_MOTIF_KEYS = ['heart', 'star', 'moon', 'droplet', 'diamond', 'ring'] as const

function libMotif(n: number): HybridMotif {
  return motifFromKey(LIB_MOTIF_KEYS[Math.abs(n) % LIB_MOTIF_KEYS.length]!)
}

const PATH_SAFE = /^[MmLlHhVvCcSsQqTtAaZz0-9\s,.\-+eE]+$/
const ADORNMENTS: HybridAdornment[] = ['motes', 'fireflies', 'rings', 'halo', 'none']

function hex(c: unknown, fallback: string): string {
  return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c : fallback
}

/** Keep silhouettes dark but let the requested hue show through — no 30% crush. */
export function tintSilhouetteSil(sil: string, rim: string, glow: string): string {
  const n = parseInt(sil.slice(1), 16)
  const avg = (((n >>> 16) & 255) + ((n >>> 8) & 255) + (n & 255)) / 3
  if (avg <= 96) return sil
  const hueCarrier = lerpHex(rim, glow, 0.22)
  const darkBase = '#0c0814'
  let tinted = lerpHex(darkBase, hueCarrier, 0.55)
  tinted = lerpHex(tinted, sil, 0.12)
  const t = parseInt(tinted.slice(1), 16)
  const tAvg = (((t >>> 16) & 255) + ((t >>> 8) & 255) + (t & 255)) / 3
  if (tAvg > 92) tinted = lerpHex(tinted, darkBase, 0.35)
  return tinted
}

function sanitizePalette(raw: unknown, seed: number): HybridPalette {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const rim = hex(p.rim, '#ffb877')
  const glow = hex(p.glow, '#ffd9a0')
  const accent = hex(p.accent, '#ff8f5e')
  let sil = hex(p.sil, '#150a22')
  sil = tintSilhouetteSil(sil, rim, glow)
  void seed
  return { sil, rim, glow, accent }
}

export function parseMotifPath(raw: unknown, seed: number): MotifPath[] {
  const m = (raw && typeof raw === 'object' ? raw : null) as Partial<HybridMotif> | null
  if (!m || !Array.isArray(m.paths)) return []
  const tokens = ['sil', 'rim', 'glow', 'accent', 'none'] as const
  const paths: MotifPath[] = []
  for (const p of m.paths.slice(0, 6)) {
    if (!p || typeof p !== 'object') continue
    const d = typeof p.d === 'string' ? p.d.trim().slice(0, 600) : ''
    if (!d.length || !PATH_SAFE.test(d)) continue
    paths.push({
      d,
      fill: tokens.includes(p.fill as (typeof tokens)[number]) ? p.fill : 'glow',
      stroke: tokens.includes(p.stroke as (typeof tokens)[number]) ? p.stroke : 'none',
      sw: Math.max(0, Math.min(3, Number(p.sw) || 0)),
    })
  }
  void seed
  return paths
}

function sanitizeMotif(raw: unknown, seed: number): HybridMotif {
  const paths = parseMotifPath(raw, seed)
  if (!paths.length) return libMotif(seed)
  const m = (raw && typeof raw === 'object' ? raw : null) as Partial<HybridMotif> | null
  return { label: String(m?.label || 'dream glyph').slice(0, 40), paths }
}

/**
 * Shared genome sanitizer for AI parse, shed load, and cloud sync.
 * Repairs invalid fields; returns null only when no usable base/motif can be resolved.
 */
export function sanitizeGenome(
  raw: unknown,
  idea?: string,
): HybridGenome | null {
  if (!raw || typeof raw !== 'object') return null
  const j = raw as Record<string, unknown>
  const vs = HYBRID_BASES
  const base = vs.includes(j.base as HybridBaseVariety) ? (j.base as HybridBaseVariety) : 'flower'
  let graft = vs.includes(j.graft as HybridBaseVariety) ? (j.graft as HybridBaseVariety) : 'mushroom'
  if (graft === base) graft = base === 'fern' ? 'mushroom' : 'fern'
  const seed = Math.max(1, Math.min(9999, Math.round(Number(j.seed) || 1234)))

  const genome: HybridGenome = {
    name: String(j.name || 'Nameless Bloom').slice(0, 40),
    essence: String(j.essence || '').slice(0, 180),
    base,
    graft,
    palette: sanitizePalette(j.palette, seed),
    glowIntensity: Math.max(0, Math.min(1, Number(j.glowIntensity) || 0.6)),
    adornment: ADORNMENTS.includes(j.adornment as HybridAdornment)
      ? (j.adornment as HybridAdornment)
      : 'motes',
    seed,
    motif: sanitizeMotif(j.motif, seed),
  }

  if (idea?.trim()) return applyIdeaFidelity(idea.trim(), genome)
  return genome
}
