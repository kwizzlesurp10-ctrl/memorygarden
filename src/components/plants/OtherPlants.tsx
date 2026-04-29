import type { ReactNode } from 'react'
import type { PlantStage } from '@/lib/types'

interface PlantProps {
  stage: PlantStage
  color: string
  stemColor: string
  groundColor: string
}

const STAGES = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
function si(stage: PlantStage): number { return STAGES.indexOf(stage) }

// Native SVG animation — pivots from (50, 90) in SVG user-unit space.
function Sway({ children, dur = 4 }: { children: ReactNode; dur?: number }) {
  return (
    <g>
      <animateTransform
        attributeName="transform"
        type="rotate"
        values={`-1.8 50 90; 1.8 50 90; -1.8 50 90`}
        dur={`${dur}s`}
        repeatCount="indefinite"
        calcMode="spline"
        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
      />
      {children}
    </g>
  )
}

// ── Tree ───────────────────────────────────────────────────────────────────────

export function TreePlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const idx = si(stage)

  if (idx < 1) {
    // Seed — acorn silhouette
    return (
      <>
        <ellipse cx="50" cy="86" rx="12" ry="4" fill={groundColor} opacity="0.6" />
        <path d="M 44 79 C 43 70 50 67 57 70 C 60 73 59 81 55 84 C 50 87 43 84 44 79 Z"
          fill={stemColor} opacity="0.88" />
        <ellipse cx="50" cy="68.5" rx="8" ry="4.5" fill={stemColor} opacity="0.58"
          style={{ filter: 'brightness(0.82)' }} />
      </>
    )
  }

  const trunkH = 18 + idx * 9
  const trunkTopY = 90 - trunkH
  const bw = 5 + idx * 0.9        // trunk base half-width
  const tw = 2.2 + idx * 0.4      // trunk top half-width
  const canopyRx = 14 + idx * 4.5
  const canopyRy = 12 + idx * 3.5

  return (
    <>
      {/* Root flare */}
      <ellipse cx="50" cy="90" rx={bw + 10 + idx} ry="5.5" fill={groundColor} opacity="0.65" />
      {idx >= 3 && (
        <>
          <path d={`M ${50 - bw - 2} 90 C ${50 - bw - 5} 86 ${50 - bw - 3} 83 ${50 - tw - 1} ${trunkTopY + 16}`}
            stroke={groundColor} strokeWidth="2" fill="none" opacity="0.55" />
          <path d={`M ${50 + bw + 2} 90 C ${50 + bw + 5} 86 ${50 + bw + 3} 83 ${50 + tw + 1} ${trunkTopY + 16}`}
            stroke={groundColor} strokeWidth="2" fill="none" opacity="0.55" />
        </>
      )}
      <Sway dur={5 + idx * 0.25}>
        {/* Tapered trunk */}
        <path
          d={`M ${50 - bw} 90 C ${50 - bw * 0.75} ${82} ${50 - tw * 1.3} ${trunkTopY + 10} ${50 - tw} ${trunkTopY}
              L ${50 + tw} ${trunkTopY}
              C ${50 + tw * 1.3} ${trunkTopY + 10} ${50 + bw * 0.75} ${82} ${50 + bw} 90 Z`}
          fill={stemColor} opacity="0.90"
        />
        {/* Bark line */}
        <path d={`M 50 ${trunkTopY + 5} C 50 ${trunkTopY + trunkH * 0.4} 50 ${trunkTopY + trunkH * 0.7} 50 90`}
          stroke={stemColor} strokeWidth="0.8" fill="none" opacity="0.30"
          style={{ filter: 'brightness(0.72)' }} />

        {/* Side branches at bud+ */}
        {idx >= 4 && (
          <>
            <path d={`M 50 ${trunkTopY + 14} C ${50 - 8} ${trunkTopY + 7} ${50 - 16} ${trunkTopY + 3} ${50 - canopyRx * 0.62} ${trunkTopY - 1}`}
              stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d={`M 50 ${trunkTopY + 14} C ${50 + 8} ${trunkTopY + 7} ${50 + 16} ${trunkTopY + 3} ${50 + canopyRx * 0.62} ${trunkTopY - 1}`}
              stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Canopy — multiple overlapping blobs for organic silhouette */}
        {idx >= 5 && (
          <ellipse cx={50 - canopyRx * 0.5} cy={trunkTopY - canopyRy * 0.28}
            rx={canopyRx * 0.72} ry={canopyRy * 0.70} fill={color} opacity="0.76" />
        )}
        {idx >= 5 && (
          <ellipse cx={50 + canopyRx * 0.5} cy={trunkTopY - canopyRy * 0.28}
            rx={canopyRx * 0.72} ry={canopyRy * 0.70} fill={color} opacity="0.74" />
        )}
        {/* Main central canopy mass */}
        <ellipse cx="50" cy={trunkTopY - canopyRy * 0.18}
          rx={canopyRx} ry={canopyRy * 0.92} fill={color} opacity="0.86" />
        {/* Upper crown */}
        {idx >= 3 && (
          <ellipse cx="50" cy={trunkTopY - canopyRy * 0.7}
            rx={canopyRx * 0.65} ry={canopyRy * 0.58} fill={color} opacity="0.70" />
        )}
        {/* Highlight blob */}
        {idx >= 5 && (
          <ellipse cx={50 - canopyRx * 0.25} cy={trunkTopY - canopyRy * 0.55}
            rx={canopyRx * 0.35} ry={canopyRy * 0.30}
            fill={color} opacity="0.40"
            style={{ filter: 'brightness(1.20)' }} />
        )}
      </Sway>
    </>
  )
}

