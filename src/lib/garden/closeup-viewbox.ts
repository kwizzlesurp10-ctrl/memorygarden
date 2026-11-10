export interface SvgBox {
  x: number
  y: number
  width: number
  height: number
}

export function paddedViewBox(box: SvgBox, padPx = 14, padRatio = 0.14): SvgBox {
  const padX = Math.max(padPx, box.width * padRatio) + 2
  const padY = Math.max(padPx + 2, box.height * padRatio) + 4
  return {
    x: box.x - padX,
    y: box.y - padY,
    width: box.width + padX * 2,
    height: box.height + padY * 2,
  }
}

export function viewBoxString(box: SvgBox): string {
  const x = Math.round(box.x * 100) / 100
  const y = Math.round(box.y * 100) / 100
  const w = Math.round(box.width * 100) / 100
  const h = Math.round(box.height * 100) / 100
  return `${x} ${y} ${w} ${h}`
}

export function parseViewBox(viewBox: string): SvgBox {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid viewBox: ${viewBox}`)
  }
  return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] }
}

/** True when outer fully contains inner (with small epsilon). */
export function viewBoxContains(outer: SvgBox, inner: SvgBox, epsilon = 1): boolean {
  return (
    inner.x >= outer.x - epsilon &&
    inner.y >= outer.y - epsilon &&
    inner.x + inner.width <= outer.x + outer.width + epsilon &&
    inner.y + inner.height <= outer.y + outer.height + epsilon
  )
}

export function domRectToBox(rect: DOMRect): SvgBox {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}
