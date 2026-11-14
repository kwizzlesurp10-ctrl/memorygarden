import { readFileSync } from 'node:fs'
import { PNG } from 'pngjs'

export function classifyWalkCapturePixel(r, g, b) {
  if (b >= 125 && g >= 88 && r >= 70 && b >= g - 32 && b > r + 2) return 'sky'
  if (g >= 88 && g > r + 14 && g > b - 12 && r < 150 && b < 200) return 'grass'
  if (r >= 55 && r <= 195 && g >= 40 && g <= 200 && b <= g + 35) {
    if (r > g + 6 && r < 175) return 'tree'
    if (g > r + 4 && g >= 55) return 'tree'
  }
  if (r > 45 && g > 38 && b < 95 && r >= g - 20) return 'tree'
  return 'other'
}

export function measureTreePixelFillFromPng(pngPath) {
  const png = PNG.sync.read(readFileSync(pngPath))
  const w = png.width
  const h = png.height
  let minX = w
  let maxX = -1
  let minY = h
  let maxY = -1
  let treePixels = 0
  let canopyTouchesTopRow = false
  let canopyInTopBand = false
  const topBandRows = Math.max(2, Math.ceil(h * 0.025))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (w * y + x) * 4
      const r = png.data[i]
      const g = png.data[i + 1]
      const b = png.data[i + 2]
      if (classifyWalkCapturePixel(r, g, b) !== 'tree') continue
      treePixels++
      if (y === 0) canopyTouchesTopRow = true
      if (y < topBandRows) canopyInTopBand = true
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  if (treePixels < 60 || maxX < minX) {
    return {
      treePixels,
      height: 0,
      width: 0,
      top: NaN,
      bottom: NaN,
      canopyTouchesTopRow: false,
      canopyInTopBand: false,
    }
  }
  return {
    treePixels,
    height: (maxY - minY + 1) / h,
    width: (maxX - minX + 1) / w,
    top: minY / h,
    bottom: (maxY + 1) / h,
    left: minX / w,
    right: (maxX + 1) / w,
    canopyTouchesTopRow,
    canopyInTopBand,
  }
}

export function treePixelsTouchTopRowFromPng(pngPath) {
  return measureTreePixelFillFromPng(pngPath).canopyTouchesTopRow === true
}

/** Vertical span of tree pixels in center column ± bandPx (excludes sky/grass). */
export function measureElderColumnVerticalFillFromPng(pngPath, centerX01 = 0.5, bandPx = 40) {
  const png = PNG.sync.read(readFileSync(pngPath))
  const w = png.width
  const h = png.height
  const cx = Math.min(w - 1, Math.max(0, Math.round(centerX01 * w)))
  const x0 = Math.max(0, cx - bandPx)
  const x1 = Math.min(w - 1, cx + bandPx)
  let minY = h
  let maxY = -1
  let treeRows = 0
  for (let y = 0; y < h; y++) {
    let rowTree = false
    for (let x = x0; x <= x1; x++) {
      const i = (w * y + x) * 4
      const r = png.data[i]
      const g = png.data[i + 1]
      const b = png.data[i + 2]
      const kind = classifyWalkCapturePixel(r, g, b)
      if (kind === 'sky' || kind === 'grass') continue
      if (kind === 'tree') {
        rowTree = true
        break
      }
    }
    if (rowTree) {
      treeRows++
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  const heightFrac = maxY >= minY ? (maxY - minY + 1) / h : 0
  const topFrac = maxY >= minY ? minY / h : NaN
  const bottomFrac = maxY >= minY ? (maxY + 1) / h : NaN
  const canopyTouchesTopRow = maxY >= minY && minY === 0
  return {
    heightFrac,
    topFrac,
    bottomFrac,
    treeRows,
    centerX: cx,
    bandPx,
    canopyTouchesTopRow,
  }
}