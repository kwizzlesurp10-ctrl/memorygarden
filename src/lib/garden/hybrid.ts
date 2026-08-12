import type {
  HybridAdornment,
  HybridBaseVariety,
  HybridGenome,
  HybridMotif,
  MotifPath,
} from '@/lib/types'
import { lerpHex } from './color'
import type { ScenePalette } from './palettes'

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

export function libMotif(n: number): HybridMotif {
  const lib: HybridMotif[] = [
    { label: 'heart', paths: [{ d: 'M 12 20 C 5 14 4 8 8 6 C 10 5 12 7 12 9 C 12 7 14 5 16 6 C 20 8 19 14 12 20 Z', fill: 'glow', stroke: 'none', sw: 0 }] },
    { label: 'star', paths: [{ d: 'M 12 3 L 14 9.5 L 21 9.5 L 15.5 13.5 L 17.5 20 L 12 16 L 6.5 20 L 8.5 13.5 L 3 9.5 L 10 9.5 Z', fill: 'accent', stroke: 'none', sw: 0 }] },
    { label: 'crescent', paths: [{ d: 'M 16 4 A 8.5 8.5 0 1 0 16 20 A 7 7 0 1 1 16 4 Z', fill: 'glow', stroke: 'none', sw: 0 }] },
    { label: 'droplet', paths: [{ d: 'M 12 3 C 16 9 18 12 18 15 A 6 6 0 1 1 6 15 C 6 12 8 9 12 3 Z', fill: 'rim', stroke: 'none', sw: 0 }] },
    { label: 'diamond', paths: [{ d: 'M 12 3 L 20 12 L 12 21 L 4 12 Z', fill: 'accent', stroke: 'none', sw: 0 }] },
    { label: 'ring', paths: [{ d: 'M 12 5 A 7 7 0 1 0 12 19 A 7 7 0 1 0 12 5 Z', fill: 'none', stroke: 'glow', sw: 2.5 }] },
  ]
  return lib[Math.abs(n) % lib.length]!
}

export function parseMotif(m: Partial<HybridMotif> | null | undefined, seedN: number): HybridMotif {
  const tokens = ['sil', 'rim', 'glow', 'accent', 'none'] as const
  const ok: MotifPath[] = []
  if (m && Array.isArray(m.paths)) {
    m.paths.slice(0, 6).forEach((p) => {
      if (p && typeof p.d === 'string' && p.d.length < 600 && /^[MmLlHhVvCcSsQqTtAaZz0-9\s,.\-+eE]+$/.test(p.d)) {
        ok.push({
          d: p.d,
          fill: tokens.includes(p.fill as typeof tokens[number]) ? p.fill : 'glow',
          stroke: tokens.includes(p.stroke as typeof tokens[number]) ? p.stroke : 'none',
          sw: Math.max(0, Math.min(3, Number(p.sw) || 0)),
        })
      }
    })
  }
  if (!ok.length) return libMotif(seedN)
  return { label: String((m && m.label) || 'dream glyph').slice(0, 40), paths: ok }
}

export function parseGenome(raw: string): HybridGenome | null {
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
    return {
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
  } catch {
    return null
  }
}

export function localGenome(idea: string): HybridGenome {
  let h = 2166136261
  for (const ch of idea) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  h = h >>> 0
  const vs = hybridVarieties()
  const base = vs[h % 9]!
  let graft = vs[(h >>> 4) % 9]!
  if (graft === base) graft = vs[((h % 9) + 4) % 9]!
  const pals = [
    { sil: '#1a0c26', rim: '#ffb877', glow: '#ffd9a0', accent: '#ff8f5e' },
    { sil: '#0e081f', rim: '#c98adf', glow: '#ff9ecf', accent: '#9f7bff' },
    { sil: '#040a13', rim: '#a8d4e8', glow: '#d6ecff', accent: '#9fc4d8' },
    { sil: '#122408', rim: '#d8e89a', glow: '#f2ffb0', accent: '#8fd460' },
    { sil: '#26060e', rim: '#ff9e9e', glow: '#ffc9b0', accent: '#ff6f61' },
    { sil: '#241c04', rim: '#ffe08a', glow: '#fff2c0', accent: '#ffb84a' },
  ]
  const sufs = ['bloom', 'lantern', 'whisper', 'veil', 'ember', 'chime', 'drift', 'halo']
  const w = (idea.trim().split(/\s+/)[0] || 'dream').replace(/[^a-zA-Z]/g, '') || 'dream'
  const name = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() + sufs[(h >>> 8) % sufs.length]
  return {
    name,
    essence: 'Grown from "' + idea.trim().slice(0, 60) + '" — a ' + base + ' heart carrying a ' + graft + "'s dream.",
    base,
    graft,
    palette: pals[(h >>> 12) % pals.length]!,
    glowIntensity: 0.4 + ((h >>> 16) % 60) / 100,
      adornment: (['motes', 'fireflies', 'rings', 'halo'] as HybridAdornment[])[(h >>> 20) % 4]!,
    seed: 1 + (h % 9998),
    motif: libMotif(h >>> 5),
  }
}