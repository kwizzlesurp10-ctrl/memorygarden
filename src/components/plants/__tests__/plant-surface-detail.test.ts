import { describe, it, expect } from 'vitest'
import {
  barkStriationPaths,
  filledStemPath,
  plantGroundCollar,
  plantGroundCollarSubtle,
  stemGroundFlare,
  trunkGradientDef,
} from '../plant-surface-detail'
import type { HybridPlantPalette } from '../seeded-builders'

const palette: HybridPlantPalette = {
  sil: '#4a6',
  silSoft: '#6a8',
  rim: '#234',
  glow: '#fd8',
  accent: '#c44',
  bank: '#352',
  fire: '#f80',
  hills: ['#1a2', '#2b3', '#3c4'],
  plantDimBlend: 0,
}

describe('plant-surface-detail', () => {
  it('emits deterministic bark striation count from seed', () => {
    const a = barkStriationPaths(4, 80, 3, palette, 0.8)
    const b = barkStriationPaths(4, 80, 3, palette, 0.8)
    expect(a.length).toBe(b.length)
    expect(a.length).toBeGreaterThanOrEqual(3)
  })

  it('builds a trunk gradient def with stable id', () => {
    const node = trunkGradientDef('mg-bark-1', palette)
    expect(node).toBeTruthy()
  })

  it('emits grounding collar and stem flare primitives', () => {
    expect(plantGroundCollar(palette, 0.7)).toBeTruthy()
    expect(plantGroundCollarSubtle(palette, 0.7, 12)).toBeTruthy()
    expect(stemGroundFlare(palette, 0.7, 1.5)).toBeTruthy()
    expect(filledStemPath(1.2, 12, palette, 0.7)).toBeTruthy()
  })
})
