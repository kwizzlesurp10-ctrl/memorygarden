import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { buildSeededPlant } from '@/components/plants/seeded-builders'
import type { SeededVariety } from '@/components/plants/types'
import { gardenRng } from '@/lib/garden/prng'
import { indexToPlantStage, plantStageToIndex } from '@/lib/garden/stage'
import { todPalette } from '@/lib/garden/day-night'

const palette = todPalette(14, 'summer')

function stageMarkup(variety: SeededVariety, stageIndex: number): string {
  const rng = gardenRng(42)
  const nodes = buildSeededPlant(variety, {
    stageIndex,
    palette,
    rimStrength: 0.6,
    motion: false,
    rng,
  })
  return renderToStaticMarkup(createElement('g', null, nodes))
}

describe('seeded plant stages', () => {
  it('renders distinct markup per growth stage for flower', () => {
    const marks = Array.from({ length: 8 }, (_, i) => stageMarkup('flower', i))
    const unique = new Set(marks)
    expect(unique.size).toBe(8)
  })

  it('maps all eight named stages through the stage index helpers', () => {
    for (let i = 0; i < 8; i++) {
      expect(plantStageToIndex(indexToPlantStage(i))).toBe(i)
    }
  })
})
