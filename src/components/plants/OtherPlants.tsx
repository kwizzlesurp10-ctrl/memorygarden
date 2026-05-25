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

// Inject reusable symbols
if (typeof window !== 'undefined' && !document.getElementById('botanical-symbols')) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.id = 'botanical-symbols'
  svg.style.position = 'absolute'
  svg.style.width = '0'
  svg.style.height = '0'
  svg.setAttribute('aria-hidden', 'true')
  svg.innerHTML = `
    <defs>
      <symbol id="leaf-vein" viewBox="0 0 24 32">
        <path d="M12 2 Q12 12 12 30" stroke="#1a1a1a" stroke-width="0.35" fill="none" opacity="0.2"/>
        <path d="M12 8 Q8 14 6 22" stroke="#1a1a1a" stroke-width="0.22" fill="none" opacity="0.15"/>
        <path d="M12 8 Q16 14 18 22" stroke="#1a1a1a" stroke-width="0.22" fill="none" opacity="0.15"/>
      </symbol>
    </defs>
  `
  document.body.appendChild(svg)
}

function Sway({ children, dur = 4.5, phase = 0 }: { children: ReactNode; dur?: number; phase?: number }) {
  const values = `${-1.7 + phase} 50 90; ${1.7 + phase} 50 90; ${-1.7 + phase} 50 90`
  return (
    <g>
      <animateTransform
        attributeName="transform"
        type="rotate"
        values={values}
        dur={`${dur}s`}
        repeatCount="indefinite"
        calcMode="spline"
        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
      />
      {children}
    </g>
  )
}

// Tree with vein-enhanced leaves
export function TreePlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const idx = si(stage)
  const phase = idx * 0.25

  if (idx < 1) {
    return (
      <>
        <ellipse cx="50" cy="86" rx="12" ry="4" fill={groundColor} opacity="0.6" />
        <path d="M 44 79 C 43 70 50 67 57 70 C 60 73 59 81 55 84 C 50 87 43 84 44 79 Z" fill={stemColor} opacity="0.88" />
        <ellipse cx="50" cy="68.5" rx="8" ry="4.5" fill={stemColor} opacity="0.58" style={{ filter: 'brightness(0.82)' }} />
      </>
    )
  }

  const trunkH = 18 + idx * 9
  const trunkTopY = 90 - trunkH
  const bw = 5 + idx * 0.9
  const tw = 2.2 + idx * 0.4
  const canopyRx = 14 + idx * 4.5
  const canopyRy = 12 + idx * 3.5

  return (
    <>
      <ellipse cx="50" cy="90" rx={bw + 10 + idx} ry="5.5" fill={groundColor} opacity="0.65" />
      {idx >= 3 && (
        <>
          <path d={`M ${50 - bw - 2} 90 C ${50 - bw - 5} 86 ${50 - bw - 3} 83 ${50 - tw - 1} ${trunkTopY + 16}`} stroke={groundColor} strokeWidth="2" fill="none" opacity="0.55" />
          <path d={`M ${50 + bw + 2} 90 C ${50 + bw + 5} 86 ${50 + bw + 3} 83 ${50 + tw + 1} ${trunkTopY + 16}`} stroke={groundColor} strokeWidth="2" fill="none" opacity="0.55" />
        </>
      )}
      <Sway dur={5 + idx * 0.25} phase={phase}>
        <path d={`M ${50 - bw} 90 C ${50 - bw * 0.75} ${82} ${50 - tw * 1.3} ${trunkTopY + 10} ${50 - tw} ${trunkTopY} L ${50 + tw} ${trunkTopY} C ${50 + tw * 1.3} ${trunkTopY + 10} ${50 + bw * 0.75} ${82} ${50 + bw} 90 Z`} fill={stemColor} opacity="0.90" />
        <path d={`M 50 ${trunkTopY + 5} C 50 ${trunkTopY + trunkH * 0.4} 50 ${trunkTopY + trunkH * 0.7} 50 90`} stroke={stemColor} strokeWidth="0.8" fill="none" opacity="0.30" style={{ filter: 'brightness(0.72)' }} />

        {idx >= 4 && (
          <>
            <path d={`M 50 ${trunkTopY + 14} C ${50 - 8} ${trunkTopY + 7} ${50 - 16} ${trunkTopY + 3} ${50 - canopyRx * 0.62} ${trunkTopY - 1}`} stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d={`M 50 ${trunkTopY + 14} C ${50 + 8} ${trunkTopY + 7} ${50 + 16} ${trunkTopY + 3} ${50 + canopyRx * 0.62} ${trunkTopY - 1}`} stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}

        {idx >= 5 && <ellipse cx={50 - canopyRx * 0.5} cy={trunkTopY - canopyRy * 0.28} rx={canopyRx * 0.72} ry={canopyRy * 0.70} fill={color} opacity="0.76" />}
        {idx >= 5 && <ellipse cx={50 + canopyRx * 0.5} cy={trunkTopY - canopyRy * 0.28} rx={canopyRx * 0.72} ry={canopyRy * 0.70} fill={color} opacity="0.74" />}
        <ellipse cx="50" cy={trunkTopY - canopyRy * 0.18} rx={canopyRx} ry={canopyRy * 0.92} fill={color} opacity="0.86" />
        {idx >= 3 && <ellipse cx="50" cy={trunkTopY - canopyRy * 0.7} rx={canopyRx * 0.65} ry={canopyRy * 0.58} fill={color} opacity="0.70" />}
        {idx >= 5 && <ellipse cx={50 - canopyRx * 0.25} cy={trunkTopY - canopyRy * 0.55} rx={canopyRx * 0.35} ry={canopyRy * 0.30} fill={color} opacity="0.40" style={{ filter: 'brightness(1.20)' }} />}
      </Sway>
    </>
  )
}

