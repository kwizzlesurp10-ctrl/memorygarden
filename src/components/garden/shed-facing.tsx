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

function sideElevation(C: ScenePalette, rim: number): ReactNode[] {
  return [
    <rect key="wall" x={-46} y={-36} width={42} height={36} fill={C.sil} {...rs(C, rim, 0.45)} />,
    <rect key="win" x={-36} y={-28} width={12} height={10} fill={C.glow} opacity={0.82} {...rs(C, rim, 0.4)} />,
    <path key="roof-slope" d="M -48 -36 L -48 -58 L 6 -44 L 6 -20 L -48 -20 Z" fill={C.silSoft} {...rs(C, rim, 0.5)} />,
    <path
      key="eave"
      d="M -50 -36 L -50 -60 L 8 -45"
      stroke={C.rim}
      strokeWidth={1.2}
      fill="none"
      opacity={0.5 * rim}
    />,
    <path key="thatch-edge" d="M -48 -58 Q -20 -64 6 -44" stroke={C.rim} strokeWidth={0.7} fill="none" opacity={0.35 * rim} />,
    <rect key="chimney" x={-14} y={-56} width={7} height={18} fill={C.sil} {...rs(C, rim, 0.4)} />,
    <rect key="chimney-cap" x={-16} y={-58} width={11} height={2.5} fill={C.silSoft} />,
    <ellipse key="foundation" cx={-24} cy={1} rx={28} ry={2.5} fill={C.silSoft} opacity={0.95} />,
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

  switch (facing) {
    case 'front':
      out.push(<path key="wall" d="M -38 0 L -38 -36 L 38 -36 L 38 0 Z" fill={C.sil} {...rs(C, rim, 0.45)} />)
      out.push(<path key="thatch" d="M -50 -32 Q 0 -80 50 -32 Q 0 -56 -50 -32 Z" fill={C.sil} {...rs(C, rim, 0.5)} />)
      out.push(<path key="door" d="M -12 0 L -12 -24 Q 0 -34 12 -24 L 12 0 Z" fill={C.silSoft} {...rs(C, rim, 0.3)} />)
      out.push(<circle key="knob" cx={7} cy={-13} r={1.2} fill={C.glow} opacity={0.9} />)
      out.push(<rect key="swin" x={20} y={-28} width={13} height={11} fill={C.glow} opacity={0.85} {...rs(C, rim, 0.4)} />)
      out.push(<circle key="rwin" cx={0} cy={-50} r={6.5} fill={C.glow} opacity={0.8} {...rs(C, rim, 0.5)} />)
      break
    case 'back':
      out.push(<path key="wall" d="M -36 0 L -36 -34 L 36 -34 L 36 0 Z" fill={C.sil} {...rs(C, rim, 0.4)} />)
      out.push(<path key="thatch" d="M -46 -28 Q 0 -74 46 -28 Q 0 -50 -46 -28 Z" fill={C.silSoft} {...rs(C, rim, 0.42)} />)
      out.push(<rect key="chimney" x={20} y={-56} width={8} height={20} fill={C.sil} {...rs(C, rim, 0.45)} />)
      out.push(<rect key="backwin" x={-7} y={-26} width={14} height={10} fill={C.glow} opacity={0.55} {...rs(C, rim, 0.35)} />)
      out.push(<ellipse key="step" cx={0} cy={2} rx={22} ry={2.4} fill={C.silSoft} opacity={0.9} />)
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
