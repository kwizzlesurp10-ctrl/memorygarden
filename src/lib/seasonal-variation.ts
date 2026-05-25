import type { Season } from './types'

export function getSeasonalPlantModifier(season: Season, _stage: string) {
  const modifiers: Record<Season, { scale: number; saturation: number }> = {
    spring: { scale: 1.05, saturation: 1.1 },
    summer: { scale: 1.0, saturation: 1.2 },
    autumn: { scale: 0.95, saturation: 0.9 },
    winter: { scale: 0.9, saturation: 0.75 },
  };
  return modifiers[season]
}
