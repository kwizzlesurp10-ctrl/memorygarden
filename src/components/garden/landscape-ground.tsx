import type { GardenLandscapeView } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import {
  gardenPathFillD,
  gardenPathMidRibbonD,
  getPondGeometry,
  groundPlanePathD,
  LANDSCAPE_HORIZON_Y,
} from '@/lib/garden/landscape-pond'
import { gardenRng } from '@/lib/garden/prng'
import { grassTuft, rock } from './scenery'
import { SCENE_H, SCENE_W } from '@/lib/garden/scene-constants'
import type { ReactNode } from 'react'

/** Minimal parallax on mid-hill plants only. */
export const VIEW_MID_PARALLAX_X: Record<GardenLandscapeView, number> = {
  pond: 0,
  lakeside: -8,
  meadow: 6,
  garden_path: -5,
}

interface SceneGroundPlaneProps {
  palette: ScenePalette
  sceneKey: string
  view: GardenLandscapeView
}

export function SceneGroundPlane({ palette: C, sceneKey: key, view }: SceneGroundPlaneProps): ReactNode {
  const geom = getPondGeometry(view)
  const earth = C.hills[0]
  const earthSoft = C.hills[1]

  return (
    <g data-ground-plane={view}>
      <defs>
        <linearGradient
          id={`groundGrad${key}`}
          x1={0}
          y1={LANDSCAPE_HORIZON_Y}
          x2={0}
          y2={SCENE_H}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0} stopColor={C.hills[2]} stopOpacity={1} />
          <stop offset={0.35} stopColor={C.hills[2]} stopOpacity={0.97} />
          <stop offset={0.72} stopColor={C.bank} stopOpacity={0.96} />
          <stop offset={1} stopColor={C.bank} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d={groundPlanePathD()} fill={`url(#groundGrad${key})`} />
      <path
        d={`M -8 ${LANDSCAPE_HORIZON_Y + 28} Q 360 ${LANDSCAPE_HORIZON_Y + 18} 720 ${LANDSCAPE_HORIZON_Y + 24} T ${SCENE_W + 8} ${LANDSCAPE_HORIZON_Y + 20}`}
        stroke={C.rim}
        strokeWidth={0.5}
        fill="none"
        opacity={0.06}
      />
      {view === 'garden_path' ? (
        <>
          <path
            d={gardenPathMidRibbonD(geom.bandWater ? geom.waterTopY : 596)}
            fill={earthSoft}
            opacity={0.42}
          />
          <path d={gardenPathFillD()} fill={earth} opacity={0.38} />
          <path
            d={gardenPathFillD()}
            fill="none"
            stroke={C.rim}
            strokeWidth={0.6}
            opacity={0.1}
          />
        </>
      ) : null}
    </g>
  )
}

interface AtmosphericGroundDetailProps {
  palette: ScenePalette
  gardenSeed: number
  rimStrength: number
  view: GardenLandscapeView
}

