/**
 * Render the same starter pond scene under each plant art style.
 * Run: npx vite-node scripts/capture-plant-art-styles.mjs
 * Env: ARTIFACT_DIR (default /opt/cursor/artifacts)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Resvg } from '@resvg/resvg-js'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
mkdirSync(outDir, { recursive: true })

const ART_STYLES = [
  'watercolor',
  'botanical-illustration',
  'pixel-art',
  'oil-painting',
  'studio-ghibli',
  'photorealistic',
]

const STYLE_LABELS = {
  watercolor: 'Watercolor',
  'botanical-illustration': 'Botanical',
  'pixel-art': 'Pixel Art',
  'oil-painting': 'Oil Painting',
  'studio-ghibli': 'Studio Ghibli',
  photorealistic: 'Photorealistic',
}

async function main() {
  const { GardenSceneSvg } = await import('../src/components/garden/GardenSceneSvg.tsx')
  const { todPalette } = await import('../src/lib/garden/day-night.ts')
  const { createGardenStarterDecor } = await import('../src/lib/garden/garden-starter-decor.ts')
  const { buildSeededPlant } = await import('../src/components/plants/seeded-builders.tsx')
  const { gardenRng } = await import('../src/lib/garden/prng.ts')
  const { plantStageToIndex } = await import('../src/lib/garden/stage.ts')
  const { PlantArtStyleDefs } = await import('../src/components/plants/PlantArtStyleDefs.tsx')
  const { plantArtFilterUrl } = await import('../src/lib/garden/plant-art-style.ts')

  const palette = todPalette(14, 'summer')
  const starterDecor = createGardenStarterDecor(42)

  const pngPaths = []

  for (const artStyle of ART_STYLES) {
    const body = renderToStaticMarkup(
      h(GardenSceneSvg, {
        palette,
        sceneKey: `s-${artStyle}`,
        gardenSeed: 11,
        rimStrength: 0.64,
        motion: false,
        landscapeView: 'pond',
        shedStyle: 'storybook',
        planted: [],
        candles: [],
        starterDecor,
        plantArtStyle: artStyle,
      }),
    )
    const svgPath = resolve(outDir, `garden-art-style-${artStyle}.svg`)
    writeFileSync(svgPath, body, 'utf8')
    const png = new Resvg(readFileSync(svgPath, 'utf8'), { fitTo: { mode: 'width', value: 960 } }).render().asPng()
    const pngPath = resolve(outDir, `garden-art-style-${artStyle}.png`)
    writeFileSync(pngPath, png)
    pngPaths.push({ artStyle, pngPath })
    console.log('Wrote', pngPath)
  }

  const flowerNodes = buildSeededPlant('flower', {
    stageIndex: plantStageToIndex('bloom'),
    palette,
    rimStrength: 0.7,
    motion: false,
    rng: gardenRng(4242),
  })
  const cellW = 160
  const cellH = 140
  const defs = renderToStaticMarkup(h(PlantArtStyleDefs))

  const cells = ART_STYLES.map((style, i) => {
    const inner = renderToStaticMarkup(
      h(
        'g',
        { transform: `translate(80 ${cellH - 20}) scale(0.85)`, filter: plantArtFilterUrl(style) },
        flowerNodes,
      ),
    )
    const label = STYLE_LABELS[style]
    return `<g transform="translate(${i * cellW} 0)">
      <rect width="${cellW - 8}" height="${cellH}" x="4" y="0" fill="#ebe6dc" rx="8"/>
      ${inner}
      <text x="${cellW / 2}" y="18" text-anchor="middle" font-size="11" fill="#2a2118" font-family="system-ui,sans-serif">${label}</text>
    </g>`
  }).join('')

  const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW * ART_STYLES.length}" height="${cellH}">
  ${defs}
  ${cells}
</svg>`
  const gridSvgPath = resolve(outDir, 'garden-art-style-grid.svg')
  writeFileSync(gridSvgPath, gridSvg, 'utf8')
  const gridPngPath = resolve(outDir, 'garden-art-style-grid.png')
  writeFileSync(
    gridPngPath,
    new Resvg(gridSvg, { fitTo: { mode: 'width', value: cellW * ART_STYLES.length } }).render().asPng(),
  )
  console.log('Wrote', gridPngPath)

  writeFileSync(
    resolve(outDir, 'garden-art-style-manifest.json'),
    JSON.stringify(
      {
        styles: ART_STYLES,
        scenes: pngPaths.map((p) => p.pngPath),
        grid: gridPngPath,
      },
      null,
      2,
    ),
    'utf8',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
