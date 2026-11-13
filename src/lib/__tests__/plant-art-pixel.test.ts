import { describe, expect, it } from 'vitest'
import { plantPixelCellRadius, plantPixelRasterStep } from '@/lib/garden/plant-art-pixel'

describe('plantPixelCellRadius', () => {
  it('uses coarser cells for trees than flowers at same scale', () => {
    const flower = plantPixelCellRadius('flower', 'bloom', 1)
    const tree = plantPixelCellRadius('tree', 'elder', 1)
    expect(flower).toBeGreaterThan(2)
    expect(tree).toBeGreaterThan(flower)
  })

  it('clamps extreme scales', () => {
    expect(plantPixelCellRadius('mushroom', 'mature', 0.2)).toBeGreaterThanOrEqual(2.4)
    expect(plantPixelCellRadius('flower', 'elder', 4)).toBeLessThanOrEqual(6.8)
  })
})

describe('plantPixelRasterStep', () => {
  it('returns a numeric step for legacy callers', () => {
    expect(plantPixelRasterStep('flower', 1, 'bloom')).toBeGreaterThanOrEqual(2)
  })
})
