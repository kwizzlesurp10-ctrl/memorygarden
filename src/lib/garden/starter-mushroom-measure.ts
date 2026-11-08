import { JSDOM } from 'jsdom'

interface Mat2D {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

const ID: Mat2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

function multiply(parent: Mat2D, child: Mat2D): Mat2D {
  return {
    a: parent.a * child.a + parent.c * child.b,
    b: parent.b * child.a + parent.d * child.b,
    c: parent.a * child.c + parent.c * child.d,
    d: parent.b * child.c + parent.d * child.d,
    e: parent.a * child.e + parent.c * child.f + parent.e,
    f: parent.b * child.e + parent.d * child.f + parent.f,
  }
}

function parseSingleTransform(token: string): Mat2D | null {
  const translate = token.match(/^translate\(\s*([-0-9.]+)(?:[,\s]+([-0-9.]+))?\s*\)$/)
  if (translate) {
    const tx = Number(translate[1])
    const ty = Number(translate[2] ?? 0)
    return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty }
  }
  const scale = token.match(/^scale\(\s*([-0-9.]+)(?:[,\s]+([-0-9.]+))?\s*\)$/)
  if (scale) {
    const sx = Number(scale[1])
    const sy = Number(scale[2] ?? sx)
    return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }
  }
  const matrix = token.match(/^matrix\(\s*([^)]+)\)$/)
  if (matrix) {
    const p = matrix[1].split(/[\s,]+/).map(Number)
    if (p.length >= 6) {
      return { a: p[0], b: p[1], c: p[2], d: p[3], e: p[4], f: p[5] }
    }
  }
  return null
}

function parseTransformList(raw: string | null | undefined): Mat2D | null {
  if (!raw?.trim()) return null
  const re = /(matrix\([^)]*\)|translate\([^)]*\)|scale\([^)]*\))/g
  let m: Mat2D = { ...ID }
  let matched = false
  for (const token of raw.match(re) ?? []) {
    const t = parseSingleTransform(token.trim())
    if (!t) continue
    matched = true
    m = multiply(m, t)
  }
  return matched ? m : null
}

function matrixTo(node: Element): Mat2D {
  let m: Mat2D = { ...ID }
  let el: Element | null = node
  const chain: Element[] = []
  while (el && el.tagName?.toLowerCase() !== 'svg') {
    chain.push(el)
    el = el.parentElement
  }
  for (let i = chain.length - 1; i >= 0; i--) {
    const t = parseTransformList(chain[i].getAttribute('transform'))
    if (t) m = multiply(m, t)
  }
  return m
}

/** Cap bbox width in scene user units (1200×700 viewBox). */
export function measureMushroomCapWidthScene(el: Element): number {
  const halfW = Number(el.getAttribute('data-cap-half-w') ?? NaN)
  if (!Number.isFinite(halfW) || halfW <= 0) return 0
  const m = matrixTo(el)
  const left = m.a * -halfW + m.c * 0 + m.e
  const right = m.a * halfW + m.c * 0 + m.e
  const left2 = m.b * -halfW + m.d * 0 + m.f
  const right2 = m.b * halfW + m.d * 0 + m.f
  return Math.hypot(right - left, right2 - left2)
}

export function measureStarterMushroomCapWidthsFromSvg(svgMarkup: string): number[] {
  const dom = new JSDOM(svgMarkup, { contentType: 'image/svg+xml' })
  const caps = [...dom.window.document.querySelectorAll('[data-mush-cap]')]
  return caps.map((el) => measureMushroomCapWidthScene(el)).filter((w) => w > 0)
}
