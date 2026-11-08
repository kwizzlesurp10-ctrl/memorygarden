import type { GardenLandscapeView } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { getViewPlantBand, getViewWaterLayout } from '@/lib/garden/landscape-view'
import { gardenRng } from '@/lib/garden/prng'
import { grassTuft, rock } from './scenery'
import { SCENE_W } from './GardenSceneSvg'
import type { ReactNode } from 'react'

/** Subtle horizontal parallax on mid hills so vistas feel like the same garden. */
export const VIEW_MID_PARALLAX_X: Record<GardenLandscapeView, number> = {
  pond: 0,
  lakeside: -18,
  meadow: 24,
  garden_path: -12,
}

interface NearBankExtensionProps {
  palette: ScenePalette
  gardenSeed: number
  rimStrength: number
  motion: boolean
  view: GardenLandscapeView
}

export function NearBankExtension({
  palette: C,
  gardenSeed: seed,
  rimStrength: rim,
  motion,
  view,
}: NearBankExtensionProps): ReactNode {
  const waterLayout = getViewWaterLayout(view)
  const plantBand = getViewPlantBand(view)
  const shoreY =
    waterLayout.bandHeight > 0
      ? waterLayout.waterTopY
      : waterLayout.corner
        ? waterLayout.corner.y - 6
        : plantBand.landSurfaceY - 4

  if (waterLayout.bandHeight === 0 && !waterLayout.corner) return null
  if (waterLayout.bandHeight > 0 && shoreY <= 472) return null

  const waterTopY = shoreY
  const bankLift = Math.max(0, waterTopY - 470)
  const r = gardenRng(seed + 880 + bankLift)

  const tufts: ReactNode[] = []
  const tuftCount = 6 + Math.floor(bankLift / 28)
  for (let i = 0; i < tuftCount; i++) {
    const tx = 80 + (i / Math.max(1, tuftCount - 1)) * (SCENE_W - 160) + (r() - 0.5) * 40
    const ty = waterTopY - 10 - r() * 22
    tufts.push(
      <g key={`bt-${i}`} transform={`translate(${tx} ${ty}) scale(${0.75 + r() * 0.45})`}>
        {grassTuft({ C, r: gardenRng(seed + 500 + i) })}
      </g>,
    )
  }

  const stones: ReactNode[] = []
  for (let i = 0; i < 4; i++) {
    const sx = 120 + r() * 960
    const sy = waterTopY - 4 - r() * 12
    stones.push(
      <g key={`rk-${i}`} transform={`translate(${sx} ${sy})`}>
        {rock({ C, rimStrength: rim, w: 7 + r() * 10 })}
      </g>,
    )
  }

  void motion
  const wildflowers: ReactNode[] = []
  for (let i = 0; i < 5; i++) {
    const wx = 160 + r() * 880
    const wy = waterTopY - 6 - r() * 8
    const hue = r() > 0.5 ? C.glow : C.accent
    wildflowers.push(
      <g key={`wf-${i}`} transform={`translate(${wx} ${wy})`}>
        <circle cx={0} cy={0} r={1.2} fill={hue} opacity={0.9} />
        {[0, 72, 144, 216, 288].map((ang) => (
          <circle
            key={ang}
            cx={Math.cos((ang * Math.PI) / 180) * 2.2}
            cy={Math.sin((ang * Math.PI) / 180) * 2.2 - 1}
            r={0.85}
            fill={C.sil}
            opacity={0.85}
          />
        ))}
      </g>,
    )
  }

  const pathStroke =
    view === 'garden_path' ? (
      <path
        d={`M 920 ${waterTopY + 6} Q 760 ${waterTopY - 30} 620 ${waterTopY - 52} T 380 ${waterTopY - 20} T 180 ${waterTopY + 8}`}
        stroke={C.silSoft}
        strokeWidth={14}
        fill="none"
        strokeLinecap="round"
        opacity={0.22}
      />
    ) : null

  return (
    <g data-near-bank={view} transform={`translate(${VIEW_MID_PARALLAX_X[view]} 0)`}>
      <defs>
        <linearGradient id={`bankRoll${view}`} x1={0} y1={waterTopY - 120} x2={0} y2={waterTopY + 8} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.hills[2]} stopOpacity={0.55} />
          <stop offset={0.45} stopColor={C.hills[2]} stopOpacity={0.92} />
          <stop offset={1} stopColor={C.bank} stopOpacity={0.98} />
        </linearGradient>
      </defs>
      <path
        d={`M 0 ${470 + bankLift * 0.15} Q 280 ${waterTopY - 38} 560 ${waterTopY - 18} T 1200 ${470 + bankLift * 0.12} L 1200 ${waterTopY + 6} L 0 ${waterTopY + 6} Z`}
        fill={`url(#bankRoll${view})`}
      />
      <path
        d={`M 0 ${waterTopY + 2} Q 400 ${waterTopY - 14} 800 ${waterTopY + 1} T 1200 ${waterTopY - 6}`}
        stroke={C.rim}
        strokeWidth={0.7}
        fill="none"
        opacity={0.12 * rim}
      />
      {pathStroke}
      {tufts}
      {stones}
      {wildflowers}
    </g>
  )
}

