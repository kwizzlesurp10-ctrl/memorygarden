/**
 * Resvg low-res render + pngjs nearest-neighbor upscale (no bilinear blur).
 */
import { PNG } from 'pngjs'
import { Resvg } from '@resvg/resvg-js'
import { PIXEL_ART_BLOCK_SCREEN_PX, plantPixelRasterWidth } from '../../src/lib/garden/plant-art-pixel.ts'

function renderSvgWidth(svg, width) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render()
}

/** Expand each source pixel to a block on the destination (nearest-neighbor). */
export function upscaleNearestPng(pngBuffer, outWidth, outHeight) {
  const src = PNG.sync.read(pngBuffer)
  const dst = new PNG({ width: outWidth, height: outHeight })
  for (let y = 0; y < outHeight; y++) {
    const sy = Math.min(src.height - 1, Math.floor((y / outHeight) * src.height))
    for (let x = 0; x < outWidth; x++) {
      const sx = Math.min(src.width - 1, Math.floor((x / outWidth) * src.width))
      const si = (src.width * sy + sx) << 2
      const di = (outWidth * y + x) << 2
      dst.data[di] = src.data[si]
      dst.data[di + 1] = src.data[si + 1]
      dst.data[di + 2] = src.data[si + 2]
      dst.data[di + 3] = src.data[si + 3]
    }
  }
  return PNG.sync.write(dst)
}

export function pixelateFullPngRender(rendered, blockPx = PIXEL_ART_BLOCK_SCREEN_PX) {
  const w = rendered.width
  const h = rendered.height
  const lowW = plantPixelRasterWidth(w, blockPx)
  const lowH = Math.max(4, Math.round((h / w) * lowW))
  const lowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${lowW}" height="${lowH}">
  <image href="data:image/png;base64,${rendered.asPng().toString('base64')}" width="${lowW}" height="${lowH}"/>
</svg>`
  const low = renderSvgWidth(lowSvg, lowW)
  const buf = upscaleNearestPng(low.asPng(), w, h)
  return { width: w, height: h, asPng: () => Buffer.from(buf) }
}

export function rasterizePlantSvgFragment(innerMarkup, viewBox, renderWidthPx, blockPx = PIXEL_ART_BLOCK_SCREEN_PX) {
  const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number)
  const renderHeightPx = Math.max(4, Math.round((vh / vw) * renderWidthPx))
  const lowW = plantPixelRasterWidth(renderWidthPx, blockPx)
  const lowH = Math.max(4, Math.round((vh / vw) * lowW))
  const plantSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${lowW}" height="${lowH}">
  ${innerMarkup}
</svg>`
  const low = renderSvgWidth(plantSvg, lowW)
  const upBuf = upscaleNearestPng(low.asPng(), renderWidthPx, renderHeightPx)
  const b64 = Buffer.from(upBuf).toString('base64')
  const displayH = (vh / vw) * vw
  return `<image xmlns="http://www.w3.org/2000/svg" href="data:image/png;base64,${b64}" x="${vx}" y="${vy}" width="${vw}" height="${displayH}" preserveAspectRatio="none" style="image-rendering:pixelated;image-rendering:crisp-edges"/>`
}
