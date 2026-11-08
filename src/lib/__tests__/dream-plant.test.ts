import { createElement as h } from 'react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dreamPlant } from '@/lib/garden/dream-plant'
import {
  applyIdeaFidelity,
  huesNear,
  localGenome,
  parseGenome,
  paletteDominantHue,
} from '@/lib/garden/hybrid'
import { buildMiniHybrid } from '@/components/plants/hybrid-builder'
import { todPalette } from '@/lib/garden/day-night'
import { getLLMProvider, resetLLMProvider, setLLMProvider, type LLMProvider } from '@/lib/llm-client'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'

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

  it('maps blue ocean waves to blue palette and wave motif', () => {
    const g = localGenome('blue ocean waves')
    expect(g.motif.label).toBe('wave')
    expect(huesNear(paletteDominantHue(g.palette), 215, 45)).toBe(true)
  })

  it('maps coffee with grandma to coffee cup motif', () => {
    const g = localGenome('coffee with grandma')
    expect(g.motif.label).toBe('coffee cup')
  })

  it('is deterministic for the same input', () => {
    const a = localGenome('spooky purple mushroom')
    const b = localGenome('spooky purple mushroom')
    expect(a).toEqual(b)
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

  it('writes dream contact sheet SVG when ARTIFACT_CAPTURE=1', () => {
    if (process.env.ARTIFACT_CAPTURE !== '1') return

    mkdirSync(outDir, { recursive: true })
    const palette = todPalette(14, 'summer')
    const cols = 4
    const cellW = 140
    const cellH = 168
    const rows = Math.ceil(samples.length / cols)

    const cells = samples
      .map((idea, i) => {
        const g = localGenome(idea)
        const col = i % cols
        const row = Math.floor(i / cols)
        const inner = renderToStaticMarkup(
          h('g', { transform: `translate(${cellW * 0.5} ${cellH - 18})` }, buildMiniHybrid(7, g, palette, 0.65, false)),
        )
        return `<g transform="translate(${col * cellW} ${row * cellH})">${inner}<text x="6" y="14" font-size="9" fill="#2d2418" font-family="system-ui,sans-serif">${idea.replace(/&/g, '&amp;')}</text><text x="6" y="26" font-size="8" fill="#6a5a48" font-family="system-ui,sans-serif">${g.name.replace(/&/g, '&amp;')}</text></g>`
      })
      .join('')

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cellW}" height="${rows * cellH}" viewBox="0 0 ${cols * cellW} ${rows * cellH}">${cells}</svg>`
    writeFileSync(resolve(outDir, 'dream-plant-contact-sheet.svg'), svg, 'utf8')
  })
})
