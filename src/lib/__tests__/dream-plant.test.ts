import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dreamPlant } from '@/lib/garden/dream-plant'
import {
  applyIdeaFidelity,
  huesNear,
  localGenome,
  parseGenome,
  paletteDominantHue,
} from '@/lib/garden/hybrid'
import { todPalette } from '@/lib/garden/day-night'
import {
  buildDreamContactSheetSvg,
  buildMotifGridContactSheetSvg,
  renderDreamPlantCellSvg,
} from '@/lib/garden/dream-contact-sheet'
import { MOTIF_GLYPHS } from '@/lib/garden/hybrid-motifs'
import { getPlantOfWeek, getUpcomingWeeklyPlants } from '@/lib/garden/plant-of-week'
import { getLLMProvider, resetLLMProvider, setLLMProvider, type LLMProvider } from '@/lib/llm-client'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'

const CAT_MOTIF_FRAG = 'M8 10 L6 5 L10 8'

function parseHexChannel(hex: string, channel: 'r' | 'g' | 'b'): number {
  const n = parseInt(hex.slice(1), 16)
  if (channel === 'r') return (n >>> 16) & 255
  if (channel === 'g') return (n >>> 8) & 255
  return n & 255
}

function svgHasRedBloom(svg: string, glowHex: string): boolean {
  expect(svg.includes(glowHex)).toBe(true)
  const r = parseHexChannel(glowHex, 'r')
  const g = parseHexChannel(glowHex, 'g')
  const b = parseHexChannel(glowHex, 'b')
  return r > 140 && r > g + 25 && r > b + 25
}

