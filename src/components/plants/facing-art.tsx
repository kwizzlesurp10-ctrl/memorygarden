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

type CanopyTone = 'shadow' | 'mid' | 'light'

function leafClump(
  key: string,
  cx: number,
  cy: number,
  sx: number,
  sy: number,
  tone: CanopyTone,
  C: HybridPlantPalette,
  rim: number,
  flip = 1,
): ReactNode {
  const fill = tone === 'shadow' ? C.sil : C.silSoft
  const w = 26 * sx
  const h = 20 * sy
  const f = flip
  const d = `M ${cx - w * f} ${cy} Q ${cx - w * 0.55 * f} ${cy - h * 1.35} ${cx - w * 0.15 * f} ${cy - h} Q ${cx + w * 0.35 * f} ${cy - h * 1.2} ${cx + w * 0.7 * f} ${cy - h * 0.55} Q ${cx + w * 0.45 * f} ${cy - h * 0.15} ${cx + w * f} ${cy + h * 0.12} Q ${cx + w * 0.1 * f} ${cy + h * 0.35} ${cx - w * f} ${cy} Z`
  return e('path', {
    key,
    d,
    fill,
    opacity: tone === 'light' ? 0.72 : tone === 'mid' ? 0.9 : 1,
    stroke: C.rim,
    strokeOpacity: 0.1 * rim,
    strokeWidth: 0.45,
  })
}

function elderCanopy(facing: 'front' | 'back' | 'side', C: HybridPlantPalette, rim: number, flip = 1): ReactNode[] {
  const f = flip
  type Clump = [string, number, number, number, number, CanopyTone]
  const clumps: Clump[] =
    facing === 'front'
      ? [
          ['c0', -28 * f, -76, 1.15, 1.05, 'shadow'],
          ['c1', 16 * f, -82, 1.05, 0.95, 'shadow'],
          ['c2', -8 * f, -98, 1.35, 1.1, 'mid'],
          ['c3', 12 * f, -92, 0.95, 0.85, 'mid'],
          ['c4', -22 * f, -88, 0.82, 0.78, 'light'],
          ['c5', 4 * f, -78, 0.75, 0.72, 'light'],
          ['c6', -4 * f, -108, 1.1, 0.95, 'mid'],
        ]
      : facing === 'back'
        ? [
            ['c0', 8 * f, -94, 1.1, 1, 'shadow'],
            ['c1', -14 * f, -80, 0.95, 0.88, 'mid'],
            ['c2', 2 * f, -104, 1.05, 0.92, 'mid'],
            ['c3', -6 * f, -96, 0.78, 0.8, 'light'],
          ]
        : [
            ['c0', 12 * f, -86, 1.08, 0.98, 'shadow'],
            ['c1', -16 * f, -78, 0.9, 0.82, 'mid'],
            ['c2', 2 * f, -102, 1.05, 0.95, 'mid'],
            ['c3', 18 * f, -74, 0.72, 0.68, 'light'],
            ['c4', -6 * f, -92, 0.85, 0.8, 'mid'],
            ['c5', 8 * f, -96, 0.7, 0.65, 'light'],
          ]
  return clumps.map(([key, cx, cy, sx, sy, tone]) => leafClump(key, cx, cy, sx, sy, tone, C, rim, f))
}

