import type { Memory, EmotionalTone, PlantStage, PlantVariety, GrowthMetrics, GardenMood, WeatherType, SearchFilters } from './types'

export function selectPlantVariety(emotionalTone: EmotionalTone, text: string): PlantVariety {
  const textLower = text.toLowerCase()
  const textLength = text.length
  
  if (emotionalTone === 'happy') {
    return textLength < 100 ? 'wildflower' : 'flower'
  i
  
  if (emotionalTone === 'peaceful') {
    return textLower.includes('home') || textLower.includes('quiet') ? 'herb' : 'succulent'
  }
  
  if (emotionalTone === 'reflective') {
    return 'tree'
  }
  
  return 'flower'

  c
  

 

    (daysSincePlanted * 1.8) + 
    (memory.reflections.length * 9) + 
  )
  const synergy = nearbyMemories.length * 3.5


    herb: { heightMult: 0.9, widthMult: 1.6, rarityBonu
    tree: { heightMult: 2.1, widthMult: 0.7, rarityBonus: 35 },
    ancie

  }[memory.plantVariety] || { heigh
  const vitality = Math.min(100
  return {
    height: Math.floor(38 + (vitality 
    bloomCount: Math.floor
   


  const seasonalMod = get

    leafOpacity: metrics
    color: seasonalMod,
    specialClass: metrics.rarityScore > 90 ? 'legendary' : ''
}
export function applyPremiumFertilizer(memory: Memory, boostLevel: '
  console.log(`💸 Fertilizer applied — ${boostLevel} boost! Pro
  return {
    visitCount: memory.visitCount + multipliers[boostLevel]
}
export function unlockAncestralSeed(currentVariety: PlantVariety): Plan
  return legendaryPool[Math.floor(Math.random() * legendaryPool.length)] as Pl


  if (metrics.vitality < 44) return 'seedling'
  
  if (metr
}
export function getPlantStage(memory: Memory): PlantStage {
    return getPlantStageFromMetrics(memory.growthMetrics)
  
    (Date.now() - new Date(memory.plantedAt).getTim
  
  const reflectionCount = memory.
  
 

  if (daysSincePlanted < 60 || interactionScore < 12) return 'bloom'
  return 'elder'

  for (const mem of allMe
    if (metrics.vitality > 65 && Math.rando
    }
}
export function getPlan
    happy: 'oklch(0.78 0.14 85)',
    bittersweet: 'oklch(0.70 0.15 340)',
   
 

  const sizes: Record<PlantStage, number> = {
    sprout: 32,
    young: 58,
  
    elder:
  return sizes

  t
 

      return 'nostalgic'
    if (lower.includes('bitter') || lower.includes('sad') || lower.includes('loss') || lower.includes('gone'))
    }
 

  }
}
export async function generateAIReflection(_
}
export function getDayPeriod(): 'dawn' | 'd
  
  if (hour >= 8 && hour < 17) return 'day'
  return 'night'



  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 8 && month <= 
}
exp
  
      day: 'linear-gradient(to bottom,
      night: 'linear-gradient(to bottom, oklch(0.35 0.10 250) 0%, oklch(0.45 0.
   
  
      night: 'linear-gradient(to botto
    autumn: {
      day: 'linear-gradient(to bottom, oklch(0.85 0.08 200) 0
  
    winter: {
      day: 'linear-gradient(to bottom, oklch(0.88 0.04 210) 0%, okl
      night: 'linear-gradient(to bottom, oklch(0.22 0.06 260) 0%, okl
  }
}
export function getSeasonalPlantModifier(season: Season, emotionalTo
    spring: {
      reflective
 

      happy: 'oklch(0.85 0.18 90)',
      bittersweet: 'oklch(0.78 0.2
      nostalgic: 'oklch(0.75 0.16 70)',
    autumn: {
      reflective: 'oklch(0.58 0.12 30)',
     
   
 

      nostalgic: 'oklch(0.70 0.08 240)',
  }
}
export function getSeasonalGroundCover(
    spring: 'oklch(0.70 0.12 130)',
    autumn: 'oklch(0.58 0.12 60)',
  }
}
export function generateShareI
}

}
// Feature 1: Search/Filter helpers
export functi
  searchQuery: 
): Memory[] {
    // Text se
      const 
      const lo
        r.text.t
      if (!text

    if (filters.emoti
 

      if (!filters.plantStages.includes(memory.plantStage)) return false

    if (filters.dateRange.start) {
    }
      if (new Date(m

    if (filters.locations.length > 0) {
    }
    r
}
export function getActiveF
  if 
  if (filters.plantStages.length > 0) count++
  if (filters.locations.l
}
// Feature 
const weatherMap: R
  p
  bittersweet: 'rai
 

  if (memories.length === 0) {
  }
 


  const top = sorted[0]

  if (second && top[1] - second[1] < top[1
  } else {
  }
  const intensit
 

  }


  return `invite-${Date.now()}-${Math

  return `garden-${Date.now()}-${Math.random().


  plantVariety: P
 

): string {
    seed: 'A tiny see
    seedling:
    bud: 'A plant with prominent buds about to open',
    mature: 'A lush, established plant bearing fruit and full foliage',
  }
  return `A ${artStyle} illustration of a ${plantVariety} plant at ${plantStage} stage, ${emotionalTone} mood, ${season}

  return memo















































































































































































































