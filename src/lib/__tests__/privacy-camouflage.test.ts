import { describe, expect, it } from 'vitest'
import type { Memory } from '../types'
import { layoutGardenWorld } from '../open-world/layout'
import { resolveDepenetration } from '../open-world/locomotion'
import { PLAYER_RADIUS } from '../open-world/constants'
import {
  CONTEMPLATION_RING,
  SLEEPING_SEED_TITLE,
  generateBedFillerFlora,
  projectVisitorWorld,
  sanitizeActivityForWire,
  sanitizeMemoriesForWire,
} from '../privacy-engine'

function makeMemory(id: string, extra: Partial<Memory> = {}): Memory {
  return {
    id,
    photoUrl: `https://example.test/${id}.jpg`,
    text: `Personal story for memory ${id}`,
    date: '2025-06-15',
    plantedAt: '2025-06-15T10:00:00.000Z',
    position: { x: 350, y: 420 },
    emotionalTone: 'happy',
    plantStage: 'mature',
    plantVariety: 'tree',
    visitCount: 5,
    reflections: [
      {
        id: `ref-self-${id}`,
        text: 'My private self-reflection journal entry',
        createdAt: '2025-06-16T10:00:00.000Z',
        isTend: false,
      },
      {
        id: `ref-tend-${id}`,
        text: 'Sending warm sunlight to your memory!',
        createdAt: '2025-06-17T10:00:00.000Z',
        contributorId: 'friend-1',
        contributorLogin: 'Luna',
        isTend: true,
      },
    ],
    audioRecordings: [],
    visibility: 'public',
    ...extra,
  }
}