/** Grass, flowers, stones — larger and sparser toward the viewer. */
export function AtmosphericGroundDetail({
  palette: C,
  gardenSeed: seed,
  rimStrength: rim,
  view,
}: AtmosphericGroundDetailProps): ReactNode {
  const geom = getPondGeometry(view)
  const shoreY = geom.bandWater ? geom.waterTopY : LANDSCAPE_HORIZON_Y + 80
  const r = gardenRng(seed + 2400)

  const tufts: ReactNode[] = []
  const count = view === 'meadow' ? 14 : view === 'garden_path' ? 16 : 11
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1)
    const ty = shoreY - 28 + t * (SCENE_H - shoreY - 36) + (r() - 0.5) * 12
    const tx = 60 + r() * (SCENE_W - 120)
    const sc = 0.55 + t * 0.65
    if (!geom.bandWater || ty < shoreY - 6) {
      tufts.push(
        <g key={`ag-${i}`} transform={`translate(${tx} ${ty}) scale(${sc})`}>
          {grassTuft({ C, r: gardenRng(seed + 2500 + i) })}
        </g>,
      )
    }
  }

  const stones: ReactNode[] = []
  for (let i = 0; i < 5; i++) {
    const t = r()
    stones.push(
      <g
        key={`stk-${i}`}
        transform={`translate(${80 + r() * 1040} ${shoreY + 20 + t * (SCENE_H - shoreY - 50)}) scale(${0.8 + t * 0.4})`}
      >
        {rock({ C, rimStrength: rim, w: 5 + r() * 8 })}
      </g>,
    )
  }

  const flowers: ReactNode[] = []
  for (let i = 0; i < 6; i++) {
    const t = r()
    const fx = 120 + r() * 960
    const fy = shoreY - 20 + t * (SCENE_H - shoreY - 80)
    if (fy >= shoreY - 8 && geom.bandWater) continue
    flowers.push(
      <g key={`fl-${i}`} transform={`translate(${fx} ${fy})`}>
        <circle cx={0} cy={0} r={0.9 + t * 0.4} fill={r() > 0.5 ? C.glow : C.accent} opacity={0.75} />
      </g>,
    )
  }

  return (
    <g data-ground-detail={view}>
      {tufts}
      {stones}
      {flowers}
    </g>
  )
}

interface PondShoreRimProps {
  palette: ScenePalette
  view: GardenLandscapeView
  rimStrength: number
}

export function PondShoreRim({ palette: C, view, rimStrength: rim }: PondShoreRimProps): ReactNode {
  const geom = getPondGeometry(view)
  return (
    <g data-shore-rim>
      <path d={geom.shoreLineD} stroke={C.hills[2]} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.88} />
      <path d={geom.shoreLineD} stroke={C.rim} strokeWidth={0.9} fill="none" opacity={0.18 * rim} />
    </g>
  )
}

interface ForegroundBanksProps {
  palette: ScenePalette
  sceneKey: string
  gardenSeed: number
  rimStrength: number
  view: GardenLandscapeView
}

export function ForegroundBanks({
  palette: C,
  sceneKey: key,
  gardenSeed: seed,
  rimStrength: rim,
  view,
}: ForegroundBanksProps): ReactNode {
  const r = gardenRng(seed + 1203)
  const tufts: ReactNode[] = []
  for (let i = 0; i < 8; i++) {
    const side = i % 2 === 0 ? 50 + r() * 360 : 780 + r() * 380
    tufts.push(
      <g key={`fgt-${i}`} transform={`translate(${side} ${628 + r() * 58}) scale(${0.85 + r() * 0.5})`}>
        {grassTuft({ C, r: gardenRng(seed + 1300 + i) })}
      </g>,
    )
  }

  return (
    <g data-foreground-banks={view}>
      <defs>
        <linearGradient id={`fgBank${key}`} x1={0} y1={598} x2={0} y2={700} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.hills[2]} stopOpacity={0.8} />
          <stop offset={1} stopColor={C.bank} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path
        d="M 0 700 L 0 606 Q 140 594 262 632 Q 384 668 522 692 L 522 700 Z"
        fill={`url(#fgBank${key})`}
        opacity={0.92}
      />
      <path
        d="M 1200 700 L 1200 618 Q 1076 604 976 640 Q 898 668 818 694 L 818 700 Z"
        fill={`url(#fgBank${key})`}
        opacity={0.92}
      />
      {tufts}
      {view !== 'garden_path'
        ? null
        : stonesAlongPath(C, rim, seed)}
    </g>
  )
}

function stonesAlongPath(C: ScenePalette, rim: number, seed: number): ReactNode {
  const r = gardenRng(seed + 1400)
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${320 + i * 180 + r() * 40} ${640 + i * 22})`}>
          {rock({ C, rimStrength: rim, w: 6 + r() * 6 })}
        </g>
      ))}
    </g>
  )
}
