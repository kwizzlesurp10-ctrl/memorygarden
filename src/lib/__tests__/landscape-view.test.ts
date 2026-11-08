import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LANDSCAPE_VIEW,
  GARDEN_LANDSCAPE_VIEWS,
  getViewWaterLayout,
  getWaterMaskClipRects,
  isSceneYOnLand,
  projectMemoryToScene,
  resolveGardenLandscapeView,
  rippleIntersectsWater,
} from '@/lib/garden/landscape-view'

describe('resolveGardenLandscapeView', () => {
  it('defaults to pond for missing preference (existing users)', () => {
    expect(resolveGardenLandscapeView(undefined)).toBe('pond')
    expect(resolveGardenLandscapeView(null)).toBe('pond')
  })

  it('keeps valid stored preference', () => {
    expect(resolveGardenLandscapeView('meadow')).toBe('meadow')
  })
})

describe('projectMemoryToScene', () => {
  const base = { x: 500, y: 450 }

  it('places plants on land for every landscape view', () => {
    for (const view of GARDEN_LANDSCAPE_VIEWS) {
      const pos = projectMemoryToScene(base, view)
      expect(isSceneYOnLand(pos.y, view)).toBe(true)
      expect(pos.y).toBeLessThan(pos.y + 1)
    }
  })

  it('pond view matches legacy y band', () => {
    const pos = projectMemoryToScene(base, DEFAULT_LANDSCAPE_VIEW)
    expect(pos.y).toBeGreaterThanOrEqual(432)
    expect(pos.y).toBeLessThanOrEqual(466)
  })
})

describe('view water layout', () => {
  it('garden path exposes a corner pool with visible height', () => {
    const layout = getViewWaterLayout('garden_path')
    expect(layout.bandHeight).toBe(0)
    expect(layout.corner?.height).toBeGreaterThan(48)
    expect(getWaterMaskClipRects(layout)).toHaveLength(1)
  })

  it('ripple intersection follows water mask per view', () => {
    const meadow = getViewWaterLayout('meadow')
    expect(rippleIntersectsWater(400, 640, meadow)).toBe(true)
    expect(rippleIntersectsWater(400, 520, meadow)).toBe(false)

    const path = getViewWaterLayout('garden_path')
    expect(rippleIntersectsWater(80, 640, path)).toBe(true)
    expect(rippleIntersectsWater(600, 640, path)).toBe(false)
  })
})
