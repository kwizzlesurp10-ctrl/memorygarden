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

function foliageLobe(
  key: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tone: CanopyTone,
  C: HybridPlantPalette,
  rim: number,
): ReactNode {
  const fill = tone === 'shadow' ? C.sil : tone === 'mid' ? C.silSoft : C.glow
  return e('ellipse', {
    key,
    cx,
    cy,
    rx,
    ry,
    fill,
    opacity: tone === 'light' ? 0.38 : tone === 'mid' ? 0.92 : 1,
    stroke: C.rim,
    strokeOpacity: 0.08 * rim,
    strokeWidth: 0.4,
  })
}

/** Wide, rounded crown — overlapping ellipses (no flat shelves). */
function elderCloudCanopy(
  facing: 'front' | 'back' | 'side',
  C: HybridPlantPalette,
  rim: number,
  flip = 1,
): ReactNode[] {
  const f = flip
  const crownW = 88
  type Lobe = [string, number, number, number, number, CanopyTone]
  const lobes: Lobe[] =
    facing === 'front'
      ? [
          ['u0', -crownW * 0.38 * f, -92, crownW * 0.42, crownW * 0.3, 'shadow'],
          ['u1', crownW * 0.32 * f, -88, crownW * 0.38, crownW * 0.28, 'shadow'],
          ['u2', -crownW * 0.1 * f, -104, crownW * 0.48, crownW * 0.34, 'mid'],
          ['u3', crownW * 0.12 * f, -98, crownW * 0.4, crownW * 0.3, 'mid'],
          ['u4', -crownW * 0.5 * f, -78, crownW * 0.34, crownW * 0.26, 'mid'],
          ['u5', crownW * 0.45 * f, -74, crownW * 0.32, crownW * 0.24, 'shadow'],
          ['u6', -crownW * 0.22 * f, -112, crownW * 0.36, crownW * 0.28, 'light'],
          ['u7', crownW * 0.08 * f, -82, crownW * 0.3, crownW * 0.22, 'light'],
          ['u8', crownW * 0.28 * f, -108, crownW * 0.34, crownW * 0.26, 'light'],
        ]
      : facing === 'back'
        ? [
            ['u0', crownW * 0.2 * f, -96, crownW * 0.44, crownW * 0.32, 'shadow'],
            ['u1', -crownW * 0.28 * f, -84, crownW * 0.36, crownW * 0.26, 'mid'],
            ['u2', 0, -108, crownW * 0.5, crownW * 0.34, 'mid'],
            ['u3', -crownW * 0.12 * f, -100, crownW * 0.38, crownW * 0.28, 'light'],
            ['u4', crownW * 0.36 * f, -88, crownW * 0.3, crownW * 0.22, 'shadow'],
            ['u5', -crownW * 0.42 * f, -94, crownW * 0.32, crownW * 0.24, 'mid'],
          ]
        : [
            ['u0', crownW * 0.3 * f, -90, crownW * 0.4, crownW * 0.3, 'shadow'],
            ['u1', -crownW * 0.35 * f, -82, crownW * 0.34, crownW * 0.26, 'mid'],
            ['u2', crownW * 0.05 * f, -106, crownW * 0.46, crownW * 0.32, 'mid'],
            ['u3', crownW * 0.42 * f, -76, crownW * 0.3, crownW * 0.22, 'light'],
            ['u4', -crownW * 0.08 * f, -94, crownW * 0.36, crownW * 0.28, 'shadow'],
            ['u5', -crownW * 0.2 * f, -72, crownW * 0.28, crownW * 0.2, 'light'],
            ['u6', crownW * 0.18 * f, -100, crownW * 0.32, crownW * 0.24, 'mid'],
          ]
  return lobes.map(([key, cx, cy, rx, ry, tone]) => foliageLobe(key, cx, cy, rx, ry, tone, C, rim))
}

