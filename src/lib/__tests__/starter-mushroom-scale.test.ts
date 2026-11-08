import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GardenSceneSvg } from '@/components/garden/GardenSceneSvg'
import { GARDEN_LANDSCAPE_VIEWS } from '@/lib/garden/landscape-view'
import { todPalette } from '@/lib/garden/day-night'
import { createGardenStarterDecor } from '@/lib/garden/garden-starter-decor'
import { projectWorldToScene } from '@/lib/garden/landscape-world'
import {
  STARTER_CAP_PX_FAR_MAX,
  STARTER_CAP_PX_FAR_MIN,
  STARTER_CAP_PX_NEAR_MAX,
  STARTER_CAP_PX_NEAR_MIN,
  starterMushroomLayer,
  STARTER_MUSHROOM_PRESENTATION_SCALE,
} from '@/lib/garden/starter-mushroom-scale'
import { measureStarterMushroomCapWidthsFromSvg } from '@/lib/garden/starter-mushroom-measure'

const GARDEN_SEED = 4242
const PIXEL_TOLERANCE = 1.25

function renderStarterSvg(view: (typeof GARDEN_LANDSCAPE_VIEWS)[number], decor = createGardenStarterDecor(GARDEN_SEED)): string {
  const palette = todPalette(14, 'summer')
  return renderToStaticMarkup(
    h(GardenSceneSvg, {
      palette,
      sceneKey: `measure-${view}`,
      gardenSeed: 7,
      rimStrength: 0.6,
      motion: false,
      landscapeView: view,
      shedStyle: 'storybook',
      planted: [],
      candles: [],
      memoryPlants: [],
      starterDecor: decor,
    }),
  )
}

describe('starter mushroom rendered cap widths', () => {
  const decor = createGardenStarterDecor(GARDEN_SEED)

  for (const view of GARDEN_LANDSCAPE_VIEWS) {
    it(`caps measure ${STARTER_CAP_PX_FAR_MIN}–${STARTER_CAP_PX_FAR_MAX}px far and ${STARTER_CAP_PX_NEAR_MIN}–${STARTER_CAP_PX_NEAR_MAX}px near on ${view}`, () => {
      const widths = measureStarterMushroomCapWidthsFromSvg(renderStarterSvg(view))
      expect(widths.length).toBeGreaterThanOrEqual(6)
      const minW = Math.min(...widths)
      const maxW = Math.max(...widths)
      const farMax = STARTER_CAP_PX_FAR_MAX * STARTER_MUSHROOM_PRESENTATION_SCALE
      const farMin = STARTER_CAP_PX_FAR_MIN * STARTER_MUSHROOM_PRESENTATION_SCALE
      const nearMax = STARTER_CAP_PX_NEAR_MAX * STARTER_MUSHROOM_PRESENTATION_SCALE
      const nearMin = STARTER_CAP_PX_NEAR_MIN * STARTER_MUSHROOM_PRESENTATION_SCALE
      expect(minW).toBeGreaterThanOrEqual(farMin - PIXEL_TOLERANCE)
      expect(minW).toBeLessThanOrEqual(farMax + PIXEL_TOLERANCE)
      expect(maxW).toBeGreaterThanOrEqual(nearMin - PIXEL_TOLERANCE)
      expect(maxW).toBeLessThanOrEqual(nearMax + PIXEL_TOLERANCE)
    })
  }

  it('lakeside and meadow spread mushrooms ≥60px on screen Y', () => {
    for (const view of ['lakeside', 'meadow'] as const) {
      const ys = decor.mushrooms.map((m) => {
        const layer = starterMushroomLayer(m.wz)
        return projectWorldToScene({ wx: m.wx, wz: m.wz }, view, { layer }).y
      })
      const spread = Math.max(...ys) - Math.min(...ys)
      expect(spread).toBeGreaterThanOrEqual(60)
    }
  })
})
