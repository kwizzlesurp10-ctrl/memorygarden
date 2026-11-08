import { describe, expect, it } from 'vitest'
import { createGardenStarterDecor } from '@/lib/garden/garden-starter-decor'
import { isWorldOffShoreGrass, isWorldOnLand } from '@/lib/garden/landscape-world'

describe('garden starter decor', () => {
  it('includes one elder tree and several mushrooms without overlap', () => {
    const decor = createGardenStarterDecor(4242)
    const points = [
      { wx: decor.elderTree.wx, wz: decor.elderTree.wz },
      ...decor.mushrooms.map((m) => ({ wx: m.wx, wz: m.wz })),
    ]
    expect(isWorldOnLand({ wx: decor.elderTree.wx, wz: decor.elderTree.wz })).toBe(true)
    for (const m of decor.mushrooms) {
      expect(isWorldOffShoreGrass({ wx: m.wx, wz: m.wz })).toBe(true)
    }
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].wx - points[j].wx
        const dz = points[i].wz - points[j].wz
        expect(Math.hypot(dx, dz)).toBeGreaterThan(0.04)
      }
    }
  })
})
