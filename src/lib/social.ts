import type { Memory } from './types'

export type ReactionType = 
  | 'sprout' 
  | 'water' 
  | 'bloom' 
  | 'heart' 
  | 'sparkle'

export interface Reaction {
  type: ReactionType
  count: number
  reactedBy: string[] // user ids or names
}

export interface SocialMemory extends Memory {
  reactions?: Partial<Record<ReactionType, Reaction>>
  tendedBy?: string[]
  lastTendedAt?: string
}

export const REACTION_EMOJI: Record<ReactionType, string> = {
  sprout: '🌱',
  water: '💧',
  bloom: '🌸',
  heart: '❤️',
  sparkle: '✨',
}

export const REACTION_LABEL: Record<ReactionType, string> = {
  sprout: 'Sprout',
  water: 'Water',
  bloom: 'Bloom',
  heart: 'Heart',
  sparkle: 'Sparkle',
}

export function toggleReaction(
  memory: Memory,
  reactionType: ReactionType,
  userId: string
): Memory {
  const reactions = { ...(memory.reactions || {}) }
  const current = reactions[reactionType] || { type: reactionType, count: 0, reactedBy: [] }

  const hasReacted = current.reactedBy.includes(userId)

  if (hasReacted) {
    current.count = Math.max(0, current.count - 1)
    current.reactedBy = current.reactedBy.filter(id => id !== userId)
  } else {
    current.count += 1
    current.reactedBy = [...current.reactedBy, userId]
  }

  if (current.count === 0) {
    delete reactions[reactionType]
  } else {
    reactions[reactionType] = current
  }

  return {
    ...memory,
    reactions,
  }
}
