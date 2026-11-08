import type { HybridAdornment, HybridBaseVariety, HybridGenome, HybridMotif, HybridPalette } from '@/lib/types'
import type { HybridBaseVariety as Base } from '@/lib/types'
import { MOTIF_PHRASES, motifFromKey, resolveMotifKey } from './hybrid-motifs'

export interface IdeaSemantics {
  colorHue: number | null
  colorWord: string | null
  plantBase: HybridBaseVariety | null
  plantWord: string | null
  motifKey: string | null
  moods: string[]
}

const COLOR_WORDS: Record<string, number> = {
  red: 4,
  crimson: 4,
  scarlet: 4,
  ruby: 4,
  maroon: 4,
  orange: 28,
  amber: 32,
  gold: 42,
  golden: 42,
  yellow: 48,
  green: 125,
  emerald: 130,
  lime: 110,
  teal: 175,
  cyan: 185,
  turquoise: 175,
  aqua: 175,
  blue: 215,
  navy: 225,
  azure: 205,
  cobalt: 220,
  purple: 275,
  violet: 280,
  indigo: 260,
  lavender: 285,
  lilac: 285,
  pink: 340,
  rose: 345,
  magenta: 310,
  silver: 210,
  grey: 210,
  gray: 210,
  black: 0,
  white: 0,
}

const PLANT_PHRASES: Record<string, HybridBaseVariety> = {
  'cherry blossom': 'tree',
}

const PLANT_RANK: Record<string, number> = {
  sunflower: 12,
  mushroom: 12,
  toadstool: 12,
  rose: 11,
  lotus: 11,
  cactus: 10,
  aloe: 10,
  fern: 10,
  moss: 10,
  tulip: 10,
  lily: 10,
  daisy: 9,
  wildflower: 8,
  ivy: 8,
  vine: 8,
  mint: 8,
  lavender: 8,
  oak: 7,
  pine: 7,
  willow: 7,
  maple: 7,
  birch: 7,
  tree: 5,
  flower: 5,
  herb: 5,
  succulent: 5,
  blossom: 6,
}

const PLANT_WORDS: Record<string, HybridBaseVariety> = {
  rose: 'flower',
  tulip: 'flower',
  lily: 'flower',
  daisy: 'wildflower',
  sunflower: 'wildflower',
  wildflower: 'wildflower',
  flower: 'flower',
  oak: 'tree',
  pine: 'tree',
  willow: 'tree',
  maple: 'tree',
  birch: 'tree',
  tree: 'tree',
  cactus: 'succulent',
  aloe: 'succulent',
  succulent: 'succulent',
  ivy: 'vine',
  vine: 'vine',
  mint: 'herb',
  herb: 'herb',
  basil: 'herb',
  sage: 'herb',
  lavender: 'herb',
  fern: 'fern',
  moss: 'fern',
  mushroom: 'mushroom',
  toadstool: 'mushroom',
  lotus: 'lotus',
  blossom: 'flower',
}

const GRAFT_PAIR: Record<HybridBaseVariety, HybridBaseVariety> = {
  flower: 'herb',
  tree: 'fern',
  succulent: 'mushroom',
  vine: 'flower',
  herb: 'wildflower',
  wildflower: 'vine',
  fern: 'mushroom',
  mushroom: 'herb',
  lotus: 'fern',
}

const MOOD_WORDS = ['calm', 'sad', 'joyful', 'love', 'angry', 'peaceful', 'spooky', 'happy', 'cozy', 'angsty'] as const

const NAME_SUFFIXES = ['Lantern', 'Bloom', 'Whisper', 'Veil', 'Ember', 'Chime', 'Drift', 'Halo']