// ── Succulent ─────────────────────────────────────────────────────────────────

export function SucculentPlant({ stage, color, groundColor }: PlantProps) {
  const idx = si(stage)
  const centerY = 74 - idx * 2
  const outerR = 9 + idx * 3.8
  const leafCount = [3, 4, 5, 6, 7, 8, 10, 12][idx] ?? 8

  if (idx < 1) {
    return (
      <>
        <ellipse cx="50" cy="86" rx="12" ry="4" fill={groundColor} opacity="0.6" />
        <circle cx="50" cy="76" r={9 + idx * 3} fill={color} opacity="0.88" />
        <circle cx="50" cy="74" r={5 + idx * 2} fill={color} opacity="0.55"
          style={{ filter: 'brightness(0.86)' }} />
      </>
    )
  }

  // Rosette leaf — pointed ovoid from inner radius to tip
  function roseLeaf(i: number, count: number, innerR: number, tipR: number, halfW: number, opacity: number) {
    const angle = (i * 360 / count - 90) * Math.PI / 180
    const perp  = angle + Math.PI / 2
    const bx = 50 + innerR * Math.cos(angle)
    const by = centerY + innerR * Math.sin(angle) * 0.72
    const tx = 50 + tipR * Math.cos(angle)
    const ty = centerY + tipR * Math.sin(angle) * 0.72
    const mx  = (bx + tx) / 2 + halfW * Math.cos(perp) * 0.85
    const my  = (by + ty) / 2 + halfW * Math.sin(perp) * 0.85 * 0.72
    const mx2 = (bx + tx) / 2 - halfW * Math.cos(perp) * 0.85
    const my2 = (by + ty) / 2 - halfW * Math.sin(perp) * 0.85 * 0.72
    return (
      <path
        key={i}
        d={`M ${bx.toFixed(1)} ${by.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q ${mx2.toFixed(1)} ${my2.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)} Z`}
        fill={color}
        opacity={opacity}
      />
    )
  }

  const outerLeaves = Array.from({ length: leafCount }, (_, i) =>
    roseLeaf(i, leafCount, outerR * 0.28, outerR + 3, outerR * 0.38, 0.76 + (i % 3) * 0.04)
  )

  const innerCount = Math.floor(leafCount * 0.55)
  const innerLeaves = idx >= 5
    ? Array.from({ length: innerCount }, (_, i) =>
        roseLeaf(i, innerCount, outerR * 0.12, outerR * 0.55, outerR * 0.26, 0.88)
      )
    : []

  return (
    <>
      <ellipse cx="50" cy="86" rx={outerR + 5} ry="5.5" fill={groundColor} opacity="0.65" />
      {outerLeaves}
      {innerLeaves}
      {/* Dark centre */}
      <circle cx="50" cy={centerY} r={outerR * 0.18} fill={color} opacity="0.97"
        style={{ filter: 'brightness(0.80)' }} />
      {/* Central flower spike at elder */}
      {idx >= 7 && (
        <>
          <line x1="50" y1={centerY} x2="50" y2={centerY - outerR - 9}
            stroke={color} strokeWidth="1.5" strokeLinecap="round"
            style={{ filter: 'brightness(0.85)' }} />
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <g key={i} transform={`translate(50, ${centerY - outerR - 9}) rotate(${a})`}>
              <path d="M 0 0 C -3 -3 -3 -9 0 -12 C 3 -9 3 -3 0 0 Z"
                fill="oklch(0.85 0.18 90)" opacity="0.90" />
            </g>
          ))}
          <circle cx="50" cy={centerY - outerR - 9} r="4" fill="oklch(0.88 0.16 85)" opacity="0.97" />
        </>
      )}
    </>
  )
}

