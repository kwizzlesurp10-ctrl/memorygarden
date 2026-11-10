import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const beforeDir = process.env.BEFORE_DIR || '/opt/cursor/artifacts/before'
const afterDir = process.env.AFTER_DIR || '/opt/cursor/artifacts/after'
const outDir = process.env.OUT_DIR || '/opt/cursor/artifacts/compare'
const sourceW = Number(process.env.COMPARE_WIDTH || 1200)

mkdirSync(outDir, { recursive: true })

const GRID_W = 944
const BEFORE_GRID_H = 228 + 260 + 178 + 200 + 192 + 196 + 200 + 168 + 168
const AFTER_GRID_H = 228 + 328 + 178 + 200 + 192 + 196 + 200 + 168 + 168

const ROW_LAYOUT = {
  tree: {
    before: { y: 228, h: 260 },
    after: { y: 228, h: 328, file: 'plant-stages-tree-row.png' },
  },
  mushroom: {
    before: { y: 228 + 260 + 178 + 200 + 192 + 196 + 200, h: 168 },
    after: { y: 228 + 328 + 178 + 200 + 192 + 196 + 200, h: 168, file: 'plant-stages-mushroom-row.png' },
  },
}

function b64(path) {
  return readFileSync(path).toString('base64')
}

function cropGridRow(dir, gridName, gridTotalH, y0, rowH) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${GRID_W}" height="${rowH + 32}" viewBox="0 0 ${GRID_W} ${rowH + 32}">
  <rect width="100%" height="100%" fill="#e8e2d6"/>
  <image href="data:image/png;base64,${b64(resolve(dir, gridName))}" y="${32 - y0}" width="${GRID_W}" height="${gridTotalH}"/>
</svg>`
  return new Resvg(svg, { fitTo: { mode: 'width', value: GRID_W } }).render().asPng()
}

function rowPng(dir, spec, gridName, gridH) {
  if (spec.file && existsSync(resolve(dir, spec.file))) {
    return readFileSync(resolve(dir, spec.file))
  }
  return cropGridRow(dir, gridName, gridH, spec.y, spec.h)
}

function sideBySideBuffers(name, leftPng, rightPng, leftLabel, rightLabel, height) {
  const w = sourceW
  const leftB64 = leftPng.toString('base64')
  const rightB64 = rightPng.toString('base64')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${height + 36}">
  <rect width="${w * 2}" height="${height + 36}" fill="#e8e2d6"/>
  <text x="24" y="28" fill="#2a2118" font-size="18" font-family="system-ui,sans-serif">${leftLabel}</text>
  <text x="${w + 24}" y="28" fill="#1a3d24" font-size="18" font-family="system-ui,sans-serif">${rightLabel}</text>
  <image href="data:image/png;base64,${leftB64}" x="0" y="36" width="${w}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
  <image href="data:image/png;base64,${rightB64}" x="${w}" y="36" width="${w}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
  <line x1="${w}" y1="32" x2="${w}" y2="${height + 36}" stroke="#9a8a72" stroke-width="2"/>
</svg>`
  const outPath = resolve(outDir, `${name}.png`)
  writeFileSync(outPath, new Resvg(svg, { fitTo: { mode: 'width', value: w * 2 } }).render().asPng())
  console.log('Wrote', outPath)
}

function sideBySideFiles(name, beforeName, afterName, height = 820) {
  const afterSha = readFileSync(resolve(afterDir, 'BUILD_SHA.txt'), 'utf8').trim().slice(0, 7)
  sideBySideBuffers(
    name,
    readFileSync(resolve(beforeDir, beforeName)),
    readFileSync(resolve(afterDir, afterName)),
    `BEFORE (main) — ${basename(beforeName)}`,
    `AFTER (${afterSha}) — ${basename(afterName)}`,
    height,
  )
}

sideBySideFiles('compare-garden-starter-pond', 'garden-starter-pond.png', 'garden-starter-pond.png')
sideBySideFiles('compare-plant-stages-grid', 'plant-stages-multi-variety-grid.png', 'plant-stages-multi-variety-grid.png', 960)

const afterSha = readFileSync(resolve(afterDir, 'BUILD_SHA.txt'), 'utf8').trim().slice(0, 7)

for (const [label, layout] of Object.entries(ROW_LAYOUT)) {
  sideBySideBuffers(
    `compare-crop-${label}-stages`,
    rowPng(beforeDir, layout.before, 'plant-stages-multi-variety-grid.png', BEFORE_GRID_H),
    rowPng(afterDir, layout.after, 'plant-stages-multi-variety-grid.png', AFTER_GRID_H),
    `${label} — BEFORE (main, cropped row)`,
    `${label} — AFTER (${afterSha})`,
    layout.after.h + 48,
  )
}

if (
  existsSync(resolve(afterDir, 'garden-tree-memories-pond.png')) &&
  existsSync(resolve(beforeDir, 'garden-tree-memories-pond.png'))
) {
  sideBySideFiles(
    'compare-garden-tree-memories-pond',
    'garden-tree-memories-pond.png',
    'garden-tree-memories-pond.png',
    580,
  )
}
