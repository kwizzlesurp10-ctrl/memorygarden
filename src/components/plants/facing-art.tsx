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
    return [e('g', { key: 'elder-facing' }, buildElderTreeFacing(facing, C, rim, 1, rimFromLeft))]
  }
  if (variety === 'tree' && stageIndex >= 4) {
    return [e('g', { key: 'tree-facing' }, buildElderTreeFacing(facing, C, rim * 0.85, 0.88, rimFromLeft))]
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

type CanopyTone = 'deep' | 'shadow' | 'mid' | 'light' | 'highlight'

const ELDER_CANOPY_LIGHT = '#7FA05A'
const ELDER_CANOPY_HIGHLIGHT = '#95B86A'

function canopyFill(tone: CanopyTone, C: HybridPlantPalette): string {
  switch (tone) {
    case 'deep':
      return C.sil
    case 'shadow':
      return C.silSoft
    case 'mid':
      return ELDER_CANOPY_LIGHT
    case 'light':
      return '#88A862'
    case 'highlight':
      return ELDER_CANOPY_HIGHLIGHT
    default: {
      const _exhaustive: never = tone
      return _exhaustive
    }
  }
}

/** Irregular scalloped blob — many small bumps instead of one smooth ellipse. */
function foliageBlobPath(cx: number, cy: number, rx: number, ry: number, lobes: number, phase: number): string {
  const steps = lobes * 2
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const wobble = 0.9 + 0.1 * Math.cos(a * lobes + phase)
    const px = cx + Math.cos(a) * rx * wobble
    const py = cy + Math.sin(a) * ry * wobble
    d += `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)} `
  }
  return `${d}Z`
}

function foliageClump(
  key: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tone: CanopyTone,
  C: HybridPlantPalette,
  rim: number,
  phase: number,
): ReactNode {
  return e('path', {
    key,
    d: foliageBlobPath(cx, cy, rx, ry, 4, phase),
    fill: canopyFill(tone, C),
    stroke: C.sil,
    strokeOpacity: 0.04 * rim,
    strokeWidth: 0.25,
    strokeLinejoin: 'round',
  })
}

type ClumpSpec = [string, number, number, number, number, CanopyTone, number]

function elderCrownBranches(C: HybridPlantPalette, flip: number): ReactNode[] {
  const f = flip
  return [
    e('path', {
      key: 'br-a',
      d: `M ${-4 * f} -56 L ${-16 * f} -68 M ${-4 * f} -56 L ${4 * f} -72 M ${2 * f} -68 L ${12 * f} -82`,
      stroke: C.bank,
      strokeWidth: 2.4,
      fill: 'none',
      strokeLinecap: 'round',
      opacity: 0.82,
    }),
    e('path', {
      key: 'br-b',
      d: `M ${8 * f} -62 L ${26 * f} -80 M ${-8 * f} -64 L ${-28 * f} -82`,
      stroke: C.sil,
      strokeWidth: 2,
      fill: 'none',
      strokeLinecap: 'round',
      opacity: 0.7,
    }),
  ]
}

function elderCrownMass(facing: 'front' | 'back' | 'side', C: HybridPlantPalette, flip: number): ReactNode {
  const f = flip
  const d =
    facing === 'front'
      ? `M ${-46 * f} -56 Q ${-58 * f} -96 ${-32 * f} -112 Q ${-4 * f} -120 ${24 * f} -108 Q ${52 * f} -92 ${54 * f} -68 Q ${50 * f} -48 ${26 * f} -40 Q ${-2 * f} -36 ${-30 * f} -44 Q ${-52 * f} -52 ${-46 * f} -56 Z`
      : facing === 'back'
        ? `M ${40 * f} -58 Q ${56 * f} -94 ${28 * f} -110 Q ${0} -116 ${-26 * f} -102 Q ${-50 * f} -88 ${-48 * f} -64 Q ${-42 * f} -46 ${-16 * f} -40 Q ${12 * f} -38 ${38 * f} -48 Q ${54 * f} -54 ${40 * f} -58 Z`
        : `M ${36 * f} -52 Q ${52 * f} -88 ${26 * f} -106 Q ${0 * f} -110 ${-22 * f} -96 Q ${-44 * f} -80 ${-40 * f} -58 Q ${-34 * f} -42 ${-8 * f} -38 Q ${18 * f} -36 ${36 * f} -52 Z`
  return e('path', { key: 'crown-mass', d, fill: C.sil, opacity: 0.94 })
}

