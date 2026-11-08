import type {
  HybridBaseVariety,
  HybridGenome,
  HybridMotif,
} from '@/lib/types'
import { lerpHex } from './color'
import type { ScenePalette } from './palettes'
import { motifFromKey } from './hybrid-motifs'
import { semanticLocalGenome } from './hybrid-semantic'
import { parseMotifPath, sanitizeGenome, tintSilhouetteSil } from './hybrid-sanitize'

export {
  analyzeIdea,
  applyIdeaFidelity,
  huesNear,
  paletteDominantHue,
  semanticLocalGenome,
} from './hybrid-semantic'
export { sanitizeGenome, tintSilhouetteSil } from './hybrid-sanitize'

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

/** Genome-forward plant colors so dream hues read on blooms and foliage (still silhouette-first). */
export function hybridPlantPalette(g: HybridGenome): import('@/components/plants/seeded-builders').HybridPlantPalette {
  const p = g.palette
  const gi = g.glowIntensity ?? 0.55
  const vivid = Math.min(1, gi + 0.28)
  return {
    sil: lerpHex(p.sil, p.rim, 0.32 + vivid * 0.28),
    silSoft: lerpHex(p.sil, p.glow, 0.46 + vivid * 0.22),
    rim: p.rim,
    glow: p.glow,
    accent: p.accent,
  }
}

const LIB_MOTIF_KEYS = ['heart', 'star', 'moon', 'droplet', 'diamond', 'ring'] as const

export function libMotif(n: number): HybridMotif {
  return motifFromKey(LIB_MOTIF_KEYS[Math.abs(n) % LIB_MOTIF_KEYS.length]!)
}

export function parseMotif(
  m: Partial<HybridMotif> | null | undefined,
  seedN: number,
): HybridMotif {
  const paths = parseMotifPath(m, seedN)
  if (!paths.length) return libMotif(seedN)
  return {
    label: String((m && m.label) || 'dream glyph').slice(0, 40),
    paths,
  }
}

export function parseGenome(raw: string, idea?: string): HybridGenome | null {
  try {
    const a = raw.indexOf('{')
    const b = raw.lastIndexOf('}')
    if (a < 0 || b <= a) return null
    const j = JSON.parse(raw.slice(a, b + 1)) as Record<string, unknown>
    return sanitizeGenome(j, idea)
  } catch {
    return null
  }
}

export function localGenome(idea: string): HybridGenome {
  return semanticLocalGenome(idea, hybridVarieties())
}