function buildElderTreeFacing(
  facing: PlantFacing,
  C: HybridPlantPalette,
  rim: number,
  scale = 1,
): ReactNode[] {
  const bark = C.sil
  const moss = C.silSoft
  const lightBark = C.silSoft
  const out: ReactNode[] = []

  const trunkFront = () => [
    e('path', {
      key: 'trunk',
      d: 'M -15 1 C -18 0 -16 -2 -12 0 L -10 -42 C -8 -72 -5 -88 -2 -96 L 6 -96 C 9 -86 11 -68 13 -42 L 14 0 C 18 -2 16 1 12 1 Z',
      fill: bark,
      stroke: C.rim,
      strokeOpacity: 0.4 * rim,
      strokeWidth: 0.75,
    }),
    e('path', {
      key: 'trunk-lit',
      d: 'M 6 -20 C 9 -48 8 -74 6 -92',
      stroke: lightBark,
      strokeWidth: 2.2,
      fill: 'none',
      opacity: 0.45,
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'limb-l',
      d: 'M -2 -52 C -14 -46 -34 -36 -42 -24',
      stroke: bark,
      strokeWidth: 5.2,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'limb-r',
      d: 'M 4 -64 C 14 -72 26 -68 30 -56',
      stroke: moss,
      strokeWidth: 3.8,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'limb-up',
      d: 'M 0 -76 C 6 -86 2 -94 -4 -98',
      stroke: bark,
      strokeWidth: 3.2,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'low-limb',
      d: 'M -2 -50 Q -30 -44 -42 -28 Q -24 -40 -2 -46',
      stroke: moss,
      strokeWidth: 4.6,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('ellipse', {
      key: 'hollow',
      cx: 5,
      cy: -38,
      rx: 4.5,
      ry: 7,
      fill: C.glow,
      opacity: 0.48,
    }),
    e('path', {
      key: 'roots-l',
      d: 'M -10 1 Q -22 9 -18 14 M -3 1 Q -16 10 -11 14 M 8 1 Q 16 8 20 11',
      stroke: bark,
      strokeWidth: 2.6,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'lean',
      d: 'M 8 -24 Q 14 -46 8 -62',
      stroke: C.rim,
      strokeWidth: 1,
      fill: 'none',
      opacity: 0.35 * rim,
    }),
  ]

  switch (facing) {
    case 'front':
      out.push(...trunkFront(), ...elderCanopy('front', C, rim))
      break
    case 'back':
      out.push(
        e('path', {
          key: 'trunk',
          d: 'M -12 1 C -15 0 -12 -2 -8 0 L -6 -40 C -4 -68 -2 -86 0 -94 L 8 -94 C 10 -84 12 -64 14 -38 L 16 0 C 20 -2 18 1 14 1 Z',
          fill: bark,
        }),
        e('path', {
          key: 'limb',
          d: 'M 2 -58 C 12 -52 22 -42 26 -30',
          stroke: bark,
          strokeWidth: 4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('path', {
          key: 'roots-r',
          d: 'M 8 1 Q 20 8 24 12 M 2 1 Q 14 9 18 13',
          stroke: bark,
          strokeWidth: 2.4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        ...elderCanopy('back', C, rim),
      )
      break
    case 'left':
      out.push(
        e('path', {
          key: 'trunk',
          d: 'M -14 1 L -8 -94 C -4 -98 0 -96 4 -90 L 10 1 C 6 3 2 2 -2 2 Z',
          fill: bark,
        }),
        e('path', {
          key: 'limb-out',
          d: 'M -6 -40 C 10 -32 26 -22 34 -10',
          stroke: moss,
          strokeWidth: 4.4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('path', {
          key: 'limb-up',
          d: 'M -4 -70 C 4 -82 0 -92 -6 -98',
          stroke: bark,
          strokeWidth: 3.4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        ...elderCanopy('side', C, rim, 1),
      )
      break
    case 'right':
      out.push(
        e('path', {
          key: 'trunk',
          d: 'M 14 1 L 8 -92 C 4 -98 0 -96 -4 -90 L -10 1 C -6 3 -2 2 2 2 Z',
          fill: bark,
        }),
        e('path', {
          key: 'limb-low',
          d: 'M 6 -54 C -12 -48 -28 -36 -34 -24',
          stroke: moss,
          strokeWidth: 4.2,
          fill: 'none',
          strokeLinecap: 'round',
        }),
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
        ...elderCanopy('side', C, rim, -1),
      )
      break
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }

  out.push(e('ellipse', { key: 'base-shadow', cx: 0, cy: 4, rx: 26, ry: 5, fill: C.rim, opacity: 0.24 }))

  if (scale !== 1) {
    return [e('g', { key: 'elder-scale', transform: `scale(${scale})` }, out)]
  }
  return out
}

function mushroomCapColors(C: HybridPlantPalette): readonly [string, string, string, string] {
  return [C.glow, C.silSoft, C.accent, C.sil]
}

function oneMushroom(
  key: string,
  w: number,
  capFill: string,
  rim: number,
  C: HybridPlantPalette,
  litSide: number,
  spots: boolean,
  tiltDeg: number,
  showGill: boolean,
): ReactNode {
  const domeH = w * 0.62
  const capW = w * 1.15
  const stemW = w * 0.24
  const stemH = w * 0.95
  const baseY = 0
  const gillY = -stemH + 1.5
  return e(
    'g',
    { key, transform: `rotate(${tiltDeg})` },
    e('ellipse', { key: 'sh', cx: litSide * 1.5, cy: baseY + 2.8, rx: capW * 0.95, ry: w * 0.14, fill: C.rim, opacity: 0.26 }),
    e('rect', {
      key: 'stem',
      x: -stemW * 0.5,
      y: -stemH,
      width: stemW,
      height: stemH,
      rx: stemW * 0.4,
      fill: C.glow,
      opacity: 0.88,
    }),
    showGill
      ? e('path', {
          key: 'gill-band',
          d: `M ${-capW * 0.55} ${gillY} Q 0 ${gillY + domeH * 0.12} ${capW * 0.55} ${gillY}`,
          stroke: C.sil,
          strokeWidth: Math.max(0.35, w * 0.045),
          fill: 'none',
          opacity: 0.42,
          strokeLinecap: 'round',
        })
      : null,
    e('path', {
      key: 'cap',
      d: `M ${-capW} ${baseY} Q ${-capW * 0.55} ${-domeH * 1.85} 0 ${-domeH * 1.55} Q ${capW * 0.55} ${-domeH * 1.85} ${capW} ${baseY} Z`,
      fill: capFill,
      stroke: C.rim,
      strokeOpacity: 0.35 * rim,
      strokeWidth: 0.5,
    }),
    e('path', {
      key: 'cap-lit',
      d: `M ${litSide * capW * 0.1} ${-domeH * 0.55} Q ${litSide * capW * 0.35} ${-domeH * 1.2} ${litSide * capW * 0.55} ${-domeH * 0.75}`,
      stroke: C.glow,
      strokeWidth: 0.65,
      fill: 'none',
      opacity: 0.45,
      strokeLinecap: 'round',
    }),
    spots
      ? [
          e('circle', { key: 's1', cx: capW * 0.22, cy: -domeH * 1.1, r: w * 0.09, fill: C.glow, opacity: 0.92 }),
          e('circle', { key: 's2', cx: -capW * 0.18, cy: -domeH * 0.85, r: w * 0.07, fill: C.glow, opacity: 0.88 }),
        ]
      : null,
  )
}

export function buildReadableMushroomCluster(
  facing: PlantFacing,
  C: HybridPlantPalette,
  rim: number,
  stage: number,
): ReactNode[] {
  const palette = mushroomCapColors(C)
  const lit = facing === 'right' || facing === 'back' ? -1 : 1
  const showGill = facing === 'left' || facing === 'right' || facing === 'back'
  const out: ReactNode[] = []

  const specs: [number, number, number, number, number, boolean][] =
    stage >= 6
      ? [
          [0, 0, 1.12, 0, -4, false],
          [-12, 1.5, 0.76, 1, 6, false],
          [11, 0.8, 0.9, 2, -8, false],
          [-17, 2.2, 0.55, 3, 10, true],
        ]
      : [
          [0, 0, 1, 0, -3, false],
          [-9, 1.2, 0.72, 1, 5, false],
        ]

  specs.forEach(([mx, my, sc, capIx, tilt, spots], i) => {
    const w = (7 + stage * 0.7) * sc
    const capFill = palette[capIx % palette.length]
    out.push(
      e(
        'g',
        { key: `mc${i}`, transform: `translate(${mx} ${my})` },
        oneMushroom(`m${i}`, w, capFill, rim, C, lit, spots, tilt, showGill),
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
