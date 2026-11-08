import type { GardenStarterDecor, WorldDecorMushroom } from '@/lib/types'
import { gardenRng } from '@/lib/garden/prng'
import { isWorldOffShoreGrass, type WorldCoord } from '@/lib/garden/landscape-world'

const MUSHROOM_COUNT_MIN = 5
const MUSHROOM_COUNT_MAX = 6
const TREE_RADIUS_W = 0.12
const MUSHROOM_RADIUS_W = 0.035
const ELDER_TREE: WorldCoord = { wx: 0.31, wz: 0.28 }

export function createGardenStarterDecor(gardenSeed: number): GardenStarterDecor {
  const r = gardenRng(gardenSeed * 9137 + 41)
  const count = MUSHROOM_COUNT_MIN + Math.floor(r() * (MUSHROOM_COUNT_MAX - MUSHROOM_COUNT_MIN + 1))
  const mushrooms: WorldDecorMushroom[] = []
  const placed: WorldCoord[] = [ELDER_TREE]

  const clusters: Array<{ wx: number; wz: number }> = [
    { wx: ELDER_TREE.wx + 0.06, wz: ELDER_TREE.wz + 0.11 },
    { wx: ELDER_TREE.wx - 0.08, wz: ELDER_TREE.wz + 0.04 },
    { wx: ELDER_TREE.wx + 0.12, wz: ELDER_TREE.wz + 0.06 },
    { wx: 0.22, wz: 0.16 },
    { wx: 0.56, wz: 0.24 },
    { wx: 0.72, wz: 0.36 },
    { wx: 0.38, wz: 0.46 },
    { wx: 0.64, wz: 0.52 },
    { wx: 0.18, wz: 0.38 },
  ]

  let attempts = 0
  let clusterIx = 0
  while (mushrooms.length < count && attempts < count * 80) {
    attempts += 1
    const cluster = clusters[clusterIx % clusters.length]
    clusterIx += 1

    const spread = 0.055 + r() * 0.04
    const angle = r() * Math.PI * 2
    const candidate: WorldCoord = {
      wx: cluster.wx + Math.cos(angle) * spread * r(),
      wz: cluster.wz + Math.sin(angle) * spread * r() * 1.35,
    }
    if (!isWorldOffShoreGrass(candidate)) continue
    if (!fitsClearance(candidate, placed, MUSHROOM_RADIUS_W)) continue

    const depthT = Math.max(0, Math.min(1, (candidate.wz - 0.14) / 0.48))
    const baseScale = 0.85 + depthT * 0.55

    mushrooms.push({
      id: `m-${mushrooms.length}`,
      wx: roundCoord(candidate.wx),
      wz: roundCoord(candidate.wz),
      geneticsSeed: `starter-mushroom-${gardenSeed}-${mushrooms.length}`,
      scale: baseScale * (0.92 + r() * 0.22),
    })
    placed.push(candidate)
  }

  if (mushrooms.length < count) {
    while (mushrooms.length < count && attempts < count * 120) {
      attempts += 1
      const candidate: WorldCoord = {
        wx: 0.14 + r() * 0.7,
        wz: 0.16 + r() * 0.46,
      }
      if (!isWorldOffShoreGrass(candidate)) continue
      if (!fitsClearance(candidate, placed, MUSHROOM_RADIUS_W)) continue
      const depthT = Math.max(0, Math.min(1, (candidate.wz - 0.14) / 0.48))
      mushrooms.push({
        id: `m-${mushrooms.length}`,
        wx: roundCoord(candidate.wx),
        wz: roundCoord(candidate.wz),
        geneticsSeed: `starter-mushroom-${gardenSeed}-${mushrooms.length}`,
        scale: (0.85 + depthT * 0.5) * (0.95 + r() * 0.2),
      })
      placed.push(candidate)
    }
  }

  return {
    v: 1,
    gardenSeed,
    elderTree: {
      wx: ELDER_TREE.wx,
      wz: ELDER_TREE.wz,
      geneticsSeed: `starter-elder-${gardenSeed}`,
      scale: 2.05,
    },
    mushrooms,
  }
}

function fitsClearance(point: WorldCoord, others: WorldCoord[], minDist: number): boolean {
  for (let i = 0; i < others.length; i++) {
    const o = others[i]
    const dx = point.wx - o.wx
    const dz = point.wz - o.wz
    const treePad = i === 0 ? TREE_RADIUS_W : minDist
    if (Math.hypot(dx, dz) < treePad + minDist) return false
  }
  return true
}

function roundCoord(n: number): number {
  return Math.round(n * 10000) / 10000
}