describe('dream plant semantic fallback', () => {
  it('maps red rose to red palette, flower base, and rose/flower motif', () => {
    const g = localGenome('red rose')
    expect(g.base).toBe('flower')
    expect(['rose', 'flower']).toContain(g.motif.label)
    expect(huesNear(paletteDominantHue(g.palette), 4, 55)).toBe(true)
    expect(g.name.toLowerCase()).toContain('rose')
  })

  it('maps my cat Luna to a cat motif', () => {
    const g = localGenome('my cat Luna')
    expect(g.motif.label).toBe('cat')
  })

  it('maps blue ocean waves to blue palette, wave motif, and lotus base', () => {
    const g = localGenome('blue ocean waves')
    expect(g.motif.label).toBe('wave')
    expect(g.base).toBe('lotus')
    expect(huesNear(paletteDominantHue(g.palette), 215, 45)).toBe(true)
  })

  it('maps coffee with grandma to coffee cup motif', () => {
    const g = localGenome('coffee with grandma')
    expect(g.motif.label).toBe('coffee cup')
  })

  it('maps spooky purple mushroom to mushroom base', () => {
    const g = localGenome('spooky purple mushroom')
    expect(g.base).toBe('mushroom')
    expect(huesNear(paletteDominantHue(g.palette), 275, 45)).toBe(true)
  })

  it('maps sad rainy day to fern base and rain motif', () => {
    const g = localGenome('sad rainy day')
    expect(g.base).toBe('fern')
    expect(g.motif.label).toBe('rain')
  })

  it('maps joyful golden sunflower to wildflower with gold palette', () => {
    const g = localGenome('joyful golden sunflower')
    expect(g.base).toBe('wildflower')
    expect(huesNear(paletteDominantHue(g.palette), 42, 40)).toBe(true)
  })

  it('maps calm lavender mint with lavender-purple palette', () => {
    const g = localGenome('calm lavender mint')
    expect(['herb', 'wildflower']).toContain(g.base)
    expect(huesNear(paletteDominantHue(g.palette), 285, 40)).toBe(true)
  })

  it('is deterministic for the same input', () => {
    const a = localGenome('spooky purple mushroom')
    const b = localGenome('spooky purple mushroom')
    expect(a).toEqual(b)
  })

  it('rendered red rose svg includes a red-hue bloom fill', () => {
    const g = localGenome('red rose')
    const palette = todPalette(12, 'summer')
    const svg = renderDreamPlantCellSvg(g, palette)
    expect(svgHasRedBloom(svg, g.palette.glow)).toBe(true)
  })

  it('rendered my cat Luna svg includes the cat motif path', () => {
    const g = localGenome('my cat Luna')
    const palette = todPalette(12, 'summer')
    const svg = renderDreamPlantCellSvg(g, palette)
    expect(svg).toContain(CAT_MOTIF_FRAG)
  })

  it('rejects unsafe motif path data and falls back safely', () => {
    const raw = JSON.stringify({
      name: 'Bad',
      essence: 'x',
      base: 'flower',
      graft: 'fern',
      palette: { sil: '#111111', rim: '#ff0000', glow: '#ffaaaa', accent: '#ff5500' },
      glowIntensity: 0.5,
      adornment: 'none',
      seed: 42,
      motif: {
        label: 'hack',
        paths: [{ d: '<script>alert(1)</script>', fill: 'glow', stroke: 'none', sw: 0 }],
      },
    })
    const g = parseGenome(raw, 'red rose')
    expect(g?.motif.paths.every((p) => /^[MmLlHhVvCcSsQqTtAaZz0-9\s,.\-+eE]+$/.test(p.d))).toBe(true)
    expect(g?.base).toBe('flower')
  })

  it('overrides AI genome when explicit user words disagree', () => {
    const raw = JSON.stringify({
      name: 'Wrong Bloom',
      essence: 'mist',
      base: 'tree',
      graft: 'succulent',
      palette: { sil: '#111111', rim: '#55ff55', glow: '#aaffaa', accent: '#00ff00' },
      glowIntensity: 0.4,
      adornment: 'none',
      seed: 99,
      motif: { label: 'star', paths: [{ d: 'M12 3 L14 9.5 L21 9.5 L15.5 13.5 L17.5 20 L12 16 L6.5 20 L8.5 13.5 L3 9.5 L10 9.5 Z', fill: 'glow', stroke: 'none', sw: 0 }] },
    })
    const g = parseGenome(raw, 'red rose')!
    expect(g.base).toBe('flower')
    expect(huesNear(paletteDominantHue(g.palette), 4, 55)).toBe(true)
    expect(['rose', 'flower']).toContain(g.motif.label)
  })

  it('applyIdeaFidelity enforces cat motif over mismatched AI label', () => {
    const raw = parseGenome(
      JSON.stringify({
        name: 'Star Sprout',
        essence: 'nope',
        base: 'herb',
        graft: 'vine',
        palette: { sil: '#101010', rim: '#cccccc', glow: '#eeeeee', accent: '#dddddd' },
        glowIntensity: 0.5,
        adornment: 'motes',
        seed: 1,
        motif: { label: 'comet', paths: [{ d: 'M12 3 L14 9.5 L21 9.5 L15.5 13.5 L17.5 20 L12 16 L6.5 20 L8.5 13.5 L3 9.5 L10 9.5 Z', fill: 'glow', stroke: 'none', sw: 0 }] },
      }),
    )!
    const fixed = applyIdeaFidelity('my cat Luna', raw)
    expect(fixed.motif.label).toBe('cat')
  })
})

