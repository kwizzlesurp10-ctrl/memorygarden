import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Resvg } from '@resvg/resvg-js'
import { GardenSceneSvg } from '@/components/garden/GardenSceneSvg'
import { todPalette } from '@/lib/garden/day-night'
import { createGardenStarterDecor } from '@/lib/garden/garden-starter-decor'
import { GARDEN_LANDSCAPE_VIEWS, LANDSCAPE_HORIZON_Y } from '@/lib/garden/landscape-view'
import { getPondGeometry } from '@/lib/garden/landscape-pond'
import { SCENE_W } from '@/lib/garden/scene-constants'

const RENDER_W = 1200

function renderScenePng(view: (typeof GARDEN_LANDSCAPE_VIEWS)[number]): Uint8Array {
  const palette = todPalette(14, 'summer')
  const starterDecor = createGardenStarterDecor(4242)
  const body = renderToStaticMarkup(
    h(GardenSceneSvg, {
      palette,
      sceneKey: view[0],
      gardenSeed: 7,
      rimStrength: 0.6,
      motion: false,
      landscapeView: view,
      shedStyle: 'storybook',
      planted: [],
      candles: [],
      memoryPlants: [],
      starterDecor,
    }),
  )
  const wrapped = body.includes('xmlns=') ? body : body.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  const rendered = new Resvg(wrapped, { fitTo: { mode: 'width', value: RENDER_W } }).render()
  return rendered.pixels
}

function pixelAt(pixels: Uint8Array, width: number, x: number, y: number): [number, number, number, number] {
  const i = (y * width + x) * 4
  return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]]
}

function isHillEdgeGap(r: number, g: number, b: number, a: number): boolean {
  if (a < 8) return true
  const whitish = r > 246 && g > 246 && b > 246
  const skyish = b > 190 && g > 168 && r < 205 && (r + g + b) / 3 > 175
  return whitish || skyish
}

function isWaterEdgeGap(r: number, g: number, b: number, a: number): boolean {
  if (a < 8) return true
  const whitish = r > 246 && g > 246 && b > 246
  const skyish = b > 190 && g > 168 && r < 205 && (r + g + b) / 3 > 175
  return whitish || skyish
}

describe('landscape hill edge coverage', () => {
  for (const view of GARDEN_LANDSCAPE_VIEWS) {
    it(`fills below-horizon edge columns for ${view}`, () => {
      const pixels = renderScenePng(view)
      const width = RENDER_W
      const height = Math.floor((pixels.length / 4) / width)
      const scale = width / SCENE_W
      const yMin = Math.floor((LANDSCAPE_HORIZON_Y + 12) * scale)
      const edgeCols = [0, 1, 2, width - 3, width - 2, width - 1]
      const offenders: string[] = []

      for (const x of edgeCols) {
        for (let y = yMin; y < height - 2; y += 4) {
          const [r, g, b, a] = pixelAt(pixels, width, x, y)
          if (isHillEdgeGap(r, g, b, a)) {
            offenders.push(`x=${x} y=${y} rgba=${r},${g},${b},${a}`)
            if (offenders.length >= 6) break
          }
        }
        if (offenders.length >= 6) break
      }

      expect(offenders, `gap pixels in ${view}:\n${offenders.join('\n')}`).toEqual([])
    })

    it(`fills water-band edge columns for ${view}`, () => {
      const geom = getPondGeometry(view)
      if (!geom.bandWater) return

      const pixels = renderScenePng(view)
      const width = RENDER_W
      const scale = width / SCENE_W
      const yMin = Math.floor((geom.waterTopY + 18) * scale)
      const yMax = Math.floor((geom.waterTopY + 90) * scale)
      const edgeCols = [0, 1, 2, width - 3, width - 2, width - 1]
      const offenders: string[] = []

      for (const x of edgeCols) {
        for (let y = yMin; y <= yMax; y += 4) {
          const [r, g, b, a] = pixelAt(pixels, width, x, y)
          if (isWaterEdgeGap(r, g, b, a)) {
            offenders.push(`water x=${x} y=${y} rgba=${r},${g},${b},${a}`)
            if (offenders.length >= 6) break
          }
        }
        if (offenders.length >= 6) break
      }

      expect(offenders, `water gaps in ${view}:\n${offenders.join('\n')}`).toEqual([])
    })
  }
})
