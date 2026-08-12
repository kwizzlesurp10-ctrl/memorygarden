import type { CSSProperties, ReactNode } from 'react'
import type { Candle, ShedStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'

export interface SceneryMotionProps {
  C: ScenePalette
  rimStrength: number
  motion: boolean
}

function rs(C: ScenePalette, rimv: number, o: number) {
  return { stroke: C.rim, strokeOpacity: o * rimv, strokeWidth: 0.8 }
}

export function candle({
  C,
  motion,
  cd,
  i,
}: {
  C: ScenePalette
  motion: boolean
  cd: Candle
  i: number
}): ReactNode[] {
  const out: ReactNode[] = []
  out.push(<title key="t">{(cd.note ? cd.note + ' · ' : '') + cd.date}</title>)
  out.push(
    <ellipse key="ring" cx={0} cy={1.6} rx={11} ry={2.8} fill="none" stroke={C.ripple} strokeWidth={0.7} opacity={0.3} />,
  )
  out.push(
    <ellipse key="refl" cx={0} cy={10} rx={2.2} ry={8} fill="#ffcf8f" opacity={0.28} style={{ filter: 'blur(2px)' }} />,
  )

  const boat: ReactNode[] = []
  boat.push(
    <path
      key="dish"
      d="M -8 0 Q -8 3.4 0 3.8 Q 8 3.4 8 0 Q 4 1.4 0 1.4 Q -4 1.4 -8 0 Z"
      fill={C.sil}
      stroke={C.rim}
      strokeOpacity={0.4}
      strokeWidth={0.5}
    />,
  )
  boat.push(
    <path key="body" d="M -2.8 0.6 L -2.8 -6.4 Q 0 -7.4 2.8 -6.4 L 2.8 0.6 Z" fill="#f2e4c8" opacity={0.95} />,
  )
  boat.push(
    <path key="drip" d="M -2.8 -5.8 q -0.9 1.4 -0.4 2.8" stroke="#f2e4c8" strokeWidth={0.8} fill="none" strokeLinecap="round" opacity={0.8} />,
  )
  boat.push(
    <circle
      key="halo"
      cx={0}
      cy={-10}
      r={7.5}
      fill="#ffd88a"
      opacity={0.28}
      style={{
        filter: 'blur(3px)',
        animation: motion ? `mgPulse ${2.4 + (i % 4) * 0.5}s ease-in-out infinite alternate` : 'none',
      }}
    />,
  )
  const flStyle: CSSProperties | undefined = motion
    ? {
        animation: `mgFlick ${0.85 + (i % 5) * 0.13}s ease-in-out ${(i % 3) * 0.3}s infinite alternate`,
        transformBox: 'fill-box',
        transformOrigin: '50% 100%',
      }
    : undefined
  boat.push(
    <g key="fl" style={flStyle}>
      <path d="M 0 -7 C -1.9 -9.4, -1.1 -12.2, 0 -13.8 C 1.1 -12.2, 1.9 -9.4, 0 -7 Z" fill="#ffcf8f" />
      <path d="M 0 -7.6 C -0.9 -8.9, -0.5 -10.6, 0 -11.6 C 0.5 -10.6, 0.9 -8.9, 0 -7.6 Z" fill="#fff4dc" />
    </g>,
  )

  const lapStyle: CSSProperties | undefined = motion
    ? { animation: `mgLap ${3 + (i % 4) * 0.7}s ease-in-out ${(i % 5) * 0.4}s infinite alternate` }
    : undefined
  out.push(
    <g key="boat" style={lapStyle}>
      {boat}
    </g>,
  )
  return out
}

export function shed({ kind, C, rimStrength: rimv, motion }: SceneryMotionProps & { kind: ShedStyle }): ReactNode[] {
  const out: ReactNode[] = []

  if (kind === 'antique') {
    out.push(<path key="wall" d="M -40 0 L -39 -40 L 0 -57 L 40 -42 L 41 0 Z" fill={C.sil} {...rs(C, rimv, 0.45)} />)
    ;[
      [-28, -36],
      [-16, -38],
      [30, -37],
    ].forEach(([px, py], i) =>
      out.push(<line key={'pl' + i} x1={px} y1={-2} x2={px + 1} y2={py} stroke={C.silSoft} strokeWidth={1} opacity={0.8} />),
    )
    out.push(<path key="roof" d="M -50 -35 Q -4 -66 50 -37" stroke={C.sil} strokeWidth={7} fill="none" strokeLinecap="round" />)
    out.push(<path key="roofr" d="M -50 -38 Q -4 -69 50 -40" stroke={C.rim} strokeWidth={1.2} fill="none" opacity={0.5 * rimv} strokeLinecap="round" />)
    out.push(<circle key="moss1" cx={-22} cy={-51} r={4} fill={C.silSoft} opacity={0.9} />)
    out.push(<circle key="moss2" cx={14} cy={-55} r={3} fill={C.silSoft} opacity={0.9} />)
    out.push(
      <g key="pipe" transform="rotate(4 24 -60)">
        <rect x={21} y={-76} width={6} height={18} fill={C.sil} />
        <ellipse cx={24} cy={-77} rx={4.5} ry={1.6} fill={C.sil} />
      </g>,
    )
    out.push(
      <g key="door" transform="rotate(-2 -2 -16)">
        <rect x={-13} y={-33} width={23} height={33} fill={C.silSoft} {...rs(C, rimv, 0.3)} />
        <circle cx={6} cy={-17} r={1.2} fill={C.glow} opacity={0.9} />
      </g>,
    )
    out.push(<rect key="win" x={18} y={-32} width={14} height={12} fill={C.glow} opacity={0.75} {...rs(C, rimv, 0.4)} />)
    out.push(<path key="mull" d="M 25 -32 L 25 -20 M 18 -26 L 32 -26" stroke={C.sil} strokeWidth={1.2} />)
    out.push(<path key="hook" d="M -44 -34 q -5 1 -5 5" stroke={C.sil} strokeWidth={1.4} fill="none" strokeLinecap="round" />)
    out.push(
      <circle
        key="lant"
        cx={-49}
        cy={-26}
        r={2.6}
        fill={C.glow}
        opacity={0.95}
        style={motion ? { animation: 'mgPulse 3s ease-in-out infinite alternate' } : undefined}
      />,
    )
    out.push(<circle key="lanth" cx={-49} cy={-26} r={5.5} fill={C.glow} opacity={0.2} style={{ filter: 'blur(2px)' }} />)
  }

  if (kind === 'storybook') {
    out.push(<path key="wall" d="M -38 0 L -38 -36 L 38 -36 L 38 0 Z" fill={C.sil} {...rs(C, rimv, 0.45)} />)
    out.push(<path key="thatch" d="M -50 -32 Q 0 -80 50 -32 Q 0 -56 -50 -32 Z" fill={C.sil} {...rs(C, rimv, 0.5)} />)
    out.push(<path key="thatchr" d="M -42 -38 Q 0 -74 42 -38" stroke={C.rim} strokeWidth={1} fill="none" opacity={0.4 * rimv} />)
    out.push(<circle key="rwin" cx={0} cy={-50} r={6.5} fill={C.glow} opacity={0.8} {...rs(C, rimv, 0.5)} />)
    out.push(<path key="rmull" d="M -6.5 -50 L 6.5 -50 M 0 -56.5 L 0 -43.5" stroke={C.sil} strokeWidth={1.2} />)
    out.push(<path key="door" d="M -12 0 L -12 -24 Q 0 -34 12 -24 L 12 0 Z" fill={C.silSoft} {...rs(C, rimv, 0.3)} />)
    out.push(<circle key="knob" cx={7} cy={-13} r={1.2} fill={C.glow} opacity={0.9} />)
    out.push(<rect key="swin" x={20} y={-28} width={13} height={11} fill={C.glow} opacity={0.75} {...rs(C, rimv, 0.4)} />)
    out.push(<rect key="box" x={18} y={-17} width={17} height={5} fill={C.sil} />)
    ;[
      [21, 0],
      [26, 1],
      [31, 0],
    ].forEach(([fx, alt], i) => {
      out.push(<circle key={'fl' + i} cx={fx} cy={-19.5} r={1.6} fill={alt ? C.glow : C.accent} opacity={0.95} />)
    })
    out.push(<ellipse key="st1" cx={-4} cy={4} rx={6} ry={1.8} fill={C.silSoft} />)
    out.push(<ellipse key="st2" cx={10} cy={8} rx={5} ry={1.6} fill={C.silSoft} />)
  }

  if (kind === 'glass') {
    out.push(
      <path
        key="glow"
        d="M -42 0 L -42 -34 L 0 -60 L 42 -34 L 42 0 Z"
        fill={C.glow}
        opacity={0.14}
        style={motion ? { animation: 'mgPulse 4.5s ease-in-out infinite alternate' } : undefined}
      />,
    )
    out.push(<path key="frame" d="M -42 0 L -42 -34 L 0 -60 L 42 -34 L 42 0 Z" fill="none" stroke={C.sil} strokeWidth={2.4} />)
    ;[-28, -14, 14, 28].forEach((mx, i) =>
      out.push(
        <line
          key={'m' + i}
          x1={mx}
          y1={0}
          x2={mx}
          y2={-34 - (1 - Math.abs(mx) / 42) * 0}
          stroke={C.sil}
          strokeWidth={1.1}
          opacity={0.9}
        />,
      ),
    )
    out.push(<line key="mh" x1={-42} y1={-30} x2={42} y2={-30} stroke={C.sil} strokeWidth={1.1} opacity={0.9} />)
    out.push(<path key="rm1" d="M 0 -60 L -30 -26 M 0 -60 L 30 -26" stroke={C.sil} strokeWidth={1.1} opacity={0.9} />)
    out.push(<path key="ridge" d="M -2 -60 L 2 -60" stroke={C.rim} strokeWidth={2} opacity={0.6 * rimv} strokeLinecap="round" />)
    out.push(<rect key="door" x={-7} y={-26} width={14} height={26} fill="none" stroke={C.sil} strokeWidth={1.6} />)
    out.push(<circle key="knob" cx={4} cy={-13} r={1.1} fill={C.sil} />)
    out.push(
      <g key="plants" opacity={0.9}>
        <path d="M -34 -1 Q -36 -10 -32 -16 M -34 -1 Q -30 -8 -34 -14" stroke={C.sil} strokeWidth={1.3} fill="none" strokeLinecap="round" />
        <circle cx={-22} cy={-6} r={4} fill={C.sil} />
        <rect x={-25} y={-4} width={6} height={4} fill={C.sil} />
        <path d="M 24 -1 Q 22 -12 28 -18 M 24 -1 Q 28 -9 24 -13 M 34 -1 Q 35 -8 32 -12" stroke={C.sil} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      </g>,
    )
  }

  if (kind === 'modern') {
    out.push(<path key="body" d="M -44 0 L -44 -40 L 44 -54 L 44 0 Z" fill={C.sil} />)
    out.push(<path key="fascia" d="M -48 -40 L 48 -55" stroke={C.rim} strokeWidth={2} opacity={0.65 * rimv} strokeLinecap="round" />)
    out.push(
      <path
        key="glass"
        d="M 8 0 L 8 -47 L 40 -52 L 40 0 Z"
        fill={C.glow}
        opacity={0.32}
        style={motion ? { animation: 'mgPulse 5s ease-in-out infinite alternate' } : undefined}
      />,
    )
    ;[20, 32].forEach((gx, i) =>
      out.push(<line key={'gm' + i} x1={gx} y1={0} x2={gx} y2={-49} stroke={C.sil} strokeWidth={1.4} />),
    )
    out.push(<circle key="handle" cx={11.5} cy={-22} r={1} fill={C.rim} opacity={0.8} />)
    for (let i = 0; i < 6; i++) {
      out.push(
        <line
          key={'slat' + i}
          x1={-41}
          y1={-6 - i * 6}
          x2={4}
          y2={-6.8 - i * 6}
          stroke={C.silSoft}
          strokeWidth={1}
          opacity={0.75}
        />,
      )
    }
    out.push(<rect key="planter" x={-58} y={-8} width={16} height={8} fill={C.silSoft} />)
    out.push(
      <g key="succ" transform="translate(-50 -8) scale(0.5)">
        <g transform="scale(1 0.62)">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d="M 0 0 Q -2.4 -4.4, 0 -8 Q 2.4 -4.4, 0 0 Z" fill={C.sil} />
            </g>
          ))}
        </g>
      </g>,
    )
    out.push(<line key="lamp" x1={52} y1={0} x2={52} y2={-7} stroke={C.sil} strokeWidth={1.2} />)
    out.push(
      <circle
        key="lampg"
        cx={52}
        cy={-8.5}
        r={1.8}
        fill={C.glow}
        opacity={0.95}
        style={motion ? { animation: 'mgPulse 3.6s ease-in-out infinite alternate' } : undefined}
      />,
    )
  }

  return out
}

