import { createElement as e, type ReactNode, type CSSProperties } from 'react'
import type { PlantFacing } from '@/lib/garden/landscape-world'
import type { HybridPlantPalette } from './seeded-builders'
import type { SeededVariety } from './types'

export function applyPlantFacing(
  variety: SeededVariety,
  facing: PlantFacing,
  nodes: ReactNode[],
  C: HybridPlantPalette,
  rim: number,
  stageIndex: number,
  rimFromLeft = true,
): ReactNode[] {
  if (variety === 'tree' && stageIndex >= 7) {
    return [e('g', { key: 'elder-facing' }, buildElderTreeFacing(facing, C, rim))]
  }
  if (variety === 'tree' && stageIndex >= 4) {
    return [e('g', { key: 'tree-facing' }, buildElderTreeFacing(facing, C, rim * 0.85, 0.88))]
  }
  if (variety === 'mushroom' && stageIndex >= 3) {
    return [e('g', { key: 'mush-cluster' }, buildReadableMushroomCluster(facing, C, rim, stageIndex))]
  }
  const lit = rimFromLeft ? 1 : -1
  const accents = memoryFacingAccents(variety, facing, C, rim, stageIndex, lit)
  if (facing === 'back') {
    return [e('g', { key: 'f-back', transform: 'scale(-1 1)' }, [...nodes, ...accents])]
  }
  return [...nodes, ...accents]
}