function buildElderTreeFacing(
  facing: PlantFacing,
  C: HybridPlantPalette,
  rim: number,
  scale = 1,
): ReactNode[] {
  const bark = C.bank
  const barkMid = C.silSoft
  const limbWood = C.sil
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
      stroke: barkMid,
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
      stroke: limbWood,
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
      stroke: limbWood,
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
      out.push(...trunkFront(), ...elderCloudCanopy('front', C, rim))
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
        ...elderCloudCanopy('back', C, rim),
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
          stroke: limbWood,
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
        ...elderCloudCanopy('side', C, rim, 1),
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
          stroke: limbWood,
          strokeWidth: 4.2,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('circle', {
          key: 'knot',
          cx: 6,
          cy: -30,
          r: 3.4,
          fill: barkMid,
          stroke: C.rim,
          strokeWidth: 0.6,
          strokeOpacity: 0.5 * rim,
        }),
        ...elderCloudCanopy('side', C, rim, -1),
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

/** Warm earth tones only — no leaf greens on mushrooms. */
const MUSHROOM_CAP: readonly ['cream', 'tan', 'ochre', 'red-brown'] = [
  'cream',
  'tan',
  'ochre',
  'red-brown',
]

function capFillFor(kind: (typeof MUSHROOM_CAP)[number], C: HybridPlantPalette): string {
  switch (kind) {
    case 'cream':
      return C.glow
    case 'tan':
      return C.rim
    case 'ochre':
      return C.accent
    case 'red-brown':
      return C.fire
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function oneMushroom(
  key: string,
  stemW: number,
  capKind: (typeof MUSHROOM_CAP)[number],
  rim: number,
  C: HybridPlantPalette,
  litSide: number,
  spots: boolean,
  tiltDeg: number,
): ReactNode {
  const capW = stemW * 2.2
  const domeRise = capW * 0.55
  const stemH = stemW * 3.4
  const baseY = 0
  const capFill = capFillFor(capKind, C)
  const gillTone = capKind === 'red-brown' ? C.accent : C.fire
  return e(
    'g',
    { key, transform: `rotate(${tiltDeg})` },
    e('ellipse', {
      key: 'sh',
      cx: litSide * 1.2,
      cy: baseY + 2.6,
      rx: capW * 0.75,
      ry: stemW * 0.35,
      fill: C.bank,
      opacity: 0.35,
    }),
    e('path', {
      key: 'stem',
      d: `M ${-stemW * 0.42} ${baseY} L ${-stemW * 0.52} ${-stemH} Q 0 ${-stemH - stemW * 0.2} ${stemW * 0.52} ${-stemH} L ${stemW * 0.42} ${baseY} Z`,
      fill: C.glow,
      opacity: 0.92,
    }),
    e('path', {
      key: 'cap',
      d: `M ${-capW} ${baseY} A ${capW} ${domeRise} 0 0 1 ${capW} ${baseY} Z`,
      fill: capFill,
      stroke: C.accent,
      strokeOpacity: 0.22 * rim,
      strokeWidth: 0.45,
    }),
    e('path', {
      key: 'gill-band',
      d: `M ${-capW * 0.62} ${baseY - 0.5} Q 0 ${baseY + domeRise * 0.14} ${capW * 0.62} ${baseY - 0.5}`,
      stroke: gillTone,
      strokeWidth: Math.max(0.32, stemW * 0.12),
      fill: 'none',
      opacity: 0.55,
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'cap-lit',
      d: `M ${litSide * capW * 0.15} ${baseY - domeRise * 0.35} Q ${litSide * capW * 0.42} ${baseY - domeRise * 0.92} ${litSide * capW * 0.58} ${baseY - domeRise * 0.55}`,
      stroke: C.glow,
      strokeWidth: 0.75,
      fill: 'none',
      opacity: 0.55,
      strokeLinecap: 'round',
    }),
    spots
      ? [
          e('circle', { key: 's1', cx: capW * 0.2, cy: baseY - domeRise * 0.62, r: stemW * 0.22, fill: C.glow, opacity: 0.95 }),
          e('circle', { key: 's2', cx: -capW * 0.12, cy: baseY - domeRise * 0.48, r: stemW * 0.16, fill: C.glow, opacity: 0.9 }),
          capKind === 'red-brown'
            ? e('circle', { key: 's3', cx: capW * 0.05, cy: baseY - domeRise * 0.78, r: stemW * 0.12, fill: C.glow, opacity: 0.88 })
            : null,
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
  const lit = facing === 'right' || facing === 'back' ? -1 : 1
  const out: ReactNode[] = []

  const specs: [number, number, number, number, number, boolean][] =
    stage >= 6
      ? [
          [0, 0, 1.05, 0, -5, false],
          [-11, 1.4, 0.82, 1, 7, false],
          [10, 0.6, 0.92, 2, -9, false],
          [-16, 2, 0.58, 3, 11, true],
        ]
      : [
          [0, 0, 1, 0, -4, false],
          [-8, 1.1, 0.75, 1, 6, false],
        ]

  specs.forEach(([mx, my, sc, capIx, tilt, spots], i) => {
    const stemW = (3.2 + stage * 0.22) * sc
    const capKind = MUSHROOM_CAP[capIx % MUSHROOM_CAP.length]
    out.push(
      e(
        'g',
        { key: `mc${i}`, transform: `translate(${mx} ${my})` },
        oneMushroom(`m${i}`, stemW, capKind, rim, C, lit, spots, tilt),
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
