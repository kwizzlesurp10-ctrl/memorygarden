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

const treeY = layouts.flower.rowHeight
const mushY =
  layouts.flower.rowHeight +
  layouts.tree.rowHeight +
  192 +
  196 +
  200 +
  200 +
  200

function zoomRow(label, y0, rowHeight, outName) {
  const sliceH = rowHeight + 24
  for (const [side, dir, xOff] of [
    ['before', beforeDir, 0],
    ['after', afterDir, sourceW],
  ]) {
    const half = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sourceW}" height="${sliceH}">
  <image href="data:image/png;base64,${b64(resolve(dir, 'plant-stages-multi-variety-grid.png'))}" width="${sourceW}" height="auto" y="${-y0 + 40}"/>
</svg>`
    writeFileSync(resolve(outDir, `_tmp_${side}_${outName}.svg`), half)
  }
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${sourceW * 2}" height="${sliceH + 40}">
  <rect width="100%" height="100%" fill="#0d0c0a"/>
  <text x="16" y="26" fill="#e8dcc8" font-size="18">${label} stages — BEFORE</text>
  <text x="${sourceW + 16}" y="26" fill="#c8f0c0" font-size="18">${label} stages — AFTER</text>
  <image href="data:image/png;base64,${b64(resolve(beforeDir, 'plant-stages-multi-variety-grid.png'))}" x="0" y="${40 - y0}" width="${sourceW}"/>
  <image href="data:image/png;base64,${b64(resolve(afterDir, 'plant-stages-multi-variety-grid.png'))}" x="${sourceW}" y="${40 - y0}" width="${sourceW}"/>
</svg>`
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: sourceW * 2 } }).render().asPng()
  writeFileSync(resolve(outDir, outName), png)
  console.log('Wrote', resolve(outDir, outName))
}

zoomRow('Tree', treeY, layouts.tree.rowHeight, 'compare-crop-tree-stages.png')
zoomRow('Mushroom', mushY, layouts.mushroom.rowHeight, 'compare-crop-mushroom-stages.png')
