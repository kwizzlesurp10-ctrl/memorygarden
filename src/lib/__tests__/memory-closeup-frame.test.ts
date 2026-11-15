import { describe, expect, it } from 'vitest'
import { memoryCloseupSvgLayout } from '@/lib/garden/memory-closeup-frame'

describe('memoryCloseupSvgLayout', () => {
  it('uses tighter viewBoxes for larger varieties', () => {
    const lotus = memoryCloseupSvgLayout('lotus', 'bloom', false)
    const tree = memoryCloseupSvgLayout('tree', 'bloom', false)
    const lotusScale = Number(lotus.plantTransform.match(/scale\(([\d.]+)\)/)?.[1] ?? 0)
    const treeScale = Number(tree.plantTransform.match(/scale\(([\d.]+)\)/)?.[1] ?? 0)
    expect(lotusScale).toBeGreaterThanOrEqual(1.35)
    expect(treeScale).toBeGreaterThan(0.2)
    expect(lotus.viewBox).toMatch(/^0 0 \d+ 100$/)
    expect(tree.viewBox).toMatch(/^0 0 \d+ 100$/)
  })
})