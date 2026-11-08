import { describe, expect, it } from 'vitest'
import { sanitizeGenome } from '@/lib/garden/hybrid-sanitize'
import { sanitizeShedSeed, validateShedData } from '@/lib/garden/shed-storage'
import { semanticLocalGenome } from '@/lib/garden/hybrid'
import { hybridVarieties } from '@/lib/garden/hybrid'

describe('shed storage sanitization', () => {
  it('repairs invalid genome fields instead of dropping entire seed', () => {
    const g = semanticLocalGenome('red rose', hybridVarieties())
    const raw = {
      id: 'seed-1',
      idea: 'red rose',
      note: '',
      when: 1,
      g: {
        ...g,
        base: 'not-a-plant',
        graft: 'also-bad',
        palette: { sil: '#fff', rim: 'bad', glow: g.palette.glow, accent: g.palette.accent },
        adornment: 'sparkles',
        motif: { label: 'x', paths: [{ d: '<bad>', fill: 'glow', stroke: 'none', sw: 0 }] },
      },
    }
    const seed = sanitizeShedSeed(raw)
    expect(seed).toBeTruthy()
    expect(seed!.g.base).toBe('flower')
    expect(seed!.g.motif.paths.length).toBeGreaterThan(0)
    expect(seed!.idea).toBe('red rose')
  })

  it('skips entries with no usable genome', () => {
    const shed = validateShedData({
      v: 1,
      seeds: [{ id: '', idea: '', g: null }],
      planted: [],
      shedStyle: 'antique',
      candles: [],
    })
    expect(shed.seeds).toHaveLength(0)
  })

  it('sanitizeGenome tints bright sil toward hue', () => {
    const g = sanitizeGenome({
      name: 'Bright',
      essence: 'x',
      base: 'flower',
      graft: 'fern',
      palette: { sil: '#f0e0ff', rim: '#ff2244', glow: '#ff8899', accent: '#ff4455' },
      glowIntensity: 0.5,
      adornment: 'none',
      seed: 12,
      motif: { label: 'heart', paths: [{ d: 'M12 12 L14 14', fill: 'glow', stroke: 'none', sw: 0 }] },
    })
    expect(g).toBeTruthy()
    const avg =
      (parseInt(g!.palette.sil.slice(1, 3), 16) +
        parseInt(g!.palette.sil.slice(3, 5), 16) +
        parseInt(g!.palette.sil.slice(5, 7), 16)) /
      3
    expect(avg).toBeLessThan(96)
    expect(g!.palette.sil.toLowerCase()).not.toBe('#f0e0ff')
    expect(g!.palette.sil).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
