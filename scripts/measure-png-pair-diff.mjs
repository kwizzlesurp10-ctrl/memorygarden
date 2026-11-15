/**
 * Luminance diff % between two PNGs (pixels differing by more than threshold).
 * Usage: node scripts/measure-png-pair-diff.mjs before.png after.png [threshold]
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PNG } = require('pngjs')

const [beforePath, afterPath] = process.argv.slice(2)
const lumThreshold = Number(process.argv[4] ?? process.argv[3] ?? 30)

function lum(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

const before = PNG.sync.read(readFileSync(beforePath))
const after = PNG.sync.read(readFileSync(afterPath))
const w = Math.min(before.width, after.width)
const h = Math.min(before.height, after.height)
if (before.width !== after.width || before.height !== after.height) {
  console.warn(`Size mismatch crop to ${w}x${h}: ${before.width}x${before.height} vs ${after.width}x${after.height}`)
}
let diff = 0
const total = w * h
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const bi = (before.width * y + x) * 4
    const ai = (after.width * y + x) * 4
    const d = Math.abs(lum(before.data[bi], before.data[bi + 1], before.data[bi + 2]) - lum(after.data[ai], after.data[ai + 1], after.data[ai + 2]))
    if (d > lumThreshold) diff++
  }
}
const pct = (100 * diff) / total
console.log(JSON.stringify({ beforePath, afterPath, lumThreshold, diffPixels: diff, totalPixels: total, diffPercent: pct }))
process.exit(pct > 5 ? 0 : 2)