import { createElement as h } from 'react'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it } from 'vitest'
import { GardenSceneSvg } from '@/components/garden/GardenSceneSvg'
import { todPalette } from '@/lib/garden/day-night'
import { buildSeededPlant } from '@/components/plants/seeded-builders'
import { gardenRng } from '@/lib/garden/prng'
import { indexToPlantStage } from '@/lib/garden/stage'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'
import { GARDEN_LANDSCAPE_VIEWS } from '@/lib/garden/landscape-view'
import { projectMemoryToSceneWorld } from '@/lib/garden/landscape-world'
import { createGardenStarterDecor } from '@/lib/garden/garden-starter-decor'
import type { SeededVariety } from '@/components/plants/types'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'

function writeSvgAndPng(fileStem: string, svg: string): void {
  const svgPath = resolve(outDir, `${fileStem}.svg`)
  writeFileSync(svgPath, svg, 'utf8')
  const png = new Resvg(readFileSync(svgPath, 'utf8'), {
    fitTo: { mode: 'width', value: 1200 },
  }).render().asPng()
  writeFileSync(resolve(outDir, `${fileStem}.png`), png)
}

const STAGE_CELL_W = 118

interface VarietyStageLayout {
  rowHeight: number
  anchorY: number
  scale: number
}

const VARIETY_STAGE_LAYOUT: Record<SeededVariety, VarietyStageLayout> = {
  flower: { rowHeight: 228, anchorY: 132, scale: 0.98 },
  tree: { rowHeight: 260, anchorY: 218, scale: 0.52 },
  herb: { rowHeight: 192, anchorY: 118, scale: 0.98 },
  wildflower: { rowHeight: 196, anchorY: 114, scale: 0.95 },
  mushroom: { rowHeight: 168, anchorY: 100, scale: 1 },
  fern: { rowHeight: 200, anchorY: 125, scale: 0.95 },
  vine: { rowHeight: 200, anchorY: 120, scale: 0.95 },
  succulent: { rowHeight: 178, anchorY: 108, scale: 1 },
  lotus: { rowHeight: 168, anchorY: 100, scale: 1 },
}

function stageCell(
  stageIndex: number,
  variety: SeededVariety,
  palette: ReturnType<typeof todPalette>,
  layout: VarietyStageLayout,
) {
  const stage = PLANT_STAGES_ORDER[stageIndex]
  const nodes = buildSeededPlant(variety, {
    stageIndex,
    palette,
    rimStrength: 0.65,
    motion: false,
    rng: gardenRng(99 + stageIndex * 17 + variety.length * 3),
  })
  const inner = renderToStaticMarkup(
    h('g', { transform: `translate(${STAGE_CELL_W * 0.5} ${layout.anchorY}) scale(${layout.scale})` }, nodes),
  )
  return `<g transform="translate(${stageIndex * STAGE_CELL_W} 0)">${inner}<text x="8" y="${layout.rowHeight - 10}" font-size="10" fill="#2d2418" font-family="system-ui,sans-serif">${stage}</text></g>`
}

describe('garden visual artifacts', () => {
  it('writes landscape views and stage row SVGs when ARTIFACT_CAPTURE=1', { timeout: 120_000 }, () => {
    if (process.env.ARTIFACT_CAPTURE !== '1') return

    mkdirSync(outDir, { recursive: true })
    const palette = todPalette(14, 'summer')

    const samplePositions = [
      { id: 'm1', x: 220, y: 440 },
      { id: 'm2', x: 520, y: 448 },
      { id: 'm3', x: 780, y: 455 },
      { id: 'm4', x: 980, y: 442 },
    ]
    const starterDecor = createGardenStarterDecor(4242)

    const renderScene = (
      view: (typeof GARDEN_LANDSCAPE_VIEWS)[number],
      memoryPlants: ReturnType<typeof h>[],
      starter = starterDecor,
      fileStem: string,
    ) => {
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
          starterDecor: starter,
        }),
      )
      const wrapped = body.includes('xmlns=') ? body : body.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      writeSvgAndPng(`${fileStem}-${view}`, wrapped)
    }

    for (const view of GARDEN_LANDSCAPE_VIEWS) {
      renderScene(view, [], starterDecor, 'garden-starter')
    }

    const nightPalette = todPalette(22.5, 'summer')
    const nightBody = renderToStaticMarkup(
      h(GardenSceneSvg, {
        palette: nightPalette,
        sceneKey: 'pond-night',
        gardenSeed: 7,
        rimStrength: 0.85,
        motion: false,
        landscapeView: 'pond',
        shedStyle: 'storybook',
        planted: [],
        candles: [],
        memoryPlants: [],
        starterDecor,
      }),
    )
    const nightWrapped = nightBody.includes('xmlns=')
      ? nightBody
      : nightBody.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    writeSvgAndPng('garden-starter-pond-night', nightWrapped)

    const lakesideNightBody = renderToStaticMarkup(
      h(GardenSceneSvg, {
        palette: nightPalette,
        sceneKey: 'lakeside-night',
        gardenSeed: 7,
        rimStrength: 0.85,
        motion: false,
        landscapeView: 'lakeside',
        shedStyle: 'storybook',
        planted: [],
        candles: [],
        memoryPlants: [],
        starterDecor,
      }),
    )
    const lakesideNightWrapped = lakesideNightBody.includes('xmlns=')
      ? lakesideNightBody
      : lakesideNightBody.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    writeSvgAndPng('garden-starter-lakeside-night', lakesideNightWrapped)

    for (const view of GARDEN_LANDSCAPE_VIEWS) {
      const memoryPlants = samplePositions.map((mem, i) => {
        const pos = projectMemoryToSceneWorld(mem, view)
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
            facing: pos.facing,
          }),
        )
      })

      renderScene(view, memoryPlants, undefined, 'garden-memories')
    }

    const flowerLayout = VARIETY_STAGE_LAYOUT.flower
    const flowerRow = PLANT_STAGES_ORDER.map((_, index) =>
      stageCell(index, 'flower', palette, flowerLayout),
    ).join('')
    const flowerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PLANT_STAGES_ORDER.length * STAGE_CELL_W}" height="${flowerLayout.rowHeight}" viewBox="0 0 ${PLANT_STAGES_ORDER.length * STAGE_CELL_W} ${flowerLayout.rowHeight}">${flowerRow}</svg>`
    writeFileSync(resolve(outDir, 'plant-stages-flower-row.svg'), flowerSvg, 'utf8')

    const gridVarieties: SeededVariety[] = ['flower', 'tree', 'herb', 'wildflower']
    const gridW = PLANT_STAGES_ORDER.length * STAGE_CELL_W
    let gridH = 0
    const gridRows = gridVarieties
      .map((variety) => {
        const layout = VARIETY_STAGE_LAYOUT[variety]
        const rowY = gridH
        gridH += layout.rowHeight
        const cells = PLANT_STAGES_ORDER.map((_, stageIndex) =>
          stageCell(stageIndex, variety, palette, layout),
        ).join('')
        return `<g transform="translate(0 ${rowY})"><text x="4" y="14" font-size="11" fill="#3d3024" font-family="system-ui,sans-serif" font-weight="600">${variety}</text>${cells}</g>`
      })
      .join('')

    const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${gridW}" height="${gridH}" viewBox="0 0 ${gridW} ${gridH}">${gridRows}</svg>`
    writeFileSync(resolve(outDir, 'plant-stages-multi-variety-grid.svg'), gridSvg, 'utf8')
  })
})
