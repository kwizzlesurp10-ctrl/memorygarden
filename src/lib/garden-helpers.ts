import type { Memory, EmotionalTone, PlantStage, PlantVariety, GrowthMetrics, GardenMood, WeatherType, SearchFilters, Season, ArtStyle } from './types'

declare global {
  interface Window {
    spark: {
      llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string
      llm: (prompt: string, model?: string) => Promise<string>
    }
  }
}

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
  
  if (emotionalTone === 'nostalgic') {
    return 'vine'
  }
  
  return 'flower'
}

export function calculateGrowthMetrics(memory: Memory, nearbyMemories: Memory[]): GrowthMetrics {
  const daysSincePlanted = Math.floor(
    (Date.now() - new Date(memory.plantedAt).getTime()) / 86400000
  )
  
  const baseGrowth = Math.min(100,
    (memory.visitCount * 6) +
    (daysSincePlanted * 1.8) + 
    (memory.reflections.length * 9)
  )
  const synergy = nearbyMemories.length * 3.5

  const varietyModifiers = {
    flower: { heightMult: 1.0, widthMult: 1.0, rarityBonus: 0 },
    wildflower: { heightMult: 0.8, widthMult: 1.2, rarityBonus: 5 },
    herb: { heightMult: 0.9, widthMult: 1.6, rarityBonus: 10 },
    succulent: { heightMult: 0.7, widthMult: 1.3, rarityBonus: 8 },
    vine: { heightMult: 1.4, widthMult: 0.8, rarityBonus: 12 },
    tree: { heightMult: 2.1, widthMult: 0.7, rarityBonus: 35 },
    ancient_oak: { heightMult: 2.5, widthMult: 1.0, rarityBonus: 85 },
    eternal_rose: { heightMult: 1.2, widthMult: 1.1, rarityBonus: 75 },
    phoenix_vine: { heightMult: 1.8, widthMult: 0.9, rarityBonus: 80 },
    starlight_succulent: { heightMult: 0.9, widthMult: 1.4, rarityBonus: 70 },
  }[memory.plantVariety] || { heightMult: 1.0, widthMult: 1.0, rarityBonus: 0 }
  
  const vitality = Math.min(100, baseGrowth + synergy)
  
  return {
    vitality,
    height: Math.floor(38 + (vitality * varietyModifiers.heightMult * 1.2)),
    width: Math.floor(32 + (vitality * varietyModifiers.widthMult * 0.8)),
    bloomCount: Math.floor(vitality / 18 + memory.reflections.length * 1.5),
    foliageDensity: Math.min(100, vitality + nearbyMemories.length * 5),
    rarityScore: Math.min(100, vitality * 0.6 + varietyModifiers.rarityBonus + (memory.shareCount || 0) * 8),
    lastInteractionAt: memory.lastVisited ? new Date(memory.lastVisited).getTime() : new Date(memory.plantedAt).getTime(),
  }
}

function getPlantStageFromMetrics(metrics: GrowthMetrics): PlantStage {
  if (metrics.vitality < 10) return 'seed'
  if (metrics.vitality < 22) return 'sprout'
  if (metrics.vitality < 36) return 'seedling'
  if (metrics.vitality < 50) return 'young'
  if (metrics.vitality < 64) return 'bud'
  if (metrics.vitality < 78) return 'bloom'
  if (metrics.vitality < 90) return 'mature'
  return 'elder'
}

export function getPlantStage(memory: Memory): PlantStage {
  if (memory.growthMetrics) {
    return getPlantStageFromMetrics(memory.growthMetrics)
  }
  
  const daysSincePlanted = Math.floor(
    (Date.now() - new Date(memory.plantedAt).getTime()) / 86400000
  )
  
  const reflectionCount = memory.reflections.length
  const visitCount = memory.visitCount
  
  const interactionScore = (visitCount * 2) + (reflectionCount * 3)
  
  if (daysSincePlanted < 1 && interactionScore < 2) return 'seed'
  if (daysSincePlanted < 3 || interactionScore < 4) return 'sprout'
  if (daysSincePlanted < 7 || interactionScore < 8) return 'seedling'
  if (daysSincePlanted < 14 || interactionScore < 12) return 'young'
  if (daysSincePlanted < 21 || interactionScore < 16) return 'bud'
  if (daysSincePlanted < 30 || interactionScore < 20) return 'bloom'
  if (daysSincePlanted < 60 || interactionScore < 30) return 'mature'
  return 'elder'
}

