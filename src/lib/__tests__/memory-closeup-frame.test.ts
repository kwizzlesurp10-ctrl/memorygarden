import { describe, expect, it } from 'vitest'
import { memoryCloseupSvgLayout } from '@/lib/garden/memory-closeup-frame'
import { plantPixelViewBox } from '@/lib/garden/plant-art-pixel'

describe('memoryCloseupSvgLayout', () => {
  it('gives tall trees a taller viewBox and sizes bloom lotus near 60% of frame height', () => {
    const lotus = memoryCloseupSvgLayout('lotus', 'bloom', false)
    const tree = memoryCloseupSvgLayout('tree', 'young', false)
    expect(lotus.plantScale).toBeGreaterThanOrEqual(2.65)
    const lotusVbH = Number(lotus.viewBox.split(' ')[3])
    const lotusDrawH = plantPixelViewBox('lotus', 'bloom', 1).height
    const lotusFill = (lotus.plantScale * lotusDrawH) / lotusVbH
    expect(lotusFill).toBeGreaterThan(0.55)
    expect(lotusFill).toBeLessThan(0.7)
    expect(Number(tree.viewBox.split(' ')[3])).toBeGreaterThan(lotusVbH)
  })

  it('snaps pixel-art scale to half steps', () => {
    const pixel = memoryCloseupSvgLayout('lotus', 'bloom', false, { pixelArt: true })
    expect(pixel.plantScale * 2).toBe(Math.round(pixel.plantScale * 2))
  })
})