import type { ReactNode } from 'react'
import type { ShedStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import type { PlantFacing } from '@/lib/garden/landscape-world'
import { shed } from './scenery'

function rs(C: ScenePalette, rimv: number, o: number) {
  return { stroke: C.rim, strokeOpacity: o * rimv, strokeWidth: 0.8 }
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
      out.push(<path key="wall" d="M -38 0 L -38 -36 L 38 -36 L 38 0 Z" fill={C.silSoft} {...rs(C, rim, 0.35)} />)
      out.push(<path key="thatch" d="M -48 -30 Q 0 -78 48 -30 Q 0 -54 -48 -30 Z" fill={C.sil} {...rs(C, rim, 0.45)} />)
      out.push(<rect key="chimney" x={22} y={-58} width={9} height={22} fill={C.sil} {...rs(C, rim, 0.4)} />)
      out.push(<rect key="backwin" x={-8} y={-28} width={16} height={12} fill={C.glow} opacity={0.35} {...rs(C, rim, 0.3)} />)
      break
    case 'left':
      out.push(<path key="gable" d="M 0 0 L 0 -56 L 34 -28 L 34 0 Z" fill={C.sil} {...rs(C, rim, 0.5)} />)
      out.push(<path key="roof" d="M 0 -56 L 42 -34 L 0 -12 Z" fill={C.silSoft} {...rs(C, rim, 0.35)} />)
      out.push(<circle key="round" cx={12} cy={-26} r={5} fill={C.glow} opacity={0.55} {...rs(C, rim, 0.4)} />)
      out.push(<path key="beam" d="M 8 -18 L 22 -30" stroke={C.sil} strokeWidth={1.4} />)
      break
    case 'right':
      out.push(<path key="gable" d="M 0 0 L 0 -56 L -34 -28 L -34 0 Z" fill={C.sil} {...rs(C, rim, 0.5)} />)
      out.push(<path key="roof" d="M 0 -56 L -42 -34 L 0 -12 Z" fill={C.silSoft} {...rs(C, rim, 0.35)} />)
      out.push(<rect key="box" x={-28} y={-14} width={14} height={6} fill={C.sil} />)
      ;[[-22, 0], [-18, 1], [-14, 0]].forEach(([fx, alt], i) => {
        out.push(<circle key={`fl${i}`} cx={fx} cy={-16.5} r={1.6} fill={alt ? C.glow : C.accent} opacity={0.95} />)
      })
      out.push(<path key="lean" d="M -30 4 Q -34 8 -28 12" stroke={C.silSoft} strokeWidth={1.6} fill="none" />)
      break
    default: {
      const _exhaustive: never = facing
      return _exhaustive
    }
  }

  return out
}
