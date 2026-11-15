import { describe, expect, it } from 'vitest'
import {
  assertCloseupPlantFill,
  closeupUsesMeasuredPlantFrame,
  closeupViewBoxFromPlantBBox,
  memoryCloseupSvgLayout,
} from '@/lib/garden/memory-closeup-frame'

describe('memoryCloseupSvgLayout', () => {
  it('uses r3-style fixed height viewBox and hero scale', () => {
    const lotus = memoryCloseupSvgLayout('lotus', 'bloom', false)
    const tree = memoryCloseupSvgLayout('tree', 'bloom', false)
    expect(lotus.scale).toBeGreaterThanOrEqual(2.1)
    expect(tree.scale).toBeGreaterThan(0.2)
    expect(lotus.viewBox).toMatch(/^0 0 \d+ 100$/)
    expect(tree.viewBox).toMatch(/^0 0 \d+ 100$/)
    expect(lotus.plantTransform).toMatch(/scale\([\d.]+\)/)
  })

  it('flags tall varieties for measured reframing', () => {
    expect(closeupUsesMeasuredPlantFrame('tree')).toBe(true)
    expect(closeupUsesMeasuredPlantFrame('lotus')).toBe(false)
  })

  it('builds viewBox from plant bbox with ~8% padding', () => {
    const vb = closeupViewBoxFromPlantBBox({ x: 10, y: -80, width: 40, height: 90 }, 0.08)
    const [, , w, h] = vb.split(' ').map(Number)
    expect(w).toBeCloseTo(40 * 1.16, 0)
    expect(h).toBeCloseTo(90 * 1.16, 0)
  })
})

describe('assertCloseupPlantFill', () => {
  it('requires bloom+ plants between 45% and 95% art-panel fill', () => {
    expect(assertCloseupPlantFill(0.5, 'bloom').ok).toBe(true)
    expect(assertCloseupPlantFill(0.44, 'bloom').ok).toBe(false)
    expect(assertCloseupPlantFill(0.96, 'elder').ok).toBe(false)
    expect(assertCloseupPlantFill(0.2, 'seed').ok).toBe(true)
  })
})