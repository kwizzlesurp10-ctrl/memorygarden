import { describe, expect, it } from 'vitest'
import {
  classifyWalkCapturePixel,
  measurePlantPixelFillFromBuffer,
} from '@/lib/open-world/capture-pixel-fill'

describe('capture-pixel-fill', () => {
  it('classifies sky, grass, and tree pixels', () => {
    expect(classifyWalkCapturePixel(110, 150, 210)).toBe('sky')
    expect(classifyWalkCapturePixel(60, 140, 70)).toBe('grass')
    expect(classifyWalkCapturePixel(90, 70, 45)).toBe('tree')
  })

  it('measures tree bounding box fill from a synthetic buffer', () => {
    const w = 20
    const h = 20
    const pixels = new Uint8Array(w * h * 4)
    for (let y = 4; y < 16; y++) {
      for (let x = 6; x < 14; x++) {
        const i = (y * w + x) * 4
        pixels[i] = 90
        pixels[i + 1] = 70
        pixels[i + 2] = 45
        pixels[i + 3] = 255
      }
    }
    const fill = measurePlantPixelFillFromBuffer(pixels, w, h)
    expect(fill).not.toBeNull()
    expect(fill!.height).toBeCloseTo(0.6, 1)
    expect(fill!.width).toBeCloseTo(0.4, 1)
    expect(fill!.top).toBeCloseTo(0.2, 1)
  })
})