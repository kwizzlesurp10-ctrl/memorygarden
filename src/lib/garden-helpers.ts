import type { Memory, EmotionalTone, PlantStage } from './types'

export function getPlantStage(memory: Memory): PlantStage {
  const daysSincePlanted = Math.floor(
    (Date.now() - new Date(memory.plantedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const visitCount = memory.visitCount
  
  if (daysSincePlanted < 1) return 'seed'
  if (daysSincePlanted < 3 && visitCount < 2) return 'sprout'
  if (daysSincePlanted < 7 || visitCount < 3) return 'bud'
  if (daysSincePlanted < 30 || visitCount < 5) return 'bloom'
  if (daysSincePlanted < 90) return 'mature'
  return 'evergreen'
}

export function getPlantColor(emotionalTone: EmotionalTone): string {
  const colors: Record<EmotionalTone, string> = {
    happy: 'oklch(0.78 0.14 85)',
    reflective: 'oklch(0.60 0.12 240)',
    bittersweet: 'oklch(0.70 0.15 340)',
    peaceful: 'oklch(0.55 0.08 155)',
    nostalgic: 'oklch(0.65 0.10 60)',
  }
  return colors[emotionalTone]
}

export function getPlantSize(stage: PlantStage): number {
  const sizes: Record<PlantStage, number> = {
    seed: 20,
    sprout: 35,
    bud: 50,
    bloom: 70,
    mature: 90,
    evergreen: 110,
  }
  return sizes[stage]
}

export async function classifyEmotionalTone(text: string): Promise<EmotionalTone> {
  try {
    const promptText = `Analyze the emotional tone of this memory text and classify it as one of: happy, reflective, bittersweet, peaceful, or nostalgic.

Memory text: ${text}

Return ONLY one word from the list above, nothing else.`
    
    const result = await window.spark.llm(promptText, 'gpt-4o-mini')
    const tone = result.trim().toLowerCase()
    
    if (['happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic'].includes(tone)) {
      return tone as EmotionalTone
    }
    
    return 'peaceful'
  } catch (error) {
    return 'peaceful'
  }
}

export async function generateAIReflection(memory: Memory, nearbyMemories: Memory[]): Promise<string> {
  try {
    const nearbyContext = nearbyMemories.length > 0
      ? `\n\nNearby memories in the garden:\n${nearbyMemories.map(m => `- ${m.text.substring(0, 100)}`).join('\n')}`
      : ''
    
    const promptText = `You are a gentle, poetic garden guide helping someone reflect on their memories. Generate a short, thoughtful reflection or question (2-3 sentences) about this memory. Be warm, insightful, and emotionally attuned.

Memory: ${memory.text}
Date: ${new Date(memory.date).toLocaleDateString()}
${memory.location ? `Location: ${memory.location}` : ''}
Emotional tone: ${memory.emotionalTone}${nearbyContext}

Write a gentle reflection that helps them see this memory in a new light or connect it to the broader tapestry of their life.`
    
    const result = await window.spark.llm(promptText, 'gpt-4o')
    return result.trim()
  } catch (error) {
    return "This memory holds a special place in your garden. What feelings arise when you revisit this moment?"
  }
}

export function getDayPeriod(): 'dawn' | 'day' | 'dusk' | 'night' {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export function getSeason(): Season {
  const month = new Date().getMonth()
  
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export function getBackgroundGradient(period: 'dawn' | 'day' | 'dusk' | 'night', season: Season): string {
  const gradients = {
    spring: {
      dawn: 'linear-gradient(to bottom, oklch(0.88 0.10 85) 0%, oklch(0.94 0.06 110) 50%, oklch(0.90 0.08 140) 100%)',
      day: 'linear-gradient(to bottom, oklch(0.92 0.08 200) 0%, oklch(0.96 0.04 170) 50%, oklch(0.94 0.05 150) 100%)',
      dusk: 'linear-gradient(to bottom, oklch(0.78 0.14 50) 0%, oklch(0.84 0.10 80) 50%, oklch(0.88 0.06 120) 100%)',
      night: 'linear-gradient(to bottom, oklch(0.35 0.10 250) 0%, oklch(0.45 0.08 230) 50%, oklch(0.52 0.06 210) 100%)',
    },
    summer: {
      dawn: 'linear-gradient(to bottom, oklch(0.90 0.12 70) 0%, oklch(0.95 0.08 95) 50%, oklch(0.92 0.10 120) 100%)',
      day: 'linear-gradient(to bottom, oklch(0.94 0.10 210) 0%, oklch(0.97 0.06 180) 50%, oklch(0.95 0.08 150) 100%)',
      dusk: 'linear-gradient(to bottom, oklch(0.82 0.16 40) 0%, oklch(0.88 0.12 65) 50%, oklch(0.92 0.08 90) 100%)',
      night: 'linear-gradient(to bottom, oklch(0.28 0.08 260) 0%, oklch(0.38 0.06 240) 50%, oklch(0.48 0.04 220) 100%)',
    },
    autumn: {
      dawn: 'linear-gradient(to bottom, oklch(0.82 0.14 45) 0%, oklch(0.88 0.10 65) 50%, oklch(0.85 0.08 85) 100%)',
      day: 'linear-gradient(to bottom, oklch(0.85 0.08 200) 0%, oklch(0.90 0.06 170) 50%, oklch(0.88 0.07 140) 100%)',
      dusk: 'linear-gradient(to bottom, oklch(0.72 0.18 35) 0%, oklch(0.78 0.14 55) 50%, oklch(0.82 0.10 75) 100%)',
      night: 'linear-gradient(to bottom, oklch(0.25 0.08 250) 0%, oklch(0.35 0.06 230) 50%, oklch(0.45 0.04 210) 100%)',
    },
    winter: {
      dawn: 'linear-gradient(to bottom, oklch(0.80 0.04 220) 0%, oklch(0.88 0.02 200) 50%, oklch(0.85 0.03 180) 100%)',
      day: 'linear-gradient(to bottom, oklch(0.88 0.04 210) 0%, oklch(0.92 0.03 190) 50%, oklch(0.90 0.02 170) 100%)',
      dusk: 'linear-gradient(to bottom, oklch(0.68 0.08 250) 0%, oklch(0.75 0.06 230) 50%, oklch(0.80 0.04 210) 100%)',
      night: 'linear-gradient(to bottom, oklch(0.22 0.06 260) 0%, oklch(0.30 0.04 250) 50%, oklch(0.40 0.03 240) 100%)',
    },
  }
  return gradients[season][period]
}

export function getSeasonalPlantModifier(season: Season, emotionalTone: EmotionalTone): string {
  const seasonalPalettes = {
    spring: {
      happy: 'oklch(0.82 0.16 95)',
      reflective: 'oklch(0.70 0.14 280)',
      bittersweet: 'oklch(0.75 0.18 350)',
      peaceful: 'oklch(0.65 0.12 160)',
      nostalgic: 'oklch(0.72 0.14 80)',
    },
    summer: {
      happy: 'oklch(0.85 0.18 90)',
      reflective: 'oklch(0.65 0.15 240)',
      bittersweet: 'oklch(0.78 0.20 340)',
      peaceful: 'oklch(0.60 0.12 155)',
      nostalgic: 'oklch(0.75 0.16 70)',
    },
    autumn: {
      happy: 'oklch(0.75 0.16 60)',
      reflective: 'oklch(0.58 0.12 30)',
      bittersweet: 'oklch(0.68 0.18 25)',
      peaceful: 'oklch(0.52 0.10 145)',
      nostalgic: 'oklch(0.70 0.14 45)',
    },
    winter: {
      happy: 'oklch(0.82 0.08 220)',
      reflective: 'oklch(0.72 0.10 260)',
      bittersweet: 'oklch(0.75 0.12 300)',
      peaceful: 'oklch(0.68 0.06 180)',
      nostalgic: 'oklch(0.70 0.08 240)',
    },
  }
  return seasonalPalettes[season][emotionalTone]
}

export function getSeasonalGroundCover(season: Season): string {
  const groundColors = {
    spring: 'oklch(0.70 0.12 130)',
    summer: 'oklch(0.65 0.14 140)',
    autumn: 'oklch(0.58 0.12 60)',
    winter: 'oklch(0.85 0.02 220)',
  }
  return groundColors[season]
}
