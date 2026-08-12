import { describe, expect, it } from 'vitest'
import {
  LENS_SIZE,
  LENS_ZOOM_DEFAULT,
  LENS_ZOOM_MAX,
  LENS_ZOOM_MIN,
  clampLensZoom,
  computeLoupeLayout,
  stepLensZoom,
} from '@/lib/garden/lens'

describe('computeLoupeLayout', () => {
  it('centers the loupe on the cursor', () => {
    const layout = computeLoupeLayout({ x: 400, y: 300 }, 2, { w: 1200, h: 700 })
    expect(layout.outer.width).toBe(LENS_SIZE)
    expect(layout.outer.height).toBe(LENS_SIZE)
    expect(layout.outer.left).toBe(400 - LENS_SIZE / 2)
    expect(layout.outer.top).toBe(300 - LENS_SIZE / 2)
  })

  it('maps the cursor point to the loupe center after scale+translate', () => {
    const cursor = { x: 600, y: 350 }
    const zoom = 2.4
    const layout = computeLoupeLayout(cursor, zoom, { w: 1200, h: 700 })
    const r = LENS_SIZE / 2
    // Point (cx,cy) under scale(zoom) origin 0,0 lands at (cx*z, cy*z).
    // Plus translate (tx, ty) => (cx*z + tx, cy*z + ty) must equal (r, r).
    const tx = r - cursor.x * zoom
    const ty = r - cursor.y * zoom
    expect(layout.innerTransform).toBe(`translate(${tx}px, ${ty}px) scale(${zoom})`)
    expect(cursor.x * zoom + tx).toBeCloseTo(r, 6)
    expect(cursor.y * zoom + ty).toBeCloseTo(r, 6)
  })

  it('sizes the inner clone to the measured scene, not a fixed viewBox assumption', () => {
    const layout = computeLoupeLayout({ x: 10, y: 10 }, 2, { w: 800, h: 466 })
    expect(layout.innerWidth).toBe(800)
    expect(layout.innerHeight).toBe(466)
    expect(layout.transformOrigin).toBe('0 0')
  })

  it('does not apply a full-scene parent scale (layout is loupe-only)', () => {
    // Guard against the production bug: scene wrap must stay unscaled.
    // computeLoupeLayout returns only loupe geometry — callers must not scale the parent.
    const layout = computeLoupeLayout({ x: 0, y: 0 }, LENS_ZOOM_DEFAULT, { w: 1200, h: 700 })
    expect(layout.innerTransform).toContain(`scale(${LENS_ZOOM_DEFAULT})`)
    expect(layout.outer.width).toBe(LENS_SIZE)
  })
})

describe('clampLensZoom / stepLensZoom', () => {
  it('clamps to [min, max]', () => {
    expect(clampLensZoom(0)).toBe(LENS_ZOOM_MIN)
    expect(clampLensZoom(99)).toBe(LENS_ZOOM_MAX)
    expect(clampLensZoom(2)).toBe(2)
  })

  it('steps without overshooting bounds', () => {
    expect(stepLensZoom(LENS_ZOOM_MIN, -1)).toBe(LENS_ZOOM_MIN)
    expect(stepLensZoom(LENS_ZOOM_MAX, 1)).toBe(LENS_ZOOM_MAX)
    expect(stepLensZoom(2.0, 1)).toBeCloseTo(2.2, 5)
  })
})