export function hashIdea(idea: string): number {
  let h = 2166136261
  for (const ch of idea) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function normalizeForScan(idea: string): string {
  return idea.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim()
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  const toByte = (v: number) => Math.round((v + m) * 255)
  return (
    '#' +
    [toByte(r), toByte(g), toByte(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  )
}

export function paletteFromHue(hue: number, mood: string[]): HybridPalette {
  const calm = mood.includes('calm') || mood.includes('peaceful')
  const sad = mood.includes('sad')
  const joyful = mood.includes('joyful') || mood.includes('happy') || mood.includes('love')
  const angry = mood.includes('angry')
  const spooky = mood.includes('spooky')

  const sat = angry ? 0.82 : sad ? 0.52 : joyful ? 0.88 : calm ? 0.58 : 0.74
  const sil = hslToHex(hue, sat * 0.62, spooky ? 0.12 : 0.17)
  const rim = hslToHex(hue, Math.min(0.95, sat + 0.08), angry ? 0.56 : joyful ? 0.64 : 0.6)
  const glow = hslToHex((hue + 10) % 360, Math.min(0.92, sat), joyful ? 0.76 : 0.7)
  const accent = hslToHex((hue + 26) % 360, Math.min(0.98, sat + 0.12), angry ? 0.5 : 0.58)
  return { sil, rim, glow, accent }
}

export function hexToHue(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >>> 16) & 255) / 255
  const g = ((n >>> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
  else if (max === g) h = ((b - r) / d + 2) * 60
  else h = ((r - g) / d + 4) * 60
  return h
}

export function paletteDominantHue(p: HybridPalette): number {
  const hues = [p.rim, p.glow, p.accent].map(hexToHue)
  return hues.reduce((a, b) => a + b, 0) / hues.length
}

export function huesNear(a: number, b: number, delta = 38): boolean {
  const diff = Math.abs(a - b)
  return Math.min(diff, 360 - diff) <= delta
}

function matchPhrases(text: string, table: Record<string, string>): string | null {
  const phrases = Object.keys(table).sort((a, b) => b.length - a.length)
  for (const phrase of phrases) {
    if (text.includes(phrase)) return table[phrase]!
  }
  return null
}

function scanWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

export function analyzeIdea(idea: string): IdeaSemantics {
  const text = normalizeForScan(idea)
  const moods = MOOD_WORDS.filter((m) => text.includes(m))
  let colorHue: number | null = null
  let colorWord: string | null = null
  for (const w of scanWords(text)) {
    if (w in COLOR_WORDS) {
      colorHue = COLOR_WORDS[w]!
      colorWord = w
      break
    }
  }

  let plantBase: HybridBaseVariety | null = null
  let plantWord: string | null = null
  const phrasePlant = matchPhrases(text, PLANT_PHRASES)
  if (phrasePlant) {
    plantBase = phrasePlant as HybridBaseVariety
    plantWord = Object.keys(PLANT_PHRASES).find((k) => text.includes(k)) ?? 'blossom'
  }
  if (!plantBase) {
    let bestRank = -1
    for (const w of scanWords(text)) {
      if (w in PLANT_WORDS) {
        const rank = PLANT_RANK[w] ?? 6
        if (rank >= bestRank) {
          bestRank = rank
          plantBase = PLANT_WORDS[w]!
          plantWord = w
        }
      }
    }
  }

  let motifKey: string | null = matchPhrases(text, MOTIF_PHRASES)
  if (!motifKey) {
    for (const w of scanWords(text)) {
      const key = resolveMotifKey(w)
      if (key) {
        motifKey = key
        break
      }
    }
  }

  if (!plantBase) {
    plantBase = inferThematicBase(text, motifKey)
    if (plantBase) plantWord = plantBase
  }

  // Explicit plant "rose" can double as motif when no other object matched
  if (!motifKey && /\b(rain|rainy|storm|drizzle)\b/.test(text)) motifKey = 'rain'
  if (!motifKey && plantWord === 'rose') motifKey = 'rose'
  if (!motifKey && plantWord === 'sunflower') motifKey = 'flower'
  if (!motifKey && plantWord === 'flower') motifKey = 'flower'

  return { colorHue, colorWord, plantBase, plantWord, motifKey, moods }
}

function inferThematicBase(text: string, motifKey: string | null): HybridBaseVariety | null {
  if (/\b(ocean|wave|waves|sea|water|river|lake)\b/.test(text)) return 'lotus'
  if (/\b(rain|rainy|storm|drizzle|wet)\b/.test(text)) return 'fern'
  if (/\b(forest|woods|grove)\b/.test(text)) return 'tree'
  if (motifKey === 'wave') return 'lotus'
  if (motifKey === 'rain') return 'fern'
  if (motifKey === 'moon') return 'lotus'
  return null
}

function moodAdornment(moods: string[]): HybridAdornment {
  if (moods.includes('spooky')) return 'rings'
  if (moods.includes('joyful') || moods.includes('happy')) return 'fireflies'
  if (moods.includes('love')) return 'halo'
  if (moods.includes('calm') || moods.includes('peaceful')) return 'none'
  if (moods.includes('sad')) return 'motes'
  if (moods.includes('angry')) return 'rings'
  return 'motes'
}

function moodGlow(moods: string[], base: number): number {
  if (moods.includes('spooky')) return Math.min(0.95, base + 0.15)
  if (moods.includes('joyful') || moods.includes('love')) return Math.min(0.92, base + 0.2)
  if (moods.includes('calm') || moods.includes('peaceful')) return Math.max(0.35, base - 0.12)
  if (moods.includes('sad')) return Math.max(0.3, base - 0.18)
  if (moods.includes('angry')) return Math.min(0.98, base + 0.25)
  return base
}

function titleCase(word: string): string {
  if (!word) return 'Dream'
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function buildName(sem: IdeaSemantics, h: number): string {
  const noun =
    sem.plantWord ??
    sem.motifKey ??
    (sem.colorWord && sem.colorWord !== 'rose' ? sem.colorWord : null) ??
    'dream'
  const suffix = NAME_SUFFIXES[(h >>> 8) % NAME_SUFFIXES.length]!
  return `${titleCase(noun.replace(/\s+/g, ' '))} ${suffix}`
}

export function semanticLocalGenome(idea: string, varieties: Base[]): HybridGenome {
  const trimmed = idea.trim()
  const h = hashIdea(trimmed)
  const sem = analyzeIdea(trimmed)
  const hasSemantic =
    sem.colorHue !== null || sem.plantBase !== null || sem.motifKey !== null || sem.moods.length > 0

  const base =
    sem.plantBase ??
    inferThematicBase(normalizeForScan(trimmed), sem.motifKey) ??
    varieties[h % varieties.length]!
  let graft = sem.plantBase ? GRAFT_PAIR[sem.plantBase] : varieties[(h >>> 4) % varieties.length]!
  if (graft === base) graft = varieties[((varieties.indexOf(base) + 4) % varieties.length)]!

  const palette =
    sem.colorHue !== null
      ? paletteFromHue(sem.colorHue, sem.moods)
      : [
          { sil: '#1a0c26', rim: '#ffb877', glow: '#ffd9a0', accent: '#ff8f5e' },
          { sil: '#0e081f', rim: '#c98adf', glow: '#ff9ecf', accent: '#9f7bff' },
          { sil: '#040a13', rim: '#a8d4e8', glow: '#d6ecff', accent: '#9fc4d8' },
          { sil: '#122408', rim: '#d8e89a', glow: '#f2ffb0', accent: '#8fd460' },
          { sil: '#26060e', rim: '#ff9e9e', glow: '#ffc9b0', accent: '#ff6f61' },
          { sil: '#241c04', rim: '#ffe08a', glow: '#fff2c0', accent: '#ffb84a' },
        ][(h >>> 12) % 6]!

  const glowBase = hasSemantic ? 0.52 : 0.4 + ((h >>> 16) % 60) / 100
  const adornment = sem.moods.length
    ? moodAdornment(sem.moods)
    : (['motes', 'fireflies', 'rings', 'halo'] as HybridAdornment[])[(h >>> 20) % 4]!

  const motif: HybridMotif =
    sem.motifKey !== null
      ? motifFromKey(sem.motifKey)
      : motifFromKey(['heart', 'star', 'moon', 'droplet', 'diamond', 'ring'][Math.abs(h >>> 5) % 6]!)

  const name = hasSemantic ? buildName(sem, h) : buildName({ ...sem, plantWord: scanWords(normalizeForScan(trimmed))[0] ?? 'dream' }, h)

  return {
    name: name.slice(0, 40),
    essence: `Grown from "${trimmed.slice(0, 60)}" — a ${base} carrying ${motif.label} at its crown.`,
    base,
    graft,
    palette,
    glowIntensity: moodGlow(sem.moods, glowBase),
    adornment,
    seed: 1 + (h % 9998),
    motif,
  }
}

function motifLooksWrong(sem: IdeaSemantics, motif: HybridMotif): boolean {
  if (!sem.motifKey) return false
  const expectedLabel = motifFromKey(sem.motifKey).label.toLowerCase()
  const label = motif.label.toLowerCase()
  if (label === expectedLabel) return false
  if (label.includes(sem.motifKey)) return false
  return true
}

export function applyIdeaFidelity(idea: string, genome: HybridGenome): HybridGenome {
  const sem = analyzeIdea(idea)
  const next = { ...genome, palette: { ...genome.palette }, motif: { ...genome.motif, paths: [...genome.motif.paths] } }

  if (sem.colorHue !== null) {
    const dom = paletteDominantHue(next.palette)
    if (!huesNear(dom, sem.colorHue)) {
      next.palette = paletteFromHue(sem.colorHue, sem.moods)
    }
  }

  const thematic = inferThematicBase(normalizeForScan(idea), sem.motifKey)
  const enforcedBase = sem.plantBase ?? thematic
  if (enforcedBase && next.base !== enforcedBase) {
    next.base = enforcedBase
    if (next.graft === next.base) next.graft = GRAFT_PAIR[enforcedBase]
  }

  const motifBroken = !next.motif.paths.length || next.motif.paths.every((p) => !p.d?.trim())
  if (sem.motifKey && (motifBroken || motifLooksWrong(sem, next.motif))) {
    next.motif = motifFromKey(sem.motifKey)
  }

  if (sem.moods.length) {
    next.glowIntensity = moodGlow(sem.moods, next.glowIntensity)
    // explicit color/plant beat mood for adornment — only apply mood adornment when no color word
    if (sem.colorHue === null) next.adornment = moodAdornment(sem.moods)
  }

  return next
}
