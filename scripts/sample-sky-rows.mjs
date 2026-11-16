/**
 * Sample center-column RGB rows from a dusk/overview screenshot (PNG).
 * Usage: node scripts/sample-sky-rows.mjs <png> [out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PNG } = require('pngjs')

const pngPath = process.argv[2]
const outPath = process.argv[3]
if (!pngPath) {
  console.error('Usage: node scripts/sample-sky-rows.mjs <png> [out.json]')
  process.exit(1)
}

const rows = [10, 80, 160, 240]
const png = PNG.sync.read(readFileSync(pngPath))
const cx = Math.floor(png.width / 2)
const samples = {}
for (const y of rows) {
  const yy = Math.min(png.height - 1, Math.max(0, y))
  const i = (png.width * yy + cx) * 4
  samples[`y${y}`] = { r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] }
}

const payload = { pngPath, width: png.width, height: png.height, centerX: cx, samples }
const text = JSON.stringify(payload, null, 2)
if (outPath) writeFileSync(outPath, `${text}\n`)
console.log(text)