import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const beforeDir = process.env.BEFORE_DIR || '/opt/cursor/artifacts/before'
const afterDir = process.env.AFTER_DIR || '/opt/cursor/artifacts/after'
const outDir = process.env.OUT_DIR || '/opt/cursor/artifacts/compare'
const sourceW = Number(process.env.COMPARE_WIDTH || 1200)

mkdirSync(outDir, { recursive: true })

function b64(path) {
  return readFileSync(path).toString('base64')
}

function sideBySide(name, beforeName, afterName, height = 820) {
  const beforePath = resolve(beforeDir, beforeName)
  const afterPath = resolve(afterDir, afterName)
  const w = sourceW
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${height + 36}" viewBox="0 0 ${w * 2} ${height + 36}">
  <rect width="${w * 2}" height="${height + 36}" fill="#1a1510"/>
  <text x="24" y="28" fill="#e8dcc8" font-size="22" font-family="system-ui,sans-serif">BEFORE — ${basename(beforeName)}</text>
  <text x="${w + 24}" y="28" fill="#c8f0c0" font-size="22" font-family="system-ui,sans-serif">AFTER — ${basename(afterName)}</text>
  <image href="data:image/png;base64,${b64(beforePath)}" x="0" y="36" width="${w}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
  <image href="data:image/png;base64,${b64(afterPath)}" x="${w}" y="36" width="${w}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
  <line x1="${w}" y1="36" x2="${w}" y2="${height + 36}" stroke="#6a5a48" stroke-width="2"/>
</svg>`
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: w * 2 } }).render().asPng()
  const outPath = resolve(outDir, `${name}.png`)
  writeFileSync(outPath, png)
  console.log('Wrote', outPath)
}

/** Crop a horizontal strip from the multi-variety stage grid PNG (Resvg width 1200). */
function cropStrip(gridPath, y0, rowHeight, outName, label) {
  const fullW = 1200
  const imgW = fullW
  const beforeB64 = b64(resolve(beforeDir, gridPath))
  const afterB64 = b64(resolve(afterDir, gridPath))
  const h = rowHeight
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${imgW * 2}" height="${h + 40}">
  <rect width="100%" height="100%" fill="#0d0c0a"/>
  <text x="16" y="26" fill="#e8dcc8" font-size="18" font-family="system-ui,sans-serif">${label} — BEFORE</text>
  <text x="${imgW + 16}" y="26" fill="#c8f0c0" font-size="18" font-family="system-ui,sans-serif">${label} — AFTER</text>
  <image href="data:image/png;base64,${beforeB64}" x="0" y="40" width="${imgW}" height="${h}" preserveAspectRatio="xMinYMin slice" clip-path="inset(${y0}px 0 ${8000}px 0)"/>
  <image href="data:image/png;base64,${afterB64}" x="${imgW}" y="40" width="${imgW}" height="${h}" preserveAspectRatio="xMinYMin slice" clip-path="inset(${y0}px 0 ${8000}px 0)"/>
</svg>`
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: imgW * 2 } }).render().asPng()
  writeFileSync(resolve(outDir, outName), png)
  console.log('Wrote', resolve(outDir, outName))
}

const STAGE_CELL_W = 118
const layouts = {
  flower: { rowHeight: 228, anchorY: 132, y0: 0 },
  tree: { rowHeight: 260, anchorY: 218, y0: 228 },
  mushroom: { rowHeight: 168, anchorY: 100, y0: 228 + 260 + 192 + 196 + 200 + 200 + 200 },
}

sideBySide('compare-garden-starter-pond', 'garden-starter-pond.png', 'garden-starter-pond.png')
sideBySide('compare-plant-stages-grid', 'plant-stages-multi-variety-grid.png', 'plant-stages-multi-variety-grid.png', 900)

const ROW_HEIGHTS = [228, 280, 192, 200, 192, 196, 200, 168]
const ROW_LABELS = ['flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower', 'fern', 'mushroom']

function rowYOffset(rowIndex) {
  let y = 0
  for (let i = 0; i < rowIndex; i++) y += ROW_HEIGHTS[i]
  return y
}

function zoomRow(label, rowIndex, outName) {
  const y0 = rowYOffset(rowIndex)
  const sliceH = ROW_HEIGHTS[rowIndex] + 8
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sourceW * 2}" height="${sliceH + 44}" viewBox="0 0 ${sourceW * 2} ${sliceH + 44}">
  <rect width="100%" height="100%" fill="#e8e2d6"/>
  <text x="16" y="28" fill="#2a2118" font-size="17" font-weight="600" font-family="system-ui,sans-serif">${label} stages — BEFORE (main)</text>
  <text x="${sourceW + 16}" y="28" fill="#1a3d24" font-size="17" font-weight="600" font-family="system-ui,sans-serif">${label} stages — AFTER (${readFileSync(resolve(afterDir, 'BUILD_SHA.txt'), 'utf8').trim().slice(0, 7)})</text>
  <svg x="0" y="40" width="${sourceW}" height="${sliceH}" viewBox="0 ${y0} ${sourceW} ${sliceH}">
    <image href="data:image/png;base64,${b64(resolve(beforeDir, 'plant-stages-multi-variety-grid.png'))}" width="${sourceW}" height="${ROW_HEIGHTS.reduce((a, b) => a + b, 0)}"/>
  </svg>
  <svg x="${sourceW}" y="40" width="${sourceW}" height="${sliceH}" viewBox="0 ${y0} ${sourceW} ${sliceH}">
    <image href="data:image/png;base64,${b64(resolve(afterDir, 'plant-stages-multi-variety-grid.png'))}" width="${sourceW}" height="${ROW_HEIGHTS.reduce((a, b) => a + b, 0)}"/>
  </svg>
  <line x1="${sourceW}" y1="36" x2="${sourceW}" y2="${sliceH + 44}" stroke="#9a8a72" stroke-width="2"/>
</svg>`
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: sourceW * 2 } }).render().asPng()
  writeFileSync(resolve(outDir, outName), png)
  console.log('Wrote', resolve(outDir, outName))
}

zoomRow('Tree', 1, 'compare-crop-tree-stages.png')
zoomRow('Mushroom', 7, 'compare-crop-mushroom-stages.png')
