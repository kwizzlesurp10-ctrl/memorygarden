import type { Memory, EmotionalTone } from './types'

export interface EmotionalClusterMeta {
  id: string
  theme: EmotionalTone
  name: string
  description: string
}

export interface EmotionalClusterGroup extends EmotionalClusterMeta {
  memoryIds: string[]
}

const CLUSTER_COPY: Record<
  EmotionalTone,
  { name: string; description: string }
> = {
  happy: {
    name: 'Joyful Moments',
    description: 'Memories filled with happiness and light',
  },
  nostalgic: {
    name: 'Looking Back',
    description: 'Reflections on times past',
  },
  peaceful: {
    name: 'Quiet Calm',
    description: 'Moments of serenity and peace',
  },
  reflective: {
    name: 'Deep Thoughts',
    description: 'Memories that inspired contemplation',
  },
  bittersweet: {
    name: 'Mixed Feelings',
    description: 'Beautiful moments tinged with complexity',
  },
}

/**
 * Groups memories by emotional tone for cluster views and canvas path overlays.
 * Mirrors the heuristic used in the Clusters UI (small gardens collapse to one group).
 */
export function computeEmotionalClusterGroups(memories: Memory[]): EmotionalClusterGroup[] {
  if (memories.length === 0) {
    return []
  }

  if (memories.length < 3) {
    return [
      {
        id: 'all',
        theme: 'peaceful',
        name: 'All Memories',
        description:
          'Your collection is just beginning. Plant more memories to discover meaningful patterns and connections.',
        memoryIds: memories.map((m) => m.id),
      },
    ]
  }

  const byTone = new Map<EmotionalTone, Memory[]>()
  for (const memory of memories) {
    const tone = memory.emotionalTone
    const list = byTone.get(tone)
    if (list) list.push(memory)
    else byTone.set(tone, [memory])
  }

  return Array.from(byTone.entries())
    .filter(([, mems]) => mems.length > 0)
    .map(([tone, mems]) => {
      const copy = CLUSTER_COPY[tone]
      return {
        id: `cluster-${tone}`,
        theme: tone,
        name: copy?.name ?? 'Memories',
        description: copy?.description ?? 'Connected moments',
        memoryIds: mems.map((m) => m.id),
      }
    })
}