export function cattail({
  C,
  rimStrength: rim,
  r,
}: {
  C: ScenePalette
  rimStrength: number
  r: () => number
}): ReactNode[] {
  const h = 32 + r() * 14
  const lean = (r() - 0.5) * 6
  return [
    <path
      key="s"
      d={`M 0 0 Q ${lean * 0.4} ${-h * 0.5}, ${lean} ${-h}`}
      stroke={C.sil}
      strokeWidth={1.1}
      fill="none"
      strokeLinecap="round"
    />,
    <ellipse
      key="h"
      cx={lean}
      cy={-h + 5.5}
      rx={2.2}
      ry={7}
      fill={C.sil}
      stroke={C.rim}
      strokeOpacity={0.4 * rim}
      strokeWidth={0.5}
    />,
    <path
      key="t"
      d={`M ${lean} ${-h - 1.5} L ${lean + 0.5} ${-h - 7}`}
      stroke={C.sil}
      strokeWidth={0.7}
      strokeLinecap="round"
    />,
    <path
      key="b"
      d={`M 2 0 Q ${7 + lean} ${-h * 0.45}, ${11 + lean} ${-h * 0.85}`}
      stroke={C.silSoft}
      strokeWidth={0.9}
      fill="none"
      strokeLinecap="round"
    />,
  ]
}