// Succulent with vein treatment on larger leaves
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
        <circle cx="50" cy="74" r={5 + idx * 2} fill={color} opacity="0.55" style={{ filter: 'brightness(0.86)' }} />
      </>
    )
  }

  function roseLeaf(i: number, count: number, innerR: number, tipR: number, halfW: number, opacity: number) {
    const angle = (i * 360 / count - 90) * Math.PI / 180
    const perp = angle + Math.PI / 2
    const bx = 50 + innerR * Math.cos(angle)
    const by = centerY + innerR * Math.sin(angle) * 0.72
    const tx = 50 + tipR * Math.cos(angle)
    const ty = centerY + tipR * Math.sin(angle) * 0.72
    const mx = (bx + tx) / 2 + halfW * Math.cos(perp) * 0.85
    const my = (by + ty) / 2 + halfW * Math.sin(perp) * 0.85 * 0.72
    const mx2 = (bx + tx) / 2 - halfW * Math.cos(perp) * 0.85
    const my2 = (by + ty) / 2 - halfW * Math.sin(perp) * 0.85 * 0.72
    return (
      <g key={i}>
        <path
          d={`M ${bx.toFixed(1)} ${by.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q ${mx2.toFixed(1)} ${my2.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)} Z`}
          fill={color}
          opacity={opacity}
        />
        {idx >= 4 && <use href="#leaf-vein" x={bx - 2} y={by - 5} width="8" height="12" />}
      </g>
    )
  }

  const outerLeaves = Array.from({ length: leafCount }, (_, i) => roseLeaf(i, leafCount, outerR * 0.28, outerR + 3, outerR * 0.38, 0.76 + (i % 3) * 0.04))
  const innerCount = Math.floor(leafCount * 0.55)
  const innerLeaves = idx >= 5 ? Array.from({ length: innerCount }, (_, i) => roseLeaf(i, innerCount, outerR * 0.12, outerR * 0.55, outerR * 0.26, 0.88)) : []

  return (
    <>
      <ellipse cx="50" cy="86" rx={outerR + 5} ry="5.5" fill={groundColor} opacity="0.65" />
      {outerLeaves}
      {innerLeaves}
      <circle cx="50" cy={centerY} r={outerR * 0.18} fill={color} opacity="0.97" style={{ filter: 'brightness(0.80)' }} />
      {idx >= 7 && (
        <>
          <line x1="50" y1={centerY} x2="50" y2={centerY - outerR - 9} stroke={color} strokeWidth="1.5" strokeLinecap="round" style={{ filter: 'brightness(0.85)' }} />
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <g key={i} transform={`translate(50, ${centerY - outerR - 9}) rotate(${a})`}>
              <path d="M 0 0 C -3 -3 -3 -9 0 -12 C 3 -9 3 -3 0 0 Z" fill="oklch(0.85 0.18 90)" opacity="0.90" />
            </g>
          ))}
          <circle cx="50" cy={centerY - outerR - 9} r="4" fill="oklch(0.88 0.16 85)" opacity="0.97" />
        </>
      )}
    </>
  )
}

