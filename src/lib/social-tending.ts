import type { Memory, PlantStage } from './types'

/**
 * Social Tending System
 * When someone visits or waters your plant, it grows faster.
 */

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
  const reflection = {
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
