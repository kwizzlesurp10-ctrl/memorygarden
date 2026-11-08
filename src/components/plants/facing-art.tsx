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
  const body =
    facing === 'back'
      ? e('g', { key: 'f-back', transform: 'scale(-1 1)' }, nodes)
      : e('g', { key: 'f-body' }, nodes)
  return withMemoryPresentation([body, ...accents], C, rim, variety, stageIndex)
}

function withMemoryPresentation(
  inner: ReactNode[],
  C: HybridPlantPalette,
  rim: number,
  variety: SeededVariety,
  stage: number,
): ReactNode[] {
  if (stage < 2) return inner
  const lift = variety === 'flower' || variety === 'wildflower' ? 1.08 : variety === 'tree' ? 1 : 1.04
  return [
    e(
      'g',
      { key: 'mem-present', transform: `scale(${lift})` },
      e('ellipse', { key: 'ground', cx: 0, cy: 4, rx: 10, ry: 2.4, fill: C.rim, opacity: 0.22 }),
      e(
        'g',
        {
          key: 'rim-lit',
          stroke: C.glow,
          strokeWidth: 0.45,
          strokeOpacity: 0.28 * rim,
          paintOrder: 'stroke fill',
          style: { filter: 'drop-shadow(0 0 0.8px rgba(255,255,255,0.28))' },
        },
        inner,
      ),
    ),
  ]
}

function canopyMass(
  key: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  rim: number,
  C: HybridPlantPalette,
  opacity = 1,
): ReactNode {
  return e('ellipse', {
    key,
    cx,
    cy,
    rx,
    ry,
    fill,
    opacity,
    stroke: C.rim,
    strokeOpacity: 0.12 * rim,
    strokeWidth: 0.5,
  })
}

