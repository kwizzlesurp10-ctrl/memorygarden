import type { GardenStarterDecor, WorldDecorMushroom } from '@/lib/types'
import { gardenRng } from '@/lib/garden/prng'
import { isWorldOffShoreGrass, type WorldCoord } from '@/lib/garden/landscape-world'

const MUSHROOM_COUNT_MIN = 5
const MUSHROOM_COUNT_MAX = 8
const TREE_RADIUS_W = 0.12
const MUSHROOM_RADIUS_W = 0.035
const ELDER_TREE: WorldCoord = { wx: 0.31, wz: 0.28 }

export function createGardenStarterDecor(gardenSeed: number): GardenStarterDecor {
  const r = gardenRng(gardenSeed * 9137 + 41)
  const count = MUSHROOM_COUNT_MIN + Math.floor(r() * (MUSHROOM_COUNT_MAX - MUSHROOM_COUNT_MIN + 1))
  const mushrooms: WorldDecorMushroom[] = []
  const placed: WorldCoord[] = [ELDER_TREE]

  let attempts = 0
  while (mushrooms.length < count && attempts < count * 40) {
    attempts += 1
    const candidate: WorldCoord = {
      wx: 0.12 + r() * 0.76,
      wz: 0.18 + r() * 0.4,
    }
    if (!isWorldOffShoreGrass(candidate)) continue
    if (!fitsClearance(candidate, placed, MUSHROOM_RADIUS_W)) continue
    mushrooms.push({
      id: `m-${mushrooms.length}`,
      wx: roundCoord(candidate.wx),
      wz: roundCoord(candidate.wz),
      geneticsSeed: `starter-mushroom-${gardenSeed}-${mushrooms.length}`,
      scale: 0.95 + r() * 0.45,
    })
    placed.push(candidate)
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