interface ForegroundBankDetailProps {
  palette: ScenePalette
  gardenSeed: number
  rimStrength: number
  view: GardenLandscapeView
}

/** Grass, stones, and banding on the bottom bank polygons (foreground layer). */
export function ForegroundBankDetail({
  palette: C,
  gardenSeed: seed,
  rimStrength: rim,
  view,
}: ForegroundBankDetailProps): ReactNode {
  const r = gardenRng(seed + 1203)
  const tufts: ReactNode[] = []
  for (let i = 0; i < 10; i++) {
    const side = i % 2 === 0 ? 40 + r() * 380 : 780 + r() * 380
    const ty = 628 + r() * 58
    tufts.push(
      <g key={`fgt-${i}`} transform={`translate(${side} ${ty}) scale(${0.7 + r() * 0.55})`}>
        {grassTuft({ C, r: gardenRng(seed + 1300 + i) })}
      </g>,
    )
  }

  const stones: ReactNode[] = []
  for (let i = 0; i < 6; i++) {
    stones.push(
      <g key={`fgr-${i}`} transform={`translate(${90 + r() * 1020} ${640 + r() * 48})`}>
        {rock({ C, rimStrength: rim, w: 6 + r() * 9 })}
      </g>,
    )
  }

  const pathTrace =
    view === 'garden_path' ? (
      <path
        d="M 1080 672 Q 860 640 680 658 Q 520 672 360 652 Q 220 638 80 662"
        stroke={C.silSoft}
        strokeWidth={11}
        fill="none"
        strokeLinecap="round"
        opacity={0.2}
      />
    ) : null

  return (
    <g data-foreground-bank={view}>
      <defs>
        <linearGradient id={`fgBankGrad${view}`} x1={0} y1={598} x2={0} y2={700} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={C.hills[2]} stopOpacity={0.72} />
          <stop offset={0.55} stopColor={C.bank} stopOpacity={0.94} />
          <stop offset={1} stopColor={C.bank} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path
        d="M 0 700 L 0 606 Q 140 594 262 632 Q 384 668 522 692 L 522 700 Z"
        fill={`url(#fgBankGrad${view})`}
      />
      <path
        d="M 1200 700 L 1200 618 Q 1076 604 976 640 Q 898 668 818 694 L 818 700 Z"
        fill={`url(#fgBankGrad${view})`}
      />
      <path
        d="M 0 650 Q 300 628 600 642 Q 900 658 1200 636"
        stroke={C.rim}
        strokeWidth={0.8}
        fill="none"
        opacity={0.08 * rim}
      />
      {pathTrace}
      {tufts}
      {stones}
    </g>
  )
}