// ── Vine ──────────────────────────────────────────────────────────────────────

export function VinePlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const idx = si(stage)
  const vineH = 18 + idx * 9
  const leafCount = Math.min(idx + 1, 6)

  if (idx < 1) {
    return (
      <>
        <ellipse cx="50" cy="88" rx="12" ry="4" fill={groundColor} opacity="0.6" />
        <Sway dur={2.6}>
          <path d="M 50 88 C 50 80 48 72 50 66"
            stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
          {idx >= 1 && (
            <>
              <path d="M 50 66 C 46 60 38 60 38 66 C 42 64 48 64 50 66 Z" fill={color} opacity="0.82" />
              <path d="M 50 66 C 54 60 62 60 62 66 C 58 64 52 64 50 66 Z" fill={color} opacity="0.80" />
            </>
          )}
        </Sway>
      </>
    )
  }

  return (
    <>
      <ellipse cx="50" cy="90" rx="14" ry="4.5" fill={groundColor} opacity="0.62" />
      <Sway dur={2.9}>
        {/* Thin support stake */}
        <line x1="50" y1="90" x2="50" y2={90 - vineH - 10}
          stroke={groundColor} strokeWidth="1.5" opacity="0.38" />
        {/* Curling main vine */}
        <path
          d={`M 50 90 C 52 ${90 - vineH * 0.3} 48 ${90 - vineH * 0.6} 50 ${90 - vineH}`}
          stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round"
        />
        {/* Leaf pairs along vine */}
        {Array.from({ length: leafCount }, (_, i) => {
          const t = (i + 1) / (leafCount + 1)
          const vy = 90 - vineH * t
          const side = i % 2 === 0 ? -1 : 1
          const ll = 10 + idx * 1.6
          const lx = 50 + side * 4
          const tipX = lx + side * ll
          const tipY = vy - ll * 0.5
          const mxA = lx + side * ll * 0.35
          const myA = vy - ll * 0.22
          const mxB = tipX - side * ll * 0.22
          const myB = tipY + ll * 0.22
          const mxC = tipX - side * ll * 0.22
          const myC = tipY + ll * 0.45
          const mxD = lx + side * ll * 0.1
          const myD = vy + ll * 0.18

          return (
            <g key={i}>
              <path
                d={`M ${lx} ${vy} C ${mxA} ${myA} ${mxB} ${myB} ${tipX} ${tipY} C ${mxC} ${myC} ${mxD} ${myD} ${lx} ${vy} Z`}
                fill={color} opacity={0.80 + (i % 3) * 0.04}
              />
              <line x1={lx} y1={vy} x2={tipX} y2={tipY}
                stroke={stemColor} strokeWidth="0.7" opacity="0.40" />
            </g>
          )
        })}
        {/* Curling tendrils at bud+ */}
        {idx >= 4 && (
          <>
            <path
              d={`M 50 ${90 - vineH * 0.38} C 60 ${90 - vineH * 0.38 - 5} 65 ${90 - vineH * 0.38 - 11} 62 ${90 - vineH * 0.38 - 17} C 59 ${90 - vineH * 0.38 - 22} 55 ${90 - vineH * 0.38 - 17} 58 ${90 - vineH * 0.38 - 13}`}
              stroke={stemColor} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.68"
            />
            <path
              d={`M 50 ${90 - vineH * 0.65} C 40 ${90 - vineH * 0.65 - 5} 35 ${90 - vineH * 0.65 - 11} 38 ${90 - vineH * 0.65 - 17} C 41 ${90 - vineH * 0.65 - 22} 45 ${90 - vineH * 0.65 - 17} 42 ${90 - vineH * 0.65 - 13}`}
              stroke={stemColor} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.68"
            />
          </>
        )}
        {/* Terminal flower at bloom+ */}
        {idx >= 5 && (
          <g transform={`translate(50, ${90 - vineH})`}>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <g key={i} transform={`rotate(${angle})`}>
                <path d="M 0 1 C -5 -3 -7 -13 0 -17 C 7 -13 5 -3 0 1 Z"
                  fill={color} opacity={i < 3 ? 0.70 : 0.92} />
              </g>
            ))}
            <circle cx="0" cy="0" r="5.5" fill="oklch(0.86 0.18 85)" opacity="0.97" />
          </g>
        )}
      </Sway>
    </>
  )
}

