import type { CSSProperties, ReactNode } from 'react'
import type { HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { mergedPal } from '@/lib/garden/hybrid'
import { gardenRng } from '@/lib/garden/prng'
import { buildSeededPlant, type HybridPlantPalette } from './seeded-builders'

const Hm: Record<string, number> = {
  flower: 72,
  tree: 90,
  succulent: 34,
  vine: 74,
  herb: 58,
  wildflower: 28,
  fern: 46,
  mushroom: 20,
  lotus: 18,
}

const MOTIF_SIZES = [0, 0, 0, 0, 7, 10.5, 12.5, 14]

export function buildMotifNode(m: HybridGenome['motif'], size: number, C: HybridPlantPalette): ReactNode {
  const map: Record<string, string> = { sil: C.sil, rim: C.rim, glow: C.glow, accent: C.accent, none: 'none' }
  return (
    <g transform={`scale(${size / 24}) translate(-12 -12)`}>
      <circle cx={12} cy={12} r={13} fill={C.glow} opacity={0.18} style={{ filter: 'blur(3px)' }} />
      {m.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={map[p.fill] ?? C.glow}
          stroke={p.stroke && p.stroke !== 'none' ? (map[p.stroke] ?? 'none') : 'none'}
          strokeWidth={p.sw || 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </g>
  )
}

export function buildHybrid(
  s: number,
  C: HybridPlantPalette,
  rimv: number,
  motion: boolean,
  g: HybridGenome,
): ReactNode[] {
  const out: ReactNode[] = []
  const hh = (Hm[g.base] || 50) * (0.35 + 0.65 * s / 7)
  const gi = g.glowIntensity ?? 0.5

  if (gi > 0.35 && s >= 4) {
    out.push(
      <ellipse
        key="aura"
        cx={0}
        cy={-hh * 0.55}
        rx={hh * 0.5}
        ry={hh * 0.62}
        fill={C.glow}
        opacity={0.06 + 0.12 * gi}
        style={{ filter: 'blur(6px)' }}
      />,
    )
  }

  out.push(
    <g key="base">
      {buildSeededPlant(g.base, s, gardenRng(g.seed * 17 + s * 3), C, rimv, motion)}
    </g>,
  )

  if (s >= 3 && g.graft) {
    const off = g.base === 'tree' ? 11 : 8
    out.push(
      <g key="graft" transform={`translate(${off} 0) scale(0.55)`}>
        {buildSeededPlant(g.graft, Math.min(s - 1, 7), gardenRng(g.seed * 31 + s * 7), C, rimv, motion)}
      </g>,
    )
  }

  if (s >= 5 && g.adornment && g.adornment !== 'none') {
    if (g.adornment === 'motes' && motion) {
      for (let i = 0; i < 3; i++) {
        out.push(
          <circle
            key={'ad' + i}
            cx={-8 + i * 8}
            cy={-hh - 5 - i * 3}
            r={0.9}
            fill={C.glow}
            opacity={0.7}
            style={{ animation: `mgMote ${3 + i * 0.8}s ease-in-out ${i * 0.7}s infinite` }}
          />,
        )
      }
    }
    if (g.adornment === 'halo') {
      out.push(
        <ellipse
          key="ad"
          cx={0}
          cy={-hh - 9}
          rx={9}
          ry={2.6}
          fill="none"
          stroke={C.rim}
          strokeWidth={0.8}
          opacity={0.55}
          style={motion ? { animation: 'mgPulse 3s ease-in-out infinite alternate' } : undefined}
        />,
      )
    }
    if (g.adornment === 'rings') {
      ;[12, 17].forEach((rr, i) => {
        out.push(
          <ellipse
            key={'ad' + i}
            cx={0}
            cy={-hh * 0.35}
            rx={rr}
            ry={rr * 0.32}
            fill="none"
            stroke={C.glow}
            strokeWidth={0.7}
            opacity={0.32 - i * 0.1}
          />,
        )
      })
    }
    if (g.adornment === 'fireflies' && motion) {
      for (let i = 0; i < 2; i++) {
        out.push(
          <circle
            key={'ad' + i}
            cx={-10 + i * 20}
            cy={-hh * 0.6 - i * 6}
            r={1.2}
            fill={C.glow}
            style={{ animation: `mgFly ${4 + i}s ease-in-out ${i * 1.4}s infinite` }}
          />,
        )
      }
    }
  }

  if (g.motif && g.motif.paths && g.motif.paths.length && s >= 4) {
    const msize = MOTIF_SIZES[s] ?? 0
    const my = g.base === 'tree' ? -hh + 2 : -hh - 4
    const bobStyle: CSSProperties | undefined = motion
      ? { animation: 'mgBob 3.2s ease-in-out infinite alternate' }
      : undefined
    out.push(
      <g key="motif" transform={`translate(0 ${my})`}>
        <g style={bobStyle}>{buildMotifNode(g.motif, msize, C)}</g>
      </g>,
    )
    if (s === 7) {
      ;[
        [-12, -hh * 0.68],
        [11, -hh * 0.82],
      ].forEach(([ax, ay], i) => {
        out.push(
          <g key={'mtf' + i} transform={`translate(${ax} ${ay})`}>
            <g
              style={
                motion
                  ? { animation: `mgBob ${2.6 + i * 0.7}s ease-in-out ${i * 0.5}s infinite alternate` }
                  : undefined
              }
            >
              {buildMotifNode(g.motif, 6.5, C)}
            </g>
          </g>,
        )
      })
    }
  }

  return out
}

export function buildMiniHybrid(
  i: number,
  g: HybridGenome,
  C: ScenePalette,
  rimv: number,
  motion: boolean,
): ReactNode {
  const CH = mergedPal(C, g)
  return (
    <>
      <ellipse cx={66} cy={136} rx={30} ry={5} fill={C.hills[2]} opacity={0.85} />
      <g transform="translate(66 134) scale(1.15)">
        <g
          style={{
            animation: `mgGrow 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.07}s backwards`,
            transformBox: 'fill-box',
            transformOrigin: '50% 100%',
          }}
        >
          {buildHybrid(i, CH, rimv, motion, g)}
        </g>
      </g>
    </>
  )
}

export interface HybridPlantSvgProps {
  genome: HybridGenome
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  stage?: number
  x?: number
  y?: number
  scale?: number
  swayIndex?: number
}

export function HybridPlantSvg({
  genome,
  palette,
  rimStrength,
  motion,
  stage = 7,
  x = 0,
  y = 460,
  scale = 1,
  swayIndex = 0,
}: HybridPlantSvgProps) {
  const CH = mergedPal(palette, genome)
  const swayStyle: CSSProperties | undefined = motion
    ? {
        animation: `mgSwayB ${4 + (swayIndex % 5) * 0.6}s ease-in-out ${swayIndex * 0.4}s infinite alternate`,
        transformBox: 'fill-box',
        transformOrigin: '50% 100%',
      }
    : undefined

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g style={swayStyle}>{buildHybrid(stage, CH, rimStrength, motion, genome)}</g>
    </g>
  )
}

export interface HybridGrowthStripProps {
  genome: HybridGenome
  palette: ScenePalette
  rimStrength: number
  motion: boolean
}

export function HybridGrowthStrip({ genome, palette, rimStrength, motion }: HybridGrowthStripProps) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <svg key={i} width={132} height={150} viewBox="0 0 132 150" aria-hidden>
          {buildMiniHybrid(i, genome, palette, rimStrength, motion)}
        </svg>
      ))}
    </div>
  )
}