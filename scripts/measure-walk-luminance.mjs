import { resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/measure-walk-luminance.mjs <png-path>')
  process.exit(1)
}

const abs = resolve(file)
const dataUrl = `data:image/png;base64,${readFileSync(abs).toString('base64')}`

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const result = await page.evaluate(async (src) => {
  const img = new Image()
  img.src = src
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const total = width * height
  let below20 = 0
  let sum = 0
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    sum += lum
    if (lum < 20) below20++
  }
  return {
    width,
    height,
    totalPixels: total,
    darkBelow20Pct: (below20 / total) * 100,
    meanLuminance: sum / total,
  }
}, dataUrl)
await browser.close()

const out = resolve(process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/after', 'walk-dusk-luminance.json')
writeFileSync(out, `${JSON.stringify({ file: abs, ...result }, null, 2)}\n`)
console.log(JSON.stringify({ file: abs, ...result }, null, 2))
