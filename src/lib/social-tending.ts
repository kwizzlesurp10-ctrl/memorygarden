import type { GardenBond, Memory, PlantStage, Reflection } from './types'
import type { LocalUser } from './local-user'

/**
 * Social Tending System & Reciprocal Garden Bonds
 * When someone visits or waters your plant, it grows faster and creates bonds.
 */

export const STORAGE_KEY_BONDS = 'memorygarden:bonds'
export const BOND_WINDOW_MS = 48 * 60 * 60 * 1000 // 48-hour rolling window for Garden Bonds

export interface SocialTendResult {
  newStage: PlantStage
  growthBoost: number
  message: string
}

const STAGE_ORDER: PlantStage[] = [
  'seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'
]

export function tendPlant(memory: Memory, visitorName: string): SocialTendResult {
  const currentIndex = STAGE_ORDER.indexOf(memory.plantStage)
  const visitBoost = Math.min(3, Math.floor(memory.visitCount / 5) + 1)

  // Social watering gives a nice boost
  const newVisitCount = memory.visitCount + 1
  const growthProgress = Math.min(1, (newVisitCount + visitBoost) / 25)

  let newStageIndex = Math.floor(growthProgress * (STAGE_ORDER.length - 1))
  if (newStageIndex > currentIndex) {
    newStageIndex = Math.min(currentIndex + 1, STAGE_ORDER.length - 1)
  }

  const newStage = STAGE_ORDER[newStageIndex]

  const messages = [
    `${visitorName} gently watered your ${memory.plantVariety}.`,
    `${visitorName} sat with your memory and helped it grow.`,
    `${visitorName} left quiet care for your plant.`,
    `A kind stranger (${visitorName}) tended to your memory.`,
  ]

  return {
    newStage,
    growthBoost: visitBoost,
    message: messages[Math.floor(Math.random() * messages.length)]
  }
}

export function addSocialReflection(
  memory: Memory,
  text: string,
  author: string
) {
  const reflection: Reflection = {
    id: `refl-${Date.now()}`,
    text: `${author} reflected: ${text}`,
    createdAt: new Date().toISOString(),
    tone: memory.emotionalTone,
  }

  return {
    ...memory,
    reflections: [...(memory.reflections || []), reflection],
    visitCount: (memory.visitCount || 0) + 1,
  }
}

// ── Reciprocal Garden Bonds & Visitor Watering ─────────────────────────────

export function loadGardenBonds(): GardenBond[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BONDS)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GardenBond[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveGardenBonds(bonds: GardenBond[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BONDS, JSON.stringify(bonds))
  } catch {
    // localStorage may be disabled or quota reached
  }
}

/**
 * Checks whether the user has any active Garden Bond established within the last 48 hours.
 */
export function hasActiveGardenBond(nowMs: number = Date.now()): { active: boolean; partnerName?: string; bond?: GardenBond } {
  const bonds = loadGardenBonds()
  for (const bond of bonds) {
    const lastWaterMs = new Date(bond.lastReciprocalWaterAt).getTime()
    if (!Number.isNaN(lastWaterMs) && nowMs - lastWaterMs <= BOND_WINDOW_MS) {
      return { active: true, partnerName: bond.partnerLogin, bond }
    }
  }
  return { active: false }
}

export function addOrUpdateBond(bond: GardenBond): void {
  const existing = loadGardenBonds()
  const idx = existing.findIndex((b) => b.partnerId === bond.partnerId)
  if (idx >= 0) {
    existing[idx] = bond
  } else {
    existing.push(bond)
  }
  saveGardenBonds(existing)
}

/**
 * Records a visitor watering action in 3D walkthrough mode.
 * Replenishes hydration, logs a social tend reflection, establishes/advances a Garden Bond,
 * and crafts the reciprocal notification whisper with deep link context.
 */
export function recordReciprocalWatering(
  memory: Memory,
  visitorUser: LocalUser,
  nowMs: number = Date.now(),
): { memory: Memory; bond: GardenBond; notificationMessage: string } {
  const planter = memory.plantedBy || {
    id: 'planter-default',
    login: 'Garden Host',
    avatarUrl: '',
  }

  const tendReflection: Reflection = {
    id: `tend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: `${visitorUser.login} walked through the garden and watered this memory with loving care.`,
    createdAt: new Date(nowMs).toISOString(),
    tone: memory.emotionalTone,
    contributorId: visitorUser.id,
    contributorLogin: visitorUser.login,
    contributorAvatarUrl: visitorUser.avatarUrl,
    isTend: true,
  }

  const oldMetrics = memory.growthMetrics || {
    vitality: 80,
    height: 1.2,
    width: 0.8,
    bloomCount: 3,
    foliageDensity: 0.8,
    rarityScore: 1.0,
    lastInteractionAt: nowMs,
  }

  // Hydration boost: awakened if dormant (80%), or +40% capped at 100%
  const currentVitality = oldMetrics.vitality ?? 80
  const newVitality = currentVitality <= 0 ? 80.0 : Math.min(100.0, currentVitality + 40.0)

  const updatedMemory: Memory = {
    ...memory,
    growthMetrics: {
      ...oldMetrics,
      vitality: newVitality,
      lastInteractionAt: nowMs,
    },
    visitCount: (memory.visitCount || 0) + 1,
    reflections: [...(memory.reflections || []), tendReflection],
  }

  // Garden Bond progression
  const existingBonds = loadGardenBonds()
  const prevBond = existingBonds.find((b) => b.partnerId === planter.id)

  let bondLevel = 1
  let totalReciprocalTends = 1
  if (prevBond) {
    const elapsed = nowMs - new Date(prevBond.lastReciprocalWaterAt).getTime()
    totalReciprocalTends = prevBond.totalReciprocalTends + 1
    bondLevel = elapsed <= BOND_WINDOW_MS ? Math.min(5, prevBond.bondLevel + 1) : 1
  }

  const updatedBond: GardenBond = {
    partnerId: planter.id,
    partnerLogin: planter.login,
    partnerAvatarUrl: planter.avatarUrl,
    lastReciprocalWaterAt: new Date(nowMs).toISOString(),
    bondLevel,
    totalReciprocalTends,
  }
  addOrUpdateBond(updatedBond)

  const memoryLabel = memory.text?.trim()
    ? `${memory.text.slice(0, 32)}${memory.text.length > 32 ? '...' : ''}`
    : memory.linkUrl
      ? 'your linked memory'
      : 'your memory'
  const notificationMessage = `🌱 ${visitorUser.login} watered '${memoryLabel}'! Their care nourished a fresh bloom.`

  return {
    memory: updatedMemory,
    bond: updatedBond,
    notificationMessage,
  }
}

/**
 * Asynchronously syncs watering with the Neon PostgreSQL community backend if online.
 */
export async function syncRemoteWatering(
  memoryId: string,
  visitorUser: LocalUser,
): Promise<{ success: boolean; visitCount?: number; newStage?: string }> {
  try {
    const res = await fetch('/api/gardens/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memoryId,
        userId: visitorUser.id,
        userName: visitorUser.login,
      }),
    })
    if (!res.ok) return { success: false }
    const data = await res.json() as { visitCount?: number; newStage?: string }
    return { success: true, visitCount: data.visitCount, newStage: data.newStage }
  } catch {
    // Graceful offline fallback
    return { success: false }
  }
}
