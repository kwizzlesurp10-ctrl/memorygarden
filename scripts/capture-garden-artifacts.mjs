import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
mkdirSync(outDir, { recursive: true })

async function main() {
  const { GardenSceneSvg } = await import('../src/components/garden/GardenSceneSvg.tsx')
  const { todPalette } = await import('../src/lib/garden/day-night.ts')
  const { buildSeededPlant } = await import('../src/components/plants/seeded-builders.tsx')
  const { gardenRng } = await import('../src/lib/garden/prng.ts')
  const { indexToPlantStage, plantStageToIndex } = await import('../src/lib/garden/stage.ts')
  const { PLANT_STAGES_ORDER } = await import('../src/lib/garden/plant-stages.ts')

  const palette = todPalette(14, 'summer')
  const duskPalette = todPalette(19.5, 'autumn')

  for (const view of ['pond', 'lakeside', 'meadow', 'garden_path']) {
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

  const rowSvg = (variety, rowPalette, labelFill, yNudge) => {
    const cellW = variety === 'tree' ? 130 : 120
    const row = PLANT_STAGES_ORDER.map((stage) => {
      const nodes = buildSeededPlant(variety, {
        stageIndex: plantStageToIndex(stage),
        palette: rowPalette,
        rimStrength: 0.72,
        motion: false,
        rng: gardenRng(variety === 'tree' ? 77 : 99),
      })
      const inner = renderToStaticMarkup(h('g', { transform: `translate(90 ${yNudge})` }, nodes))
      return `<g transform="translate(${PLANT_STAGES_ORDER.indexOf(stage) * cellW} 0)">${inner}<text x="0" y="${yNudge + 25}" font-size="11" fill="${labelFill}">${stage}</text></g>`
    }).join('')
  const svgHeight = variety === 'tree' ? 130 : 120
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${PLANT_STAGES_ORDER.length * cellW}" height="${svgHeight}" viewBox="0 0 ${PLANT_STAGES_ORDER.length * cellW} ${svgHeight}">${row}</svg>`
  }

  writeFileSync(resolve(outDir, 'plant-stages-flower-row.svg'), rowSvg('flower', palette, '#333', 70), 'utf8')
  writeFileSync(resolve(outDir, 'plant-stages-flower-row-dusk.svg'), rowSvg('flower', duskPalette, '#f0e7da', 70), 'utf8')
  writeFileSync(resolve(outDir, 'plant-stages-tree-row-2d.svg'), rowSvg('tree', duskPalette, '#f0e7da', 80), 'utf8')

  console.log('Artifacts written to', outDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
