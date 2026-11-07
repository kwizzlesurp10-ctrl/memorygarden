import { describe, expect, it } from 'vitest'
import type { Memory } from '@/lib/types'
import { layoutGardenWorld } from '@/lib/open-world/layout'
import { createPlantGroup } from '@/components/open-world/plant-mesh'
import { plantRecipe } from '@/lib/open-world/plant-visual'
import { todPalette } from '@/lib/garden/day-night'
import * as THREE from 'three'

function makeMockMemory(id: string, opts?: Partial<Memory>): Memory {
  return {
    id,
    photoUrl: '',
    text: `Memory ${id}`,
    date: '2026-06-01',
    plantedAt: '2026-06-01T08:00:00Z',
    position: { x: 500, y: 500 },
    emotionalTone: 'happy',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 1,
    reflections: [],
    audioRecordings: [],
    growthMetrics: {
      vitality: 80,
      height: 1.2,
      width: 0.8,
      bloomCount: 3,
      foliageDensity: 0.8,
      rarityScore: 1.0,
      lastInteractionAt: Date.now(),
    },
    ...opts,
  }
}

describe('open-world vitality & 3-tier visual state mapping', () => {
  it('computes vitality metadata on WorldPlant in layoutGardenWorld', () => {
    const mem1 = makeMockMemory('thriving-1', {
      growthMetrics: {
        vitality: 95,
        height: 1.5,
        width: 1.0,
        bloomCount: 5,
        foliageDensity: 0.9,
        rarityScore: 1.0,
        lastInteractionAt: Date.now(), // freshly watered
      },
    })

    const mem2 = makeMockMemory('thirsty-1', {
      growthMetrics: {
        vitality: 20,
        height: 1.0,
        width: 0.8,
        bloomCount: 2,
        foliageDensity: 0.7,
        rarityScore: 1.0,
        lastInteractionAt: Date.now() - 48 * 3600 * 1000, // 2 days ago
      },
    })

    const world = layoutGardenWorld([mem1, mem2], 'spring')
    expect(world.plants).toHaveLength(2)

    const p1 = world.plants.find((p) => p.id === 'thriving-1')!
    expect(p1.moistureLevel).toBeGreaterThanOrEqual(75)
    expect(p1.healthStatus).toBe('thriving')
    expect(p1.wiltingFactor).toBe(0)
    expect(p1.needsWater).toBe(false)

    const p2 = world.plants.find((p) => p.id === 'thirsty-1')!
    expect(p2.moistureLevel).toBeLessThan(30)
    expect(p2.needsWater).toBe(true)
    expect(p2.wiltingFactor).toBeGreaterThan(0)
  })

  it('marks eternal roses or deeply visited memories as isEternal', () => {
    const eternalRose = makeMockMemory('rose-1', { plantVariety: 'eternal_rose' })
    const highVisit = makeMockMemory('visit-1', { visitCount: 120 })
    const regular = makeMockMemory('reg-1', { visitCount: 5 })

    const world = layoutGardenWorld([eternalRose, highVisit, regular])
    const pRose = world.plants.find((p) => p.id === 'rose-1')!
    const pVisit = world.plants.find((p) => p.id === 'visit-1')!
    const pReg = world.plants.find((p) => p.id === 'reg-1')!

    expect(pRose.isEternal).toBe(true)
    expect(pVisit.isEternal).toBe(true)
    expect(pReg.isEternal).toBe(false)
  })

  it('generates 3D mesh group for thriving plants with sparkle motes and aura', () => {
    const mem = makeMockMemory('thriving-mesh', {
      growthMetrics: {
        vitality: 90,
        height: 1.2,
        width: 0.8,
        bloomCount: 4,
        foliageDensity: 0.8,
        rarityScore: 1.0,
        lastInteractionAt: Date.now(),
      },
      plantStage: 'mature',
    })
    const world = layoutGardenWorld([mem])
    const plant = world.plants[0]
    const palette = todPalette(0.42, 'spring')
    const recipe = plantRecipe(mem.plantVariety, mem.plantStage, mem.emotionalTone, palette, plant.height, false)

    const group = createPlantGroup(plant, recipe)
    expect(group).toBeInstanceOf(THREE.Group)

    // Check for Points (sparkle motes)
    let foundPoints = false
    group.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Points) foundPoints = true
    })
    expect(foundPoints).toBe(true)
  })

  it('generates 3D mesh group for dormant plants with scale retraction and mist ring', () => {
    const mem = makeMockMemory('dormant-mesh', {
      growthMetrics: {
        vitality: 0,
        height: 1.2,
        width: 0.8,
        bloomCount: 1,
        foliageDensity: 0.5,
        rarityScore: 1.0,
        lastInteractionAt: Date.now() - 300 * 3600 * 1000, // long ago
      },
    })
    const world = layoutGardenWorld([mem])
    const plant = world.plants[0]
    const palette = todPalette(0.42, 'spring')
    const recipe = plantRecipe(mem.plantVariety, mem.plantStage, mem.emotionalTone, palette, plant.height, false)

    const group = createPlantGroup(plant, recipe)
    expect(group.scale.x).toBeCloseTo(0.85)
    expect(group.scale.y).toBeCloseTo(0.75)
    expect(group.scale.z).toBeCloseTo(0.85)

    // Check for mist ring
    let foundMistRing = false
    group.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.RingGeometry) {
        foundMistRing = true
      }
    })
    expect(foundMistRing).toBe(true)
  })
})
