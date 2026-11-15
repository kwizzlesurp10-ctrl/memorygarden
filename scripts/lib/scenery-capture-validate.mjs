import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'

function isSkyPixel(r, g, b) {
  return b >= 125 && g >= 88 && r >= 70 && b >= g - 32 && b > r + 2
}

function isGrassPixel(r, g, b) {
  return g >= 88 && g > r + 14 && g > b - 12 && r < 150 && b < 200
}

/** True when center 20% is one flat material (camera likely inside geometry). */
export function centerTwentyPercentTooUniform(pngPath) {
  const png = PNG.sync.read(readFileSync(pngPath))
  const w = png.width
  const h = png.height
  const x0 = Math.floor(w * 0.4)
  const x1 = Math.ceil(w * 0.6)
  const y0 = Math.floor(h * 0.4)
  const y1 = Math.ceil(h * 0.6)
  const bins = new Map()
  let total = 0
  let nonSkyGrass = 0
  let sumR = 0
  let sumG = 0
  let sumB = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (w * y + x) * 4
      const r = png.data[i]
      const g = png.data[i + 1]
      const b = png.data[i + 2]
      if (isSkyPixel(r, g, b) || isGrassPixel(r, g, b)) continue
      nonSkyGrass++
      total++
      sumR += r
      sumG += g
      sumB += b
      const key = `${Math.round(r / 16)},${Math.round(g / 16)},${Math.round(b / 16)}`
      bins.set(key, (bins.get(key) ?? 0) + 1)
    }
  }
  if (nonSkyGrass < 40) return false
  let top = 0
  for (const n of bins.values()) top = Math.max(top, n)
  const dominant = top / nonSkyGrass
  const meanR = sumR / nonSkyGrass
  const meanG = sumG / nonSkyGrass
  const meanB = sumB / nonSkyGrass
  let varSum = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (w * y + x) * 4
      const r = png.data[i]
      const g = png.data[i + 1]
      const b = png.data[i + 2]
      if (isSkyPixel(r, g, b) || isGrassPixel(r, g, b)) continue
      varSum += (r - meanR) ** 2 + (g - meanG) ** 2 + (b - meanB) ** 2
    }
  }
  const std = Math.sqrt(varSum / (nonSkyGrass * 3))
  return dominant >= 0.88 || std < 7.5
}

export function centerSubjectFillRatio(pngPath) {
  const png = PNG.sync.read(readFileSync(pngPath))
  const w = png.width
  const h = png.height
  const x0 = Math.floor(w * 0.35)
  const x1 = Math.ceil(w * 0.65)
  const y0 = Math.floor(h * 0.3)
  const y1 = Math.ceil(h * 0.7)
  let subject = 0
  let total = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (w * y + x) * 4
      const r = png.data[i]
      const g = png.data[i + 1]
      const b = png.data[i + 2]
      if (isSkyPixel(r, g, b) || isGrassPixel(r, g, b)) {
        total++
        continue
      }
      subject++
      total++
    }
  }
  return total > 0 ? subject / total : 0
}