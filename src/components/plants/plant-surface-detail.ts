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