function buildElderTreeFacing(
  facing: PlantFacing,
  C: HybridPlantPalette,
  rim: number,
  scale = 1,
): ReactNode[] {
  const bark = C.sil
  const moss = C.silSoft
  const out: ReactNode[] = []
  const trunk = (d: string) =>
    e('path', { key: `tr-${d}`, d, fill: bark, stroke: C.rim, strokeOpacity: 0.45 * rim, strokeWidth: 0.7 })

  switch (facing) {
    case 'front':
      out.push(
        trunk('M -8 0 C -8 -36, -5 -62, -2 -88 L 4 -88 C 8 -60, 8 -36, 8 0 Z'),
        e('path', {
          key: 'low-limb',
          d: 'M -2 -48 Q -28 -42 -38 -28 Q -22 -38 -2 -44',
          stroke: moss,
          strokeWidth: 4.2,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('ellipse', { key: 'canopy-l', cx: -22, cy: -78, rx: 26, ry: 20, fill: moss }),
        e('ellipse', { key: 'canopy-r', cx: 12, cy: -84, rx: 22, ry: 18, fill: bark }),
        e('ellipse', { key: 'canopy-top', cx: -4, cy: -98, rx: 30, ry: 24, fill: moss }),
        e('ellipse', {
          key: 'hollow',
          cx: 4,
          cy: -36,
          rx: 4,
          ry: 6.5,
          fill: C.glow,
          opacity: 0.55,
        }),
        e('path', {
          key: 'roots-l',
          d: 'M -6 0 Q -18 6 -14 10 M -2 0 Q -12 8 -8 12',
          stroke: bark,
          strokeWidth: 2.2,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('path', { key: 'lean', d: 'M 6 -20 Q 10 -40 6 -58', stroke: C.rim, strokeWidth: 1, fill: 'none', opacity: 0.35 * rim }),
      )
      break
    case 'back':
      out.push(
        trunk('M -7 0 C -7 -34, -4 -58, 0 -86 L 6 -86 C 10 -58, 10 -34, 10 0 Z'),
        e('ellipse', { key: 'canopy', cx: 2, cy: -90, rx: 28, ry: 22, fill: bark }),
        e('ellipse', { key: 'canopy-soft', cx: -8, cy: -76, rx: 20, ry: 16, fill: moss, opacity: 0.85 }),
        e('path', {
          key: 'roots-r',
          d: 'M 6 0 Q 16 5 20 9 M 2 0 Q 14 7 18 11',
          stroke: bark,
          strokeWidth: 2,
          fill: 'none',
          strokeLinecap: 'round',
        }),
      )
      break
    case 'left':
      out.push(
        e('path', { key: 'trunk-edge', d: 'M -10 0 L -6 -90 L -2 -90 L 2 -88 L 6 0 Z', fill: bark }),
        e('path', {
          key: 'limb-out',
          d: 'M -6 -36 Q 14 -28 26 -18',
          stroke: moss,
          strokeWidth: 3.8,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('ellipse', { key: 'canopy-front', cx: 8, cy: -82, rx: 24, ry: 18, fill: moss }),
        e('ellipse', { key: 'canopy-back', cx: -16, cy: -74, rx: 14, ry: 12, fill: bark, opacity: 0.8 }),
      )
      break
    case 'right':
      out.push(
        e('path', { key: 'trunk-edge', d: 'M 10 0 L 6 -88 L 2 -90 L -2 -88 L -6 0 Z', fill: bark }),
        e('path', {
          key: 'limb-low',
          d: 'M 4 -52 Q -16 -46 -28 -32',
          stroke: moss,
          strokeWidth: 4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('ellipse', { key: 'canopy', cx: -6, cy: -86, rx: 26, ry: 20, fill: moss }),
        e('circle', { key: 'knot', cx: 5, cy: -28, r: 3.2, fill: C.silSoft, stroke: C.rim, strokeWidth: 0.6, strokeOpacity: 0.5 * rim }),
      )
      break
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }

  if (scale !== 1) {
    return [e('g', { key: 'elder-scale', transform: `scale(${scale})` }, out)]
  }
  return out
}

export function buildReadableMushroomCluster(
  facing: PlantFacing,
  C: HybridPlantPalette,
  rim: number,
  stage: number,
): ReactNode[] {
  const capLit = C.accent
  const capShade = C.sil
  const stem = C.silSoft
  const tilt = facing === 'left' ? -12 : facing === 'right' ? 12 : facing === 'back' ? 4 : -6
  const gillOpacity = facing === 'back' ? 0.85 : facing === 'front' ? 0.7 : 0.35
  const out: ReactNode[] = []

  const caps: [number, number, number][] =
    stage >= 6
      ? [
          [0, 0, 1.1],
          [-10, 1, 0.75],
          [9, 0.5, 0.85],
          [-16, 1.5, 0.55],
        ]
      : [
          [0, 0, 1],
          [-7, 0.8, 0.68],
        ]

  caps.forEach(([mx, my, sc], i) => {
    const w = (7 + stage * 0.8) * sc
    const h = w * 0.62
    out.push(
      e(
        'g',
        { key: `mc${i}`, transform: `translate(${mx} ${my})` },
        e('path', {
          key: 'stem',
          d: `M ${-w * 0.22} 0 C ${-w * 0.15} ${-h * 1.2}, ${w * 0.15} ${-h * 1.2}, ${w * 0.22} 0 Z`,
          fill: stem,
        }),
        e('path', {
          key: 'cap',
          d: `M ${-w} 0 Q ${tilt * 0.2} ${-h * 2.1}, ${w} 0 Q 0 ${h * 0.35}, ${-w} 0 Z`,
          fill: i % 2 === 0 ? capLit : capShade,
          stroke: C.rim,
          strokeOpacity: 0.45 * rim,
          strokeWidth: 0.55,
        }),
        e('path', {
          key: 'gills',
          d: `M ${-w * 0.75} 0 Q 0 ${h * 0.55}, ${w * 0.75} 0`,
          stroke: C.glow,
          strokeWidth: 0.9,
          fill: 'none',
          opacity: gillOpacity,
        }),
        e('ellipse', {
          key: 'shine',
          cx: tilt > 0 ? w * 0.35 : -w * 0.35,
          cy: -h * 0.9,
          rx: w * 0.22,
          ry: h * 0.18,
          fill: C.glow,
          opacity: 0.5,
        }),
      ),
    )
  })

  return out
}

function memoryFacingAccents(
  variety: SeededVariety,
  facing: PlantFacing,
  C: HybridPlantPalette,
  rim: number,
  stage: number,
  lit: number,
): ReactNode[] {
  if (stage < 3) return []
  const out: ReactNode[] = []
  const side = lit > 0 ? 1 : -1

  if (variety === 'flower' || variety === 'wildflower') {
    if (facing === 'left') {
      out.push(e('path', { key: 'fa', d: 'M 4 -18 Q 14 -20 16 -12', stroke: C.glow, strokeWidth: 1.2, fill: 'none', opacity: 0.8 }))
    } else if (facing === 'right') {
      out.push(e('circle', { key: 'fb', cx: -12, cy: -16, r: 4, fill: C.accent, opacity: 0.65 }))
    } else if (facing === 'front') {
      out.push(e('circle', { key: 'fc', cx: side * 8, cy: -20, r: 3.5, fill: C.glow, opacity: 0.75 }))
    }
  }

  if (variety === 'herb' || variety === 'vine') {
    out.push(
      e('path', {
        key: 'hd',
        d: `M 0 -10 Q ${side * 10} -16 ${side * 14} -8`,
        stroke: C.silSoft,
        strokeWidth: 1.4,
        fill: 'none',
        strokeLinecap: 'round',
        opacity: facing === 'back' ? 0.5 : 0.9,
      }),
    )
  }

  if (variety === 'fern') {
    out.push(
      e('path', {
        key: 'fr',
        d: `M 0 -6 Q ${side * 12} -14 ${side * 6} -22`,
        stroke: C.rim,
        strokeWidth: 0.8,
        fill: 'none',
        opacity: 0.55 * rim,
      }),
    )
  }

  return out
}

export function facingSwayStyle(facing: PlantFacing, motion: boolean): CSSProperties | undefined {
  if (!motion) return undefined
  const skew = facing === 'left' ? -2 : facing === 'right' ? 2 : 0
  return {
    transform: skew ? `skewX(${skew}deg)` : undefined,
    transformBox: 'fill-box',
    transformOrigin: '50% 100%',
  }
}
