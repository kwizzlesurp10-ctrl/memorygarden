import { createElement as h } from 'react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it } from 'vitest'
import { GardenSceneSvg } from '@/components/garden/GardenSceneSvg'
import { todPalette } from '@/lib/garden/day-night'
import { buildSeededPlant } from '@/components/plants/seeded-builders'
import { gardenRng } from '@/lib/garden/prng'
import { plantStageToIndex } from '@/lib/garden/stage'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'
import { GARDEN_LANDSCAPE_VIEWS } from '@/lib/garden/landscape-view'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'

describe('garden visual artifacts', () => {
  it('writes landscape views and stage row SVGs when ARTIFACT_CAPTURE=1', () => {
    if (process.env.ARTIFACT_CAPTURE !== '1') return

    mkdirSync(outDir, { recursive: true })
    const palette = todPalette(14, 'summer')

    for (const view of GARDEN_LANDSCAPE_VIEWS) {
      const body = renderToStaticMarkup(
        h(GardenSceneSvg, {
          palette,
          sceneKey: view[0],
          gardenSeed: 7,
          rimStrength: 0.6,
          motion: false,
          landscapeView: view,
          shedStyle: 'storybook',
          planted: [],
          candles: [],
        }),
      )
      writeFileSync(resolve(outDir, `garden-view-${view}.svg`), body, 'utf8')
    }

    const stageRow = PLANT_STAGES_ORDER.map((stage, index) => {
      const nodes = buildSeededPlant('flower', {
        stageIndex: plantStageToIndex(stage),
        palette,
        rimStrength: 0.6,
        motion: false,
        rng: gardenRng(99 + index),
      })
      const inner = renderToStaticMarkup(h('g', { transform: 'translate(50 60)' }, nodes))
      return `<g transform="translate(${index * 120} 0)">${inner}<text x="18" y="105" font-size="11" fill="#2d2418">${stage}</text></g>`
    }).join('')

    const stagesSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PLANT_STAGES_ORDER.length * 120}" height="130" viewBox="0 0 ${PLANT_STAGES_ORDER.length * 120} 130">${stageRow}</svg>`
    writeFileSync(resolve(outDir, 'plant-stages-flower-row.svg'), stagesSvg, 'utf8')
  })
})
