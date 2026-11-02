import type {
  GardenBond,
  GardenGift,
  GardenGiftType,
  GentleWhisper,
  GroveFeatureId,
  GroveProjectMilestone,
  Memory,
  Reflection,
  Season,
} from './types'
import { hashString } from './garden/prng'
import { computeCurrentMoisture, getHealthStatus } from './tending-logic'

export const GIFTS_STORAGE_KEY = 'memorygarden:gifts'
export const GROVE_WATERINGS_STORAGE_KEY = 'memorygarden:grove_waterings'

export const GIFT_METADATA: Record<
  GardenGiftType,
  { label: string; icon: string; description: string }
> = {
  blossom_note: {
    label: 'Blossom Note',
    icon: '🌸',
    description: 'Folded origami flower resting beside the stem with a heartfelt note.',
  },
  paper_lantern: {
    label: 'Paper Lantern',
    icon: '🏮',
    description: 'Warm glowing hexagonal lantern illuminating the surrounding grass.',
  },
  dew_vial: {
    label: 'Dewdrop Vial',
    icon: '🧪',
    description: 'Crystalline glass vial of Pure Dew that restores +20% vitality when opened.',
  },
  wind_chime: {
    label: 'Wind Chime',
    icon: '🎐',
    description: 'Delicate metallic chimes that ring softly in the garden breeze.',
  },
}

export const GROVE_MILESTONE_TIERS: ReadonlyArray<{
  tier: number
  threshold: number
  feature: GroveFeatureId
  title: string
  description: string
}> = [
  {
    tier: 1,
    threshold: 25,
    feature: 'birdbath',
    title: 'Carved Stone Birdbath',
    description: 'Songbirds gather around the Sanctuary Circle perimeter.',
  },
  {
    tier: 2,
    threshold: 75,
    feature: 'fireflies',
    title: 'Sanctuary Firefly Swarm',
    description: '40 bioluminescent emerald fireflies dance over the meadow at dusk.',
  },
  {
    tier: 3,
    threshold: 150,
    feature: 'sakura_tree',
    title: 'Ancient Grandfather Sakura Tree',
    description: 'A towering weeping cherry blossom tree crowns the north rim.',
  },
  {
    tier: 4,
    threshold: 300,
    feature: 'starlight_fountain',
    title: 'Illuminated Starlight Fountain',
    description: 'Cascading luminescent water jets awaken in the central basin.',
  },
  {
    tier: 5,
    threshold: 500,
    feature: 'aurora',
    title: 'Aurora Borealis Night Sky',
    description: 'Shimmering ribbons of emerald and violet light arch across the night sky.',
  },
]

