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

  const stageRow = PLANT_STAGES_ORDER.map((stage) => {
    const nodes = buildSeededPlant('flower', {
      stageIndex: plantStageToIndex(stage),
      palette,
      rimStrength: 0.6,
      motion: false,
      rng: gardenRng(99),
    })
    const inner = renderToStaticMarkup(h('g', { transform: 'translate(90 70)' }, nodes))
    return `<g transform="translate(${PLANT_STAGES_ORDER.indexOf(stage) * 120} 0)">${inner}<text x="0" y="95" font-size="11" fill="#333">${stage}</text></g>`
  }).join('')

  const stagesSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PLANT_STAGES_ORDER.length * 120}" height="120" viewBox="0 0 ${PLANT_STAGES_ORDER.length * 120} 120">${stageRow}</svg>`
  writeFileSync(resolve(outDir, 'plant-stages-flower-row.svg'), stagesSvg, 'utf8')

  const treeRow = PLANT_STAGES_ORDER.map((stage) => {
    const nodes = buildSeededPlant('tree', {
      stageIndex: plantStageToIndex(stage),
      palette,
      rimStrength: 0.6,
      motion: false,
      rng: gardenRng(77),
    })
    const inner = renderToStaticMarkup(h('g', { transform: 'translate(90 80)' }, nodes))
    return `<g transform="translate(${PLANT_STAGES_ORDER.indexOf(stage) * 130} 0)">${inner}<text x="0" y="105" font-size="11" fill="#333">${stage}</text></g>`
  }).join('')
  const treeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PLANT_STAGES_ORDER.length * 130}" height="130" viewBox="0 0 ${PLANT_STAGES_ORDER.length * 130} 130">${treeRow}</svg>`
  writeFileSync(resolve(outDir, 'plant-stages-tree-row-2d.svg'), treeSvg, 'utf8')

  console.log('Artifacts written to', outDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
