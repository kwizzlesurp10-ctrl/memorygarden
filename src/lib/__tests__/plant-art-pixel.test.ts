import { describe, expect, it } from 'vitest'
import { plantPixelRasterStep } from '@/lib/garden/plant-art-pixel'

describe('plantPixelRasterStep', () => {
  it('uses finer steps for flowers than for elder trees at same scale', () => {
    const flower = plantPixelRasterStep('flower', 1, 'bloom')
    const tree = plantPixelRasterStep('tree', 1, 'elder')
    expect(flower).toBeGreaterThanOrEqual(2)
    expect(tree).toBeGreaterThanOrEqual(2)
    expect(flower).toBeLessThan(tree)
  })

  it('clamps extreme scales', () => {
    expect(plantPixelRasterStep('flower', 0.1, 'seed')).toBeGreaterThanOrEqual(2)
    expect(plantPixelRasterStep('flower', 4, 'elder')).toBeLessThanOrEqual(7)
  })
})
