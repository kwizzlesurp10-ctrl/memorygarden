import { createElement as e, type ReactNode } from 'react'
import type { HybridPlantPalette } from './seeded-builders'

/** Deterministic bark striations across trunk width (seed is integer, not rng). */
export function barkStriationPaths(bw: number, height: number, seed: number, C: HybridPlantPalette, rim: number): ReactNode[] {
  const lines: ReactNode[] = []
  const count = 3 + (seed % 4)
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1)
    const x = -bw * 0.65 + t * bw * 1.3
    const wobble = ((seed * 7 + i * 13) % 11) / 11 - 0.5
    lines.push(
      e('path', {
        key: `bark-${i}`,
        d: `M ${x} ${-height * 0.08} Q ${x + wobble * 2} ${-height * 0.45}, ${x - wobble} ${-height * 0.88}`,
        stroke: C.rim,
        strokeOpacity: 0.22 * rim,
        strokeWidth: 0.45,
        fill: 'none',
        strokeLinecap: 'round',
      }),
    )
  }
  return lines
}

export function trunkGradientDef(gradId: string, C: HybridPlantPalette): ReactNode {
  return e(
    'linearGradient',
    { id: gradId, x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
    e('stop', { offset: '0%', stopColor: C.rim, stopOpacity: 0.28 }),
    e('stop', { offset: '42%', stopColor: C.sil, stopOpacity: 1 }),
    e('stop', { offset: '100%', stopColor: C.silSoft, stopOpacity: 0.92 }),
  )
}

/** Center vein on a simple leaf ellipse at (cx, cy). */
export function leafVein(cx: number, cy: number, rx: number, ry: number, C: HybridPlantPalette, rim: number, key = 'vein'): ReactNode {
  return e('path', {
    key,
    d: `M ${cx} ${cy + ry * 0.15} Q ${cx - rx * 0.1} ${cy - ry * 0.2}, ${cx} ${cy - ry * 0.85} M ${cx} ${cy - ry * 0.1} Q ${cx + rx * 0.35} ${cy - ry * 0.35}, ${cx + rx * 0.55} ${cy - ry * 0.05}`,
    stroke: C.rim,
    strokeOpacity: 0.35 * rim,
    strokeWidth: 0.35,
    fill: 'none',
    strokeLinecap: 'round',
  })
}

/** Subtle highlight arc on a bloom petal cluster. */
export function petalSheen(cx: number, cy: number, radius: number, C: HybridPlantPalette): ReactNode {
  return e('ellipse', {
    key: 'sheen',
    cx: cx - radius * 0.25,
    cy: cy - radius * 0.35,
    rx: radius * 0.55,
    ry: radius * 0.28,
    fill: C.glow,
    opacity: 0.2,
  })
}

/** Gentle canopy shimmer — CSS-only, no extra DOM when motion is off. */
export function canopyShimmerStyle(motion: boolean, phase: number): { animation?: string } | undefined {
  if (!motion) return undefined
  return { animation: `mgPulse ${3.6 + (phase % 5) * 0.4}s ease-in-out ${phase * 0.3}s infinite alternate` }
}

/** Soft soil bed for close-ups (no bright rims or grass tufts). */
export function plantGroundCollarSubtle(C: HybridPlantPalette, rim: number, width = 14): ReactNode {
  const soil = C.bank ?? C.rim
  return e(
    'g',
    { key: 'ground-collar-subtle' },
    e('ellipse', {
      cx: 0,
      cy: 4.4,
      rx: width * 0.92,
      ry: width * 0.2,
      fill: C.rim,
      opacity: 0.09 * Math.max(0.35, rim),
    }),
    e('ellipse', {
      cx: 0,
      cy: 2.6,
      rx: width * 0.62,
      ry: width * 0.13,
      fill: soil,
      opacity: 0.58,
    }),
  )
}

/** Soil mound + contact shadow so stems read as planted at y=0 (not floating). */
export function plantGroundCollar(
  C: HybridPlantPalette,
  rim: number,
  width = 11,
  depth = 3.2,
): ReactNode {
  void rim
  void depth
  return plantGroundCollarSubtle(C, 0.5, width)
}

/** Flat pad where a vertical stem meets the soil line — improves joint continuity. */
export function stemGroundFlare(C: HybridPlantPalette, rim: number, halfW = 1.4): ReactNode {
  return e('path', {
    key: 'stem-flare',
    d: `M ${-halfW} 0.4 Q ${-halfW * 0.42} ${-2.4} 0 ${-1.6} Q ${halfW * 0.42} ${-2.4} ${halfW} 0.4 Z`,
    fill: C.sil,
    stroke: C.rim,
    strokeOpacity: 0.48 * rim,
    strokeWidth: 0.65,
  })
}

/** Filled tapered stem (reads at scene scale; stroke-only stems vanish). */
export function filledStemPath(halfW: number, height: number, C: HybridPlantPalette, rim: number, key = 'fstem'): ReactNode {
  const hw = Math.max(0.75, halfW)
  const top = Math.min(-4, -height)
  return e('path', {
    key,
    d: `M ${-hw} 0.2 Q ${-hw * 0.55} ${top * 0.45} ${-hw * 0.35} ${top} L ${hw * 0.35} ${top} Q ${hw * 0.55} ${top * 0.45} ${hw} 0.2 Z`,
    fill: C.sil,
    stroke: C.rim,
    strokeOpacity: 0.4 * rim,
    strokeWidth: 0.55,
  })
}