function buildElderTreeFacing(
  facing: PlantFacing,
  C: HybridPlantPalette,
  rim: number,
  scale = 1,
): ReactNode[] {
  const bark = C.sil
  const moss = C.silSoft
  const highlight = C.glow
  const out: ReactNode[] = []
  const trunk = (d: string, key: string) =>
    e('path', { key, d, fill: bark, stroke: C.rim, strokeOpacity: 0.45 * rim, strokeWidth: 0.75 })

  const canopyStack = (facing: 'front' | 'back' | 'side', flip = 1): ReactNode[] => {
    const sx = flip
    type Mass = [number, number, number, number, string, number]
    const masses: Mass[] =
      facing === 'front'
        ? [
            [-26 * sx, -74, 28, 22, moss, 0.92],
            [14 * sx, -80, 26, 20, bark, 0.95],
            [-6 * sx, -94, 34, 26, moss, 1],
            [8 * sx, -88, 20, 16, bark, 0.75],
            [-14 * sx, -84, 18, 14, highlight, 0.35],
          ]
        : facing === 'back'
          ? [
              [6 * sx, -92, 30, 24, bark, 1],
              [-10 * sx, -78, 22, 18, moss, 0.85],
              [2 * sx, -98, 24, 18, moss, 0.8],
            ]
          : [
              [10 * sx, -84, 28, 21, moss, 0.95],
              [-14 * sx, -76, 18, 15, bark, 0.82],
              [0, -100, 22, 18, moss, 0.88],
              [16 * sx, -72, 14, 12, highlight, 0.3],
            ]
    return masses.map(([cx, cy, rx, ry, fill, op], i) =>
      canopyMass(`cm${i}`, cx, cy, rx, ry, fill, rim, C, op),
    )
  }

  switch (facing) {
    case 'front':
      out.push(
        trunk('M -9 0 C -9 -38, -6 -66, -3 -90 L 5 -90 C 10 -62, 10 -36, 10 0 Z', 'tr'),
        e('path', {
          key: 'low-limb',
          d: 'M -2 -50 Q -30 -44 -42 -28 Q -24 -40 -2 -46',
          stroke: moss,
          strokeWidth: 4.6,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('path', {
          key: 'branch-r',
          d: 'M 4 -62 Q 18 -72 24 -64 Q 16 -68 6 -64',
          stroke: bark,
          strokeWidth: 2.4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        ...canopyStack('front'),
        e('path', {
          key: 'hl-rim',
          d: 'M -38 -80 Q -8 -108 28 -76',
          stroke: highlight,
          strokeWidth: 1.4,
          fill: 'none',
          opacity: 0.25 * rim,
        }),
        e('ellipse', {
          key: 'hollow',
          cx: 5,
          cy: -38,
          rx: 4.5,
          ry: 7,
          fill: highlight,
          opacity: 0.55,
        }),
        e('path', {
          key: 'roots-l',
          d: 'M -7 0 Q -20 7 -16 11 M -2 0 Q -14 9 -9 13',
          stroke: bark,
          strokeWidth: 2.4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('path', {
          key: 'lean',
          d: 'M 7 -22 Q 12 -44 7 -60',
          stroke: C.rim,
          strokeWidth: 1,
          fill: 'none',
          opacity: 0.35 * rim,
        }),
      )
      break
    case 'back':
      out.push(
        trunk('M -8 0 C -8 -36, -5 -60, 0 -88 L 7 -88 C 12 -58, 12 -34, 12 0 Z', 'tr'),
        ...canopyStack('back'),
        e('path', {
          key: 'roots-r',
          d: 'M 7 0 Q 18 6 22 10 M 3 0 Q 16 8 20 12',
          stroke: bark,
          strokeWidth: 2.1,
          fill: 'none',
          strokeLinecap: 'round',
        }),
      )
      break
    case 'left':
      out.push(
        e('path', { key: 'trunk-edge', d: 'M -11 0 L -7 -92 L -2 -94 L 3 -90 L 7 0 Z', fill: bark }),
        e('path', {
          key: 'limb-out',
          d: 'M -7 -38 Q 16 -30 30 -18',
          stroke: moss,
          strokeWidth: 4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        ...canopyStack('side', 1),
      )
      break
    case 'right':
      out.push(
        e('path', { key: 'trunk-edge', d: 'M 11 0 L 7 -90 L 2 -94 L -3 -90 L -7 0 Z', fill: bark }),
        e('path', {
          key: 'limb-low',
          d: 'M 5 -54 Q -18 -48 -30 -34',
          stroke: moss,
          strokeWidth: 4.2,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        ...canopyStack('side', -1),
        e('circle', {
          key: 'knot',
          cx: 6,
          cy: -30,
          r: 3.4,
          fill: C.silSoft,
          stroke: C.rim,
          strokeWidth: 0.6,
          strokeOpacity: 0.5 * rim,
        }),
      )
      break
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }

  out.push(e('ellipse', { key: 'base-shadow', cx: 0, cy: 3, rx: 22, ry: 4.5, fill: C.rim, opacity: 0.2 }))

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
  const caps: readonly string[] = [C.glow, C.silSoft, C.sil, C.accent]
  const stem = C.silSoft
  const gill = C.rim
  const tilt = facing === 'left' ? -10 : facing === 'right' ? 10 : facing === 'back' ? 3 : -5
  const gillOpacity = facing === 'back' ? 0.75 : facing === 'front' ? 0.55 : 0.28
  const out: ReactNode[] = []

  const specs: [number, number, number, number][] =
    stage >= 6
      ? [
          [0, 0, 1.15, 0],
          [-11, 1.2, 0.78, 1],
          [10, 0.6, 0.88, 2],
          [-18, 1.8, 0.52, 0],
        ]
      : [
          [0, 0, 1, 0],
          [-8, 0.9, 0.7, 1],
        ]

  specs.forEach(([mx, my, sc, capIx], i) => {
    const w = (7.5 + stage * 0.75) * sc
    const h = w * 0.55
    const capFill = caps[capIx % caps.length]
    const stemW = w * 0.28
    out.push(
      e(
        'g',
        { key: `mc${i}`, transform: `translate(${mx} ${my}) rotate(${tilt * 0.12})` },
        e('ellipse', { key: 'shadow', cx: tilt * 0.08, cy: 3.2, rx: w * 0.85, ry: h * 0.22, fill: C.rim, opacity: 0.22 }),
        e('rect', {
          key: 'stem',
          x: -stemW * 0.5,
          y: -h * 1.35,
          width: stemW,
          height: h * 1.35,
          rx: stemW * 0.35,
          fill: stem,
          stroke: C.rim,
          strokeOpacity: 0.25 * rim,
          strokeWidth: 0.4,
        }),
        e('ellipse', {
          key: 'gills',
          cx: 0,
          cy: -h * 0.15,
          rx: w * 0.82,
          ry: h * 0.32,
          fill: gill,
          opacity: gillOpacity * 0.35,
        }),
        e('ellipse', {
          key: 'cap',
          cx: tilt * 0.05,
          cy: -h * 1.15,
          rx: w,
          ry: h,
          fill: capFill,
          stroke: C.rim,
          strokeOpacity: 0.4 * rim,
          strokeWidth: 0.55,
        }),
        capIx === 0
          ? e('circle', { key: 'spot', cx: w * 0.35, cy: -h * 1.35, r: w * 0.11, fill: C.glow, opacity: 0.9 })
          : null,
        capIx === 1
          ? e('circle', { key: 'spot2', cx: -w * 0.25, cy: -h * 1.2, r: w * 0.08, fill: C.glow, opacity: 0.85 })
          : null,
        e('path', {
          key: 'cap-shine',
          d: `M ${-w * 0.55} ${-h * 1.05} Q ${tilt * 0.05} ${-h * 1.55}, ${w * 0.35} ${-h * 1.1}`,
          stroke: C.glow,
          strokeWidth: 0.8,
          fill: 'none',
          opacity: 0.35,
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
      out.push(
        e('path', { key: 'fa', d: 'M 4 -18 Q 16 -22 18 -10', stroke: C.glow, strokeWidth: 1.4, fill: 'none', opacity: 0.9 }),
      )
      out.push(e('circle', { key: 'fbloom', cx: 16, cy: -12, r: 4.5, fill: C.accent, opacity: 0.82 }))
    } else if (facing === 'right') {
      out.push(e('circle', { key: 'fb', cx: -12, cy: -16, r: 4.8, fill: C.accent, opacity: 0.78 }))
      out.push(e('circle', { key: 'fb-core', cx: -12, cy: -16, r: 2, fill: C.glow, opacity: 0.95 }))
    } else if (facing === 'front') {
      out.push(e('circle', { key: 'fc', cx: side * 8, cy: -20, r: 4.2, fill: C.glow, opacity: 0.88 }))
      out.push(e('circle', { key: 'fc-ring', cx: side * 8, cy: -20, r: 5.5, fill: 'none', stroke: C.accent, strokeWidth: 0.7, opacity: 0.65 }))
    }
  }

  if (variety === 'herb' || variety === 'vine') {
    out.push(
      e('path', {
        key: 'hd',
        d: `M 0 -10 Q ${side * 12} -18 ${side * 16} -8`,
        stroke: C.glow,
        strokeWidth: 1.6,
        fill: 'none',
        strokeLinecap: 'round',
        opacity: facing === 'back' ? 0.55 : 0.95,
      }),
    )
    out.push(
      e('circle', { key: 'herb-tip', cx: side * 16, cy: -8, r: 2.2, fill: C.silSoft, opacity: 0.9 }),
    )
  }

  if (variety === 'fern') {
    out.push(
      e('path', {
        key: 'fr',
        d: `M 0 -6 Q ${side * 14} -16 ${side * 8} -24`,
        stroke: C.glow,
        strokeWidth: 1.1,
        fill: 'none',
        opacity: 0.7 * rim,
      }),
    )
  }

  if (variety === 'succulent') {
    out.push(e('circle', { key: 'succ-glow', cx: side * 4, cy: -8, r: 3, fill: C.glow, opacity: 0.55 }))
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
