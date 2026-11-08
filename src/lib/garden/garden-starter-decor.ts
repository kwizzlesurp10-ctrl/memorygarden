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

  const wzTiers = [0.54, 0.46, 0.39, 0.32, 0.25]
  /** Far caps sit higher on side views (larger wx); near caps lower on the lawn. */
  const wxTiers = [0.32, 0.42, 0.54, 0.74, 0.88]
  const groups: MushroomGroup[] = [
    { wx: ELDER_TREE.wx + 0.04, wz: wzTiers[0], size: 2 },
    { wx: ELDER_TREE.wx - 0.02, wz: wzTiers[1], size: 2 },
    { wx: wxTiers[2], wz: wzTiers[2], size: 2 },
    { wx: wxTiers[3], wz: wzTiers[3], size: 1 },
    { wx: wxTiers[4], wz: wzTiers[4], size: 2 },
  ]
  const groupCount = 3 + Math.floor(r() * 3)
  const activeGroups = groups.slice(0, groupCount).map((g, i) => ({
    wx: i === 0 ? ELDER_TREE.wx + 0.04 : i === 1 ? ELDER_TREE.wx - 0.02 : wxTiers[Math.min(i, wxTiers.length - 1)] ?? g.wx,
    wz: wzTiers[Math.min(i, wzTiers.length - 1)] ?? g.wz,
    size: g.size,
  }))

  const mushrooms: WorldDecorMushroom[] = []
  const placed: WorldCoord[] = [ELDER_TREE]

  for (const group of activeGroups) {
    if (mushrooms.length >= targetTotal) break
    const inGroup = Math.min(group.size, targetTotal - mushrooms.length)
    for (let g = 0; g < inGroup; g++) {
      let placedOne = false
      for (let attempt = 0; attempt < 32 && !placedOne; attempt++) {
        const spread = 0.022 + r() * 0.03
        const angle = r() * Math.PI * 2
        const candidate: WorldCoord = {
          wx: group.wx + Math.cos(angle) * spread,
          wz: group.wz + Math.sin(angle) * spread * 0.35,
        }
        if (!isWorldOffShoreGrass(candidate)) continue
        if (!fitsClearance(candidate, placed, MUSHROOM_RADIUS_W)) continue

        const scale = 1

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
    const tierIdx = Math.floor(r() * wzTiers.length)
    const tierPick = wzTiers[tierIdx] ?? 0.36
    const wxPick = wxTiers[tierIdx] ?? 0.54
    const candidate: WorldCoord = {
      wx: wxPick + (r() - 0.5) * 0.05,
      wz: tierPick + (r() - 0.5) * 0.03,
    }
    if (!isWorldOffShoreGrass(candidate)) continue
    if (!fitsClearance(candidate, placed, MUSHROOM_RADIUS_W)) continue
    mushrooms.push({
      id: `m-${mushrooms.length}`,
      wx: roundCoord(candidate.wx),
      wz: roundCoord(candidate.wz),
      geneticsSeed: `starter-mushroom-${gardenSeed}-${mushrooms.length}`,
      scale: 1,
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