export function applyPremiumFertilizer(memory: Memory, boostLevel: 'standard' | 'premium' | 'legendary'): Memory {
  const multipliers = {
    standard: 5,
    premium: 12,
    legendary: 25,
  }
  
  return {
    ...memory,
    visitCount: memory.visitCount + multipliers[boostLevel]
  }
}

export function unlockAncestralSeed(currentVariety: PlantVariety): PlantVariety {
  const legendaryPool: PlantVariety[] = ['ancient_oak', 'eternal_rose', 'phoenix_vine', 'starlight_succulent']
  return legendaryPool[Math.floor(Math.random() * legendaryPool.length)]
}

export function getPlantColor(emotionalTone: EmotionalTone): string {
  const colors: Record<EmotionalTone, string> = {
    happy: 'oklch(0.78 0.14 85)',
    peaceful: 'oklch(0.65 0.10 155)',
    reflective: 'oklch(0.58 0.12 240)',
    bittersweet: 'oklch(0.70 0.15 340)',
    nostalgic: 'oklch(0.72 0.14 60)',
  }
  return colors[emotionalTone] || colors.happy
}

export function getPlantSize(plantStage: PlantStage): number {
  const sizes: Record<PlantStage, number> = {
    seed: 18,
    sprout: 32,
    seedling: 46,
    young: 58,
    bud: 70,
    bloom: 84,
    mature: 98,
    elder: 115,
  }
  return sizes[plantStage] || 46
}

export interface VisualParams {
  size: number
  color: string
  leafOpacity: number
  specialClass: string
  glow: number
  scaleX: number
  bloomOpacity: number
}

export function getVisualParams(memory: Memory, metrics: GrowthMetrics): VisualParams {
  const size = getPlantSize(memory.plantStage)
  const seasonalColor = getSeasonalPlantModifier(getSeason(), memory.emotionalTone)
  
  return {
    size,
    color: seasonalColor,
    leafOpacity: Math.min(100, metrics.foliageDensity) / 100,
    specialClass: metrics.rarityScore > 90 ? 'legendary' : '',
    glow: metrics.rarityScore > 90 ? 1 : 0,
    scaleX: 1,
    bloomOpacity: metrics.rarityScore > 50 ? 1 : 0.7,
  }
}

export async function classifyEmotionalTone(text: string): Promise<EmotionalTone> {
  const lower = text.toLowerCase()
  
  if (lower.includes('joy') || lower.includes('happy') || lower.includes('excited') || lower.includes('amazing') || lower.includes('love')) {
    return 'happy'
  }
  
  if (lower.includes('peace') || lower.includes('calm') || lower.includes('serene') || lower.includes('quiet') || lower.includes('still')) {
    return 'peaceful'
  }
  
  if (lower.includes('remember') || lower.includes('miss') || lower.includes('old') || lower.includes('childhood') || lower.includes('back then')) {
    return 'nostalgic'
  }
  
  if (lower.includes('bitter') || lower.includes('sad') || lower.includes('loss') || lower.includes('gone') || lower.includes('ended')) {
    return 'bittersweet'
  }
  
  if (lower.includes('think') || lower.includes('wonder') || lower.includes('ponder') || lower.includes('reflect') || lower.includes('realize')) {
    return 'reflective'
  }
  
  return 'peaceful'
}

export async function generateAIReflection(memory: Memory, nearbyMemories: Memory[]): Promise<string> {
  const prompt = window.spark.llmPrompt`You are a gentle garden companion reflecting on a personal memory.

Memory text: "${memory.text}"
Memory date: ${memory.date}
Emotional tone: ${memory.emotionalTone}
Times revisited: ${memory.visitCount}
${nearbyMemories.length > 0 ? `Nearby memories: ${nearbyMemories.map(m => m.text.slice(0, 50)).join(', ')}` : ''}

Write a brief, poetic reflection (2-3 sentences) that:
- Acknowledges the memory's emotional essence
- Offers a gentle perspective or observation
- Connects to themes of growth, time, or connection if relevant

Keep it warm, personal, and meaningful.`

  return await window.spark.llm(prompt, 'gpt-4o-mini')
}

