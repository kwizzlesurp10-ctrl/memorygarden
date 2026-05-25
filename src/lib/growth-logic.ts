import type { PlantStage } from './types'

export function calculatePlantStage(visitCount: number, reflections: number): PlantStage {
  const score = visitCount + (reflections * 2);
  if (score < 3) return 'seed';
  if (score < 8) return 'sprout';
  if (score < 15) return 'bud';
  if (score < 25) return 'bloom';
  if (score < 40) return 'mature';
  return 'elder';
}
