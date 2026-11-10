import { createElement as e, type ReactNode, type CSSProperties } from 'react'
import type { PlantFacing } from '@/lib/garden/landscape-world'
import type { HybridPlantPalette } from './seeded-builders'
import type { SeededVariety } from './types'
import { lerpHex } from '@/lib/garden/color'
import { STARTER_MUSHROOM_STEM_W } from '@/lib/garden/starter-mushroom-scale'
import { plantGroundCollar } from './plant-surface-detail'

export function applyPlantFacing(
  variety: SeededVariety,
  facing: PlantFacing,
  nodes: ReactNode[],
  C: HybridPlantPalette,
  rim: number,
  stageIndex: number,
  rimFromLeft = true,
  geneticsSeed?: string,
): ReactNode[] {
  if (variety === 'tree' && stageIndex >= 7 && geneticsSeed?.startsWith('starter-elder-')) {
    return [e('g', { key: 'elder-facing' }, buildElderTreeFacing(facing, C, rim, 1, rimFromLeft))]
  }
  if (variety === 'mushroom' && stageIndex >= 3) {
    return [e('g', { key: 'mush-cluster' }, buildReadableMushroomCluster(facing, C, rim, stageIndex, geneticsSeed))]
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

function plantDimBlend(C: HybridPlantPalette): number {
  return Math.max(0, Math.min(1, C.plantDimBlend ?? 0))
}

const CANOPY_DAY: Record<CanopyTone, string> = {
  deep: '#1F3D2C',
  shadow: '#2A4534',
  mid: '#3E6B3F',
  light: '#7FA05A',
  highlight: '#9DBE6E',
}

function canopyNightFill(tone: CanopyTone, C: HybridPlantPalette): string {
  switch (tone) {
    case 'deep':
      return C.sil
    case 'shadow':
      return C.silSoft
    case 'mid':
      return lerpHex(C.hills[1], C.silSoft, 0.55)
    case 'light':
      return lerpHex(C.hills[0], C.silSoft, 0.65)
    case 'highlight':
      return lerpHex(C.hills[0], C.glow, 0.08)
    default: {
      const _exhaustive: never = tone
      return _exhaustive
    }
  }
}

function canopyFill(tone: CanopyTone, C: HybridPlantPalette): string {
  const blend = plantDimBlend(C)
  if (blend <= 0) return CANOPY_DAY[tone]
  return lerpHex(CANOPY_DAY[tone], canopyNightFill(tone, C), blend)
}

/** Soft cloud silhouette from smooth cubic bezier segments (no hard polygon edges). */
function smoothFoliagePath(cx: number, cy: number, rx: number, ry: number, phase: number): string {
  const segments = 14
  const points: Array<[number, number]> = []
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2
    const bump =
      0.84 +
      0.1 * Math.sin(t * 2.4 + phase) +
      0.06 * Math.cos(t * 4.1 - phase * 0.65) +
      0.04 * Math.sin(t * 6.2 + phase * 1.3)
    points.push([cx + Math.cos(t) * rx * bump, cy + Math.sin(t) * ry * bump])
  }
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 0; i < segments; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % segments]
    const [x0, y0] = points[(i - 1 + segments) % segments]
    const [x3, y3] = points[(i + 2) % segments]
    const c1x = x1 + (x2 - x0) / 6
    const c1y = y1 + (y2 - y0) / 6
    const c2x = x2 - (x3 - x1) / 6
    const c2y = y2 - (y3 - y1) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  return `${d} Z`
}