export function getDayPeriod(): 'dawn' | 'day' | 'dusk' | 'night' {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

export function getSeason(): Season {
  const month = new Date().getMonth()
  
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export function getSeasonalSky(season: Season, period: 'dawn' | 'day' | 'dusk' | 'night'): string {
  const skies: Record<Season, Record<string, string>> = {
    spring: {
      dawn: 'linear-gradient(to bottom, oklch(0.82 0.10 200) 0%, oklch(0.88 0.08 180) 100%)',
      day: 'linear-gradient(to bottom, oklch(0.85 0.12 220) 0%, oklch(0.92 0.08 200) 100%)',
      dusk: 'linear-gradient(to bottom, oklch(0.70 0.16 50) 0%, oklch(0.82 0.12 180) 100%)',
      night: 'linear-gradient(to bottom, oklch(0.35 0.10 250) 0%, oklch(0.45 0.08 240) 100%)',
    },
    summer: {
      dawn: 'linear-gradient(to bottom, oklch(0.88 0.12 80) 0%, oklch(0.92 0.08 200) 100%)',
      day: 'linear-gradient(to bottom, oklch(0.90 0.14 240) 0%, oklch(0.94 0.10 220) 100%)',
      dusk: 'linear-gradient(to bottom, oklch(0.75 0.18 40) 0%, oklch(0.85 0.12 200) 100%)',
      night: 'linear-gradient(to bottom, oklch(0.28 0.08 260) 0%, oklch(0.40 0.10 250) 100%)',
    },
    autumn: {
      dawn: 'linear-gradient(to bottom, oklch(0.80 0.14 60) 0%, oklch(0.86 0.10 180) 100%)',
      day: 'linear-gradient(to bottom, oklch(0.85 0.08 200) 0%, oklch(0.90 0.06 190) 100%)',
      dusk: 'linear-gradient(to bottom, oklch(0.68 0.18 35) 0%, oklch(0.78 0.12 180) 100%)',
      night: 'linear-gradient(to bottom, oklch(0.30 0.06 270) 0%, oklch(0.42 0.08 250) 100%)',
    },
    winter: {
      dawn: 'linear-gradient(to bottom, oklch(0.78 0.06 220) 0%, oklch(0.84 0.04 200) 100%)',
      day: 'linear-gradient(to bottom, oklch(0.88 0.04 210) 0%, oklch(0.92 0.02 200) 100%)',
      dusk: 'linear-gradient(to bottom, oklch(0.62 0.10 260) 0%, oklch(0.76 0.06 220) 100%)',
      night: 'linear-gradient(to bottom, oklch(0.22 0.06 260) 0%, oklch(0.35 0.08 250) 100%)',
    },
  }
  
  return skies[season][period] || skies.spring.day
}

export function getSeasonalPlantModifier(season: Season, emotionalTone: EmotionalTone): string {
  const modifiers: Record<Season, Record<EmotionalTone, string>> = {
    spring: {
      happy: 'oklch(0.82 0.16 95)',
      peaceful: 'oklch(0.70 0.12 160)',
      reflective: 'oklch(0.62 0.10 240)',
      bittersweet: 'oklch(0.72 0.14 350)',
      nostalgic: 'oklch(0.75 0.12 65)',
    },
    summer: {
      happy: 'oklch(0.85 0.18 90)',
      peaceful: 'oklch(0.68 0.14 155)',
      reflective: 'oklch(0.60 0.12 235)',
      bittersweet: 'oklch(0.78 0.20 340)',
      nostalgic: 'oklch(0.75 0.16 70)',
    },
    autumn: {
      happy: 'oklch(0.80 0.18 70)',
      peaceful: 'oklch(0.62 0.10 145)',
      reflective: 'oklch(0.58 0.12 30)',
      bittersweet: 'oklch(0.68 0.16 350)',
      nostalgic: 'oklch(0.72 0.14 55)',
    },
    winter: {
      happy: 'oklch(0.75 0.12 100)',
      peaceful: 'oklch(0.72 0.08 180)',
      reflective: 'oklch(0.65 0.10 250)',
      bittersweet: 'oklch(0.70 0.12 340)',
      nostalgic: 'oklch(0.70 0.08 240)',
    },
  }
  
  return modifiers[season][emotionalTone] || getPlantColor(emotionalTone)
}

export function getSeasonalGroundCover(season: Season): string {
  const covers: Record<Season, string> = {
    spring: 'oklch(0.70 0.12 130)',
    summer: 'oklch(0.65 0.14 135)',
    autumn: 'oklch(0.58 0.12 60)',
    winter: 'oklch(0.75 0.04 200)',
  }
  return covers[season] || covers.spring
}

export function generateShareId(): string {
  return `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

export function getShareUrl(shareId: string): string {
  return `${window.location.origin}?share=${shareId}`
}

export function generateGardenId(): string {
  return `garden-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

export function generateInviteToken(): string {
  return `invite-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`
}

export function generatePlantImagePrompt(
  plantVariety: PlantVariety,
  plantStage: PlantStage,
  emotionalTone: EmotionalTone,
  season: Season,
  artStyle: ArtStyle
): string {
  const stageDescriptions: Record<PlantStage, string> = {
    seed: 'A tiny seed just planted in soil',
    sprout: 'A small sprout emerging from the ground',
    seedling: 'A young seedling with first leaves',
    young: 'A developing plant with visible growth',
    bud: 'A plant with prominent buds about to open',
    bloom: 'A flowering plant in full bloom',
    mature: 'A lush, established plant bearing fruit and full foliage',
    elder: 'An ancient, majestic plant with deep character',
  }
  
  return `A ${artStyle} illustration of a ${plantVariety} plant at ${plantStage} stage, ${emotionalTone} mood, ${season} season. ${stageDescriptions[plantStage]}. Beautiful, emotional, detailed.`
}

export function filterMemories(
  memories: Memory[],
  searchQuery: string,
  filters: SearchFilters
): Memory[] {
  return memories.filter((memory) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const textMatch = memory.text.toLowerCase().includes(query)
      const locationMatch = memory.location?.toLowerCase().includes(query)
      const reflectionMatch = memory.reflections.some(
        r => r.text.toLowerCase().includes(query)
      )
      if (!textMatch && !locationMatch && !reflectionMatch) return false
    }

    if (filters.emotionalTones.length > 0) {
      if (!filters.emotionalTones.includes(memory.emotionalTone)) return false
    }

    if (filters.plantStages.length > 0) {
      if (!filters.plantStages.includes(memory.plantStage)) return false
    }

    if (filters.dateRange.start) {
      if (new Date(memory.date) < new Date(filters.dateRange.start)) return false
    }
    
    if (filters.dateRange.end) {
      if (new Date(memory.date) > new Date(filters.dateRange.end)) return false
    }

    if (filters.locations.length > 0) {
      if (!memory.location || !filters.locations.includes(memory.location)) return false
    }

    return true
  })
}

export function getActiveFilterCount(searchQuery: string, filters: SearchFilters): number {
  let count = 0
  if (searchQuery.trim()) count++
  if (filters.emotionalTones.length > 0) count++
  if (filters.plantStages.length > 0) count++
  if (filters.locations.length > 0) count++
  if (filters.dateRange.start || filters.dateRange.end) count++
  return count
}

export function computeGardenMood(memories: Memory[]): GardenMood {
  const weatherMap: Record<EmotionalTone | 'mixed', WeatherType> = {
    happy: 'sunny',
    peaceful: 'mist',
    reflective: 'partly-cloudy',
    bittersweet: 'rain',
    nostalgic: 'golden-haze',
    mixed: 'rain-sun',
  }

  if (memories.length === 0) {
    return {
      dominantEmotion: 'peaceful',
      intensity: 0,
      weatherType: 'mist',
    }
  }

  const toneCounts: Record<string, number> = {}
  for (const memory of memories) {
    toneCounts[memory.emotionalTone] = (toneCounts[memory.emotionalTone] || 0) + 1
  }

  const sorted = Object.entries(toneCounts).sort((a, b) => b[1] - a[1])
  const top = sorted[0]
  const second = sorted[1]

  let dominantEmotion: EmotionalTone | 'mixed'
  if (second && top[1] - second[1] < top[1] * 0.3) {
    dominantEmotion = 'mixed'
  } else {
    dominantEmotion = top[0] as EmotionalTone
  }

  const intensity = Math.min(100, (memories.length * 8))

  return {
    dominantEmotion,
    intensity,
    weatherType: weatherMap[dominantEmotion],
  }
}