export function loadGardenGifts(): GardenGift[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(GIFTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GardenGift[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveGardenGifts(gifts: GardenGift[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(gifts.slice(-200)))
  } catch {
    // Ignore storage quota errors
  }
}

export function getGiftsForMemory(memoryId: string, storedGifts?: GardenGift[]): GardenGift[] {
  const all = storedGifts ?? loadGardenGifts()
  return all.filter((g) => g.memoryId === memoryId)
}

/**
 * Places a 3D gift or note at the base of a memory plant.
 */
export function placeGardenGift(
  memory: Memory,
  sender: { id: string; login: string; avatarUrl?: string },
  giftType: GardenGiftType,
  message?: string,
  now: Date = new Date(),
): { gift: GardenGift; updatedMemory: Memory } {
  const existingGifts = memory.gifts ?? getGiftsForMemory(memory.id)
  const index = existingGifts.length
  const seedHash = hashString(`${memory.id}:${sender.id}:${giftType}:${index}`)
  const angle = ((seedHash % 360) / 360) * Math.PI * 2 + index * 1.15
  const distance = 0.28 + ((seedHash >>> 8) % 100) / 1000 // 0.28m to 0.38m from stem

  const gift: GardenGift = {
    id: `gift-${memory.id}-${now.getTime()}-${index}`,
    memoryId: memory.id,
    senderId: sender.id,
    senderLogin: sender.login,
    senderAvatarUrl: sender.avatarUrl,
    giftType,
    message: message?.trim() || `${sender.login} left a ${GIFT_METADATA[giftType].label}.`,
    createdAt: now.toISOString(),
    positionOffset: {
      angle,
      distance,
    },
  }

  const allStored = loadGardenGifts()
  allStored.push(gift)
  saveGardenGifts(allStored)

  const updatedMemory: Memory = {
    ...memory,
    gifts: [...existingGifts, gift],
  }

  return { gift, updatedMemory }
}

/**
 * Opens an unopened 3D gift at a plant's base.
 * - If `dew_vial`, grants +20 vitality boost (capped at 100).
 * - Converts the gift note into a permanent reflection keepsake on the memory.
 */
export function openGardenGift(
  memory: Memory,
  giftId: string,
  now: Date = new Date(),
): {
  gift: GardenGift | null
  vitalityAdded: number
  updatedMemory: Memory
} {
  const stored = loadGardenGifts()
  const memoryGifts = memory.gifts ?? stored.filter((g) => g.memoryId === memory.id)
  const target = memoryGifts.find((g) => g.id === giftId)

  if (!target) {
    return { gift: null, vitalityAdded: 0, updatedMemory: memory }
  }

  if (target.openedAt) {
    return { gift: target, vitalityAdded: 0, updatedMemory: memory }
  }

  const openedGift: GardenGift = {
    ...target,
    openedAt: now.toISOString(),
  }

  const updatedGifts = memoryGifts.map((g) => (g.id === giftId ? openedGift : g))
  const updatedStored = stored.map((g) => (g.id === giftId ? openedGift : g))
  saveGardenGifts(updatedStored)

  const isDewVial = openedGift.giftType === 'dew_vial'
  const vitalityAdded = isDewVial ? 20 : 0
  const prevVitality = memory.growthMetrics?.vitality ?? 80
  const nextVitality = Math.min(100, prevVitality + vitalityAdded)

  const keepsakeReflection: Reflection = {
    id: `ref-gift-${openedGift.id}`,
    text: `${GIFT_METADATA[openedGift.giftType].icon} ${openedGift.message ?? `Gift from ${openedGift.senderLogin}`}`,
    createdAt: now.toISOString(),
    contributorId: openedGift.senderId,
    contributorLogin: openedGift.senderLogin,
    contributorAvatarUrl: openedGift.senderAvatarUrl,
    isTend: true,
  }

  const updatedMemory: Memory = {
    ...memory,
    gifts: updatedGifts,
    reflections: [...(memory.reflections ?? []), keepsakeReflection],
    growthMetrics: {
      vitality: nextVitality,
      height: memory.growthMetrics?.height ?? 1,
      width: memory.growthMetrics?.width ?? 1,
      bloomCount: memory.growthMetrics?.bloomCount ?? 1,
      foliageDensity: memory.growthMetrics?.foliageDensity ?? 1,
      rarityScore: memory.growthMetrics?.rarityScore ?? 1,
      lastInteractionAt: isDewVial ? now.getTime() : (memory.growthMetrics?.lastInteractionAt ?? now.getTime()),
    },
  }

  return {
    gift: openedGift,
    vitalityAdded,
    updatedMemory,
  }
}

/**
 * Evaluates "The Grove Project" community milestones from total collective waterings.
 */
export function computeGroveMilestone(
  totalCommunityWaterings: number,
  gardenId: string = 'local-sanctuary',
): GroveProjectMilestone {
  const count = Math.max(0, Math.floor(totalCommunityWaterings))
  const unlockedFeatures: GroveFeatureId[] = []
  let currentTier = 0
  let nextMilestoneAt = GROVE_MILESTONE_TIERS[0].threshold

  for (const milestone of GROVE_MILESTONE_TIERS) {
    if (count >= milestone.threshold) {
      currentTier = milestone.tier
      unlockedFeatures.push(milestone.feature)
    } else {
      nextMilestoneAt = milestone.threshold
      break
    }
  }

  if (currentTier === GROVE_MILESTONE_TIERS.length) {
    nextMilestoneAt = GROVE_MILESTONE_TIERS[GROVE_MILESTONE_TIERS.length - 1].threshold
  }

  return {
    gardenId,
    totalCommunityWaterings: count,
    currentTier,
    unlockedFeatures,
    nextMilestoneAt,
  }
}

export function loadCommunityWateringCount(memories?: Memory[]): number {
  const baseFromMemories = (memories ?? []).reduce((sum, m) => sum + Math.max(0, m.visitCount || 0), 0)
  if (typeof window === 'undefined') return baseFromMemories
  try {
    const raw = window.localStorage.getItem(GROVE_WATERINGS_STORAGE_KEY)
    const stored = raw ? parseInt(raw, 10) : 0
    return Math.max(baseFromMemories, Number.isFinite(stored) ? stored : 0)
  } catch {
    return baseFromMemories
  }
}

export function saveCommunityWateringCount(count: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(GROVE_WATERINGS_STORAGE_KEY, String(Math.max(0, Math.floor(count))))
  } catch {
    // Ignore storage errors
  }
}

export function incrementCommunityWaterings(amount: number = 1, memories?: Memory[]): GroveProjectMilestone {
  const current = loadCommunityWateringCount(memories)
  const next = current + Math.max(1, amount)
  saveCommunityWateringCount(next)
  return computeGroveMilestone(next)
}

/**
 * Rule-of-Three Gentle Re-Engagement Whispers.
 * Generates at most 3 compassionate notifications per week across:
 * 1. "On This Day" Botanical Whispers
 * 2. Social Care & Gift Notifications
 * 3. Gentle Thirst Reminders (never punitive)
 * 4. Seasonal Solstice & Equinox Invitations
 */
export function generateGentleWhispers(
  memories: Memory[],
  bonds: GardenBond[] = [],
  season: Season = 'spring',
  now: Date = new Date(),
): GentleWhisper[] {
  const whispers: GentleWhisper[] = []
  const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentYear = now.getFullYear()

  // 1. "On This Day" Botanical Whispers
  const anniversaryMemory = memories.find((m) => {
    if (!m.date) return false
    const parts = m.date.split('-')
    if (parts.length < 3) return false
    const mYear = parseInt(parts[0], 10)
    const mMonthDay = `${parts[1]}-${parts[2].slice(0, 2)}`
    return mMonthDay === monthDay && mYear < currentYear
  })

  if (anniversaryMemory) {
    const snippet = anniversaryMemory.text.trim().slice(0, 48)
    whispers.push({
      id: `whisper-otd-${anniversaryMemory.id}`,
      category: 'on_this_day',
      title: 'On This Day in Your Garden',
      message: `A memory planted on this day is glowing softly in the 3D garden: "${snippet}…"`,
      memoryId: anniversaryMemory.id,
      createdAt: now.toISOString(),
    })
  }

  // 2. Social Care Notifications (Unopened gifts or active bonds)
  const memoryWithGift = memories.find((m) => (m.gifts ?? []).some((g) => !g.openedAt))
  if (memoryWithGift) {
    const unopened = memoryWithGift.gifts!.find((g) => !g.openedAt)!
    whispers.push({
      id: `whisper-social-gift-${unopened.id}`,
      category: 'social_care',
      title: 'A Quiet Gift Awaits',
      message: `${unopened.senderLogin} left a ${GIFT_METADATA[unopened.giftType].label} beside your ${memoryWithGift.plantVariety}.`,
      memoryId: memoryWithGift.id,
      createdAt: now.toISOString(),
    })
  } else if (bonds.length > 0) {
    const topBond = bonds[0]
    whispers.push({
      id: `whisper-social-bond-${topBond.partnerId}`,
      category: 'social_care',
      title: 'Twin Fireflies of Friendship',
      message: `${topBond.partnerLogin} tended your garden — twin fireflies are dancing near the entrance arch.`,
      createdAt: now.toISOString(),
    })
  }

  // 3. Gentle Thirst Reminders (Compassionate & poetic)
  if (whispers.length < 3) {
    const thirstyMemory = memories.find((m) => {
      const initM = m.growthMetrics?.vitality ?? 80
      const lastW = m.growthMetrics?.lastInteractionAt
      const curM = computeCurrentMoisture(initM, lastW, m.plantVariety, season, now.getTime())
      const status = getHealthStatus(curM)
      return status === 'thirsty' || status === 'wilting'
    })

    if (thirstyMemory) {
      whispers.push({
        id: `whisper-thirst-${thirstyMemory.id}`,
        category: 'gentle_thirst',
        title: 'A Gentle Thirst in the Grove',
        message: `Your ${thirstyMemory.plantVariety} from ${thirstyMemory.date} is feeling a gentle thirst under the ${season} sky. Take a 30-second stroll by the pond when you need a quiet moment.`,
        memoryId: thirstyMemory.id,
        createdAt: now.toISOString(),
      })
    }
  }

  // 4. Seasonal Solstice & Equinox Invitation (if under the Rule-of-Three cap)
  if (whispers.length < 3) {
    const seasonalMessages: Record<Season, string> = {
      spring: 'Spring blossoms have arrived in the garden — morning dew shimmers by the pond.',
      summer: 'Warm summer sunbeams filter through the canopy; fireflies gather by the water at dusk.',
      autumn: 'Golden autumn leaves are drifting across the flagstones in the 3D walkthrough.',
      winter: 'A peaceful winter hush rests over the grove, with crystalline frost along the pond bank.',
    }
    whispers.push({
      id: `whisper-season-${season}`,
      category: 'seasonal_solstice',
      title: `The ${season.charAt(0).toUpperCase() + season.slice(1)} Garden Awaits`,
      message: seasonalMessages[season],
      createdAt: now.toISOString(),
    })
  }

  // Strict Rule-of-Three enforcement: never exceed 3 whispers
  return whispers.slice(0, 3)
}
