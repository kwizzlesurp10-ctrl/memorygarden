import type { Memory } from './types'

export const seedMemories: Omit<Memory, 'id' | 'plantedAt' | 'position'>[] = [
  {
    photoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    text: "The morning my grandmother taught me how to make her secret soup. She said the secret wasn't in the recipe — it was in the way you stir while thinking about the people you're feeding.",
    date: '2023-03-12',
    location: 'Kyoto, Japan',
    emotionalTone: 'nostalgic',
    plantVariety: 'tree',
    plantStage: 'mature',
    visitCount: 12,
    reflections: [
      {
        id: 'refl-1',
        text: "This is the kind of memory that becomes a family heirloom.",
        createdAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'refl-2',
        text: "I can almost smell the ginger and miso from here.",
        createdAt: '2024-02-03T14:22:00Z',
      }
    ],
    audioRecordings: [],
    reactions: {
      heart: { type: 'heart', count: 8, reactedBy: ['self', 'user2', 'user3'] },
      bloom: { type: 'bloom', count: 5, reactedBy: ['self', 'user2'] },
      sparkle: { type: 'sparkle', count: 3, reactedBy: ['user3'] }
    }
  },
  {
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    text: "The last night on the beach before I moved across the country. We didn't talk much. We just watched the waves and knew everything was about to change.",
    date: '2022-08-27',
    location: 'Big Sur, California',
    emotionalTone: 'bittersweet',
    plantVariety: 'vine',
    plantStage: 'bloom',
    visitCount: 7,
    reflections: [
      {
        id: 'refl-3',
        text: "Sometimes the most important conversations happen in silence.",
        createdAt: '2024-01-20T09:15:00Z',
      }
    ],
    audioRecordings: [],
    reactions: {
      heart: { type: 'heart', count: 14, reactedBy: ['self', 'user2', 'user3', 'user4'] },
      water: { type: 'water', count: 6, reactedBy: ['self', 'user2'] }
    }
  },
  {
    photoUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    text: "The forest after the first snow. Everything was so quiet I could hear my own heartbeat. I stayed until my fingers went numb.",
    date: '2023-12-04',
    location: 'Banff, Canada',
    emotionalTone: 'peaceful',
    plantVariety: 'tree',
    plantStage: 'mature',
    visitCount: 9,
    reflections: [],
    audioRecordings: [],
    reactions: {
      sprout: { type: 'sprout', count: 4, reactedBy: ['self', 'user2'] },
      heart: { type: 'heart', count: 7, reactedBy: ['self', 'user3'] }
    }
  },
  {
    photoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    text: "The night we finally told each other the truth. It was terrifying and beautiful at the same time. We both cried, then laughed until 3am.",
    date: '2021-11-18',
    location: 'Brooklyn, New York',
    emotionalTone: 'reflective',
    plantVariety: 'wildflower',
    plantStage: 'bloom',
    visitCount: 15,
    reflections: [
      {
        id: 'refl-4',
        text: "This is what real connection feels like.",
        createdAt: '2024-02-10T22:40:00Z',
      }
    ],
    audioRecordings: [],
    reactions: {
      heart: { type: 'heart', count: 22, reactedBy: ['self', 'user2', 'user3', 'user4', 'user5'] },
      bloom: { type: 'bloom', count: 11, reactedBy: ['self', 'user2', 'user3'] },
      sparkle: { type: 'sparkle', count: 8, reactedBy: ['self', 'user4'] }
    }
  }
]

export function createSeededMemories(): Memory[] {
  return seedMemories.map((m, index) => ({
    ...m,
    id: `seed-memory-${index + 1}`,
    plantedAt: new Date(Date.now() - (index * 86400000 * 30)).toISOString(),
    position: {
      x: 500 + (index % 3) * 280,
      y: 420 + Math.floor(index / 3) * 260,
    },
    reflections: m.reflections || [],
    audioRecordings: m.audioRecordings || [],
    reactions: m.reactions || {},
    geneticsSeed: `seed-${index}`,
    traits: {},
    unlocks: [],
    genetics: undefined,
  })) as Memory[]
}