import { gardenRng } from '@/lib/garden/prng'
import type { Cc0ModelId } from './cc0-catalog'
import type { GardenWorld, WorldPath } from './types'

export interface Cc0Placement {
  modelId: Cc0ModelId
  x: number
  z: number
  yaw: number
  scale: number
  anchor?: boolean
}

export interface Cc0PlacementTier {
  scatterMultiplier: number
}

export function cc0TierForDevice(opts: { reducedMotion: boolean; coarsePointer: boolean }): Cc0PlacementTier {
  if (opts.reducedMotion) return { scatterMultiplier: 0.45 }
  if (opts.coarsePointer) return { scatterMultiplier: 0.62 }
  return { scatterMultiplier: 1 }
}

function distToSegmentSq(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const abx = bx - ax
  const abz = bz - az
  const apx = px - ax
  const apz = pz - az
  const abLenSq = abx * abx + abz * abz
  const t = abLenSq < 1e-8 ? 0 : Math.max(0, Math.min(1, (apx * abx + apz * abz) / abLenSq))
  const cx = ax + abx * t
  const cz = az + abz * t
  const dx = px - cx
  const dz = pz - cz
  return dx * dx + dz * dz
}

export function minDistanceToPaths(x: number, z: number, paths: WorldPath[]): number {
  let minSq = Infinity
  for (const path of paths) {
    const pts = path.points
    for (let i = 0; i < pts.length - 1; i++) {
      minSq = Math.min(minSq, distToSegmentSq(x, z, pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z))
    }
  }
  return Math.sqrt(minSq)
}

export function canPlaceScenery(
  world: GardenWorld,
  x: number,
  z: number,
  clearance: number,
): boolean {
  const pathDist = minDistanceToPaths(x, z, world.paths)
  const pathMargin = 1.35 + clearance
  if (pathDist < pathMargin) return false

  const pondDist = Math.hypot(x - world.pond.x, z - world.pond.z)
  if (pondDist < world.pond.radius + clearance + 0.45) return false

  const shedHalf = Math.max(world.shed.width, world.shed.depth) * 0.75
  if (Math.hypot(x - world.shed.x, z - world.shed.z) < shedHalf + clearance) return false

  const sc = world.sanctuaryCircle
  if (sc) {
    const scDist = Math.hypot(x - sc.x, z - sc.z)
    if (scDist < sc.radius + clearance + 0.25) return false
  }

  for (const plant of world.plants) {
    const d = Math.hypot(x - plant.x, z - plant.z)
    if (d < plant.radius + clearance + 0.55) return false
  }

  const b = world.bounds
  if (x < b.minX + 2.2 || x > b.maxX - 2.2 || z < b.minZ + 2.2 || z > b.maxZ - 2.2) return false
  return true
}

const ANCHORS: Array<Omit<Cc0Placement, 'scale'> & { scale?: number }> = [
  { modelId: 'quat_CommonTree_1', x: -22, z: -28, yaw: 0.35, anchor: true, scale: 1.05 },
  { modelId: 'quat_Willow_1', x: 7.2, z: -10.5, yaw: -1.1, anchor: true, scale: 0.95 },
  { modelId: 'kenney_tree_oak', x: 24, z: -24, yaw: 2.4, anchor: true },
  { modelId: 'kenney_tree_detailed', x: -18, z: 14, yaw: -0.6, anchor: true },
  { modelId: 'kenney_tree_pineTallA_detailed', x: 30, z: 8, yaw: 2.9, anchor: true },
  { modelId: 'kenney_mushroom_redGroup', x: 5.8, z: -2.2, yaw: 0.8, anchor: true, scale: 1.15 },
  { modelId: 'quat_BushBerries_1', x: -6.5, z: -3.5, yaw: 0.2, anchor: true },
  { modelId: 'kenney_fence_simple', x: 12, z: 28, yaw: Math.PI / 2, anchor: true },
]

const SCATTER_POOL: Cc0ModelId[] = [
  'kenney_grass_large',
  'quat_Grass',
  'kenney_grass_large',
  'quat_Grass',
  'kenney_flower_purpleA',
  'quat_Flowers',
  'kenney_plant_bushDetailed',
  'quat_BushBerries_1',
  'kenney_stump_roundDetailed',
  'quat_TreeStump_Moss',
  'kenney_log',
  'kenney_rock_largeA',
  'kenney_mushroom_redGroup',
]

export function buildCc0Placements(
  world: GardenWorld,
  gardenSeed: number,
  tier: Cc0PlacementTier,
): Cc0Placement[] {
  const placements: Cc0Placement[] = []

  for (const a of ANCHORS) {
    const clearance = a.modelId.includes('tree') || a.modelId === 'quat_Willow_1' ? 1.8 : 0.55
    if (canPlaceScenery(world, a.x, a.z, clearance)) {
      placements.push({
        modelId: a.modelId,
        x: a.x,
        z: a.z,
        yaw: a.yaw,
        scale: a.scale ?? 1,
        anchor: true,
      })
    }
  }

  const baseScatter = 52
  const scatterAttempts = Math.round(baseScatter * tier.scatterMultiplier)
  const rng = gardenRng(gardenSeed + 90421)

  for (let i = 0; i < scatterAttempts; i++) {
    const modelId = SCATTER_POOL[Math.floor(rng() * SCATTER_POOL.length)]
    const x = (rng() * 2 - 1) * (world.bounds.maxX - 2.5)
    const z = (rng() * 2 - 1) * (world.bounds.maxZ - 2.5)
    const clearance = modelId.includes('tree') ? 1.5 : 0.42
    if (!canPlaceScenery(world, x, z, clearance)) continue
    placements.push({
      modelId,
      x,
      z,
      yaw: rng() * Math.PI * 2,
      scale: 0.82 + rng() * 0.45,
    })
  }

  return placements
}
