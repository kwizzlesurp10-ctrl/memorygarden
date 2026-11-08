import type { GardenStarterDecor, WorldDecorMushroom } from '@/lib/types'
import { gardenRng } from '@/lib/garden/prng'
import { isWorldOnLand, type WorldCoord } from '@/lib/garden/landscape-world'

const MUSHROOM_COUNT_MIN = 5
const MUSHROOM_COUNT_MAX = 8
const TREE_RADIUS_W = 0.12
const MUSHROOM_RADIUS_W = 0.035
const ELDER_TREE: WorldCoord = { wx: 0.38, wz: 0.52 }

export function createGardenStarterDecor(gardenSeed: number): GardenStarterDecor {
  const r = gardenRng(gardenSeed * 9137 + 41)
  const count = MUSHROOM_COUNT_MIN + Math.floor(r() * (MUSHROOM_COUNT_MAX - MUSHROOM_COUNT_MIN + 1))
  const mushrooms: WorldDecorMushroom[] = []
  const placed: WorldCoord[] = [ELDER_TREE]

  let attempts = 0
  while (mushrooms.length < count && attempts < count * 40) {
    attempts += 1
    const candidate: WorldCoord = {
      wx: 0.14 + r() * 0.72,
      wz: 0.22 + r() * 0.58,
    }
    if (!isWorldOnLand(candidate)) continue
    if (!fitsClearance(candidate, placed, MUSHROOM_RADIUS_W)) continue
    mushrooms.push({
      id: `m-${mushrooms.length}`,
      wx: roundCoord(candidate.wx),
      wz: roundCoord(candidate.wz),
      geneticsSeed: `starter-mushroom-${gardenSeed}-${mushrooms.length}`,
      scale: 0.55 + r() * 0.35,
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
      scale: 1.55,
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
