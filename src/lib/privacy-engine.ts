import type { EmotionalTone, Memory, PrivacyMode, Reflection } from './types'
import type { GardenWorld, WorldBed, WorldFillerFlora, WorldPlant } from './open-world/types'
import { hashString } from './garden/prng'

export const CONTEMPLATION_RING = {
  x: 0,
  z: -5.5,
  radius: 7.2,
}

export const SLEEPING_SEED_TITLE = 'A quiet memory rests here in gentle contemplation'

export interface VisitorProjectionOptions {
  mode: PrivacyMode
  isOwner?: boolean
  isCircleMember?: boolean
  gardenId?: string
}

function u01(salt: string): number {
  return hashString(salt) / 4294967296
}

/**
 * Generates deterministic Poisson-disc ambient undergrowth (clover patches, mossy stones,
 * and ferns) across emotional tone beds to mask negative space in Mode A (Camouflage).
 * Seeded exclusively by `gardenId` and `bed.tone` — never by private plant count or coordinates.
 */
export function generateBedFillerFlora(
  beds: WorldBed[],
  visiblePlants: WorldPlant[],
  gardenId: string = 'default-garden',
  candidatesPerBed: number = 14,
): WorldFillerFlora[] {
  const fillers: WorldFillerFlora[] = []
  const minFillerDist = 1.65

  for (const bed of beds) {
    const bedFillers: WorldFillerFlora[] = []
    for (let i = 0; i < candidatesPerBed; i++) {
      const baseSeed = `${gardenId}:${bed.tone}:filler:${i}`
      const angle = u01(`${baseSeed}:a`) * Math.PI * 2
      const dist = Math.sqrt(u01(`${baseSeed}:r`)) * (bed.radius * 0.82)
      const x = bed.x + Math.cos(angle) * dist
      const z = bed.z + Math.sin(angle) * dist
      const scale = 0.65 + u01(`${baseSeed}:s`) * 0.55

      // 1. Keep clear of visible plants (dist >= r_p + 0.3m)
      const overlapsPlant = visiblePlants.some(
        (p) => Math.hypot(x - p.x, z - p.z) < p.radius + 0.3,
      )
      if (overlapsPlant) continue

      // 2. Poisson-disc minimum spacing between filler tufts
      const overlapsFiller = bedFillers.some(
        (f) => Math.hypot(x - f.x, z - f.z) < minFillerDist,
      )
      if (overlapsFiller) continue

      bedFillers.push({
        x,
        z,
        scale,
        tone: bed.tone as EmotionalTone,
      })
    }
    fillers.push(...bedFillers)
  }

  return fillers
}

/**
 * Projects a canonical `GardenWorld` into a visitor-safe 3D world under either:
 * - Mode A (`camouflage`): Fixed-Coordinate Camouflage with zero coordinate drift (\Delta === 0)
 *   and Poisson-disc Negative-Space Masking filler flora.
 * - Mode B (`sleeping_seed`): Projects private memories onto the Central Contemplation Ring
 *   around the pond (0, -5.5) at radius 7.2m with uniform `sprout` geometry and 100% redacted text/photos.
 */
