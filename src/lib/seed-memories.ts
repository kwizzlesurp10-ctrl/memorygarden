import type { Memory } from './types'

export function createSeededMemories(): Memory[] {
  const now = Date.now()

  return [
    {
      id: 'seed-1',
      photoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      text: "The morning my grandmother taught me how to make her secret soup. She said the secret wasn't in the recipe — it was in the way you stir while thinking about the people you're feeding.",
      date: '2023-03-12',
      location: 'Kyoto, Japan',
      plantedAt: new Date(now - 1000 * 60 * 60 * 24 * 90).toISOString(),
      position: { x: 620, y: 480 },
      emotionalTone: 'nostalgic',
      plantVariety: 'tree',
      plantStage: 'mature',
      visitCount: 12,
      reflections: [
        { id: 'r1', text: "This is the kind of memory that becomes a family heirloom.", createdAt: new Date(now - 100000000).toISOString() },
        { id: 'r2', text: "I can almost smell the ginger and miso from here.", createdAt: new Date(now - 80000000).toISOString() }
      ],
      audioRecordings: [],
      reactions: {
        heart: { type: 'heart', count: 8, reactedBy: ['self', 'u2', 'u3'] },
        bloom: { type: 'bloom', count: 5, reactedBy: ['self', 'u2'] },
        sparkle: { type: 'sparkle', count: 3, reactedBy: ['u3'] }
      },
      geneticsSeed: 'seed1',
      traits: {},
      unlocks: []
    },
    {
      id: 'seed-2',
      photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      text: "The last night on the beach before I moved across the country. We didn't talk much. We just watched the waves and knew everything was about to change.",
      date: '2022-08-27',
      location: 'Big Sur, California',
      plantedAt: new Date(now - 1000 * 60 * 60 * 24 * 120).toISOString(),
      position: { x: 980, y: 610 },
      emotionalTone: 'bittersweet',
      plantVariety: 'vine',
      plantStage: 'bloom',
      visitCount: 7,
      reflections: [
        { id: 'r3', text: "Sometimes the most important conversations happen in silence.", createdAt: new Date(now - 60000000).toISOString() }
      ],
      audioRecordings: [],
      reactions: {
        heart: { type: 'heart', count: 14, reactedBy: ['self', 'u2', 'u3', 'u4'] },
        water: { type: 'water', count: 6, reactedBy: ['self', 'u2'] }
      },
      geneticsSeed: 'seed2',
      traits: {},
      unlocks: []
    },
    {
      id: 'seed-3',
      photoUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      text: "The forest after the first snow. Everything was so quiet I could hear my own heartbeat. I stayed until my fingers went numb.",
      date: '2023-12-04',
      location: 'Banff, Canada',
      plantedAt: new Date(now - 1000 * 60 * 60 * 24 * 60).toISOString(),
      position: { x: 410, y: 820 },
      emotionalTone: 'peaceful',
      plantVariety: 'tree',
      plantStage: 'mature',
      visitCount: 9,
      reflections: [],
      audioRecordings: [],
      reactions: {
        sprout: { type: 'sprout', count: 4, reactedBy: ['self', 'u2'] },
        heart: { type: 'heart', count: 7, reactedBy: ['self', 'u3'] }
      },
      geneticsSeed: 'seed3',
      traits: {},
      unlocks: []
    },
    {
      id: 'seed-4',
      photoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
      text: "The night we finally told each other the truth. It was terrifying and beautiful at the same time. We both cried, then laughed until 3am.",
      date: '2021-11-18',
      location: 'Brooklyn, New York',
      plantedAt: new Date(now - 1000 * 60 * 60 * 24 * 150).toISOString(),
      position: { x: 1150, y: 390 },
      emotionalTone: 'reflective',
      plantVariety: 'wildflower',
      plantStage: 'bloom',
      visitCount: 15,
      reflections: [
        { id: 'r4', text: "This is what real connection feels like.", createdAt: new Date(now - 40000000).toISOString() }
      ],
      audioRecordings: [],
      reactions: {
        heart: { type: 'heart', count: 22, reactedBy: ['self', 'u2', 'u3', 'u4', 'u5'] },
        bloom: { type: 'bloom', count: 11, reactedBy: ['self', 'u2', 'u3'] },
        sparkle: { type: 'sparkle', count: 8, reactedBy: ['self', 'u4'] }
      },
      geneticsSeed: 'seed4',
      traits: {},
      unlocks: []
    }
  ] as Memory[]
}