// Vine with vein treatment
export function VinePlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const idx = si(stage)
  const vineH = 18 + idx * 9
  const leafCount = Math.min(idx + 1, 6)
  const phase = idx * 0.35

  if (idx < 1) {
    return (
      <>
        <ellipse cx="50" cy="88" rx="12" ry="4" fill={groundColor} opacity="0.6" />
        <Sway dur={2.6} phase={phase}>
          <path d="M 50 88 C 50 80 48 72 50 66" stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        </Sway>
      </>
    )
  }

  return (
    <>
      <ellipse cx="50" cy="90" rx="14" ry="4.5" fill={groundColor} opacity="0.62" />
      <Sway dur={2.9} phase={phase}>
        <line x1="50" y1="90" x2="50" y2={90 - vineH - 10} stroke={groundColor} strokeWidth="1.5" opacity="0.38" />
        <path d={`M 50 90 C 52 ${90 - vineH * 0.3} 48 ${90 - vineH * 0.6} 50 ${90 - vineH}`} stroke={stemColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {Array.from({ length: leafCount }, (_, i) => {
          const t = (i + 1) / (leafCount + 1)
          const vy = 90 - vineH * t
          const side = i % 2 === 0 ? -1 : 1
          const ll = 10 + idx * 1.6
          const lx = 50 + side * 4
          const tipX = lx + side * ll
          const tipY = vy - ll * 0.5
          return (
            <g key={i}>
              <path d={`M ${lx} ${vy} C ${lx + side * ll * 0.35} ${vy - ll * 0.22} ${tipX - side * ll * 0.22} ${tipY + ll * 0.22} ${tipX} ${tipY} C ${tipX - side * ll * 0.22} ${tipY + ll * 0.45} ${lx + side * ll * 0.1} ${vy + ll * 0.18} ${lx} ${vy} Z`} fill={color} opacity={0.80 + (i % 3) * 0.04} />
              <use href="#leaf-vein" x={lx - 3} y={vy - 6} width="8" height="10" />
            </g>
          )
        })}
        {idx >= 4 && (
          <>
            <path d={`M 50 ${90 - vineH * 0.38} C 60 ${90 - vineH * 0.38 - 5} 65 ${90 - vineH * 0.38 - 11} 62 ${90 - vineH * 0.38 - 17} C 59 ${90 - vineH * 0.38 - 22} 55 ${90 - vineH * 0.38 - 17} 58 ${90 - vineH * 0.38 - 13}`} stroke={stemColor} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.68" />
            <path d={`M 50 ${90 - vineH * 0.65} C 40 ${90 - vineH * 0.65 - 5} 35 ${90 - vineH * 0.65 - 11} 38 ${90 - vineH * 0.65 - 17} C 41 ${90 - vineH * 0.65 - 22} 45 ${90 - vineH * 0.65 - 17} 42 ${90 - vineH * 0.65 - 13}`} stroke={stemColor} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.68" />
          </>
        )}
        {idx >= 5 && (
          <g transform={`translate(50, ${90 - vineH})`}>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <g key={i} transform={`rotate(${angle})`}>
                <path d="M 0 1 C -5 -3 -7 -13 0 -17 C 7 -13 5 -3 0 1 Z" fill={color} opacity={i < 3 ? 0.70 : 0.92} />
              </g>
            ))}
            <circle cx="0" cy="0" r="5.5" fill="oklch(0.86 0.18 85)" opacity="0.97" />
          </g>
        )}
      </Sway>
    </>
  )
}

