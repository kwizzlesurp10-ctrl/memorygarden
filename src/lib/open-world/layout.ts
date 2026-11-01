import type { EmotionalTone, Memory, PlantStage, PlantVariety, Season } from '@/lib/types'
import { hashString } from '@/lib/garden/prng'
import {
  computeCurrentMoisture,
  computeWiltingFactor,
  getHealthStatus,
} from '@/lib/tending-logic'
import {
  PATH_WIDTH,
  PLAYER_RADIUS,
  SEPARATION_GAP,
  WORLD_HALF,
} from './constants'
import type { GardenWorld, Vec2, WorldBed, WorldPlant } from './types'

const BEDS: WorldBed[] = [
  { tone: 'happy', x: -16, z: -15, radius: 10 },
  { tone: 'peaceful', x: 16, z: -15, radius: 10 },
  { tone: 'reflective', x: -17, z: 3, radius: 9.5 },
  { tone: 'nostalgic', x: 17, z: 3, radius: 9.5 },
  { tone: 'bittersweet', x: 0, z: 16, radius: 9 },
]

const STAGE_RADIUS: Record<PlantStage, number> = {
  seed: 0.18,
  sprout: 0.24,
  seedling: 0.32,
  young: 0.4,
  bud: 0.48,
  bloom: 0.55,
  mature: 0.72,
  elder: 0.95,
}

const STAGE_HEIGHT: Record<PlantStage, number> = {
  seed: 0.12,
  sprout: 0.35,
  seedling: 0.55,
  young: 0.9,
  bud: 1.15,
  bloom: 1.35,
  mature: 1.85,
  elder: 2.4,
}

const TREE_VARIETIES = new Set<PlantVariety>(['tree', 'ancient_oak'])

function u01(salt: string): number {
  return hashString(salt) / 4294967296
}

function titleFrom(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= 72) return trimmed || 'A planted memory'
  return `${trimmed.slice(0, 69).trimEnd()}…`
}

export function plantRadius(stage: PlantStage, variety: PlantVariety): number {
  const base = STAGE_RADIUS[stage] ?? 0.45
  return TREE_VARIETIES.has(variety) ? base * 1.45 : base
}

export function plantHeight(stage: PlantStage, variety: PlantVariety): number {
  const base = STAGE_HEIGHT[stage] ?? 1.2
  if (TREE_VARIETIES.has(variety)) return base * 1.7
  if (variety === 'mushroom' || variety === 'succulent' || variety === 'starlight_succulent') {
    return base * 0.55
  }
  return base
}

function bedFor(tone: EmotionalTone): WorldBed {
  return BEDS.find((b) => b.tone === tone) ?? BEDS[2]
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function pushOutOfCircle(
  x: number,
  z: number,
  cx: number,
  cz: number,
  minDist: number,
): Vec2 {
  const dx = x - cx
  const dz = z - cz
  const d = Math.hypot(dx, dz)
  if (d >= minDist) return { x, z }
  if (d < 1e-6) return { x: cx + minDist, z: cz }
  const s = minDist / d
  return { x: cx + dx * s, z: cz + dz * s }
}

function separatePlants(plants: WorldPlant[]): void {
  const sorted = [...plants].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  for (let iter = 0; iter < 10; iter++) {
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]
        const b = sorted[j]
        const dx = b.x - a.x
        const dz = b.z - a.z
        const min = a.radius + b.radius + SEPARATION_GAP
        const dist = Math.hypot(dx, dz)
        if (dist >= min) continue
        if (dist < 1e-6) {
          const ang = u01(`${a.id}:${b.id}:sep`) * Math.PI * 2
          b.x = a.x + Math.cos(ang) * min
          b.z = a.z + Math.sin(ang) * min
          continue
        }
        const push = (min - dist) * 0.5
        const nx = dx / dist
        const nz = dz / dist
        a.x -= nx * push
        a.z -= nz * push
        b.x += nx * push
        b.z += nz * push
      }
    }
  }
}

function clampPlant(p: WorldPlant, half: number): void {
  const m = p.radius + 1.2
  p.x = clamp(p.x, -half + m, half - m)
  p.z = clamp(p.z, -half + m, half - m)
}

