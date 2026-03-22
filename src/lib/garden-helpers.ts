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

export function getSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth()
  
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export function getBackgroundGradient(period: 'dawn' | 'day' | 'dusk' | 'night'): string {
  const gradients = {
    dawn: 'linear-gradient(to bottom, oklch(0.85 0.08 60) 0%, oklch(0.92 0.04 85) 50%, oklch(0.88 0.05 95) 100%)',
    day: 'linear-gradient(to bottom, oklch(0.90 0.05 220) 0%, oklch(0.95 0.02 180) 50%, oklch(0.92 0.03 140) 100%)',
    dusk: 'linear-gradient(to bottom, oklch(0.75 0.12 30) 0%, oklch(0.82 0.08 50) 50%, oklch(0.88 0.04 80) 100%)',
    night: 'linear-gradient(to bottom, oklch(0.30 0.08 260) 0%, oklch(0.40 0.06 240) 50%, oklch(0.50 0.04 220) 100%)',
  }
  return gradients[period]
}
