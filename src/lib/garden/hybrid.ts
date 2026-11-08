import type {
  HybridAdornment,
  HybridBaseVariety,
  HybridGenome,
  HybridMotif,
  MotifPath,
} from '@/lib/types'
import { lerpHex } from './color'
import type { ScenePalette } from './palettes'
import { motifFromKey } from './hybrid-motifs'
import { applyIdeaFidelity, semanticLocalGenome } from './hybrid-semantic'

export {
  analyzeIdea,
  applyIdeaFidelity,
  huesNear,
  paletteDominantHue,
  semanticLocalGenome,
} from './hybrid-semantic'

export function hybridVarieties(): HybridBaseVariety[] {
  return ['flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower', 'fern', 'mushroom', 'lotus']
}

export function mergedPal(C: ScenePalette, g: HybridGenome): ScenePalette {
  return {
    ...C,
    sil: g.palette.sil,
    silSoft: lerpHex(g.palette.sil, '#f0e7da', 0.16),
    rim: g.palette.rim,
    glow: g.palette.glow,
    accent: g.palette.accent,
  }
}

const LIB_MOTIF_KEYS = ['heart', 'star', 'moon', 'droplet', 'diamond', 'ring'] as const

export function libMotif(n: number): HybridMotif {
  return motifFromKey(LIB_MOTIF_KEYS[Math.abs(n) % LIB_MOTIF_KEYS.length]!)
}

const PATH_SAFE = /^[MmLlHhVvCcSsQqTtAaZz0-9\s,.\-+eE]+$/

export function parseMotif(m: Partial<HybridMotif> | null | undefined, seedN: number): HybridMotif {
  const tokens = ['sil', 'rim', 'glow', 'accent', 'none'] as const
  const ok: MotifPath[] = []
  if (m && Array.isArray(m.paths)) {
    m.paths.slice(0, 6).forEach((p) => {
      if (!p || typeof p.d !== 'string') return
      const d = p.d.trim().slice(0, 600)
      if (!d.length || !PATH_SAFE.test(d)) return
      ok.push({
        d,
        fill: tokens.includes(p.fill as (typeof tokens)[number]) ? p.fill : 'glow',
        stroke: tokens.includes(p.stroke as (typeof tokens)[number]) ? p.stroke : 'none',
        sw: Math.max(0, Math.min(3, Number(p.sw) || 0)),
      })
    })
  }
  if (!ok.length) return libMotif(seedN)
  return { label: String((m && m.label) || 'dream glyph').slice(0, 40), paths: ok }
}

export function parseGenome(raw: string, idea?: string): HybridGenome | null {
  try {
    const a = raw.indexOf('{')
    const b = raw.lastIndexOf('}')
    if (a < 0 || b <= a) return null
    const j = JSON.parse(raw.slice(a, b + 1)) as Record<string, unknown>
    const vs = hybridVarieties()
    const hex = (c: unknown, d: string) => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)) ? c : d
    const base = vs.includes(j.base as HybridBaseVariety) ? (j.base as HybridBaseVariety) : 'flower'
    let graft = vs.includes(j.graft as HybridBaseVariety) ? (j.graft as HybridBaseVariety) : 'mushroom'
    if (graft === base) graft = base === 'fern' ? 'mushroom' : 'fern'
    const palette = j.palette as Record<string, unknown> | undefined
    let sil = hex(palette?.sil, '#150a22')
    const p = parseInt(sil.slice(1), 16)
    if ((((p >>> 16) & 255) + ((p >>> 8) & 255) + (p & 255)) / 3 > 96) {
      sil = '#' + [16, 8, 0].map((sh) => Math.round(((p >>> sh) & 255) * 0.3).toString(16).padStart(2, '0')).join('')
    }
    const genome: HybridGenome = {
      name: String(j.name || 'Nameless Bloom').slice(0, 40),
      essence: String(j.essence || '').slice(0, 180),
      base,
      graft,
      palette: {
        sil,
        rim: hex(palette?.rim, '#ffb877'),
        glow: hex(palette?.glow, '#ffd9a0'),
        accent: hex(palette?.accent, '#ff8f5e'),
      },
      glowIntensity: Math.max(0, Math.min(1, Number(j.glowIntensity) || 0.6)),
      adornment: ['motes', 'fireflies', 'rings', 'halo', 'none'].includes(j.adornment as string)
        ? (j.adornment as HybridGenome['adornment'])
        : 'motes',
      seed: Math.max(1, Math.min(9999, Math.round(Number(j.seed) || 1234))),
      motif: parseMotif(j.motif as Partial<HybridMotif>, Math.round(Number(j.seed) || 1234)),
    }
    if (idea?.trim()) return applyIdeaFidelity(idea.trim(), genome)
    return genome
  } catch {
    return null
  }
}

export function localGenome(idea: string): HybridGenome {
  return semanticLocalGenome(idea, hybridVarieties())
}