describe('dreamPlant with mocked LLM', () => {
  beforeEach(() => {
    resetLLMProvider()
    vi.restoreAllMocks()
  })

  it('uses semantic repair on AI output', async () => {
    const mock: LLMProvider = {
      prompt: (s, ...v) => s.reduce((acc, str, i) => acc + str + (v[i] ?? ''), ''),
      available: true,
      complete: async () =>
        JSON.stringify({
          name: 'Ocean Tree',
          essence: 'A tree of tides',
          base: 'tree',
          graft: 'vine',
          palette: { sil: '#0a0a0a', rim: '#88ff88', glow: '#ccffcc', accent: '#66ff66' },
          glowIntensity: 0.5,
          adornment: 'none',
          seed: 77,
          motif: { label: 'leaf', paths: [{ d: 'M12 20 C6 16 5 10 8 6 C10 4 12 6 12 9 V20 Z', fill: 'glow', stroke: 'none', sw: 0 }] },
        }),
    }
    setLLMProvider(mock)
    expect(getLLMProvider().available).toBe(true)
    const { genome, source } = await dreamPlant('blue ocean waves')
    expect(source).toBe('ai')
    expect(genome.motif.label).toBe('wave')
    expect(genome.base).toBe('lotus')
    expect(huesNear(paletteDominantHue(genome.palette), 215, 45)).toBe(true)
  })

  it('falls back locally when LLM throws', async () => {
    const mock: LLMProvider = {
      prompt: (s, ...v) => s.reduce((acc, str, i) => acc + str + (v[i] ?? ''), ''),
      available: true,
      complete: async () => {
        throw new Error('400 out of credits')
      },
    }
    setLLMProvider(mock)
    const { genome, source } = await dreamPlant('red rose')
    expect(source).toBe('local')
    expect(genome.base).toBe('flower')
  })
})

describe('dream plant contact sheet artifact', () => {
  const samples = [
    'red rose',
    'my cat Luna',
    'blue ocean waves',
    'coffee with grandma',
    'joyful golden sunflower',
    'spooky purple mushroom',
    'calm lavender mint',
    'love and hearts',
    'rocket to the moon',
    'grandma graduation cap',
    'sad rainy day',
    'emerald fern forest',
  ]

  it('writes dream contact sheet SVG + PNG when ARTIFACT_CAPTURE=1', async () => {
    if (process.env.ARTIFACT_CAPTURE !== '1') return

    mkdirSync(outDir, { recursive: true })
    const genomes = samples.map((idea) => localGenome(idea))
    const dayPalette = todPalette(12, 'summer')
    const nightPalette = todPalette(21, 'summer')

    const daySvg = buildDreamContactSheetSvg({
      samples,
      genomes,
      palette: dayPalette,
      title: 'Dream plants — day',
      background: '#e9f3e5',
    })
    const nightSvg = buildDreamContactSheetSvg({
      samples,
      genomes,
      palette: nightPalette,
      title: 'Dream plants — night',
      background: '#0d0a14',
    })

    writeFileSync(resolve(outDir, 'dream-plant-contact-sheet-day.svg'), daySvg, 'utf8')
    writeFileSync(resolve(outDir, 'dream-plant-contact-sheet-night.svg'), nightSvg, 'utf8')

    const { Resvg } = await import('@resvg/resvg-js')
    const renderPng = (svg: string, name: string) => {
      const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: 736 },
        background: name.includes('night') ? '#0d0a14' : '#e9f3e5',
      })
      const data = resvg.render()
      writeFileSync(resolve(outDir, name), data.asPng())
    }

    renderPng(daySvg, 'dream-plant-contact-sheet-day.png')
    renderPng(nightSvg, 'dream-plant-contact-sheet-night.png')

    const weekly = getUpcomingWeeklyPlants(8)
    const weeklySamples = weekly.map((w) => `PoW ${w.isoWeek}: ${w.theme}`)
    const weeklyGenomes = weekly.map((w) => w.genome)
    const weeklyDaySvg = buildDreamContactSheetSvg({
      samples: weeklySamples,
      genomes: weeklyGenomes,
      palette: dayPalette,
      cols: 4,
      title: 'Plants of the week (current + next 7)',
      background: '#e9f3e5',
    })
    writeFileSync(resolve(outDir, 'dream-plant-weekly-contact-sheet-day.svg'), weeklyDaySvg, 'utf8')
    renderPng(weeklyDaySvg, 'dream-plant-weekly-contact-sheet-day.png')

    const motifSvg = buildMotifGridContactSheetSvg(dayPalette)
    writeFileSync(resolve(outDir, 'dream-motif-grid.svg'), motifSvg, 'utf8')
    renderPng(motifSvg, 'dream-motif-grid.png')
    expect(Object.keys(MOTIF_GLYPHS).length).toBeGreaterThanOrEqual(47)
  })
})
