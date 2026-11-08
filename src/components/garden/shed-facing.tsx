import type { ReactNode } from 'react'
import type { ShedStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import type { PlantFacing } from '@/lib/garden/landscape-world'
import { shed } from './scenery'

function rs(C: ScenePalette, rimv: number, o: number) {
  return { stroke: C.rim, strokeOpacity: o * rimv, strokeWidth: 0.8 }
}

const SHED_FACING_SCALE: Record<PlantFacing, number> = {
  front: 1.32,
  back: 1.12,
  left: 1.28,
  right: 1.28,
}

export function shedDrawScale(facing: PlantFacing): number {
  return SHED_FACING_SCALE[facing]
}

function plankLines(C: ScenePalette, x0: number, y0: number, w: number, h: number): ReactNode[] {
  const lines: ReactNode[] = []
  for (let i = 1; i < 4; i++) {
    const y = y0 + (h * i) / 4
    lines.push(
      <line key={`pl${i}`} x1={x0} y1={y} x2={x0 + w} y2={y} stroke={C.rim} strokeWidth={0.35} opacity={0.18} />,
    )
  }
  return lines
}

function sideElevation(C: ScenePalette, rim: number): ReactNode[] {
  const wall = C.silSoft
  const roof = C.sil
  return [
    <ellipse key="ground-shadow" cx={-22} cy={2.8} rx={34} ry={3.8} fill={C.bank} opacity={0.55} />,
    <rect key="wall" x={-46} y={-36} width={42} height={36} fill={wall} {...rs(C, rim, 0.28)} />,
    ...plankLines(C, -46, -36, 42, 36),
    <rect key="win" x={-36} y={-28} width={12} height={10} fill={C.glow} opacity={0.92} {...rs(C, rim, 0.35)} />,
    <rect key="win-mullion" x={-30.5} y={-28} width={1} height={10} fill={C.rim} opacity={0.25} />,
    <path
      key="roof"
      d="M -50 -36 L -50 -56 L 8 -42 L 8 -18 L -50 -18 Z"
      fill={roof}
      {...rs(C, rim, 0.4)}
    />,
    <path key="eave-fill" d="M -52 -18 L 10 -18 L 10 -14 L -52 -14 Z" fill={roof} opacity={0.92} />,
    <rect key="chimney" x={-14} y={-58} width={7} height={20} fill={roof} {...rs(C, rim, 0.35)} />,
    <rect key="chimney-cap" x={-16} y={-60} width={11} height={2.5} fill={C.rim} opacity={0.7} />,
    <rect key="sill" x={-48} y={-1} width={46} height={2} fill={C.rim} opacity={0.35} />,
  ]
}

/** Per-facing storybook cottage art (asymmetric — not a single mirror). */
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

  const rim = rimStrength
  const out: ReactNode[] = []
  const wall = C.silSoft
  const roof = C.sil

  switch (facing) {
    case 'front':
      out.push(<ellipse key="gsh" cx={0} cy={2.6} rx={38} ry={3.2} fill={C.bank} opacity={0.5} />)
      out.push(<path key="wall" d="M -38 0 L -38 -36 L 38 -36 L 38 0 Z" fill={wall} {...rs(C, rim, 0.3)} />)
      out.push(<path key="thatch" d="M -50 -32 Q 0 -80 50 -32 Q 0 -56 -50 -32 Z" fill={roof} {...rs(C, rim, 0.45)} />)
      out.push(<path key="door" d="M -12 0 L -12 -24 Q 0 -34 12 -24 L 12 0 Z" fill={C.bank} opacity={0.85} {...rs(C, rim, 0.25)} />)
      out.push(<circle key="knob" cx={7} cy={-13} r={1.2} fill={C.glow} opacity={0.9} />)
      out.push(<rect key="swin" x={20} y={-28} width={13} height={11} fill={C.glow} opacity={0.9} {...rs(C, rim, 0.35)} />)
      out.push(<circle key="rwin" cx={0} cy={-50} r={6.5} fill={C.glow} opacity={0.82} {...rs(C, rim, 0.45)} />)
      break
    case 'back':
      out.push(<ellipse key="gsh" cx={0} cy={2.4} rx={36} ry={3} fill={C.bank} opacity={0.5} />)
      out.push(<path key="wall" d="M -36 0 L -36 -34 L 36 -34 L 36 0 Z" fill={wall} {...rs(C, rim, 0.28)} />)
      out.push(<path key="thatch" d="M -46 -28 Q 0 -74 46 -28 Q 0 -50 -46 -28 Z" fill={roof} {...rs(C, rim, 0.4)} />)
      out.push(<rect key="chimney" x={20} y={-56} width={8} height={20} fill={roof} {...rs(C, rim, 0.4)} />)
      out.push(<rect key="backwin" x={-7} y={-26} width={14} height={10} fill={C.glow} opacity={0.62} {...rs(C, rim, 0.3)} />)
      break
    case 'left':
      out.push(...sideElevation(C, rim))
      break
    case 'right':
      out.push(
        <g key="side-mirror" transform="scale(-1 1)">
          {sideElevation(C, rim)}
        </g>,
      )
      break
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }

  return out
}
