import { describe, expect, it } from 'vitest'
import { findSpatialGardenPlantNeighbor } from '@/lib/garden/garden-plant-roving-focus'

describe('findSpatialGardenPlantNeighbor', () => {
  const plants = [
    { id: 'a', x: 100, y: 400 },
    { id: 'b', x: 280, y: 400 },
    { id: 'c', x: 190, y: 320 },
  ]

  it('picks the nearest plant to the right', () => {
    expect(findSpatialGardenPlantNeighbor(plants[0], 'right', plants)?.id).toBe('b')
  })

  it('picks upward neighbor', () => {
    expect(findSpatialGardenPlantNeighbor(plants[0], 'up', plants)?.id).toBe('c')
  })

  it('returns null when nothing in that direction', () => {
    expect(findSpatialGardenPlantNeighbor(plants[1], 'right', plants)).toBeNull()
  })
})