describe('Four-Tier Privacy & Camouflage Engine', () => {
  it('Mode A (Camouflage): guarantees zero coordinate drift (\\Delta === 0) on public plants when private plants are hidden', () => {
    const memories: Memory[] = [
      makeMemory('pub-1', { emotionalTone: 'happy', position: { x: 300, y: 400 }, visibility: 'public' }),
      makeMemory('priv-1', { emotionalTone: 'happy', position: { x: 305, y: 402 }, visibility: 'private' }),
      makeMemory('pub-2', { emotionalTone: 'peaceful', position: { x: 600, y: 450 }, visibility: 'public' }),
      makeMemory('priv-2', { emotionalTone: 'peaceful', position: { x: 602, y: 452 }, visibility: 'private' }),
    ]

    const canonicalWorld = layoutGardenWorld(memories, 'spring')
    const ownerView = projectVisitorWorld(canonicalWorld, memories, {
      mode: 'camouflage',
      isOwner: true,
      gardenId: 'garden-alpha',
    })
    const visitorView = projectVisitorWorld(canonicalWorld, memories, {
      mode: 'camouflage',
      isOwner: false,
      gardenId: 'garden-alpha',
    })

    expect(ownerView.plants).toHaveLength(4)
    expect(visitorView.plants).toHaveLength(2)
    expect(visitorView.plants.map((p) => p.id)).toEqual(['pub-1', 'pub-2'])

    for (const visPlant of visitorView.plants) {
      const ownerPlant = ownerView.plants.find((p) => p.id === visPlant.id)!
      const dx = Math.abs(ownerPlant.x - visPlant.x)
      const dz = Math.abs(ownerPlant.z - visPlant.z)
      expect(dx).toBe(0)
      expect(dz).toBe(0)
    }
  })

  it('Negative-Space Masking: generates deterministic Poisson-disc bed filler flora clear of visible plants', () => {
    const memories: Memory[] = [
      makeMemory('pub-1', { emotionalTone: 'happy', visibility: 'public' }),
      makeMemory('priv-1', { emotionalTone: 'reflective', visibility: 'private' }),
    ]
    const world = layoutGardenWorld(memories, 'spring')
    const visitorView = projectVisitorWorld(world, memories, {
      mode: 'camouflage',
      isOwner: false,
      gardenId: 'garden-mask-test',
    })

    expect(visitorView.fillerFlora).toBeDefined()
    expect(visitorView.fillerFlora!.length).toBeGreaterThan(10)

    // Verify every filler tuft respects clearance >= r_p + 0.3m from visible plants
    for (const filler of visitorView.fillerFlora!) {
      for (const plant of visitorView.plants) {
        const dist = Math.hypot(filler.x - plant.x, filler.z - plant.z)
        expect(dist).toBeGreaterThanOrEqual(plant.radius + 0.3)
      }
    }

    // Verify determinism for identical gardenId
    const secondRun = generateBedFillerFlora(world.beds, visitorView.plants, 'garden-mask-test')
    expect(visitorView.fillerFlora).toEqual(secondRun)
  })

  it('Mode B (Sleeping Seed): projects private memories onto the Central Contemplation Ring at R = 7.2m with 100% redacted text/photo', () => {
    const memories: Memory[] = [
      makeMemory('pub-1', { emotionalTone: 'happy', visibility: 'public' }),
      makeMemory('priv-a', {
        emotionalTone: 'bittersweet',
        plantStage: 'elder',
        plantVariety: 'ancient_oak',
        text: 'Ultra-secret private journal entry',
        photoUrl: 'https://secret.test/photo.jpg',
        visibility: 'private',
      }),
      makeMemory('priv-b', {
        emotionalTone: 'nostalgic',
        plantStage: 'mature',
        plantVariety: 'lotus',
        text: 'Another private memory',
        photoUrl: 'https://secret.test/photo2.jpg',
        visibility: 'private',
      }),
    ]

    const canonicalWorld = layoutGardenWorld(memories, 'spring')
    const visitorWorld = projectVisitorWorld(canonicalWorld, memories, {
      mode: 'sleeping_seed',
      isOwner: false,
      gardenId: 'garden-beta',
    })

    expect(visitorWorld.plants).toHaveLength(3)
    const seeds = visitorWorld.plants.filter((p) => p.isSleepingSeed)
    expect(seeds).toHaveLength(2)

    for (const seed of seeds) {
      const distFromPond = Math.hypot(
        seed.x - CONTEMPLATION_RING.x,
        seed.z - CONTEMPLATION_RING.z,
      )
      expect(distFromPond).toBeCloseTo(CONTEMPLATION_RING.radius, 5)
      expect(seed.stage).toBe('sprout')
      expect(seed.variety).toBe('flower')
      expect(seed.tone).toBe('peaceful')
      expect(seed.radius).toBe(0.22)
      expect(seed.height).toBe(0.35)
      expect(seed.title).toBe(SLEEPING_SEED_TITLE)
      expect(seed.photoUrl).toBe('')
    }
  })

  it('sanitizes wire payloads by stripping self-reflections (!isTend) and masking private activity IDs', () => {
    const memories: Memory[] = [
      makeMemory('pub-1', { visibility: 'public' }),
      makeMemory('priv-1', { visibility: 'private', text: 'Hidden text' }),
    ]

    const wireCamouflage = sanitizeMemoriesForWire(memories, {
      mode: 'camouflage',
      isOwner: false,
    })
    expect(wireCamouflage).toHaveLength(1)
    expect(wireCamouflage[0].id).toBe('pub-1')
    // Only the social tend (isTend === true) should remain on the public memory
    expect(wireCamouflage[0].reflections).toHaveLength(1)
    expect(wireCamouflage[0].reflections[0].isTend).toBe(true)

    const wireSleepingSeed = sanitizeMemoriesForWire(memories, {
      mode: 'sleeping_seed',
      isOwner: false,
    })
    expect(wireSleepingSeed).toHaveLength(2)
    const redactedPriv = wireSleepingSeed.find((m) => m.id === 'priv-1')!
    expect(redactedPriv.text).toBe(SLEEPING_SEED_TITLE)
    expect(redactedPriv.photoUrl).toBe('')
    expect(redactedPriv.reflections).toEqual([])

    const activities = [
      { memory_id: 'pub-1', user_name: 'Alice', description: 'Alice watered pub-1' },
      { memory_id: 'priv-1', user_name: 'Bob', description: 'Bob planted priv-1' },
    ]
    const maskedActivities = sanitizeActivityForWire(activities, new Set(['priv-1']))
    expect(maskedActivities[0].memory_id).toBe('pub-1')
    expect(maskedActivities[1].memory_id).toBeNull()
    expect(maskedActivities[1].description).toContain('tended a quiet seed')
  })

  it('resolves player collision depenetration when overlapping a trunk collider', () => {
    const memories = [makeMemory('tree-1', { plantStage: 'elder', plantVariety: 'ancient_oak' })]
    const world = layoutGardenWorld(memories, 'spring')
    const tree = world.plants[0]

    // Elder tree has large visual canopy radius (> 1.3m) but clamped trunk colliderRadius (0.22m)
    expect(tree.radius).toBeGreaterThan(1.0)
    expect(tree.colliderRadius).toBeLessThanOrEqual(0.22)

    // Place player slightly inside the trunk collider
    const pushed = resolveDepenetration(tree.x + 0.05, tree.z, world)
    const newDist = Math.hypot(pushed.x - tree.x, pushed.z - tree.z)
    expect(newDist).toBeGreaterThanOrEqual(PLAYER_RADIUS + (tree.colliderRadius ?? 0.22))
  })
})
