import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LANDSCAPE_VIEW,
  GARDEN_LANDSCAPE_VIEWS,
  bandWaterTopYForTests,
  getPondGeometry,
  getViewWaterLayout,
  isSceneYOnLand,
  projectMemoryToScene,
  resolveGardenLandscapeView,
  rippleIntersectsWater,
} from '@/lib/garden/landscape-view'
import { LANDSCAPE_HORIZON_Y, POND_FULL_DEPTH } from '@/lib/garden/landscape-pond'

describe('resolveGardenLandscapeView', () => {
  it('defaults to pond for missing preference (existing users)', () => {
    expect(resolveGardenLandscapeView(undefined)).toBe('pond')
    expect(resolveGardenLandscapeView(null)).toBe('pond')
  })

  it('keeps valid stored preference', () => {
    expect(resolveGardenLandscapeView('meadow')).toBe('meadow')
  })
})

describe('pond geometry per view', () => {
  it('slides shore downward as less pond is visible', () => {
    const pond = bandWaterTopYForTests('pond')
    const lake = bandWaterTopYForTests('lakeside')
    const meadow = bandWaterTopYForTests('meadow')
    expect(pond).toBe(LANDSCAPE_HORIZON_Y)
    expect(lake).toBeGreaterThan(pond)
    expect(meadow).toBeGreaterThan(lake)
    expect(meadow).toBeLessThanOrEqual(LANDSCAPE_HORIZON_Y + POND_FULL_DEPTH)
  })

  it('garden path uses an organic corner pool path', () => {
    const geom = getPondGeometry('garden_path')
    expect(geom.bandWater).toBe(false)
    expect(geom.waterPathD).toMatch(/^M /)
    expect(getViewWaterLayout('garden_path').bandHeight).toBe(0)
  })
})

describe('projectMemoryToScene', () => {
  const base = { x: 500, y: 450 }

  it('places plants on land for every landscape view', () => {
    for (const view of GARDEN_LANDSCAPE_VIEWS) {
      const pos = projectMemoryToScene(base, view)
      expect(isSceneYOnLand(pos.y, view, pos.x)).toBe(true)
    }
  })

  it('pond view matches legacy y band', () => {
    const pos = projectMemoryToScene(base, DEFAULT_LANDSCAPE_VIEW)
    expect(pos.y).toBeGreaterThanOrEqual(432)
    expect(pos.y).toBeLessThanOrEqual(466)
  })
})

describe('water intersection', () => {
  it('ripple intersection follows pond mask per view', () => {
    expect(rippleIntersectsWater(400, 662, 'meadow')).toBe(true)
    expect(rippleIntersectsWater(400, 580, 'meadow')).toBe(false)
    expect(rippleIntersectsWater(120, 650, 'garden_path')).toBe(true)
    expect(rippleIntersectsWater(600, 650, 'garden_path')).toBe(false)
  })
})
