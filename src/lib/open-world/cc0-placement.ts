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
  const pathMargin = 1.2 + clearance
  if (pathDist < pathMargin) return false

  const pondDist = Math.hypot(x - world.pond.x, z - world.pond.z)
  if (pondDist < world.pond.radius + clearance + 0.35) return false

  const shedHalf = Math.max(world.shed.width, world.shed.depth) * 0.75
  if (Math.hypot(x - world.shed.x, z - world.shed.z) < shedHalf + clearance) return false

  const sc = world.sanctuaryCircle
  if (sc) {
    const scDist = Math.hypot(x - sc.x, z - sc.z)
    if (scDist < sc.radius + clearance + 0.25) return false
  }

  for (const plant of world.plants) {
    const d = Math.hypot(x - plant.x, z - plant.z)
    if (d < plant.radius + clearance + 0.5) return false
  }

  const b = world.bounds
  if (x < b.minX + 2.2 || x > b.maxX - 2.2 || z < b.minZ + 2.2 || z > b.maxZ - 2.2) return false
  return true
}

/** Hero pieces along the entry path — visible from spawn without blocking the spine. */
const ANCHORS: Array<Omit<Cc0Placement, 'scale'> & { scale?: number }> = [
  { modelId: 'kenney_tree_detailed', x: -5.2, z: 32, yaw: 0.15, anchor: true, scale: 1.15 },
  { modelId: 'kenney_tree_oak', x: 5.4, z: 32, yaw: -0.2, anchor: true, scale: 1.12 },
  { modelId: 'quat_BushBerries_1', x: -4.1, z: 27.5, yaw: 0.5, anchor: true, scale: 1.1 },
  { modelId: 'kenney_flower_purpleA', x: 3.8, z: 27, yaw: -0.4, anchor: true, scale: 1.15 },
  { modelId: 'kenney_mushroom_redGroup', x: 4.2, z: 23.5, yaw: 0.9, anchor: true, scale: 1.25 },
  { modelId: 'kenney_rock_largeA', x: -3.6, z: 23, yaw: 1.2, anchor: true, scale: 1.2 },
  { modelId: 'quat_Flowers', x: 3.5, z: 20.5, yaw: -0.6, anchor: true, scale: 1.1 },
  { modelId: 'quat_CommonTree_1', x: -7.5, z: 19, yaw: 0.45, anchor: true, scale: 1.08 },
  { modelId: 'kenney_tree_pineTallA_detailed', x: 7.8, z: 17, yaw: -0.55, anchor: true, scale: 1.05 },
  { modelId: 'quat_Willow_1', x: 6.5, z: 6, yaw: -1.05, anchor: true, scale: 1.05 },
  { modelId: 'kenney_fence_simple', x: -8.5, z: 14, yaw: Math.PI / 2, anchor: true, scale: 1.1 },
  { modelId: 'kenney_log', x: -6.2, z: 11, yaw: 0.3, anchor: true },
  { modelId: 'quat_TreeStump_Moss', x: 5.8, z: 10, yaw: -0.8, anchor: true },
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
    const clearance =
      a.modelId.includes('tree') || a.modelId === 'quat_Willow_1' || a.modelId === 'quat_CommonTree_1'
        ? 1.4
        : 0.48
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

  const baseScatter = 48
  const scatterAttempts = Math.round(baseScatter * tier.scatterMultiplier)
  const rng = gardenRng(gardenSeed + 90421)

  for (let i = 0; i < scatterAttempts; i++) {
    const modelId = SCATTER_POOL[Math.floor(rng() * SCATTER_POOL.length)]
    const x = (rng() * 2 - 1) * (world.bounds.maxX - 2.5)
    let z: number
    if (rng() < 0.55) {
      z = 8 + rng() * 28
    } else {
      z = (rng() * 2 - 1) * (world.bounds.maxZ - 2.5)
    }
    const clearance = modelId.includes('tree') ? 1.5 : 0.4
    if (!canPlaceScenery(world, x, z, clearance)) continue
    placements.push({
      modelId,
      x,
      z,
      yaw: rng() * Math.PI * 2,
      scale: 0.95 + rng() * 0.55,
    })
  }

  return placements
}

/** Capture camera pose — same for before/after comparison shots. */
export const CC0_WALK_CAPTURE_POSE = {
  x: 2.15,
  z: 33.6,
  yaw: 0.42,
  pitch: -0.11,
} as const

/** Single-model turntable anchor — in front of the walk capture camera. */
export const CC0_SHOWCASE_ANCHOR = {
  x: 1.9,
  z: 31.35,
  yaw: 0.22,
} as const

export const CC0_SHOWCASE_CAPTURE_POSE = {
  x: CC0_WALK_CAPTURE_POSE.x,
  z: CC0_WALK_CAPTURE_POSE.z,
  yaw: CC0_WALK_CAPTURE_POSE.yaw,
  pitch: -0.18,
} as const

export function cc0ShowcaseFillScale(targetHeight: number): number {
  if (targetHeight >= 5) return Math.max(0.88, 3.25 / targetHeight)
  return Math.min(2.85, Math.max(1.35, 4.2 / targetHeight))
}

export function cc0ShowcaseCapturePose(targetHeight: number): {
  x: number
  z: number
  yaw: number
  pitch: number
} {
  const retreat = targetHeight >= 5 ? (targetHeight - 4) * 1.15 : 0
  return {
    x: CC0_WALK_CAPTURE_POSE.x,
    z: CC0_WALK_CAPTURE_POSE.z + retreat,
    yaw: CC0_WALK_CAPTURE_POSE.yaw,
    pitch: targetHeight >= 5 ? -0.13 : -0.18,
  }
}
