/**
 * Resvg-based plant rasterization for pixel-art captures (nearest-neighbor upscale).
 */
import { Resvg } from '@resvg/resvg-js'
import { PIXEL_ART_BLOCK_SCREEN_PX, plantPixelRasterWidth } from '../../src/lib/garden/plant-art-pixel.ts'

function renderSvgWidth(svg, width) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render()
}

/** Wrap low-res PNG in SVG and upscale with crisp pixels for Resvg. */
export function upscalePixelPng(pngBuffer, outWidth, outHeight) {
  const b64 = pngBuffer.toString('base64')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}" viewBox="0 0 ${outWidth} ${outHeight}">
  <image href="data:image/png;base64,${b64}" width="${outWidth}" height="${outHeight}" preserveAspectRatio="none"
    style="image-rendering:pixelated;image-rendering:crisp-edges"/>
</svg>`
  return renderSvgWidth(svg, outWidth)
}

export function rasterizePlantSvgFragment(innerMarkup, viewBox, renderWidthPx, blockPx = PIXEL_ART_BLOCK_SCREEN_PX) {
  const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number)
  const renderHeightPx = Math.max(4, Math.round((vh / vw) * renderWidthPx))
  const lowW = plantPixelRasterWidth(renderWidthPx, blockPx)
  const lowH = Math.max(4, Math.round((vh / vw) * lowW))
  const plantSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${lowW}" height="${lowH}">
  <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="none"/>
  ${innerMarkup}
</svg>`
  const low = renderSvgWidth(plantSvg, lowW)
  const up = upscalePixelPng(low.asPng(), renderWidthPx, renderHeightPx)
  const b64 = up.asPng().toString('base64')
  const displayW = vw
  const displayH = (vh / vw) * displayW
  return `<image xmlns="http://www.w3.org/2000/svg" href="data:image/png;base64,${b64}" x="${vx}" y="${vy}" width="${displayW}" height="${displayH}" preserveAspectRatio="none" style="image-rendering:pixelated;image-rendering:crisp-edges"/>`
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
  return upscalePixelPng(low.asPng(), w, h)
}
