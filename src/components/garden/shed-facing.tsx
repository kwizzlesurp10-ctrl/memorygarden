import type { ReactNode } from 'react'
import type { ShedStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import type { PlantFacing } from '@/lib/garden/landscape-world'
import { shed } from './scenery'

const SHED_FACING_SCALE: Record<PlantFacing, number> = {
  front: 1.32,
  back: 1.12,
  left: 1.28,
  right: 1.28,
}

export function shedDrawScale(facing: PlantFacing): number {
  return SHED_FACING_SCALE[facing]
}

function groundShadow(): ReactNode {
  return <ellipse key="gsh" cx={0} cy={2.8} rx={36} ry={3.6} fill="currentColor" opacity={0.45} />
}

function plankWall(
  x: number,
  y: number,
  w: number,
  h: number,
  C: ScenePalette,
): ReactNode[] {
  const wall = C.glow
  const planks: ReactNode[] = [
    <rect key="wall" x={x} y={y} width={w} height={h} fill={wall} opacity={0.42} stroke={C.rim} strokeWidth={0.6} strokeOpacity={0.25} />,
  ]
  for (let i = 1; i < 4; i++) {
    planks.push(
      <line
        key={`pl${i}`}
        x1={x}
        y1={y + (h * i) / 4}
        x2={x + w}
        y2={y + (h * i) / 4}
        stroke={C.rim}
        strokeWidth={0.35}
        opacity={0.2}
      />,
    )
  }
  return planks
}

/** Per-facing storybook cottage — consistent chimney on the +X roof shoulder. */
export function shedForFacing(
  kind: ShedStyle,
  facing: PlantFacing,
  C: ScenePalette,
  rimStrength: number,
  motion: boolean,
): ReactNode[] {
  if (kind !== 'storybook') {
    return shed({ kind, C, rimStrength, motion })
  }

  void rimStrength
  const roof = C.sil
  const out: ReactNode[] = []

  switch (facing) {
    case 'front':
      out.push(
        <g key="gshadow" color={C.bank}>
          {groundShadow()}
        </g>,
        ...plankWall(-38, -36, 76, 36, C),
        <path key="roof" d="M -50 -36 L 0 -72 L 50 -36 Z" fill={roof} stroke={C.rim} strokeWidth={0.7} strokeOpacity={0.35} />,
        <path key="eave" d="M -52 -36 L 52 -36 L 50 -32 L -50 -32 Z" fill={roof} opacity={0.95} />,
        <rect key="chimney" x={22} y={-64} width={8} height={22} fill={roof} />,
        <rect key="chimney-cap" x={20} y={-66} width={12} height={2.5} fill={C.rim} opacity={0.7} />,
        <path
          key="door"
          d="M -11 0 L -11 -23 Q 0 -32 11 -23 L 11 0 Z"
          fill={C.bank}
          opacity={0.85}
          stroke={C.rim}
          strokeWidth={0.5}
          strokeOpacity={0.3}
        />,
        <circle key="knob" cx={8} cy={-12} r={1.3} fill={C.fire} />,
        <rect key="win" x={16} y={-28} width={14} height={11} fill={C.glow} opacity={0.95} />,
      )
      break
    case 'back':
      out.push(
        <g key="gshadow" color={C.bank}>
          {groundShadow()}
        </g>,
        ...plankWall(-36, -34, 72, 34, C),
        <path key="roof" d="M -46 -34 L 0 -68 L 46 -34 Z" fill={roof} stroke={C.rim} strokeWidth={0.65} strokeOpacity={0.3} />,
        <path key="eave" d="M -48 -34 L 48 -34 L 46 -30 L -46 -30 Z" fill={roof} opacity={0.92} />,
        <rect key="chimney" x={20} y={-62} width={8} height={20} fill={roof} />,
        <rect key="backwin" x={-8} y={-26} width={16} height={10} fill={C.glow} opacity={0.72} />,
      )
      break
    case 'left':
    case 'right': {
      const side = facing === 'left' ? sideElevation(C) : (
        <g key="mir" transform="scale(-1 1)">
          {sideElevation(C)}
        </g>
      )
      out.push(side)
      break
    }
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }

  return out
}

function sideElevation(C: ScenePalette): ReactNode {
  const roof = C.sil
  return (
    <g key="side">
      <g color={C.bank}>{groundShadow()}</g>
      {plankWall(-44, -36, 44, 36, C)}
      <path key="roof-slope" d="M -46 -36 L 6 -58 L 6 -20 L -46 -20 Z" fill={roof} stroke={C.rim} strokeWidth={0.65} strokeOpacity={0.32} />
      <path key="eave" d="M -48 -20 L 8 -20 L 8 -16 L -48 -16 Z" fill={roof} opacity={0.94} />
      <rect key="win" x={-36} y={-28} width={12} height={10} fill={C.glow} opacity={0.9} />
      <rect key="chimney" x={-12} y={-56} width={7} height={18} fill={roof} />
      <rect key="chimney-cap" x={-14} y={-58} width={11} height={2.5} fill={C.rim} opacity={0.65} />
      <rect key="sill" x={-45} y={-1} width={48} height={2} fill={C.rim} opacity={0.3} />
    </g>
  )
}
