import type { GardenStarterDecor, WorldDecorMushroom } from '@/lib/types'
import { gardenRng } from '@/lib/garden/prng'
import { isWorldOffShoreGrass, type WorldCoord } from '@/lib/garden/landscape-world'

const MUSHROOM_COUNT_MIN = 6
const MUSHROOM_COUNT_MAX = 9
const TREE_RADIUS_W = 0.11
const MUSHROOM_RADIUS_W = 0.028
const ELDER_TREE: WorldCoord = { wx: 0.31, wz: 0.28 }

interface MushroomGroup {
  wx: number
  wz: number
  /** Mushrooms in this patch (2–3 typical). */
  size: number
}

export function createGardenStarterDecor(gardenSeed: number): GardenStarterDecor {
  const r = gardenRng(gardenSeed * 9137 + 41)
  const targetTotal = MUSHROOM_COUNT_MIN + Math.floor(r() * (MUSHROOM_COUNT_MAX - MUSHROOM_COUNT_MIN + 1))

  const groups: MushroomGroup[] = [
    { wx: ELDER_TREE.wx + 0.05, wz: ELDER_TREE.wz + 0.085, size: 2 },
    { wx: ELDER_TREE.wx - 0.07, wz: ELDER_TREE.wz + 0.055, size: 2 },
    { wx: 0.48, wz: 0.3, size: 2 },
    { wx: 0.68, wz: 0.42, size: 1 },
    { wx: 0.26, wz: 0.46, size: 2 },
  ]
  const groupCount = 3 + Math.floor(r() * 3)
  const activeGroups = groups.slice(0, groupCount)

  const mushrooms: WorldDecorMushroom[] = []
  const placed: WorldCoord[] = [ELDER_TREE]

  for (const group of activeGroups) {
    if (mushrooms.length >= targetTotal) break
    const inGroup = Math.min(group.size, targetTotal - mushrooms.length)
    for (let g = 0; g < inGroup; g++) {
      let placedOne = false
      for (let attempt = 0; attempt < 32 && !placedOne; attempt++) {
        const spread = 0.028 + r() * 0.038
        const angle = r() * Math.PI * 2
        const candidate: WorldCoord = {
          wx: group.wx + Math.cos(angle) * spread,
          wz: group.wz + Math.sin(angle) * spread * 1.25,
        }
        if (!isWorldOffShoreGrass(candidate)) continue
        if (!fitsClearance(candidate, placed, MUSHROOM_RADIUS_W)) continue

        const depthT = Math.max(0, Math.min(1, (candidate.wz - 0.12) / 0.5))
        const nearBoost = 1.05 + depthT * 0.95
        const scale = nearBoost * (0.98 + r() * 0.12)

        mushrooms.push({
          id: `m-${mushrooms.length}`,
          wx: roundCoord(candidate.wx),
          wz: roundCoord(candidate.wz),
          geneticsSeed: `starter-mushroom-${gardenSeed}-${mushrooms.length}`,
          scale,
        })
        placed.push(candidate)
        placedOne = true
      }
    }
  }

  let attempts = 0
  while (mushrooms.length < targetTotal && attempts < 120) {
    attempts += 1
    const candidate: WorldCoord = {
      wx: 0.16 + r() * 0.68,
      wz: 0.14 + r() * 0.48,
    }
    if (!isWorldOffShoreGrass(candidate)) continue
    if (!fitsClearance(candidate, placed, MUSHROOM_RADIUS_W)) continue
    const depthT = Math.max(0, Math.min(1, (candidate.wz - 0.12) / 0.5))
    mushrooms.push({
      id: `m-${mushrooms.length}`,
      wx: roundCoord(candidate.wx),
      wz: roundCoord(candidate.wz),
      geneticsSeed: `starter-mushroom-${gardenSeed}-${mushrooms.length}`,
      scale: (0.95 + depthT * 0.85) * (0.96 + r() * 0.1),
    })
    placed.push(candidate)
  }

  const neutralCaps = ['cream', 'tan', 'ochre'] as const
  const redCapCount = Math.min(mushrooms.length, 1 + Math.floor(r() * 2))
  const redSlots = new Set<number>()
  while (redSlots.size < redCapCount) {
    redSlots.add(Math.floor(r() * mushrooms.length))
  }
  const cappedMushrooms = mushrooms.map((m, idx) => ({
    ...m,
    geneticsSeed: `${m.geneticsSeed}-${redSlots.has(idx) ? 'red-brown' : neutralCaps[idx % neutralCaps.length]}`,
  }))

  return {
    v: 1,
    gardenSeed,
    elderTree: {
      wx: ELDER_TREE.wx,
      wz: ELDER_TREE.wz,
      geneticsSeed: `starter-elder-${gardenSeed}`,
      scale: 2.05,
    },
    mushrooms: cappedMushrooms,
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