export function projectVisitorWorld(
  canonicalWorld: GardenWorld,
  memories: Memory[],
  options: VisitorProjectionOptions,
): GardenWorld {
  const {
    mode,
    isOwner = false,
    isCircleMember = false,
    gardenId = 'default-garden',
  } = options

  if (isOwner) {
    return {
      ...canonicalWorld,
      plants: canonicalWorld.plants.map((p) => ({ ...p })),
    }
  }

  const memoryById = new Map<string, Memory>()
  for (const m of memories) {
    memoryById.set(m.id, m)
  }

  const visiblePlants: WorldPlant[] = []
  const privateMemories: Memory[] = []

  for (const plant of canonicalWorld.plants) {
    const mem = memoryById.get(plant.id)
    const visibility = mem?.visibility ?? plant.visibility ?? 'public'

    if (visibility === 'public' || (visibility === 'circle' && isCircleMember)) {
      // Preserve exact canonical coordinates (zero drift: \Delta_i === 0)
      visiblePlants.push({
        ...plant,
        visibility,
      })
    } else if (mem) {
      privateMemories.push(mem)
    }
  }

  if (mode === 'camouflage') {
    const fillerFlora = generateBedFillerFlora(canonicalWorld.beds, visiblePlants, gardenId)
    return {
      ...canonicalWorld,
      plants: visiblePlants,
      fillerFlora,
    }
  }

  // Mode B: 'sleeping_seed' — project private memories onto the Central Contemplation Ring
  const nPriv = privateMemories.length
  const ringPhase = ((hashString(gardenId) % 1000) / 1000) * Math.PI * 2

  const sleepingSeeds: WorldPlant[] = privateMemories.map((mem, k) => {
    const theta = (2 * Math.PI * k) / Math.max(1, nPriv) + ringPhase
    const x = CONTEMPLATION_RING.x + CONTEMPLATION_RING.radius * Math.cos(theta)
    const z = CONTEMPLATION_RING.z + CONTEMPLATION_RING.radius * Math.sin(theta)

    return {
      id: mem.id,
      x,
      z,
      radius: 0.22,
      colliderRadius: 0.22,
      height: 0.35,
      variety: 'flower',
      stage: 'sprout',
      tone: 'peaceful',
      title: SLEEPING_SEED_TITLE,
      photoUrl: '',
      isHybrid: false,
      moistureLevel: mem.growthMetrics?.vitality ?? 80,
      healthStatus: 'healthy',
      wiltingFactor: 0,
      needsWater: (mem.growthMetrics?.vitality ?? 80) < 95,
      isEternal: false,
      isSleepingSeed: true,
      visibility: 'private',
    }
  })

  const allProjectedPlants = [...visiblePlants, ...sleepingSeeds]
  const fillerFlora = generateBedFillerFlora(canonicalWorld.beds, allProjectedPlants, gardenId)

  return {
    ...canonicalWorld,
    plants: allProjectedPlants,
    fillerFlora,
  }
}

/**
 * Strips private self-reflections (`!r.isTend`) and redacts private memory fields
 * before serializing over the wire or displaying to non-owner visitors.
 */
export function sanitizeMemoriesForWire(
  memories: Memory[],
  options: VisitorProjectionOptions,
): Memory[] {
  const {
    mode,
    isOwner = false,
    isCircleMember = false,
    gardenId = 'default-garden',
  } = options

  if (isOwner) {
    return memories
  }

  const sanitized: Memory[] = []
  const privateMemories = memories.filter((m) => {
    const vis = m.visibility ?? 'public'
    return !(vis === 'public' || (vis === 'circle' && isCircleMember))
  })
  const nPriv = privateMemories.length
  const ringPhase = ((hashString(gardenId) % 1000) / 1000) * Math.PI * 2
  let privIndex = 0

  for (const mem of memories) {
    const vis = mem.visibility ?? 'public'
    const isAllowed = vis === 'public' || (vis === 'circle' && isCircleMember)

    // Filter reflections to ONLY social tends (`r.isTend === true`)
    const publicTends: Reflection[] = (mem.reflections ?? []).filter(
      (r) => r.isTend === true,
    )

    if (isAllowed) {
      sanitized.push({
        ...mem,
        reflections: publicTends,
      })
    } else if (mode === 'sleeping_seed') {
      const theta = (2 * Math.PI * privIndex) / Math.max(1, nPriv) + ringPhase
      privIndex++
      sanitized.push({
        id: mem.id,
        photoUrl: '',
        text: SLEEPING_SEED_TITLE,
        date: '',
        location: undefined,
        plantedAt: '',
        position: {
          x: CONTEMPLATION_RING.x + CONTEMPLATION_RING.radius * Math.cos(theta),
          y: CONTEMPLATION_RING.z + CONTEMPLATION_RING.radius * Math.sin(theta),
        },
        emotionalTone: 'peaceful',
        plantStage: 'sprout',
        plantVariety: 'flower',
        visitCount: mem.visitCount,
        reflections: [],
        audioRecordings: [],
        visibility: 'private',
      })
    }
    // In 'camouflage' mode, private memories are omitted from the wire payload completely
  }

  return sanitized
}

/**
 * Masks private memory IDs in activity logs so visitors cannot correlate activity rows
 * to hidden memories.
 */
export function sanitizeActivityForWire<
  T extends { memory_id?: string | null; memoryId?: string | null; description: string; user_name?: string; userLogin?: string }
>(
  activities: T[],
  privateMemoryIds: Set<string>,
): T[] {
  return activities.map((act) => {
    const mId = act.memory_id ?? act.memoryId
    if (mId && privateMemoryIds.has(mId)) {
      const actor = act.user_name ?? act.userLogin ?? 'A gardener'
      return {
        ...act,
        memory_id: null,
        memoryId: undefined,
        description: `${actor} tended a quiet seed in the garden`,
      }
    }
    return act
  })
}
