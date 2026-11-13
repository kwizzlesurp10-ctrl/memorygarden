/**
 * Sample mean RGB from lower grass band of a walk capture PNG.
 * Usage: node scripts/sample-grass-rgb.mjs <png path>
 */
import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const path = process.argv[2]
if (!path) {
  console.error('Usage: node scripts/sample-grass-rgb.mjs <png>')
  process.exit(1)
}

const png = PNG.sync.read(readFileSync(path))
const { width, height, data } = png
let r = 0
let g = 0
let b = 0
let n = 0
const y0 = Math.floor(height * 0.52)
const y1 = Math.floor(height * 0.82)
for (let y = y0; y < y1; y++) {
  for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x++) {
    const i = (width * y + x) << 2
    const pr = data[i]
    const pg = data[i + 1]
    const pb = data[i + 2]
    if (pg < pr * 0.9 || pg < 70) continue
    r += pr
    g += pg
    b += pb
    n++
  }
}
if (!n) {
  console.log(path, 'no grass samples')
  process.exit(1)
}
console.log(
  path,
  `grass avg rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`,
  `n=${n}`,
)