/** Broad old-tree crown: many small clumps, value steps, deliberate gaps for sky. */
function elderOrganicCanopy(
  facing: 'front' | 'back' | 'side',
  C: HybridPlantPalette,
  rim: number,
  litSide: number,
  flip = 1,
): ReactNode[] {
  const f = flip
  const sun = litSide > 0 ? 1 : -1
  const base: ClumpSpec[] =
    facing === 'front'
      ? [
          ['c0', -44 * f, -88, 22, 16, 'deep', 0.2],
          ['c1', 40 * f, -84, 20, 15, 'deep', 1.1],
          ['c2', -28 * f, -102, 24, 18, 'shadow', 0.5],
          ['c3', 18 * f, -100, 22, 17, 'shadow', 1.8],
          ['c4', -6 * f, -112, 28, 20, 'mid', 0.9],
          ['c5', -52 * f, -74, 18, 14, 'shadow', 2.2],
          ['c6', 48 * f, -72, 17, 13, 'deep', 0.6],
          ['c7', -20 * f, -78, 16, 12, 'mid', 1.4],
          ['c8', 32 * f, -92, 19, 14, 'mid', 2.6],
          ['c9', 8 * f, -118, 20, 15, 'light', 1.2],
          ['c10', -36 * f, -96, 15, 11, 'light', 0.3],
          ['c11', 26 * f, -74, 14, 10, 'shadow', 1.9],
          ['c12', -12 * f, -88, 14, 10, 'mid', 2.8],
          ['c13', 0, -104, 16, 12, 'light', 0.7],
        ]
      : facing === 'back'
        ? [
            ['c0', 22 * f, -94, 23, 17, 'deep', 0.4],
            ['c1', -30 * f, -86, 20, 15, 'shadow', 1.2],
            ['c2', 0, -108, 26, 19, 'mid', 0.8],
            ['c3', -14 * f, -98, 18, 13, 'light', 2.1],
            ['c4', 36 * f, -88, 17, 12, 'shadow', 1.6],
            ['c5', -42 * f, -92, 16, 12, 'deep', 0.1],
            ['c6', 12 * f, -78, 15, 11, 'mid', 2.4],
            ['c7', -8 * f, -74, 14, 10, 'shadow', 0.9],
            ['c8', 28 * f, -100, 16, 12, 'mid', 1.7],
          ]
        : [
            ['c0', 28 * f, -88, 21, 15, 'deep', 0.5],
            ['c1', -32 * f, -80, 19, 14, 'shadow', 1.3],
            ['c2', 6 * f, -106, 25, 18, 'mid', 0.6],
            ['c3', 38 * f, -74, 16, 12, 'light', 2.0],
            ['c4', -10 * f, -92, 17, 13, 'shadow', 1.1],
            ['c5', -24 * f, -70, 15, 11, 'deep', 2.3],
            ['c6', 16 * f, -98, 16, 12, 'mid', 1.8],
            ['c7', -18 * f, -96, 14, 10, 'light', 0.2],
            ['c8', 22 * f, -68, 13, 10, 'shadow', 2.6],
          ]

  const highlights: ClumpSpec[] =
    facing === 'front'
      ? [
          ['h0', 14 * sun * f, -108, 11, 8, 'highlight', 0.4],
          ['h1', -8 * sun * f, -114, 10, 7, 'highlight', 1.6],
          ['h2', 34 * sun * f, -86, 9, 7, 'highlight', 2.2],
        ]
      : facing === 'back'
        ? [['h0', -10 * sun * f, -106, 10, 7, 'highlight', 0.5]]
        : [
            ['h0', 20 * sun * f, -96, 10, 7, 'highlight', 0.8],
            ['h1', -6 * sun * f, -102, 9, 6, 'highlight', 1.9],
          ]

  const toneOrder: Record<CanopyTone, number> = {
    deep: 0,
    shadow: 1,
    mid: 2,
    light: 3,
    highlight: 4,
  }
  const sorted = [...base, ...highlights].sort((a, b) => toneOrder[a[5]] - toneOrder[b[5]])

  return [
    elderCrownMass(facing, C, f),
    ...elderCrownBranches(C, f),
    ...sorted.map(([key, cx, cy, rx, ry, tone, phase]) =>
      foliageClump(key, cx * f, cy, rx, ry, tone, C, rim, phase),
    ),
  ]
}

