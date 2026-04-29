import { describe, expect, it } from 'vitest'
import {
  buildClusterPathD,
  getMemoryPlantCenter,
  orderClusterPointsAroundCentroid,
} from '../cluster-path-geometry'
import type { Memory } from '../types'

function makeMemory(
  id: string,
  x: number,
  y: number,
  stage: Memory['plantStage'] = 'bloom',
): Memory {
  return {
    id,
    photoUrl: '',
    text: '',
    date: new Date().toISOString(),
    plantedAt: new Date().toISOString(),
    position: { x, y },
    emotionalTone: 'peaceful',
    plantStage: stage,
    plantVariety: 'flower',
    visitCount: 0,
    reflections: [],
    audioRecordings: [],
  }
}

describe('getMemoryPlantCenter', () => {
  it('offsets by half the stage size', () => {
    const m = makeMemory('a', 100, 200, 'seed')
    const c = getMemoryPlantCenter(m)
    expect(c.x).toBe(100 + 10)
    expect(c.y).toBe(200 + 10)
  })
})

describe('orderClusterPointsAroundCentroid', () => {
  it('preserves single point', () => {
    const pts = [{ x: 1, y: 2 }]
    expect(orderClusterPointsAroundCentroid(pts)).toEqual(pts)
  })
})

describe('buildClusterPathD', () => {
  it('returns a line for two points', () => {
    const d = buildClusterPathD([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ])
    expect(d).toMatch(/^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/)
    expect(d).toContain('0 0')
    expect(d).toContain('10 0')
  })

  it('returns null for fewer than two points', () => {
    expect(buildClusterPathD([])).toBeNull()
    expect(buildClusterPathD([{ x: 0, y: 0 }])).toBeNull()
  })
})
