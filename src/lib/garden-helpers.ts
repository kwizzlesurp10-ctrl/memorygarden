import type { Memory, EmotionalTone, PlantStage, PlantVariety, GrowthMetrics } from './types'

export function selectPlantVariety(emotionalTone: EmotionalTone, text: string): PlantVariety {
  const textLower = text.toLowerCase()
  const textLength = text.length
  
  if (emotionalTone === 'happy') {
    return textLength < 100 ? 'wildflower' : 'flower'
  }
  
  if (emotionalTone === 'peaceful') {
    return textLower.includes('home') || textLower.includes('quiet') ? 'herb' : 'succulent'
  }
  
  if (emotionalTone === 'reflective') {
    return 'tree'
  }
  
  if (emotionalTone === 'bittersweet') {
    return 'vine'
  }
  
  return 'flower'
}

export function calculateGrowthMetrics(memory: Memory, nearbyMemories: Memory[] = []): GrowthMetrics {
  const daysSincePlanted = Math.floor((Date.now() - new Date(memory.plantedAt).getTime()) / 86400000)
  const consistencyBonus = memory.visitCount > 0 
    ? Math.min(1.8, 1 + (memory.visitCount / (daysSincePlanted + 1)) * 0.4) 
    : 1

  const toneConsistency = memory.reflections.length > 3
    ? memory.reflections.slice(-3).filter(r => r.tone === memory.emotionalTone).length / 3
    : 0.6

  let baseVitality = Math.min(100, 
    (daysSincePlanted * 1.8) + 
    (memory.visitCount * 4.2) + 
    (memory.reflections.length * 9) + 
    (toneConsistency * 22)
  )

  const synergy = nearbyMemories.length * 3.5
  baseVitality += synergy

  const varietyCurve = {
    wildflower: { heightMult: 1.1, widthMult: 1.4, rarityBonus: 8 },
    flower: { heightMult: 1.3, widthMult: 1.1, rarityBonus: 12 },
    herb: { heightMult: 0.9, widthMult: 1.6, rarityBonus: 15 },
    succulent: { heightMult: 0.8, widthMult: 1.2, rarityBonus: 25 },
    tree: { heightMult: 2.1, widthMult: 0.7, rarityBonus: 35 },
    vine: { heightMult: 1.0, widthMult: 2.3, rarityBonus: 22 },
    ancient_oak: { heightMult: 2.8, widthMult: 1.2, rarityBonus: 85 },
    eternal_rose: { heightMult: 1.6, widthMult: 1.5, rarityBonus: 75 },
    phoenix_vine: { heightMult: 1.4, widthMult: 2.8, rarityBonus: 90 },
    starlight_succulent: { heightMult: 1.0, widthMult: 1.8, rarityBonus: 80 },
  }[memory.plantVariety] || { heightMult: 1, widthMult: 1, rarityBonus: 10 }

  const vitality = Math.min(100, Math.max(5, baseVitality * consistencyBonus))
  
  return {
    vitality,
    height: Math.floor(38 + (vitality * 1.1 * varietyCurve.heightMult)),
    width: Math.floor(32 + (vitality * 0.9 * varietyCurve.widthMult)),
    bloomCount: Math.floor(vitality / 18),
    foliageDensity: Math.min(0.98, vitality / 110),
    rarityScore: Math.min(100, Math.floor(vitality * 0.4 + varietyCurve.rarityBonus + (memory.shareCount || 0) * 7)),
    lastInteractionAt: Date.now()
  }
}

export function getVisualParams(memory: Memory, metrics: GrowthMetrics) {
  const seasonalMod = getSeasonalPlantModifier(getSeason(), memory.emotionalTone)
  return {
    size: metrics.height,
    scaleX: metrics.width / metrics.height,
    leafOpacity: metrics.foliageDensity,
    bloomOpacity: metrics.bloomCount > 0 ? 0.95 : 0.4,
    color: seasonalMod,
    glow: metrics.rarityScore > 75 ? `0 0 28px ${seasonalMod}` : 'none',
    specialClass: metrics.rarityScore > 90 ? 'legendary' : ''
  }
}

export function applyPremiumFertilizer(memory: Memory, boostLevel: 'standard' | 'premium' | 'legendary' = 'standard'): Memory {
  const multipliers = { standard: 18, premium: 34, legendary: 55 }
  console.log(`💸 Fertilizer applied — ${boostLevel} boost! Projected +${multipliers[boostLevel]} interactions`)
  
  return {
    ...memory,
    visitCount: memory.visitCount + multipliers[boostLevel]
  }
}

export function unlockAncestralSeed(currentVariety: PlantVariety): PlantVariety {
  const legendaryPool: PlantVariety[] = ['ancient_oak', 'eternal_rose', 'phoenix_vine', 'starlight_succulent']
  return legendaryPool[Math.floor(Math.random() * legendaryPool.length)] as PlantVariety
}

export function getPlantStageFromMetrics(metrics: GrowthMetrics): PlantStage {
  if (metrics.vitality < 12) return 'seed'
  if (metrics.vitality < 28) return 'sprout'
  if (metrics.vitality < 44) return 'seedling'
  if (metrics.vitality < 62) return 'young'
  if (metrics.vitality < 78) return 'bud'
  if (metrics.vitality < 89) return 'bloom'
  if (metrics.vitality < 97) return 'mature'
  return 'elder'
}

export function getPlantStage(memory: Memory): PlantStage {
  if (memory.growthMetrics) {
    return getPlantStageFromMetrics(memory.growthMetrics)
  }
  
  const daysSincePlanted = Math.floor(
    (Date.now() - new Date(memory.plantedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const visitCount = memory.visitCount
  const reflectionCount = memory.reflections.length
  const interactionScore = visitCount + (reflectionCount * 2)
  
  if (daysSincePlanted < 1 && interactionScore === 0) return 'seed'
  if (daysSincePlanted < 2 || interactionScore < 2) return 'sprout'
  if (daysSincePlanted < 5 || interactionScore < 4) return 'seedling'
  if (daysSincePlanted < 14 || interactionScore < 6) return 'young'
  if (daysSincePlanted < 30 || interactionScore < 8) return 'bud'
  if (daysSincePlanted < 60 || interactionScore < 12) return 'bloom'
  if (daysSincePlanted < 120) return 'mature'
  return 'elder'
}

export async function runDailyGrowthBatch(allMemories: Memory[]): Promise<void> {
  for (const mem of allMemories) {
    const metrics = calculateGrowthMetrics(mem)
    if (metrics.vitality > 65 && Math.random() > 0.7) {
      console.log(`🌟 Premium upsell opportunity for memory ${mem.id}`)
    }
  }
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
    sprout: 32,
    seedling: 45,
    young: 58,
    bud: 70,
    bloom: 85,
    mature: 100,
    elder: 120,
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

export function generateShareId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getShareUrl(shareId: string): string {
  return `${window.location.origin}?share=${shareId}`
}