function foliageClump(
  key: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tone: CanopyTone,
  C: HybridPlantPalette,
  _rim: number,
  phase: number,
): ReactNode {
  void _rim
  return e('path', {
    key,
    d: smoothFoliagePath(cx, cy, rx, ry, phase),
    fill: canopyFill(tone, C),
    stroke: 'none',
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
  const mass =
    facing === 'front'
      ? { cx: 4 * f, cy: -78, rx: 52, ry: 38, phase: 0.15 }
      : facing === 'back'
        ? { cx: -2 * f, cy: -76, rx: 50, ry: 36, phase: 0.9 }
        : { cx: 6 * f, cy: -74, rx: 48, ry: 34, phase: 0.55 }
  return e('path', {
    key: 'crown-mass',
    d: smoothFoliagePath(mass.cx, mass.cy, mass.rx, mass.ry, mass.phase),
    fill: C.sil,
    opacity: 0.92,
    stroke: 'none',
  })
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
      ? [['h0', 10 * sun * f, -112, 7, 5, 'highlight', 0.4]]
      : facing === 'back'
        ? [['h0', -8 * sun * f, -108, 7, 5, 'highlight', 0.5]]
        : [['h0', 16 * sun * f, -100, 7, 5, 'highlight', 0.8]]

  const toneOrder: Record<CanopyTone, number> = {
    deep: 0,
    shadow: 1,
    mid: 2,
    light: 3,
    highlight: 4,
  }
  const sorted = [...base, ...highlights].sort((a, b) => toneOrder[a[5]] - toneOrder[b[5]])

  const underbelly = elderCanopyUnderbelly(facing, C, f)
  const edgeTexture = elderCanopyEdgeBumps(facing, C, litSide, f)
  const gapTwigs = elderUnderCanopyGapTwigs(facing, C, f)

  return [
    elderCrownMass(facing, C, f),
    underbelly,
    ...gapTwigs,
    ...sorted.map(([key, cx, cy, rx, ry, tone, phase]) =>
      foliageClump(key, cx * f, cy, rx, ry, tone, C, rim, phase),
    ),
    ...edgeTexture,
  ]
}

function elderCanopyUnderbelly(
  facing: 'front' | 'back' | 'side',
  C: HybridPlantPalette,
  flip: number,
): ReactNode {
  const f = flip
  const band =
    facing === 'front'
      ? `M ${-50 * f} -58 Q ${-8 * f} -48 ${36 * f} -52 Q ${54 * f} -54 ${50 * f} -64 Q ${20 * f} -72 ${-36 * f} -68 Q ${-54 * f} -66 ${-50 * f} -58 Z`
      : facing === 'back'
        ? `M ${46 * f} -56 Q ${6 * f} -46 ${-34 * f} -50 Q ${-52 * f} -52 ${-48 * f} -62 Q ${-18 * f} -70 ${36 * f} -66 Q ${52 * f} -64 ${46 * f} -56 Z`
        : `M ${42 * f} -54 Q ${4 * f} -44 ${-30 * f} -48 Q ${-46 * f} -50 ${-42 * f} -60 Q ${-14 * f} -68 ${32 * f} -64 Q ${46 * f} -62 ${42 * f} -54 Z`
  return e('path', {
    key: 'canopy-under',
    d: band,
    fill: C.sil,
    opacity: 0.88,
    stroke: 'none',
  })
}

/** Thin twigs only in shaded under-canopy / sky-gap slots — never over lit clumps. */
function elderUnderCanopyGapTwigs(
  facing: 'front' | 'back' | 'side',
  C: HybridPlantPalette,
  flip: number,
): ReactNode[] {
  const f = flip
  const trunk = C.bank
  const specs: Array<[string, string]> =
    facing === 'front'
      ? [
          ['gap0', `M ${-12 * f} -62 L ${-10 * f} -68 L ${-7 * f} -66`],
          ['gap1', `M ${4 * f} -64 L ${6 * f} -70 L ${9 * f} -67`],
        ]
      : facing === 'back'
        ? [['gap0', `M ${8 * f} -60 L ${10 * f} -66 L ${13 * f} -63`]]
        : [
            ['gap0', `M ${2 * f} -61 L ${4 * f} -67 L ${7 * f} -64`],
            ['gap1', `M ${-16 * f} -58 L ${-14 * f} -64 L ${-11 * f} -61`],
          ]
  return specs.map(([key, d]) =>
    e('path', {
      key,
      d,
      stroke: trunk,
      strokeWidth: 1.35,
      fill: 'none',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      opacity: 0.48,
    }),
  )
}

function elderCanopyEdgeBumps(
  facing: 'front' | 'back' | 'side',
  C: HybridPlantPalette,
  litSide: number,
  flip: number,
): ReactNode[] {
  const f = flip
  const sun = litSide > 0 ? 1 : -1
  const seeds: Array<[number, number, number]> =
    facing === 'front'
      ? [
          [-38 * f, -72, 0.2],
          [30 * f, -78, 1.1],
          [-10 * f, -116, 0.7],
          [20 * f, -110, 1.8],
          [-44 * f, -88, 2.4],
        ]
      : facing === 'back'
        ? [
            [28 * f, -76, 0.5],
            [-24 * f, -82, 1.3],
            [4 * f, -112, 0.9],
          ]
        : [
            [32 * f, -74, 0.6],
            [-26 * f, -80, 1.2],
            [8 * f, -104, 1.9],
          ]
  return seeds.map(([cx, cy, phase], i) =>
    foliageClump(
      `edge-${i}`,
      cx,
      cy,
      5.5 + (i % 2) * 1.2,
      4 + (i % 3) * 0.6,
      i % 2 === 0 ? 'mid' : sun > 0 ? 'light' : 'shadow',
      C,
      0.6,
      phase + 0.8,
    ),
  )
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

  const L = litSide
  const trunkCore = [
    e('path', {
      key: 'trunk',
      d: 'M -20 2 C -24 0 -22 -3 -16 0 L -13 -40 C -11 -62 -8 -82 -5 -94 C -2 -98 4 -98 6 -94 C 8 -82 10 -62 12 -40 L 17 0 C 22 -3 20 2 15 2 Z',
      fill: bark,
      stroke: C.rim,
      strokeOpacity: 0.3 * rim,
      strokeWidth: 0.65,
    }),
    e('path', {
      key: 'bark-lit-band',
      d: `M ${9 * L} 0 C ${11 * L} -30 ${10 * L} -58 ${7 * L} -88 L ${4 * L} -88 C ${6 * L} -56 ${7 * L} -28 ${6 * L} 0 Z`,
      fill: barkMid,
      opacity: 0.44,
    }),
    e('path', {
      key: 'bark-line-1',
      d: `M ${3.5 * L} -6 L ${4.5 * L} -78`,
      stroke: C.sil,
      strokeWidth: 0.55,
      fill: 'none',
      opacity: 0.24,
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'bark-line-2',
      d: `M ${7.5 * L} -12 L ${8.5 * L} -66`,
      stroke: C.sil,
      strokeWidth: 0.42,
      fill: 'none',
      opacity: 0.18,
      strokeLinecap: 'round',
    }),
    e('circle', { key: 'joint-l', cx: -2, cy: -54, r: 4.4, fill: bark }),
    e('path', {
      key: 'limb-l',
      d: 'M -2 -54 C -12 -50 -22 -44 -28 -36',
      stroke: bark,
      strokeWidth: 5.6,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('circle', { key: 'joint-r', cx: 4, cy: -64, r: 3.6, fill: limbWood }),
    e('path', {
      key: 'limb-r',
      d: 'M 4 -64 C 10 -70 18 -68 22 -58',
      stroke: limbWood,
      strokeWidth: 4.2,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('circle', { key: 'joint-up', cx: 0, cy: -78, r: 3.2, fill: bark }),
    e('path', {
      key: 'limb-up',
      d: 'M 0 -78 C 6 -88 2 -96 -4 -100',
      stroke: bark,
      strokeWidth: 4,
      fill: 'none',
      strokeLinecap: 'round',
    }),
    e('path', {
      key: 'roots',
      d: 'M -14 2 Q -30 11 -22 16 M -2 2 Q -16 12 -9 16 M 12 2 Q 26 10 28 14',
      stroke: bark,
      strokeWidth: 2.8,
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

  out.unshift(plantGroundCollar(C, rim, 34, 5.5))
  out.push(
    e('ellipse', { key: 'base-shadow', cx: 0, cy: 6, rx: 34, ry: 7.5, fill: C.rim, opacity: 0.55 }),
    e('ellipse', { key: 'root-mound', cx: 0, cy: 2.5, rx: 22, ry: 4, fill: C.bank ?? C.silSoft, opacity: 0.55 }),
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
const MUSHROOM_GILLS_DAY = '#6B5440'

const MUSHROOM_STEM_DAY = '#EDE3CF'
const MUSHROOM_STEM_SHADE_DAY = '#BFB194'
const MUSHROOM_SHADOW_DAY = '#1E3A2C'

function mushroomStemColors(C: HybridPlantPalette): { stem: string; stemShade: string; shadow: string; gills: string } {
  const blend = plantDimBlend(C)
  if (blend <= 0) {
    return {
      stem: MUSHROOM_STEM_DAY,
      stemShade: MUSHROOM_STEM_SHADE_DAY,
      shadow: MUSHROOM_SHADOW_DAY,
      gills: MUSHROOM_GILLS_DAY,
    }
  }
  return {
    stem: lerpHex(MUSHROOM_STEM_DAY, C.silSoft, blend * 0.82),
    stemShade: lerpHex(MUSHROOM_STEM_SHADE_DAY, C.bank, blend * 0.88),
    shadow: lerpHex(MUSHROOM_SHADOW_DAY, C.bank, blend * 0.75),
    gills: lerpHex(MUSHROOM_GILLS_DAY, C.bank, blend * 0.7),
  }
}

function mushroomCapColors(
  kind: (typeof MUSHROOM_CAP)[number],
  C: HybridPlantPalette,
): { cap: string; capDark: string; capLight: string } {
  const base = MUSHROOM_COLORS[kind]
  const blend = plantDimBlend(C)
  if (blend <= 0) return base
  return {
    cap: lerpHex(base.cap, C.hills[1], blend * 0.5),
    capDark: lerpHex(base.capDark, C.bank, blend * 0.72),
    capLight: lerpHex(base.capLight, C.silSoft, blend * 0.55),
  }
}

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
  const col = mushroomCapColors(capKind, C)
  const stem = mushroomStemColors(C)
  const capHW = stemW * 0.95 // half cap width
  const capW = capHW * 2
  const sw = capHW * 0.35 // half stem width (~35% of cap width)
  const stemH = capW * 0.8
  const rise = capHW * 0.78
  const capY = -stemH // cap underside sits on top of the stem
  const L = litSide
  return e(
    'g',
    { key, transform: `rotate(${tiltDeg * 0.65})` },
    ...mushroomForegroundGrass(C, stemW, litSide),
    e('ellipse', { key: 'sh', cx: -L * stemW * 0.2, cy: 1.8, rx: capHW * 1.05, ry: stemW * 0.32, fill: stem.shadow, opacity: 0.72 }),
    // stem: slightly flared base, narrower under the cap
    e('path', {
      key: 'stem',
      d: `M ${-sw} 0 Q ${-sw * 0.7} ${capY * 0.5} ${-sw * 0.72} ${capY} L ${sw * 0.72} ${capY} Q ${sw * 0.7} ${capY * 0.5} ${sw} 0 Z`,
      fill: stem.stem,
    }),
    e('path', {
      key: 'stem-shade',
      d: `M ${L * sw * 0.15} 0 Q ${L * sw * 0.55} ${capY * 0.45} ${L * sw * 0.75} ${capY * 0.92} L ${L * sw * 0.38} ${capY * 0.95} Q ${L * sw * 0.28} ${capY * 0.5} ${L * sw * 0.22} 0 Z`,
      fill: stem.stemShade,
      opacity: 0.72,
    }),
    // gill underside
    e('ellipse', { key: 'gills', cx: 0, cy: capY, rx: capHW * 0.92, ry: rise * 0.16, fill: stem.gills }),
    // domed cap
    e('path', {
      key: 'cap',
      'data-mush-cap': '1',
      'data-cap-half-w': String(capHW),
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
          e('ellipse', {
            key: 's1',
            cx: capHW * 0.18,
            cy: capY - rise * 0.62,
            rx: stemW * 0.14,
            ry: stemW * 0.1,
            fill: stem.stem,
            opacity: 0.92,
          }),
          e('ellipse', {
            key: 's2',
            cx: -capHW * 0.4,
            cy: capY - rise * 0.38,
            rx: stemW * 0.11,
            ry: stemW * 0.08,
            fill: stem.stem,
            opacity: 0.88,
          }),
          e('ellipse', {
            key: 's3',
            cx: capHW * 0.55,
            cy: capY - rise * 0.3,
            rx: stemW * 0.09,
            ry: stemW * 0.07,
            fill: stem.stem,
            opacity: 0.85,
          }),
        ]
      : null,
  )
}

type MushroomCapKind = (typeof MUSHROOM_CAP)[number]

function capKindFromGenetics(geneticsSeed?: string): { kind: MushroomCapKind; spots: boolean } {
  if (!geneticsSeed) return { kind: 'tan', spots: false }
  const match = geneticsSeed.match(/-(cream|tan|ochre|red-brown)$/)
  if (!match) return { kind: 'tan', spots: false }
  const kind = match[1] as MushroomCapKind
  return { kind, spots: kind === 'red-brown' }
}

export function buildReadableMushroomCluster(
  facing: PlantFacing,
  C: HybridPlantPalette,
  rim: number,
  stage: number,
  geneticsSeed?: string,
): ReactNode[] {
  const lit = facing === 'right' || facing === 'back' ? -1 : 1
  const primary = capKindFromGenetics(geneticsSeed)
  const secondaryKinds: MushroomCapKind[] = ['cream', 'tan', 'ochre']
  const out: ReactNode[] = []

  const memberCount = geneticsSeed?.includes('starter-mushroom')
    ? 1
    : stage >= 6
      ? 4
      : 2

  const layouts = [
    { mx: 0, my: -2, sc: 1, tilt: -7 },
    { mx: -11, my: 2.8, sc: 0.78, tilt: 11 },
    { mx: 10, my: 2, sc: 0.72, tilt: -12 },
    { mx: -16, my: 4.5, sc: 0.58, tilt: 8 },
  ]

  out.push(plantGroundCollar(C, rim, 26 + memberCount * 4, 4.8))

  for (let i = 0; i < memberCount; i++) {
    const { mx, my, sc, tilt } = layouts[i] ?? layouts[layouts.length - 1]
    const capKind = i === 0 ? primary.kind : secondaryKinds[i % secondaryKinds.length]
    const spots = i === 0 ? primary.spots : false
    const starter = geneticsSeed?.includes('starter-mushroom')
    const stemW = (starter ? STARTER_MUSHROOM_STEM_W : 7.5 + stage * 0.35) * sc
    out.push(
      e(
        'g',
        { key: `mc${i}`, transform: `translate(${mx} ${my})` },
        oneMushroom(`m${i}`, stemW, capKind, rim, C, lit, spots, tilt),
      ),
    )
  }

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
