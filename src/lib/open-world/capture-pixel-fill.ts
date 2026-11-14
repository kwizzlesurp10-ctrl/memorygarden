export type PlantPixelFill = {
  top: number
  bottom: number
  left: number
  right: number
  height: number
  width: number
  treePixels: number
  canopyTouchesTopRow: boolean
  canopyInTopBand: boolean
}

export function classifyWalkCapturePixel(
  r: number,
  g: number,
  b: number,
): 'sky' | 'grass' | 'tree' | 'other' {
  if (b >= 125 && g >= 88 && r >= 70 && b >= g - 32 && b > r + 2) return 'sky'
  if (g >= 88 && g > r + 14 && g > b - 12 && r < 150 && b < 200) return 'grass'
  if (r >= 55 && r <= 195 && g >= 40 && g <= 200 && b <= g + 35) {
    if (r > g + 6 && r < 175) return 'tree'
    if (g > r + 4 && g >= 55) return 'tree'
  }
  if (r > 45 && g > 38 && b < 95 && r >= g - 20) return 'tree'
  return 'other'
}

export function measurePlantPixelFillFromBuffer(
  pixels: Uint8Array,
  width: number,
  height: number,
): PlantPixelFill | null {
  let minX = width
  let maxX = -1
  let minY = height
  let maxY = -1
  let treePixels = 0
  let canopyTouchesTopRow = false
  let canopyInTopBand = false
  const topBandRows = Math.max(2, Math.ceil(height * 0.025))
  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y
    for (let x = 0; x < width; x++) {
      const i = (srcY * width + x) * 4
      const r = pixels[i]!
      const g = pixels[i + 1]!
      const b = pixels[i + 2]!
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
  if (treePixels < 60 || maxX < minX) return null
  return {
    top: minY / height,
    bottom: (maxY + 1) / height,
    left: minX / width,
    right: (maxX + 1) / width,
    height: (maxY - minY + 1) / height,
    width: (maxX - minX + 1) / width,
    treePixels,
    canopyTouchesTopRow,
    canopyInTopBand,
  }
}

export function measurePlantPixelFillFromGl(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  width: number,
  height: number,
): PlantPixelFill | null {
  const pixels = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  return measurePlantPixelFillFromBuffer(pixels, width, height)
}