function buildPaths(): GardenWorld['paths'] {
  const spine: Vec2[] = [
    { x: 0, z: 38 },
    { x: 0, z: 24 },
    { x: 0, z: 10 },
    { x: 0, z: -2 },
    { x: 0, z: -14 },
  ]
  const branches = BEDS.map((bed) => ({
    points: [
      { x: 0, z: bed.z > 0 ? 10 : -2 },
      { x: bed.x * 0.45, z: bed.z * 0.55 },
      { x: bed.x, z: bed.z },
    ],
    width: PATH_WIDTH * 0.78,
  }))
  return [{ points: spine, width: PATH_WIDTH }, ...branches]
}

/**
 * Stable walkable layout: emotional-tone beds + canvas X + id scatter.
 * Same memory set always yields the same world coordinates.
 */
export function layoutGardenWorld(memories: Memory[], season: Season = 'spring'): GardenWorld {
  const half = WORLD_HALF
  const pond = { x: 0, z: -5.5, radius: 5.4 }
  const shed = { x: -30, z: 20, width: 4.2, depth: 3.2, yaw: 0.2 }
  const gate = { x: 0, z: 38 }

  const plants: WorldPlant[] = memories.map((memory) => {
    const bed = bedFor(memory.emotionalTone)
    const canvasX = ((memory.position.x % 1200) / 1200 - 0.5) * 28
    const jx = (u01(`${memory.id}:x`) - 0.5) * 8.5
    const jz = (u01(`${memory.id}:z`) - 0.5) * 8.5
    let x = bed.x * 0.62 + canvasX * 0.38 + jx
    let z = bed.z + jz
    const radius = plantRadius(memory.plantStage, memory.plantVariety)
    const height = plantHeight(memory.plantStage, memory.plantVariety)
    const pondClear = pushOutOfCircle(x, z, pond.x, pond.z, pond.radius + radius + 0.8)
    x = pondClear.x
    z = pondClear.z
    const shedClear = pushOutOfCircle(
      x,
      z,
      shed.x,
      shed.z,
      Math.max(shed.width, shed.depth) * 0.7 + radius + 0.6,
    )
    x = shedClear.x
    z = shedClear.z

    const initM = memory.growthMetrics?.vitality ?? 80.0
    const lastW = memory.growthMetrics?.lastInteractionAt
    const moistureLevel = computeCurrentMoisture(initM, lastW, memory.plantVariety, season)
    const healthStatus = getHealthStatus(moistureLevel)
    const wiltingFactor = computeWiltingFactor(moistureLevel)
    const needsWater = moistureLevel < 30.0
    const isEternal = memory.plantVariety === 'eternal_rose' || (memory.visitCount || 0) >= 100

    return {
      id: memory.id,
      x,
      z,
      radius,
      height,
      variety: memory.plantVariety,
      stage: memory.plantStage,
      tone: memory.emotionalTone,
      title: titleFrom(memory.text),
      photoUrl: memory.photoUrl,
      isHybrid: Boolean(memory.isHybrid),
      moistureLevel,
      healthStatus,
      wiltingFactor,
      needsWater,
      isEternal,
    }
  })

  separatePlants(plants)
  for (const p of plants) {
    const pondClear = pushOutOfCircle(p.x, p.z, pond.x, pond.z, pond.radius + p.radius + 0.8)
    p.x = pondClear.x
    p.z = pondClear.z
    clampPlant(p, half)
  }

  const spawnX = gate.x
  let spawnZ = gate.z - 1.2
  for (const p of plants) {
    const d = Math.hypot(spawnX - p.x, spawnZ - p.z)
    const min = p.radius + PLAYER_RADIUS + 0.6
    if (d < min) {
      spawnZ = Math.min(half - 2, spawnZ + (min - d) + 0.4)
    }
  }

  return {
    bounds: { minX: -half, maxX: half, minZ: -half, maxZ: half },
    spawn: { x: spawnX, z: spawnZ, yaw: 0 },
    plants,
    paths: buildPaths(),
    pond,
    shed,
    gate,
    beds: BEDS,
  }
}

export function worldToMinimap(
  x: number,
  z: number,
  bounds: GardenWorld['bounds'],
  size: number,
): { x: number; y: number } {
  const u = (x - bounds.minX) / (bounds.maxX - bounds.minX || 1)
  const v = (z - bounds.minZ) / (bounds.maxZ - bounds.minZ || 1)
  return { x: u * size, y: v * size }
}
