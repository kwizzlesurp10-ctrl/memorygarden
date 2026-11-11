import type { PlantVariety } from '@/lib/types'

const PLANT_VARIETY_LABEL: Record<PlantVariety, string> = {
  flower: 'Flower',
  tree: 'Tree',
  succulent: 'Succulent',
  vine: 'Vine',
  herb: 'Herb',
  wildflower: 'Wildflower',
  fern: 'Fern',
  mushroom: 'Mushroom',
  lotus: 'Lotus',
  ancient_oak: 'Ancient Oak',
  eternal_rose: 'Eternal Rose',
  phoenix_vine: 'Phoenix Vine',
  starlight_succulent: 'Starlight Succulent',
}

export function plantVarietyDisplayLabel(variety: PlantVariety | undefined): string {
  if (!variety) return 'Plant'
  return PLANT_VARIETY_LABEL[variety] ?? variety.replace(/_/g, ' ')
}