export function grassTuft({ C, r }: { C: ScenePalette; r: () => number }): ReactNode[] {
  const blades: ReactNode[] = []
  const k = 5 + Math.floor(r() * 3)
  for (let i = 0; i < k; i++) {
    const side = -1 + (2 * i) / (k - 1)
    const len = 7 + r() * 11
    blades.push(
      <path
        key={i}
        d={`M 0 0 Q ${side * len * 0.4} ${-len * 0.6}, ${side * len * 0.85} ${-len}`}
        stroke={i % 2 ? C.silSoft : C.sil}
        strokeWidth={0.8 + r() * 0.5}
        fill="none"
        strokeLinecap="round"
      />,
    )
  }
  return blades
}

export function rock({ C, rimStrength: rim, w }: { C: ScenePalette; rimStrength: number; w: number }): ReactNode[] {
  return [
    <path
      key="r"
      d={`M ${-w} 0 Q ${-w * 0.9} ${-w * 0.75}, ${-w * 0.2} ${-w * 0.85} Q ${w * 0.6} ${-w * 0.9}, ${w} ${-w * 0.2} L ${w} 0 Z`}
      fill={C.silSoft}
    />,
    <path
      key="h"
      d={`M ${-w * 0.75} ${-w * 0.62} Q ${-w * 0.15} ${-w * 0.82}, ${w * 0.5} ${-w * 0.68}`}
      stroke={C.rim}
      strokeOpacity={0.3 * rim}
      strokeWidth={0.8}
      fill="none"
      strokeLinecap="round"
    />,
  ]
}