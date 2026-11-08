import type { ReactNode } from 'react'
import type { ShedStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import type { PlantFacing } from '@/lib/garden/landscape-world'
import { shed } from './scenery'

const SHED_FACING_SCALE: Record<PlantFacing, number> = {
  front: 1.16,
  back: 1.02,
  left: 1.12,
  right: 1.12,
}

export function shedDrawScale(facing: PlantFacing): number {
  return SHED_FACING_SCALE[facing]
}

function groundShadow(): ReactNode {
  return (
    <>
      <ellipse key="gsh" cx={0} cy={3.2} rx={40} ry={4.2} fill="currentColor" opacity={0.5} />
      <ellipse key="gsh-soft" cx={4} cy={3.6} rx={28} ry={2.4} fill="currentColor" opacity={0.28} />
    </>
  )
}

function shedBaseGrass(C: ScenePalette): ReactNode[] {
  const stroke = C.hills[2]
  const offsets = [-22, -8, 6, 18, 30]
  return offsets.map((x, i) => (
    <path
      key={`sgr${i}`}
      d={`M ${x} 0.5 Q ${x - 2} -5 ${x + 1} -10`}
      stroke={stroke}
      strokeWidth={1.1}
      fill="none"
      strokeLinecap="round"
      opacity={0.55 + (i % 2) * 0.12}
    />
  ))
}

function warmWindowGlow(x: number, y: number, w: number, h: number, C: ScenePalette): ReactNode {
  return (
    <>
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} fill={C.fire} opacity={0.32} rx={2} style={{ filter: 'blur(3px)' }} />
      <rect x={x} y={y} width={w} height={h} fill={C.glow} opacity={0.95} />
    </>
  )
}

function plankWall(
  x: number,
  y: number,
  w: number,
  h: number,
  C: ScenePalette,
): ReactNode[] {
  const wall = C.hills[1]
  const planks: ReactNode[] = [
    <rect key="wall" x={x} y={y} width={w} height={h} fill={wall} opacity={0.78} stroke={C.rim} strokeWidth={0.55} strokeOpacity={0.3} />,
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
  const roofLight = C.hills[0]
  const roofDark = C.sil
  const out: ReactNode[] = []

  switch (facing) {
    case 'front':
      out.push(
        <g key="gshadow" color={C.bank}>
          {groundShadow()}
        </g>,
        ...shedBaseGrass(C),
        ...plankWall(-38, -36, 76, 36, C),
        <path key="roof" d="M -50 -36 L 0 -72 L 50 -36 Z" fill={roofLight} stroke={C.rim} strokeWidth={0.7} strokeOpacity={0.35} />,
        <path key="roof-shade" d="M 2 -68 L 48 -36 L 50 -36 L 0 -72 Z" fill={roofDark} opacity={0.28} />,
        <path key="eave" d="M -54 -36 L 54 -36 L 52 -30 L -52 -30 Z" fill={roofLight} opacity={0.96} />,
        <path key="eave-shadow" d="M -52 -30 L 52 -30 L 50 -26 L -50 -26 Z" fill={roofDark} opacity={0.3} />,
        <rect key="chimney" x={22} y={-64} width={8} height={22} fill={roofDark} />,
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
        <g key="front-window">{warmWindowGlow(16, -28, 14, 11, C)}</g>,
      )
      break
    case 'back':
      out.push(
        <g key="gshadow" color={C.bank}>
          {groundShadow()}
        </g>,
        ...shedBaseGrass(C),
        <rect key="wall-base" x={-38} y={-36} width={76} height={36} fill={C.hills[1]} opacity={0.82} rx={1} />,
        ...plankWall(-36, -34, 72, 34, C),
        <path key="wall-lit" d="M 18 -34 L 36 -34 L 36 0 L 22 0 Z" fill={C.glow} opacity={0.22} />,
        <path key="roof" d="M -46 -34 L 0 -68 L 46 -34 Z" fill={roofLight} stroke={C.rim} strokeWidth={0.65} strokeOpacity={0.35} />,
        <path key="roof-shade" d="M 2 -64 L 44 -34 L 46 -34 L 0 -68 Z" fill={roofDark} opacity={0.22} />,
        <path key="roof-lit" d="M -44 -36 L 0 -66 L -2 -34 Z" fill={C.hills[1]} opacity={0.22} />,
        <path key="eave" d="M -50 -34 L 50 -34 L 48 -28 L -48 -28 Z" fill={roofLight} opacity={0.94} />,
        <path key="eave-shadow" d="M -48 -28 L 48 -28 L 46 -24 L -46 -24 Z" fill={roofDark} opacity={0.22} />,
        <rect key="chimney" x={20} y={-62} width={8} height={20} fill={roofDark} />,
        <rect key="chimney-cap" x={18} y={-64} width={12} height={2.5} fill={C.rim} opacity={0.65} />,
        <g key="back-window">{warmWindowGlow(-8, -26, 16, 10, C)}</g>,
        <path
          key="door-hint"
          d="M -9 0 L -9 -20 Q 0 -26 9 -20 L 9 0"
          fill={C.bank}
          opacity={0.78}
          stroke={C.rim}
          strokeWidth={0.45}
          strokeOpacity={0.28}
        />,
        <rect key="sill" x={-38} y={-1} width={76} height={2.5} fill={C.rim} opacity={0.32} />,
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
  const roofLight = C.hills[0]
  const roofDark = C.sil
  const wall = C.hills[1]
  return (
    <g key="side">
      <g color={C.bank}>{groundShadow()}</g>
      {shedBaseGrass(C)}
      <rect key="wall-base" x={-46} y={-36} width={50} height={36} fill={wall} opacity={0.85} rx={1} />
      {plankWall(-44, -36, 44, 36, C)}
      <path key="roof-slope" d="M -46 -36 L 6 -58 L 6 -20 L -46 -20 Z" fill={roofLight} stroke={C.rim} strokeWidth={0.68} strokeOpacity={0.38} />
      <path key="roof-lit" d="M -44 -34 L -6 -52 L -6 -20 L -44 -20 Z" fill={C.hills[2]} opacity={0.24} />
      <path key="roof-shade" d="M -4 -52 L 6 -58 L 6 -20 L -20 -20 Z" fill={roofDark} opacity={0.18} />
      <path key="wall-edge-lit" d="M -44 -36 L -44 -1 L -38 -1 L -38 -36 Z" fill={C.glow} opacity={0.32} />
      <path key="eave" d="M -50 -20 L 10 -20 L 10 -14 L -50 -14 Z" fill={roofLight} opacity={0.96} />
      <g key="side-window">{warmWindowGlow(-36, -28, 12, 10, C)}</g>
      <rect key="chimney" x={-12} y={-56} width={7} height={18} fill={roofDark} />
      <rect key="chimney-cap" x={-14} y={-58} width={11} height={2.5} fill={C.rim} opacity={0.65} />
      <rect key="sill" x={-45} y={-1} width={48} height={2.5} fill={C.rim} opacity={0.34} />
    </g>
  )
}