function cameraFacingBarkDetail(
  facing: PlantFacing,
  C: HybridPlantPalette,
  bark: string,
  rim: number,
): ReactNode[] {
  switch (facing) {
    case 'front':
      return [
        e('ellipse', {
          key: 'knot',
          cx: 3,
          cy: -36,
          rx: 3.2,
          ry: 4.8,
          fill: bark,
          opacity: 0.72,
          stroke: C.sil,
          strokeWidth: 0.65,
          strokeOpacity: 0.55,
        }),
      ]
    case 'back':
      return [
        e('ellipse', {
          key: 'knot',
          cx: -2,
          cy: -34,
          rx: 2.8,
          ry: 4.2,
          fill: C.sil,
          opacity: 0.8,
        }),
      ]
    case 'left':
      return [
        e('ellipse', {
          key: 'hollow',
          cx: -5,
          cy: -32,
          rx: 2.4,
          ry: 3.8,
          fill: C.sil,
          opacity: 0.85,
          stroke: bark,
          strokeWidth: 0.5,
          strokeOpacity: 0.4 * rim,
        }),
      ]
    case 'right':
      return [
        e('circle', {
          key: 'knot',
          cx: 5,
          cy: -31,
          r: 2.6,
          fill: C.sil,
          opacity: 0.82,
          stroke: bark,
          strokeWidth: 0.55,
          strokeOpacity: 0.5,
        }),
      ]
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }
}

