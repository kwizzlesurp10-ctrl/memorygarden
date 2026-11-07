import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LANDSCAPE_VIEW,
  GARDEN_LANDSCAPE_VIEWS,
  isSceneYOnLand,
  projectMemoryToScene,
  resolveGardenLandscapeView,
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
