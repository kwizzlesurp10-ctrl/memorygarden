import { describe, expect, it } from 'vitest'
import { plantPixelCellRadius, plantPixelRasterStep, plantPixelViewBox } from '@/lib/garden/plant-art-pixel'

describe('plantPixelCellRadius', () => {
  it('returns larger bbox for trees than flowers at same scale', () => {
    const flower = plantPixelViewBox('flower', 'bloom', 1)
    const tree = plantPixelViewBox('tree', 'elder', 1)
    expect(flower.width).toBeGreaterThan(20)
    expect(tree.width).toBeGreaterThan(flower.width)
  })

  it('clamps extreme scales', () => {
    expect(plantPixelCellRadius('mushroom', 'mature', 0.2)).toBeGreaterThanOrEqual(3.2)
    expect(plantPixelCellRadius('flower', 'elder', 4)).toBeLessThanOrEqual(8.5)
  })
})

describe('plantPixelRasterStep', () => {
  it('returns a numeric step for legacy callers', () => {
    expect(plantPixelRasterStep('flower', 1, 'bloom')).toBeGreaterThanOrEqual(2)
  })
})