function buildElderTreeFacing(
  facing: PlantFacing,
  C: HybridPlantPalette,
  rim: number,
  scale = 1,
  rimFromLeft = true,
): ReactNode[] {
  const bark = C.bank
  const barkMid = C.silSoft
  const limbWood = C.sil
  const litSide = rimFromLeft ? 1 : -1
  const out: ReactNode[] = []

  const trunkCore = [
    e('path', {
      key: 'trunk',
      d: 'M -16 2 C -19 0 -17 -2 -13 0 L -11 -42 C -9 -72 -6 -88 -3 -96 L 6 -96 C 9 -86 11 -68 13 -42 L 15 0 C 19 -2 17 1 13 2 Z',
      fill: bark,
      stroke: C.rim,
      strokeOpacity: 0.35 * rim,
      strokeWidth: 0.7,
    }),
    e('path', {
      key: 'trunk-lit',
      d: 'M 7 -18 C 10 -46 9 -72 6 -90',
      stroke: barkMid,
      strokeWidth: 2,
      fill: 'none',
      opacity: 0.42,
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'trunk-shade',
      d: 'M -9 -16 C -12 -44 -11 -70 -8 -88',
      stroke: C.sil,
      strokeWidth: 1.6,
      fill: 'none',
      opacity: 0.28,
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'limb-l',
      d: 'M -2 -54 C -12 -50 -22 -44 -28 -36',
      stroke: bark,
      strokeWidth: 4.4,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'limb-r',
      d: 'M 4 -64 C 10 -70 18 -68 22 -58',
      stroke: limbWood,
      strokeWidth: 3.2,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'limb-up',
      d: 'M 0 -78 C 6 -88 2 -96 -4 -100',
      stroke: bark,
      strokeWidth: 3,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'roots',
      d: 'M -12 2 Q -26 10 -20 15 M -2 2 Q -14 11 -8 15 M 10 2 Q 22 9 24 12',
      stroke: bark,
      strokeWidth: 2.5,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    ...cameraFacingBarkDetail(facing, C, bark, rim),
  ]

  const canopyFacing: 'front' | 'back' | 'side' =
    facing === 'back' ? 'back' : facing === 'front' ? 'front' : 'side'
  const canopyFlip = facing === 'right' ? -1 : 1

  switch (facing) {
    case 'front':
      out.push(...trunkCore, ...elderOrganicCanopy(canopyFacing, C, rim, litSide, canopyFlip))
      break
    case 'back':
      out.push(
        e('path', {
          key: 'trunk',
          d: 'M -11 2 C -14 0 -11 -2 -7 0 L -5 -40 C -3 -68 -1 -86 1 -94 L 9 -94 C 11 -84 13 -64 15 -38 L 17 0 C 21 -2 19 1 15 2 Z',
          fill: bark,
        }),
        e('path', {
          key: 'limb',
          d: 'M 2 -60 C 14 -52 24 -42 28 -30',
          stroke: bark,
          strokeWidth: 4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('path', {
          key: 'roots-r',
          d: 'M 9 2 Q 22 9 26 13 M 3 2 Q 16 10 20 14',
          stroke: bark,
          strokeWidth: 2.3,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        ...cameraFacingBarkDetail('back', C, bark, rim),
        ...elderOrganicCanopy('back', C, rim, litSide, 1),
      )
      break
    case 'left':
      out.push(
        e('path', {
          key: 'trunk',
          d: 'M -13 2 L -7 -94 C -3 -98 1 -96 5 -90 L 11 2 C 7 4 3 3 -1 3 Z',
          fill: bark,
        }),
        e('path', {
          key: 'limb-out',
          d: 'M -5 -42 C 8 -36 18 -28 24 -20',
          stroke: limbWood,
          strokeWidth: 4.2,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('path', {
          key: 'limb-up',
          d: 'M -4 -72 C 4 -84 0 -94 -6 -100',
          stroke: bark,
          strokeWidth: 3.2,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        ...cameraFacingBarkDetail('left', C, bark, rim),
        ...elderOrganicCanopy('side', C, rim, litSide, 1),
      )
      break
    case 'right':
      out.push(
        e('path', {
          key: 'trunk',
          d: 'M 13 2 L 7 -92 C 3 -98 -1 -96 -5 -90 L -11 2 C -7 4 -3 3 1 3 Z',
          fill: bark,
        }),
        e('path', {
          key: 'limb-low',
          d: 'M 5 -56 C -10 -50 -22 -40 -26 -32',
          stroke: limbWood,
          strokeWidth: 4,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        e('path', {
          key: 'limb-up',
          d: 'M 4 -70 C -4 -82 -2 -92 4 -98',
          stroke: bark,
          strokeWidth: 3.2,
          fill: 'none',
          strokeLinecap: 'round',
        }),
        ...cameraFacingBarkDetail('right', C, bark, rim),
        ...elderOrganicCanopy('side', C, rim, litSide, -1),
      )
      break
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }

  out.push(
    e('ellipse', { key: 'base-shadow', cx: 0, cy: 5, rx: 30, ry: 6, fill: C.rim, opacity: 0.28 }),
    e('ellipse', { key: 'root-mound', cx: 0, cy: 2, rx: 18, ry: 3.2, fill: C.glow, opacity: 0.12 }),
  )

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

/** Fixed, natural mushroom palette (not theme-derived, so caps never read as glowing yellow blobs). */
const MUSHROOM_COLORS: Record<(typeof MUSHROOM_CAP)[number], { cap: string; capDark: string; capLight: string }> = {
  cream: { cap: '#D8C7A4', capDark: '#A8916A', capLight: '#F1E6CC' },
  tan: { cap: '#B98A5A', capDark: '#87603A', capLight: '#D9B184' },
  ochre: { cap: '#B7853A', capDark: '#86602A', capLight: '#D8AA5E' },
  'red-brown': { cap: '#9E4B32', capDark: '#6E3022', capLight: '#C27355' },
}
const MUSHROOM_STEM = '#EDE3CF'
const MUSHROOM_STEM_SHADE = '#BFB194'
const MUSHROOM_GILLS = '#6B5440'
const MUSHROOM_SHADOW = '#1E3A2C'

function mushroomForegroundGrass(C: HybridPlantPalette, stemW: number, litSide: number): ReactNode[] {
  const blades: ReactNode[] = []
  for (let i = 0; i < 3; i++) {
    const x = (-1.2 + i * 1.1) * stemW * 0.35 + litSide * 0.8
    blades.push(
      e('path', {
        key: `blade${i}`,
        d: `M ${x} 0.2 Q ${x - litSide * 1.2} -4 ${x + 0.6} -9`,
        stroke: C.glow,
        strokeWidth: 0.9,
        fill: 'none',
        strokeLinecap: 'round',
        opacity: 0.55,
      }),
    )
  }
  return blades
}

function oneMushroom(
  key: string,
  stemW: number,
  capKind: (typeof MUSHROOM_CAP)[number],
  _rim: number,
  C: HybridPlantPalette,
  litSide: number,
  spots: boolean,
  tiltDeg: number,
): ReactNode {
  void _rim
  const col = MUSHROOM_COLORS[capKind]
  const sw = stemW * 0.36 // half stem width at the base
  const stemH = stemW * 1.55
  const capHW = stemW * 1.05 // half cap width
  const rise = capHW * 0.78
  const capY = -stemH // cap underside sits on top of the stem
  const L = litSide
  return e(
    'g',
    { key, transform: `rotate(${tiltDeg * 0.5})` },
    ...mushroomForegroundGrass(C, stemW, litSide),
    e('ellipse', { key: 'sh', cx: -L * stemW * 0.25, cy: 0.6, rx: capHW * 0.8, ry: stemW * 0.18, fill: MUSHROOM_SHADOW, opacity: 0.45 }),
    // stem: slightly flared base, narrower under the cap
    e('path', {
      key: 'stem',
      d: `M ${-sw} 0 Q ${-sw * 0.7} ${capY * 0.5} ${-sw * 0.72} ${capY} L ${sw * 0.72} ${capY} Q ${sw * 0.7} ${capY * 0.5} ${sw} 0 Z`,
      fill: MUSHROOM_STEM,
    }),
    // shaded side of the stem, away from the light
    e('path', {
      key: 'stem-shade',
      d: `M ${-L * sw} 0 Q ${-L * sw * 0.7} ${capY * 0.5} ${-L * sw * 0.72} ${capY} L ${-L * sw * 0.15} ${capY} Q ${-L * sw * 0.2} ${capY * 0.5} ${-L * sw * 0.3} 0 Z`,
      fill: MUSHROOM_STEM_SHADE,
    }),
    // gill underside
    e('ellipse', { key: 'gills', cx: 0, cy: capY, rx: capHW * 0.92, ry: rise * 0.16, fill: MUSHROOM_GILLS }),
    // domed cap
    e('path', {
      key: 'cap',
      d: `M ${-capHW} ${capY} C ${-capHW} ${capY - rise * 1.05} ${capHW} ${capY - rise * 1.05} ${capHW} ${capY} Q 0 ${capY + rise * 0.12} ${-capHW} ${capY} Z`,
      fill: col.cap,
    }),
    // shadow half of the cap
    e('path', {
      key: 'cap-shade',
      d: `M ${-L * capHW} ${capY} C ${-L * capHW} ${capY - rise * 1.05} ${-L * capHW * 0.1} ${capY - rise * 0.8} ${-L * capHW * 0.05} ${capY - rise * 0.79} Q ${-L * capHW * 0.35} ${capY - rise * 0.3} ${-L * capHW * 0.4} ${capY + rise * 0.05} Z`,
      fill: col.capDark,
      opacity: 0.55,
    }),
    // soft highlight on the lit shoulder
    e('ellipse', {
      key: 'cap-lit',
      cx: L * capHW * 0.38,
      cy: capY - rise * 0.58,
      rx: capHW * 0.26,
      ry: rise * 0.16,
      fill: col.capLight,
      opacity: 0.8,
      transform: `rotate(${-L * 22} ${L * capHW * 0.38} ${capY - rise * 0.58})`,
    }),
    spots
      ? [
          e('ellipse', { key: 's1', cx: capHW * 0.18, cy: capY - rise * 0.62, rx: stemW * 0.14, ry: stemW * 0.1, fill: '#F6EEDD', opacity: 0.92 }),
          e('ellipse', { key: 's2', cx: -capHW * 0.4, cy: capY - rise * 0.38, rx: stemW * 0.11, ry: stemW * 0.08, fill: '#F6EEDD', opacity: 0.88 }),
          e('ellipse', { key: 's3', cx: capHW * 0.55, cy: capY - rise * 0.3, rx: stemW * 0.09, ry: stemW * 0.07, fill: '#F6EEDD', opacity: 0.85 }),
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
          [0, -2, 1.05, 0, -5, false],
          [-12, 3.2, 0.78, 1, 7, false],
          [11, 1.8, 0.88, 2, -9, false],
          [-18, 5, 0.55, 3, 11, true],
          [16, 4.5, 0.62, 0, -8, false],
        ]
      : [
          [0, -1, 1, 0, -4, false],
          [-9, 2.4, 0.72, 1, 6, false],
          [8, 3, 0.65, 2, -7, false],
        ]

  specs.forEach(([mx, my, sc, capIx, tilt, spots], i) => {
    const stemW = (7.5 + stage * 0.35) * sc
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
