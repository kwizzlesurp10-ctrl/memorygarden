import type { EmotionalTone } from './types'

export function getPlantColorByEmotion(emotionalTone: EmotionalTone): string {
  const palette: Record<EmotionalTone, string> = {
    happy: 'oklch(0.68 0.25 95)',
    peaceful: 'oklch(0.62 0.2 155)',
    reflective: 'oklch(0.58 0.18 265)',
    bittersweet: 'oklch(0.6 0.22 35)',
    nostalgic: 'oklch(0.65 0.15 320)',
  };
  return palette[emotionalTone]
}
