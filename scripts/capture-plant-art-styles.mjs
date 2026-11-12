/**
 * Render garden + plant closeups for each art style; compute pairwise plant-region diff.
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

/** Pond starter scene — elder tree + lawn mushrooms (matches capture seed). */
const GARDEN_PLANT_CROP_VIEWBOX = '180 80 520 380'
const SCENE_VIEWBOX = { minX: -120, width: 1440, height: 700 }

const RIM = 0.64
const PALETTE_HOUR = 14
const GARDEN_SEED = 11
const STARTER_SEED = 42

function renderPng(svg, width) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render()
}

/** Resvg panics on some cropped sceneViewBox renders — slice from the full raster instead. */
function cropFromFullRender(full, viewBoxStr, outWidth) {
  const [vx, vy, vw, vh] = viewBoxStr.split(' ').map(Number)
  const imgW = full.width
  const imgH = full.height
  const x0 = Math.max(0, Math.round(((vx - SCENE_VIEWBOX.minX) / SCENE_VIEWBOX.width) * imgW))
  const y0 = Math.max(0, Math.round((vy / SCENE_VIEWBOX.height) * imgH))
  const cw = Math.round((vw / SCENE_VIEWBOX.width) * imgW)
  const ch = Math.round((vh / SCENE_VIEWBOX.height) * imgH)
  const b64 = full.asPng().toString('base64')
  const cropSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}">
    <image href="data:image/png;base64,${b64}" x="${-x0}" y="${-y0}" width="${imgW}" height="${imgH}"/>
  </svg>`
  return renderPng(cropSvg, outWidth)
}

function isPlantPixel(r, g, b, a) {
  if (a < 20) return false
  if (r > 228 && g > 222 && b > 208) return false
  if (g > 95 && r < 75 && b < 85 && g > r + 15) return true
  if (r > 40 || g > 45 || b > 35) {
    if (r > 210 && g > 200 && b > 175 && r - b < 55) return false
    return true
  }
  return false
}

function meanPlantDiff(imgA, imgB) {
  const { width, height } = imgA
  const a = imgA.pixels
  const b = imgB.pixels
  let sum = 0
  let n = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4
      const ar = a[o]
      const ag = a[o + 1]
      const ab = a[o + 2]
      const aa = a[o + 3]
      const br = b[o]
      const bg = b[o + 1]
      const bb = b[o + 2]
      const plant =
        isPlantPixel(ar, ag, ab, aa) ||
        isPlantPixel(br, bg, bb, b[o + 3])
      if (!plant) continue
      sum += (Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb)) / 3
      n++
    }
  }
  return { mean: n > 0 ? sum / n : 0, samples: n }
}

async function main() {
  const { GardenSceneSvg } = await import('../src/components/garden/GardenSceneSvg.tsx')
  const { todPalette } = await import('../src/lib/garden/day-night.ts')
  const { createGardenStarterDecor } = await import('../src/lib/garden/garden-starter-decor.ts')
  const { PlantArtStyleDefs } = await import('../src/components/plants/PlantArtStyleDefs.tsx')
  const { SeededPlantSvg } = await import('../src/components/plants/SeededPlantSvg.tsx')

  const palette = todPalette(PALETTE_HOUR, 'summer')
  const starterDecor = createGardenStarterDecor(STARTER_SEED)
  const defs = renderToStaticMarkup(h(PlantArtStyleDefs))

  const pixelMaps = {}

  for (const artStyle of ART_STYLES) {
    const body = renderToStaticMarkup(
      h(GardenSceneSvg, {
        palette,
        sceneKey: `s-${artStyle}`,
        gardenSeed: GARDEN_SEED,
        rimStrength: RIM,
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
    const full = renderPng(readFileSync(svgPath, 'utf8'), 960)
    writeFileSync(resolve(outDir, `garden-art-style-${artStyle}.png`), full.asPng())

    const crop = cropFromFullRender(full, GARDEN_PLANT_CROP_VIEWBOX, 520)
    writeFileSync(resolve(outDir, `garden-art-style-crop-${artStyle}.png`), crop.asPng())
    pixelMaps[`crop:${artStyle}`] = crop

  const treeMarkup = renderToStaticMarkup(
      h(SeededPlantSvg, {
        variety: 'tree',
        stage: 'elder',
        geneticsSeed: `elder-${STARTER_SEED}`,
        palette,
        rimStrength: RIM,
        motion: false,
        artStyle,
      }),
    )
    const flowerMarkup = renderToStaticMarkup(
      h(SeededPlantSvg, {
        variety: 'flower',
        stage: 'bloom',
        geneticsSeed: 'closeup-flower',
        palette,
        rimStrength: RIM,
        motion: false,
        artStyle,
      }),
    )
    const mushMarkup = renderToStaticMarkup(
      h(SeededPlantSvg, {
        variety: 'mushroom',
        stage: 'mature',
        geneticsSeed: 'closeup-mushroom',
        palette,
        rimStrength: RIM,
        motion: false,
        artStyle,
      }),
    )
    const closeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 240" width="420" height="240">
  ${defs}
  <rect width="420" height="240" fill="#ebe6dc"/>
  <g transform="translate(108 215) scale(0.58)">${treeMarkup}</g>
  <g transform="translate(318 208) scale(1.15)">${flowerMarkup}</g>
  <g transform="translate(228 218) scale(0.95)">${mushMarkup}</g>
</svg>`
    const close = renderPng(closeSvg, 420)
    writeFileSync(resolve(outDir, `garden-art-style-closeup-${artStyle}.png`), close.asPng())
    pixelMaps[`close:${artStyle}`] = close

    console.log('Wrote', resolve(outDir, `garden-art-style-${artStyle}.png`))
  }

  const cellW = 200
  const cellH = 176

  const cells = ART_STYLES.map((style, i) => {
    const inner = renderToStaticMarkup(
      h(
        'g',
        { transform: `translate(100 ${cellH - 8}) scale(1.35)` },
        h(SeededPlantSvg, {
          variety: 'flower',
          stage: 'bloom',
          geneticsSeed: 'grid-flower',
          palette,
          rimStrength: 0.7,
          motion: false,
          artStyle: style,
        }),
      ),
    )
    const label = STYLE_LABELS[style]
    return `<g transform="translate(${i * cellW} 0)">
      <rect width="${cellW - 6}" height="${cellH}" x="3" y="0" fill="#ebe6dc" rx="8"/>
      ${inner}
      <text x="${cellW / 2}" y="20" text-anchor="middle" font-size="12" fill="#2a2118" font-family="system-ui,sans-serif">${label}</text>
    </g>`
  }).join('')

  const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW * ART_STYLES.length}" height="${cellH}">
  ${defs}
  ${cells}
