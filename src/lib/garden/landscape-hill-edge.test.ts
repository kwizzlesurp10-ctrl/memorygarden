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

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const srgb = [r, g, b].map((c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  const [lr, lg, lb] = srgb
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883
  const f = (t: number) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

function deltaE(rgbA: [number, number, number], rgbB: [number, number, number]): number {
  const [l1, a1, b1] = rgbToLab(...rgbA)
  const [l2, a2, b2] = rgbToLab(...rgbB)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

function sceneX(renderX: number, width: number): number {
  return Math.round((renderX * SCENE_W) / width)
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

  const BAND_WATER_VIEWS = GARDEN_LANDSCAPE_VIEWS.filter((v) => getPondGeometry(v).bandWater)

  for (const view of BAND_WATER_VIEWS) {
    it(`pond-class water has consistent tone across band for ${view}`, () => {
      const pixels = renderScenePng(view)
      const width = RENDER_W
      const scale = width / SCENE_W
      const geom = getPondGeometry(view)
      const yProbe = Math.floor(450 * scale)
      const xLeft = Math.floor((1000 * width) / SCENE_W)
      const xRight = Math.floor((1150 * width) / SCENE_W)
      const left = pixelAt(pixels, width, xLeft, yProbe).slice(0, 3) as [number, number, number]
      const right = pixelAt(pixels, width, xRight, yProbe).slice(0, 3) as [number, number, number]
      const dE = deltaE(left, right)
      expect(
        dE,
        `${view}: ΔE(${1000},450) vs (1150,450) = ${dE.toFixed(1)} — left=${left.join(',')} right=${right.join(',')}`,
      ).toBeLessThan(28)
    })

    it(`no sharp vertical seam in water band columns for ${view}`, () => {
      const pixels = renderScenePng(view)
      const width = RENDER_W
      const scale = width / SCENE_W
      const geom = getPondGeometry(view)
      const yMin = Math.floor((geom.waterTopY + 12) * scale)
      const yMax = Math.floor((geom.waterTopY + 96) * scale)
      const seamCols: string[] = []

      for (let x = 2; x < width - 3; x++) {
        let hops = 0
        for (let y = yMin; y < yMax; y++) {
          const a = pixelAt(pixels, width, x, y).slice(0, 3)
          const b = pixelAt(pixels, width, x + 1, y).slice(0, 3)
          if (deltaE(a as [number, number, number], b as [number, number, number]) > 32) hops++
        }
        if (hops >= 18) {
          const sceneCol = sceneX(x, width)
          seamCols.push(`x≈${sceneCol} (${hops} sharp rows)`)
          if (seamCols.length >= 4) break
        }
      }

      expect(seamCols, `vertical water seams in ${view}:\n${seamCols.join('\n')}`).toEqual([])
    })
  }
})
