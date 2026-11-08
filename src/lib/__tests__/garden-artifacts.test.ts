import { createElement as h } from 'react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it } from 'vitest'
import { GardenSceneSvg } from '@/components/garden/GardenSceneSvg'
import { todPalette } from '@/lib/garden/day-night'
import { buildSeededPlant } from '@/components/plants/seeded-builders'
import { gardenRng } from '@/lib/garden/prng'
import { indexToPlantStage } from '@/lib/garden/stage'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'
import { GARDEN_LANDSCAPE_VIEWS, projectMemoryToScene } from '@/lib/garden/landscape-view'
import type { SeededVariety } from '@/components/plants/types'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'

const STAGE_CELL_W = 118
const STAGE_CELL_H = 168
const STAGE_ART_Y = 88

function stageCell(stageIndex: number, variety: SeededVariety, palette: ReturnType<typeof todPalette>) {
  const stage = PLANT_STAGES_ORDER[stageIndex]
  const nodes = buildSeededPlant(variety, {
    stageIndex,
    palette,
    rimStrength: 0.65,
    motion: false,
    rng: gardenRng(99 + stageIndex * 17 + variety.length * 3),
  })
  const inner = renderToStaticMarkup(h('g', { transform: `translate(${STAGE_CELL_W * 0.5} ${STAGE_ART_Y}) scale(1.35)` }, nodes))
  return `<g transform="translate(${stageIndex * STAGE_CELL_W} 0)">${inner}<text x="8" y="${STAGE_CELL_H - 10}" font-size="10" fill="#2d2418" font-family="system-ui,sans-serif">${stage}</text></g>`
}

describe('garden visual artifacts', () => {
  it('writes landscape views and stage row SVGs when ARTIFACT_CAPTURE=1', () => {
    if (process.env.ARTIFACT_CAPTURE !== '1') return

    mkdirSync(outDir, { recursive: true })
    const palette = todPalette(14, 'summer')

    const samplePositions = [
      { id: 'm1', x: 220, y: 440 },
      { id: 'm2', x: 520, y: 448 },
      { id: 'm3', x: 780, y: 455 },
      { id: 'm4', x: 980, y: 442 },
    ]

    for (const view of GARDEN_LANDSCAPE_VIEWS) {
      const memoryPlants = samplePositions.map((mem, i) => {
        const pos = projectMemoryToScene(mem, view)
        const varieties: SeededVariety[] = ['flower', 'tree', 'herb', 'wildflower']
        const variety = varieties[i]
        return h(
          'g',
          { key: mem.id, transform: `translate(${pos.x} ${pos.y})` },
          h(SeededPlantSvg, {
            variety,
            stage: indexToPlantStage(4 + (i % 3)),
            geneticsSeed: mem.id,
            palette,
            rimStrength: 0.6,
            motion: false,
            scale: 0.85 + i * 0.05,
          }),
        )
      })

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
          memoryPlants,
        }),
      )
      writeFileSync(resolve(outDir, `garden-view-${view}.svg`), body, 'utf8')
    }

    const flowerRow = PLANT_STAGES_ORDER.map((_, index) => stageCell(index, 'flower', palette)).join('')
    const flowerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PLANT_STAGES_ORDER.length * STAGE_CELL_W}" height="${STAGE_CELL_H}" viewBox="0 0 ${PLANT_STAGES_ORDER.length * STAGE_CELL_W} ${STAGE_CELL_H}">${flowerRow}</svg>`
    writeFileSync(resolve(outDir, 'plant-stages-flower-row.svg'), flowerSvg, 'utf8')

    const gridVarieties: SeededVariety[] = ['flower', 'tree', 'herb', 'wildflower']
    const gridW = PLANT_STAGES_ORDER.length * STAGE_CELL_W
    const gridH = gridVarieties.length * STAGE_CELL_H
    const gridRows = gridVarieties
      .map((variety, row) => {
        const cells = PLANT_STAGES_ORDER.map((_, stageIndex) => stageCell(stageIndex, variety, palette)).join('')
        return `<g transform="translate(0 ${row * STAGE_CELL_H})"><text x="4" y="14" font-size="11" fill="#3d3024" font-family="system-ui,sans-serif" font-weight="600">${variety}</text>${cells}</g>`
      })
      .join('')

    const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${gridW}" height="${gridH}" viewBox="0 0 ${gridW} ${gridH}">${gridRows}</svg>`
    writeFileSync(resolve(outDir, 'plant-stages-multi-variety-grid.svg'), gridSvg, 'utf8')
  })
})