</svg>`
  writeFileSync(resolve(outDir, 'garden-art-style-grid.svg'), gridSvg, 'utf8')
  writeFileSync(
    resolve(outDir, 'garden-art-style-grid.png'),
    renderPng(gridSvg, cellW * ART_STYLES.length).asPng(),
  )

  const pairs = []
  for (let i = 0; i < ART_STYLES.length; i++) {
    for (let j = i + 1; j < ART_STYLES.length; j++) {
      const a = ART_STYLES[i]
      const b = ART_STYLES[j]
      const cropDiff = meanPlantDiff(pixelMaps[`crop:${a}`], pixelMaps[`crop:${b}`])
      const closeDiff = meanPlantDiff(pixelMaps[`close:${a}`], pixelMaps[`close:${b}`])
      pairs.push({
        a,
        b,
        cropMeanRgbDiff: Number(cropDiff.mean.toFixed(2)),
        cropSamples: cropDiff.samples,
        closeupMeanRgbDiff: Number(closeDiff.mean.toFixed(2)),
        closeupSamples: closeDiff.samples,
      })
    }
  }

  const report = { styles: ART_STYLES, pairs, generatedAt: new Date().toISOString() }
  writeFileSync(resolve(outDir, 'garden-art-style-pairwise-diff.json'), JSON.stringify(report, null, 2))
  console.log('Pairwise plant-region mean RGB diff (closeup):')
  for (const p of pairs) {
    console.log(`  ${p.a} vs ${p.b}: crop=${p.cropMeanRgbDiff} closeup=${p.closeupMeanRgbDiff}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
