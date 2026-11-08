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
  const liftMid = view === 'lakeside' || view === 'meadow'

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
          <stop
            offset={0}
            stopColor={liftMid ? C.hills[1] : C.hills[2]}
            stopOpacity={liftMid ? 0.9 : 0.92}
          />
          <stop offset={0.18} stopColor={C.hills[2]} stopOpacity={liftMid ? 0.94 : 0.95} />
          <stop offset={0.42} stopColor={liftMid ? C.hills[2] : C.hills[1]} stopOpacity={0.96} />
          <stop offset={0.68} stopColor={C.hills[2]} stopOpacity={0.98} />
          <stop offset={0.84} stopColor={C.bank} stopOpacity={0.96} />
          <stop offset={1} stopColor={C.bank} stopOpacity={1} />
        </linearGradient>
        {liftMid ? (
          <linearGradient
            id={`groundDepth${key}`}
            x1={0}
            y1={0}
            x2={SCENE_W}
            y2={0}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset={0} stopColor={C.hills[2]} stopOpacity={0.24} />
            <stop offset={0.48} stopColor={C.hills[2]} stopOpacity={0.1} />
            <stop offset={1} stopColor={C.bank} stopOpacity={0.05} />
          </linearGradient>
        ) : null}
      </defs>
      <path d={groundPlanePathD()} fill={`url(#groundGrad${key})`} />
      {liftMid ? (
        <path d={groundPlanePathD()} fill={`url(#groundDepth${key})`} />
      ) : null}
      <path
        d={`M -8 ${LANDSCAPE_HORIZON_Y + 32} Q 280 ${LANDSCAPE_HORIZON_Y + 22} 560 ${LANDSCAPE_HORIZON_Y + 26} T ${SCENE_W + 8} ${LANDSCAPE_HORIZON_Y + 22}`}
        stroke={C.hills[1]}
        strokeWidth={0.65}
        fill="none"
        opacity={0.08}
      />
      <path
        d={`M 0 ${LANDSCAPE_HORIZON_Y + 52} Q 420 ${LANDSCAPE_HORIZON_Y + 46} 820 ${LANDSCAPE_HORIZON_Y + 50} T ${SCENE_W} ${LANDSCAPE_HORIZON_Y + 48}`}
        stroke={C.rim}
        strokeWidth={0.45}
        fill="none"
        opacity={0.05}
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
  const count = view === 'meadow' ? 18 : view === 'garden_path' ? 20 : 14
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1)
    const ty = shoreY - 32 + t * (SCENE_H - shoreY - 40) + (r() - 0.5) * 18
    const tx = 60 + r() * (SCENE_W - 120)
    const sc = 0.48 + t * 0.72
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
  for (let i = 0; i < 10; i++) {
    const t = r()
    const fx = 120 + r() * 960
    const fy = shoreY - 24 + t * (SCENE_H - shoreY - 76)
    if (fy >= shoreY - 8 && geom.bandWater) continue
    const clover = r() > 0.55
    flowers.push(
      <g key={`fl-${i}`} transform={`translate(${fx} ${fy}) scale(${0.7 + t * 0.5})`}>
        {clover ? (
          <>
            <circle cx={-1.2} cy={0} r={0.85} fill={C.glow} opacity={0.7} />
            <circle cx={1.2} cy={0} r={0.85} fill={C.glow} opacity={0.7} />
            <circle cx={0} cy={-1.1} r={0.85} fill={C.accent} opacity={0.65} />
          </>
        ) : (
          <circle cx={0} cy={0} r={0.9 + t * 0.35} fill={r() > 0.5 ? C.glow : C.accent} opacity={0.72} />
        )}
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
  if (!geom.bandWater) {
    return (
      <g data-shore-rim>
        <path d={geom.shoreLineD} stroke={C.hills[2]} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.85} />
      </g>
    )
  }
  return (
    <g data-shore-rim>
      <path
        d={geom.shoreLineD}
        stroke={C.hills[1]}
        strokeWidth={14}
        fill="none"
        strokeLinecap="round"
        opacity={0.22}
        transform="translate(0 5)"
      />
      <path d={geom.shoreLineD} stroke={C.hills[2]} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} />
      <path d={geom.shoreLineD} stroke={C.rim} strokeWidth={1} fill="none" opacity={0.2 * rim} />
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
        d="M 0 700 L 0 608 Q 88 598 168 612 Q 248 628 318 658 Q 402 682 468 694 L 468 700 Z"
        fill={`url(#fgBank${key})`}
        opacity={0.9}
      />
      <path
        d="M 1200 700 L 1200 622 Q 1124 608 1048 622 Q 972 642 902 668 Q 848 688 782 698 L 782 700 Z"
        fill={`url(#fgBank${key})`}
        opacity={0.9}
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