// Herb plant — bushy, aromatic plant with small clustered leaves
export function HerbPlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const idx = si(stage)
  const phase = idx * 0.3
  const stemH = 12 + idx * 6
  const leafSize = 6 + idx * 1.5
  const leafCount = Math.min(2 + idx * 2, 12)

  if (idx < 1) {
    // Seed stage
    return (
      <>
        <ellipse cx="50" cy="86" rx="10" ry="3.5" fill={groundColor} opacity="0.6" />
        <path d="M 42 86 C 42 81 46 78 50 78 C 54 78 58 81 58 86 Z" fill={groundColor} opacity="0.8" />
        <ellipse cx="50" cy="79" rx="3" ry="2.5" fill={color} opacity="0.85" />
      </>
    )
  }

  return (
    <>
      <ellipse cx="50" cy="88" rx={12 + idx * 2} ry="4.5" fill={groundColor} opacity="0.62" />
      <Sway dur={3.8} phase={phase}>
        {/* Multiple stems for bushy appearance */}
        <path d={`M 50 88 C 50 ${88 - stemH * 0.5} 50 ${88 - stemH * 0.8} 50 ${88 - stemH}`} stroke={stemColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {idx >= 2 && (
          <>
            <path d={`M 47 88 C 45 ${88 - stemH * 0.4} 43 ${88 - stemH * 0.7} 42 ${88 - stemH * 0.85}`} stroke={stemColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d={`M 53 88 C 55 ${88 - stemH * 0.4} 57 ${88 - stemH * 0.7} 58 ${88 - stemH * 0.85}`} stroke={stemColor} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </>
        )}
        {/* Small rounded herb leaves */}
        {Array.from({ length: leafCount }, (_, i) => {
          const t = (i + 1) / (leafCount + 1)
          const ly = 88 - stemH * t
          const side = i % 2 === 0 ? -1 : 1
          const lx = 50 + side * (4 + idx * 0.5)
          return (
            <g key={i}>
              <ellipse 
                cx={lx + side * leafSize * 0.5} 
                cy={ly - 2} 
                rx={leafSize * 0.7} 
                ry={leafSize * 0.5} 
                fill={color} 
                opacity={0.78 + (i % 3) * 0.05}
                transform={`rotate(${side * 20} ${lx + side * leafSize * 0.5} ${ly - 2})`}
              />
            </g>
          )
        })}
        {/* Top cluster of small leaves */}
        {idx >= 3 && (
          <g transform={`translate(50, ${88 - stemH})`}>
            {[0, 45, 90, 135, 180, 225, 270, 315].slice(0, Math.min(4 + idx, 8)).map((angle, i) => (
              <ellipse
                key={i}
                cx={Math.cos(angle * Math.PI / 180) * (leafSize * 0.8)}
                cy={Math.sin(angle * Math.PI / 180) * (leafSize * 0.6) - leafSize * 0.3}
                rx={leafSize * 0.6}
                ry={leafSize * 0.4}
                fill={color}
                opacity={0.8 + (i % 2) * 0.08}
              />
            ))}
          </g>
        )}
        {/* Small flowers at maturity */}
        {idx >= 6 && (
          <g transform={`translate(50, ${88 - stemH - 4})`}>
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <circle
                key={i}
                cx={Math.cos(angle * Math.PI / 180) * 6}
                cy={Math.sin(angle * Math.PI / 180) * 4 - 2}
                r="2"
                fill="oklch(0.90 0.12 300)"
                opacity="0.85"
              />
            ))}
          </g>
        )}
      </Sway>
    </>
  )
}

