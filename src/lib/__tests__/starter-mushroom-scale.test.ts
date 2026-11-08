import { describe, expect, it } from 'vitest'
import { GARDEN_LANDSCAPE_VIEWS } from '@/lib/garden/landscape-view'
import { createGardenStarterDecor } from '@/lib/garden/garden-starter-decor'
import {
  projectedStarterMushroomCapWidthPx,
  starterMushroomDepthT,
  STARTER_CAP_PX_FAR_MAX,
  STARTER_CAP_PX_FAR_MIN,
  STARTER_CAP_PX_NEAR_MAX,
  STARTER_CAP_PX_NEAR_MIN,
  starterMushroomWzBounds,
} from '@/lib/garden/starter-mushroom-scale'

describe('starter mushroom cap width in scene px', () => {
  const decor = createGardenStarterDecor(7)
  const bounds = starterMushroomWzBounds(decor.mushrooms)

  it('maps depth linearly from far to near wz band', () => {
    expect(starterMushroomDepthT(bounds.wzMin, bounds.wzMin, bounds.wzMax)).toBe(0)
    expect(starterMushroomDepthT(bounds.wzMax, bounds.wzMin, bounds.wzMax)).toBe(1)
    const mid = (bounds.wzMin + bounds.wzMax) / 2
    expect(starterMushroomDepthT(mid, bounds.wzMin, bounds.wzMax)).toBeCloseTo(0.5, 2)
  })

  for (const view of GARDEN_LANDSCAPE_VIEWS) {
    it(`hits pixel targets on ${view}`, () => {
      const widths = decor.mushrooms.map((m) =>
        projectedStarterMushroomCapWidthPx(
          m.wx,
          m.wz,
          view,
          m.scale,
          bounds.wzMin,
          bounds.wzMax,
        ),
      )
      const minW = Math.min(...widths)
      const maxW = Math.max(...widths)
      expect(minW).toBeGreaterThanOrEqual(STARTER_CAP_PX_FAR_MIN - 0.75)
      expect(minW).toBeLessThanOrEqual(STARTER_CAP_PX_FAR_MAX + 0.75)
      expect(maxW).toBeGreaterThanOrEqual(STARTER_CAP_PX_NEAR_MIN - 0.75)
      expect(maxW).toBeLessThanOrEqual(STARTER_CAP_PX_NEAR_MAX + 0.75)
    })
  }
})