// ── Herb ──────────────────────────────────────────────────────────────────────

export function HerbPlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const idx = si(stage)
  const stemCount = [1, 2, 3, 4, 5, 5, 6, 7][idx] ?? 4
  const stemH = 14 + idx * 8

  return (
    <>
      <ellipse cx="50" cy="90" rx={10 + idx * 2} ry="4.5" fill={groundColor} opacity="0.65" />
      <Sway dur={3.3}>
        {Array.from({ length: stemCount }, (_, i) => {
          const spread = (stemCount - 1) * 8
          const xOff = stemCount > 1 ? (i - (stemCount - 1) / 2) * (spread / (stemCount - 1)) : 0
          const tiltRad = (xOff / 28) * 0.55 // natural outward lean
          const topX = 50 + xOff + Math.sin(tiltRad) * stemH * 0.4
          const topY = 90 - stemH - Math.cos(tiltRad) * stemH * 0.05
          const cx1  = 50 + xOff * 0.25
          const cy1  = 90 - stemH * 0.4

          return (
            <g key={i}>
              {/* Curved stem */}
              <path d={`M 50 90 C ${cx1} ${cy1} ${topX} ${topY + stemH * 0.3} ${topX} ${topY}`}
                stroke={stemColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />

              {/* Opposite leaf pair along mid-stem */}
              {idx >= 3 && (
                <>
                  <path
                    d={`M ${cx1} ${cy1} C ${cx1 - 9} ${cy1 - 7} ${cx1 - 14} ${cy1 - 2} ${cx1 - 11} ${cy1 + 5} C ${cx1 - 7} ${cy1 + 4} ${cx1 - 3} ${cy1 + 1} ${cx1} ${cy1} Z`}
                    fill={color} opacity="0.82"
                  />
                  <line x1={cx1} y1={cy1} x2={cx1 - 11} y2={cy1 + 3}
                    stroke={stemColor} strokeWidth="0.6" opacity="0.35" />
                  <path
                    d={`M ${cx1} ${cy1} C ${cx1 + 9} ${cy1 - 7} ${cx1 + 14} ${cy1 - 2} ${cx1 + 11} ${cy1 + 5} C ${cx1 + 7} ${cy1 + 4} ${cx1 + 3} ${cy1 + 1} ${cx1} ${cy1} Z`}
                    fill={color} opacity="0.80"
                  />
                  <line x1={cx1} y1={cy1} x2={cx1 + 11} y2={cy1 + 3}
                    stroke={stemColor} strokeWidth="0.6" opacity="0.35" />
                </>
              )}

              {/* Terminal leaf cluster */}
              <path
                d={`M ${topX} ${topY} C ${topX - 9} ${topY - 9} ${topX - 13} ${topY - 16} ${topX} ${topY - 21} C ${topX + 4} ${topY - 14} ${topX + 2} ${topY - 7} ${topX} ${topY} Z`}
                fill={color} opacity="0.89"
              />
              <path
                d={`M ${topX} ${topY} C ${topX + 9} ${topY - 7} ${topX + 13} ${topY - 14} ${topX + 4} ${topY - 18} C ${topX + 2} ${topY - 11} ${topX + 1} ${topY - 5} ${topX} ${topY} Z`}
                fill={color} opacity="0.85"
              />
              <path
                d={`M ${topX} ${topY} C ${topX - 7} ${topY - 5} ${topX - 9} ${topY - 12} ${topX - 2} ${topY - 16} C ${topX} ${topY - 9} ${topX + 1} ${topY - 4} ${topX} ${topY} Z`}
                fill={color} opacity="0.81"
              />

              {/* Small flowers at bloom+ */}
              {idx >= 5 && (
                <>
                  {[0, 120, 240].map((angle, fi) => (
                    <g key={fi} transform={`translate(${topX}, ${topY - 22}) rotate(${angle})`}>
                      <path d="M 0 0 C -2.5 -3.5 -2.5 -8 0 -10 C 2.5 -8 2.5 -3.5 0 0 Z"
                        fill={color} opacity="0.92" />
                    </g>
                  ))}
                  <circle cx={topX} cy={topY - 22} r="3" fill="oklch(0.86 0.18 85)" opacity="0.95" />
                </>
              )}
            </g>
          )
        })}
      </Sway>
    </>
  )
}