// Wildflower — delicate stems with small colorful flowers
export function WildflowerPlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const idx = si(stage)
  const phase = idx * 0.25
  const stemH = 14 + idx * 7
  const flowerCount = Math.min(1 + Math.floor(idx / 2), 5)

  if (idx < 1) {
    // Seed stage
    return (
      <>
        <ellipse cx="50" cy="86" rx="10" ry="3.5" fill={groundColor} opacity="0.6" />
        <path d="M 43 86 C 43 82 46 79 50 79 C 54 79 57 82 57 86 Z" fill={groundColor} opacity="0.8" />
        <ellipse cx="50" cy="80" rx="3.5" ry="2.5" fill={color} opacity="0.85" />
      </>
    )
  }

  // Generate stable random positions for flowers
  const flowerPositions = Array.from({ length: flowerCount }, (_, i) => ({
    x: 50 + (i % 2 === 0 ? -1 : 1) * (8 + i * 4),
    h: stemH * (0.7 + i * 0.08),
    size: 5 + idx * 0.5 - i * 0.3,
  }))

  return (
    <>
      <ellipse cx="50" cy="88" rx={10 + idx * 1.5} ry="4" fill={groundColor} opacity="0.62" />
      <Sway dur={3.2} phase={phase}>
        {/* Multiple thin stems */}
        {flowerPositions.map((pos, i) => (
          <path
            key={`stem-${i}`}
            d={`M 50 88 C ${50 + (pos.x - 50) * 0.3} ${88 - pos.h * 0.3} ${pos.x - (pos.x - 50) * 0.2} ${88 - pos.h * 0.7} ${pos.x} ${88 - pos.h}`}
            stroke={stemColor}
            strokeWidth={1.5 - i * 0.15}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {/* Small grass-like leaves at base */}
        {idx >= 2 && (
          <>
            <path d="M 50 88 C 45 80 40 72 38 65" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M 50 88 C 55 80 60 72 62 65" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />
          </>
        )}
        {/* Flowers at different stages */}
        {flowerPositions.map((pos, i) => {
          if (idx < 3 + i) {
            // Just a bud
            return (
              <ellipse
                key={`flower-${i}`}
                cx={pos.x}
                cy={88 - pos.h}
                rx={pos.size * 0.5}
                ry={pos.size * 0.7}
                fill={color}
                opacity="0.85"
              />
            )
          }
          // Full wildflower
          const petalCount = 5 + (i % 2)
          return (
            <g key={`flower-${i}`} transform={`translate(${pos.x}, ${88 - pos.h})`}>
              {Array.from({ length: petalCount }, (_, j) => {
                const angle = (j * 360) / petalCount - 90
                return (
                  <ellipse
                    key={j}
                    cx={Math.cos(angle * Math.PI / 180) * pos.size * 0.7}
                    cy={Math.sin(angle * Math.PI / 180) * pos.size * 0.7}
                    rx={pos.size * 0.5}
                    ry={pos.size * 0.35}
                    fill={color}
                    opacity={0.85}
                    transform={`rotate(${angle} ${Math.cos(angle * Math.PI / 180) * pos.size * 0.7} ${Math.sin(angle * Math.PI / 180) * pos.size * 0.7})`}
                  />
                )
              })}
              <circle cx="0" cy="0" r={pos.size * 0.35} fill="oklch(0.88 0.16 85)" opacity="0.95" />
            </g>
          )
        })}
      </Sway>
    </>
  )
}
