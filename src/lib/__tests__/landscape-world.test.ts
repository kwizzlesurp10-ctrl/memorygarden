import { describe, expect, it } from 'vitest'
import { GARDEN_LANDSCAPE_VIEWS } from '@/lib/garden/landscape-view'
import {
  CAMERA_YAW,
  isWorldOnLand,
  projectMemoryToSceneWorld,
  projectWorldToScene,
  resolvePlantFacing,
} from '@/lib/garden/landscape-world'
import { createGardenStarterDecor as buildStarter } from '@/lib/garden/garden-starter-decor'

describe('world camera projection', () => {
  const world = { wx: 0.42, wz: 0.48 }

  it('keeps the same world anchor across all four views', () => {
    const pond = projectWorldToScene(world, 'pond')
    const meadow = projectWorldToScene(world, 'meadow')
    expect(pond.x).not.toBeCloseTo(meadow.x, 0)
    expect(pond.y).not.toBeCloseTo(meadow.y, 0)
    for (const view of GARDEN_LANDSCAPE_VIEWS) {
      const p = projectWorldToScene(world, view)
      expect(Number.isFinite(p.x)).toBe(true)
      expect(Number.isFinite(p.y)).toBe(true)
    }
  })

  it('uses distinct facings per view for the same object', () => {
    const facings = GARDEN_LANDSCAPE_VIEWS.map((view) => resolvePlantFacing(view, 0))
    expect(new Set(facings).size).toBe(4)
  })

  it('maps stored memory positions through world space', () => {
    const base = { x: 500, y: 450 }
    const pond = projectMemoryToSceneWorld(base, 'pond')
    const lake = projectMemoryToSceneWorld(base, 'lakeside')
    expect(pond.facing).not.toBe(lake.facing)
  })

  it('exposes camera yaws in quarter-turn steps', () => {
    expect(CAMERA_YAW.pond).toBe(0)
    expect(CAMERA_YAW.lakeside).toBeCloseTo(Math.PI / 2)
    expect(CAMERA_YAW.meadow).toBeCloseTo(Math.PI)
    expect(CAMERA_YAW.garden_path).toBeCloseTo((3 * Math.PI) / 2)
  })
})

describe('starter decor generation', () => {
  it('places exactly one elder tree and mushrooms on land only', () => {
    const decor = buildStarter(12345)
    expect(decor.elderTree).toBeDefined()
    expect(decor.mushrooms.length).toBeGreaterThanOrEqual(5)
    expect(isWorldOnLand({ wx: decor.elderTree.wx, wz: decor.elderTree.wz })).toBe(true)
    for (const shroom of decor.mushrooms) {
      expect(isWorldOnLand({ wx: shroom.wx, wz: shroom.wz })).toBe(true)
    }
  })

  it('keeps mushroom layout stable for a fixed seed', () => {
    const a = buildStarter(99)
    const b = buildStarter(99)
    expect(a).toEqual(b)
  })
})