// ── Wildflower ────────────────────────────────────────────────────────────────

const WFCOLORS = [
  null, // uses plant color
  'oklch(0.82 0.16 350)', // pink
  'oklch(0.84 0.18 90)',  // yellow
  null,
  'oklch(0.78 0.14 280)', // purple
  'oklch(0.80 0.18 30)',  // orange
]

export function WildflowerPlant({ stage, color, stemColor, groundColor }: PlantProps & { season?: unknown }) {
  const idx = si(stage)
  const flowerCount = [1, 2, 2, 3, 3, 4, 5, 6][idx] ?? 3
  const stemH = 16 + idx * 9

  return (
    <>
      <ellipse cx="50" cy="90" rx={10 + idx * 1.5} ry="4" fill={groundColor} opacity="0.62" />
      <Sway dur={3.1}>
        {Array.from({ length: flowerCount }, (_, i) => {
          const spread = (flowerCount - 1) * 9
          const xOff = flowerCount > 1 ? (i - (flowerCount - 1) / 2) * (spread / (flowerCount - 1)) : 0
          const hVar = (i % 2 === 0 ? 0 : stemH * 0.16)
          const topX = 50 + xOff
          const topY = 90 - stemH - hVar
          const cx1  = 50 + xOff * 0.35
          const cy1  = 90 - stemH * 0.4 - hVar * 0.5
          const fc   = WFCOLORS[i % WFCOLORS.length] ?? color
          const bloomed = idx >= 3 + (i % 2)

          return (
            <g key={i}>
              {/* Curved thin stem */}
              <path d={`M 50 90 C ${cx1} ${cy1} ${topX} ${topY + stemH * 0.25} ${topX} ${topY}`}
                stroke={stemColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* Small side leaf */}
              {idx >= 2 && (
                <path
                  d={`M ${cx1} ${cy1} C ${cx1 - 9} ${cy1 - 5} ${cx1 - 12} ${cy1 + 1} ${cx1 - 8} ${cy1 + 6} C ${cx1 - 4} ${cy1 + 4} ${cx1 - 1} ${cy1 + 1} ${cx1} ${cy1} Z`}
                  fill={color} opacity="0.78"
                />
              )}

              {/* Flower head or bud */}
              {bloomed ? (
                <g transform={`translate(${topX}, ${topY})`}>
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, pi) => (
                    <g key={pi} transform={`rotate(${angle})`}>
                      <path d="M 0 0 C -3.5 -3 -4.5 -10 0 -14 C 4.5 -10 3.5 -3 0 0 Z"
                        fill={fc} opacity={pi < 4 ? 0.68 : 0.93} />
                    </g>
                  ))}
                  <circle cx="0" cy="0" r="4.5" fill="oklch(0.88 0.16 85)" opacity="0.98" />
                  {/* Pollen dots */}
                  <circle cx="0"  cy="-2" r="1.1" fill="oklch(0.96 0.08 85)" opacity="0.8" />
                  <circle cx="2"  cy="1"  r="1.1" fill="oklch(0.96 0.08 85)" opacity="0.8" />
                  <circle cx="-2" cy="1"  r="1.1" fill="oklch(0.96 0.08 85)" opacity="0.8" />
                </g>
              ) : (
                <ellipse cx={topX} cy={topY} rx="4" ry="6" fill={fc} opacity="0.82" />
              )}
            </g>
          )
        })}
      </Sway>
    </>
  )
}
