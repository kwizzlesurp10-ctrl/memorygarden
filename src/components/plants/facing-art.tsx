import { createElement as e, type ReactNode } from 'react'
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
): ReactNode[] {
  if (variety === 'tree' && stageIndex >= 4) {
    return [...nodes, ...treeFacingOverlay(facing, C, rim, stageIndex)]
  }
  if (variety === 'mushroom' && stageIndex >= 3) {
    return [...mushroomFacingTransform(facing, nodes), ...mushroomFacingOverlay(facing, C, rim)]
  }
  if (facing === 'back') {
    return [e('g', { key: 'f-back', transform: 'scale(-1 1)' }, nodes)]
  }
  if (facing === 'left') {
    return [e('g', { key: 'f-left', transform: 'skewY(-4) translate(-2 0)' }, nodes)]
  }
  if (facing === 'right') {
    return [e('g', { key: 'f-right', transform: 'skewY(4) translate(2 0)' }, nodes)]
  }
  return nodes
}

function treeFacingOverlay(facing: PlantFacing, C: HybridPlantPalette, rim: number, stage: number): ReactNode[] {
  const bark = C.sil
  const out: ReactNode[] = []
  switch (facing) {
    case 'front':
      out.push(e('path', {
        key: 'tf-burl',
        d: 'M 2 -18 Q 5 -24 3 -32',
        stroke: bark,
        strokeWidth: 2.2,
        fill: 'none',
        strokeLinecap: 'round',
        opacity: 0.85,
      }))
      break
    case 'back':
      out.push(e('ellipse', {
        key: 'tb-hollow',
        cx: -4,
        cy: -22,
        rx: 3.2,
        ry: 5.5,
        fill: C.glow,
        opacity: 0.35,
      }))
      out.push(e('path', {
        key: 'tb-branch',
        d: 'M -6 -28 Q -14 -34 -18 -28',
        stroke: C.silSoft,
        strokeWidth: stage >= 7 ? 2.4 : 1.6,
        fill: 'none',
        strokeLinecap: 'round',
      }))
      break
    case 'left':
      out.push(e('path', {
        key: 'tl-trunk',
        d: 'M -7 0 L -5 -38',
        stroke: bark,
        strokeWidth: 3.5,
        strokeLinecap: 'round',
        opacity: 0.9,
      }))
      out.push(e('path', {
        key: 'tl-branch',
        d: 'M -5 -20 Q 12 -26 18 -18',
        stroke: C.silSoft,
        strokeWidth: 2,
        fill: 'none',
        strokeLinecap: 'round',
        opacity: 0.95,
      }))
      break
    case 'right':
      out.push(e('path', {
        key: 'tr-trunk',
        d: 'M 7 0 L 5 -40',
        stroke: bark,
        strokeWidth: 3.2,
        strokeLinecap: 'round',
        opacity: 0.88,
      }))
      out.push(e('circle', {
        key: 'tr-cluster',
        cx: 14,
        cy: -32,
        r: stage >= 7 ? 9 : 6,
        fill: C.silSoft,
        opacity: 0.75,
        stroke: C.rim,
        strokeOpacity: 0.35 * rim,
        strokeWidth: 0.5,
      }))
      break
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }
  return out
}

function mushroomFacingTransform(facing: PlantFacing, nodes: ReactNode[]): ReactNode[] {
  switch (facing) {
    case 'front':
      return nodes
    case 'back':
      return [e('g', { key: 'mb-wrap', transform: 'translate(0 -2) scale(0.92 1)' }, nodes)]
    case 'left':
      return [e('g', { key: 'ml-wrap', transform: 'skewX(10) translate(-3 1)' }, nodes)]
    case 'right':
      return [e('g', { key: 'mr-wrap', transform: 'skewX(-10) translate(3 1)' }, nodes)]
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }
}

function mushroomFacingOverlay(facing: PlantFacing, C: HybridPlantPalette, rim: number): ReactNode[] {
  if (facing === 'front') {
    return [
      e('path', {
        key: 'mf-gills',
        d: 'M -5 -8 Q 0 -4 5 -8',
        stroke: C.glow,
        strokeWidth: 0.8,
        fill: 'none',
        opacity: 0.65,
      }),
    ]
  }
  if (facing === 'left') {
    return [
      e('path', {
        key: 'ml-gill',
        d: 'M -7 -9 L -2 -5 L -7 -1',
        stroke: C.glow,
        strokeWidth: 0.7,
        fill: 'none',
        opacity: 0.8,
      }),
      e('ellipse', {
        key: 'ml-cap',
        cx: 3,
        cy: -11,
        rx: 5,
        ry: 3,
        fill: C.sil,
        opacity: 0.35,
        stroke: C.rim,
        strokeOpacity: 0.4 * rim,
        strokeWidth: 0.4,
      }),
    ]
  }
  if (facing === 'right') {
    return [
      e('path', {
        key: 'mr-stem',
        d: 'M 4 0 L 5 -7',
        stroke: C.silSoft,
        strokeWidth: 1.6,
        strokeLinecap: 'round',
      }),
      e('path', {
        key: 'mr-cap-tilt',
        d: 'M 0 -8 Q 8 -13 12 -7',
        stroke: C.sil,
        strokeWidth: 1.2,
        fill: 'none',
        strokeLinecap: 'round',
      }),
    ]
  }
  return [
    e('ellipse', {
      key: 'mb-stem',
      cx: 0,
      cy: -2,
      rx: 2,
      ry: 4,
      fill: C.silSoft,
      opacity: 0.7,
    }),
  ]
}
