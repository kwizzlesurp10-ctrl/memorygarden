import { beforeEach, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { Memory } from '../types'
import {
  computeGroveMilestone,
  generateGentleWhispers,
  incrementCommunityWaterings,
  openGardenGift,
  placeGardenGift,
} from '../garden-gifts'
import { layoutGardenWorld } from '../open-world/layout'
import { plantRecipe } from '../open-world/plant-visual'
import { createPlantGroup, disposePlantGroup } from '@/components/open-world/plant-mesh'
import { todPalette } from '../garden/day-night'

function makeMemory(id: string, extra: Partial<Memory> = {}): Memory {
  return {
    id,
    photoUrl: `https://example.test/${id}.jpg`,
    text: `Cherished afternoon under the cherry blossoms (${id})`,
    date: '2025-11-01',
    plantedAt: '2025-11-01T12:00:00.000Z',
    position: { x: 420, y: 460 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 4,
    reflections: [],
    audioRecordings: [],
    growthMetrics: {
      vitality: 65,
      height: 1,
      width: 1,
      bloomCount: 3,
      foliageDensity: 1,
      rarityScore: 1,
      lastInteractionAt: Date.now() - 36 * 3600 * 1000,
    },
    ...extra,
  }
}

describe('3D Gifts, Grove Milestones & Gentle Whispers (Phase 4)', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('places 3D gifts around a plant base and grants +20 vitality when opening a Dewdrop Vial', () => {
    const mem = makeMemory('mem-gift-1')
    const sender = { id: 'visitor-7', login: 'Sora' }

    const { gift: vialGift, updatedMemory: withVial } = placeGardenGift(
      mem,
      sender,
      'dew_vial',
      'May this pure dew nourish your roots.',
    )

    expect(vialGift.giftType).toBe('dew_vial')
    expect(vialGift.openedAt).toBeUndefined()
    expect(vialGift.positionOffset.distance).toBeGreaterThanOrEqual(0.28)
    expect(withVial.gifts).toHaveLength(1)

    // Open the Dewdrop Vial and verify +20 vitality boost + keepsake reflection
    const openedRes = openGardenGift(withVial, vialGift.id)
    expect(openedRes.gift?.openedAt).toBeDefined()
    expect(openedRes.vitalityAdded).toBe(20)
    expect(openedRes.updatedMemory.growthMetrics?.vitality).toBe(85) // 65 + 20
    expect(openedRes.updatedMemory.reflections).toHaveLength(1)
    expect(openedRes.updatedMemory.reflections[0].isTend).toBe(true)
    expect(openedRes.updatedMemory.reflections[0].text).toContain('May this pure dew')
  })

  it('renders procedural 3D gift meshes & Sleeping Seed meshes and protects shared static geometries on dispose', () => {
    const mem = makeMemory('mem-mesh-1')
    const sender = { id: 'visitor-9', login: 'Kaito' }
    const { updatedMemory: m1 } = placeGardenGift(mem, sender, 'blossom_note', 'Note 1')
    const { updatedMemory: m2 } = placeGardenGift(m1, sender, 'paper_lantern', 'Lantern 2')
    const { updatedMemory: m3 } = placeGardenGift(m2, sender, 'wind_chime', 'Chime 3')

    const world = layoutGardenWorld([m3], 'spring')
    const plant = world.plants[0]
    expect(plant.activeGifts).toHaveLength(3)

    const palette = todPalette(0.5, 'spring')
    const recipe = plantRecipe(
      plant.variety,
      plant.stage,
      plant.tone,
      palette,
      plant.height,
      plant.isHybrid,
    )
    const group = createPlantGroup(plant, recipe)

    const giftChildren = group.children.filter((c) => c.name.startsWith('gift:'))
    expect(giftChildren).toHaveLength(3)

    // Verify Sleeping Seed group renders crystalline bud and mist motes
    const sleepingGroup = createPlantGroup(
      { ...plant, isSleepingSeed: true },
      recipe,
    )
    const hasPoints = sleepingGroup.children.some((c) => c instanceof THREE.Points)
    expect(hasPoints).toBe(true)

    // Disposing group should not throw or corrupt shared static geometries
    disposePlantGroup(group)
    disposePlantGroup(sleepingGroup)
  })

  it('unlocks all 5 Grove Project community milestone tiers at 25, 75, 150, 300, and 500 waterings', () => {
    expect(computeGroveMilestone(10).unlockedFeatures).toEqual([])
    expect(computeGroveMilestone(25).unlockedFeatures).toEqual(['birdbath'])
    expect(computeGroveMilestone(75).unlockedFeatures).toEqual(['birdbath', 'fireflies'])
    expect(computeGroveMilestone(150).unlockedFeatures).toEqual([
      'birdbath',
      'fireflies',
      'sakura_tree',
    ])
    expect(computeGroveMilestone(300).unlockedFeatures).toEqual([
      'birdbath',
      'fireflies',
      'sakura_tree',
      'starlight_fountain',
    ])
    const maxTier = computeGroveMilestone(500)
    expect(maxTier.currentTier).toBe(5)
    expect(maxTier.unlockedFeatures).toEqual([
      'birdbath',
      'fireflies',
      'sakura_tree',
      'starlight_fountain',
      'aurora',
    ])

    const incremented = incrementCommunityWaterings(30)
    expect(incremented.totalCommunityWaterings).toBeGreaterThanOrEqual(30)
    expect(incremented.unlockedFeatures).toContain('birdbath')
  })

  it('enforces the Rule-of-Three on gentle re-engagement whispers', () => {
    const now = new Date('2026-11-01T10:00:00.000Z')
    const otdMem = makeMemory('otd-1', { date: '2024-11-01' })
    const thirstyMem = makeMemory('thirsty-1', {
      date: '2026-08-12',
      growthMetrics: {
        vitality: 35,
        height: 1,
        width: 1,
        bloomCount: 1,
        foliageDensity: 1,
        rarityScore: 1,
        lastInteractionAt: now.getTime() - 48 * 3600 * 1000,
      },
    })
    const { updatedMemory: giftedMem } = placeGardenGift(
      makeMemory('gifted-1'),
      { id: 'u2', login: 'Hana' },
      'paper_lantern',
      'Warm light for you',
      now,
    )

    const whispers = generateGentleWhispers([otdMem, thirstyMem, giftedMem], [], 'autumn', now)
    expect(whispers.length).toBeLessThanOrEqual(3)
    expect(whispers.map((w) => w.category)).toEqual([
      'on_this_day',
      'social_care',
      'gentle_thirst',
    ])
  })
})
