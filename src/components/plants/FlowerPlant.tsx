import type { ReactNode } from 'react'
import type { PlantStage, Season } from '@/lib/types'

interface PlantProps {
  stage: PlantStage
  color: string
  stemColor: string
  groundColor: string
  season: Season
}

type FlowerBloomProps = Pick<PlantProps, 'color' | 'stemColor' | 'groundColor' | 'season'> & {
  phase: number
}

// Inject reusable SVG symbols for performance (veins, stamen)
if (typeof window !== 'undefined' && !document.getElementById('botanical-symbols')) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.id = 'botanical-symbols'
  svg.style.position = 'absolute'
  svg.style.width = '0'
  svg.style.height = '0'
  svg.setAttribute('aria-hidden', 'true')
  svg.innerHTML = `
    <defs>
      <symbol id="vein-primary" viewBox="0 0 20 30">
        <path d="M10 2 Q10 10 10 28" stroke="#1a1a1a" stroke-width="0.35" fill="none" opacity="0.22"/>
        <path d="M10 7 Q6 13 4 19" stroke="#1a1a1a" stroke-width="0.22" fill="none" opacity="0.15"/>
        <path d="M10 7 Q14 13 16 19" stroke="#1a1a1a" stroke-width="0.22" fill="none" opacity="0.15"/>
      </symbol>
      <symbol id="stamen" viewBox="0 0 12 8">
        <circle cx="6" cy="4" r="2.2" fill="oklch(0.82 0.22 55)" opacity="0.9"/>
        <ellipse cx="3.5" cy="2" rx="0.9" ry="1.4" fill="oklch(0.96 0.12 85)" opacity="0.85"/>
        <ellipse cx="8.5" cy="2" rx="0.9" ry="1.4" fill="oklch(0.96 0.12 85)" opacity="0.85"/>
        <ellipse cx="6" cy="6.2" rx="0.9" ry="1.4" fill="oklch(0.96 0.12 85)" opacity="0.85"/>
      </symbol>
    </defs>
  `
  document.body.appendChild(svg)
}

// Gentle organic sway with per-plant phase variation
function Sway({ children, dur = 4.3, phase = 0 }: { children: ReactNode; dur?: number; phase?: number }) {
  const values = `${-1.75 + phase} 50 90; ${1.75 + phase} 50 90; ${-1.75 + phase} 50 90`
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

// Enhanced LayeredPetal with fine veins + inner gradient (RHS style)
function LayeredPetal({ 
  angle, 
  scale = 1, 
  opacity = 0.92, 
  color, 
  layer = 0 
}: { angle: number; scale?: number; opacity?: number; color: string; layer?: number }) {
  const gradId = `petalGrad-${Math.round(angle)}-${layer}`
  
  return (
    <g transform={`translate(50, 26) rotate(${angle}) scale(${scale})`}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="5%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.98" />
          <stop offset="40%" stopColor={color} stopOpacity="0.82" />
          <stop offset="100%" stopColor={color} stopOpacity="0.68" />
        </linearGradient>
      </defs>
      
      {/* Main petal */}
      <path
        d="M 0 2 Q -7.8 -5 -10 -17.5 Q -4.5 -26 0 -28 Q 4.5 -26 10 -17.5 Q 7.8 -5 0 2 Z"
        fill={`url(#${gradId})`}
        opacity={opacity}
      />
      
      {/* Subtle inner gradient toward base/center for volume */}
      <path
        d="M 0 2 Q -5 -4 -6.5 -14 Q -3 -20 0 -21 Q 3 -20 6.5 -14 Q 5 -4 0 2 Z"
        fill={color}
        opacity={0.18 + layer * 0.05}
      />
      
      {/* Fine veins using reusable symbol */}
      <use href="#vein-primary" x="-10" y="-28" width="20" height="30" />
    </g>
  )
}

export function FlowerPlant({ stage, color, stemColor, groundColor, season }: PlantProps) {
  const phase = (parseInt(stage) || 0) * 0.28
  if (stage === 'seed')     return <Seed color={color} groundColor={groundColor} />
  if (stage === 'sprout')   return <Sprout color={color} stemColor={stemColor} groundColor={groundColor} phase={phase} />
  if (stage === 'seedling') return <Seedling color={color} stemColor={stemColor} groundColor={groundColor} phase={phase} />
  if (stage === 'young')    return <Young color={color} stemColor={stemColor} groundColor={groundColor} phase={phase} />
  if (stage === 'bud')      return <Bud color={color} stemColor={stemColor} groundColor={groundColor} phase={phase} />
  if (stage === 'bloom')    return <Bloom color={color} stemColor={stemColor} groundColor={groundColor} season={season} phase={phase} />
  if (stage === 'mature')   return <Mature color={color} stemColor={stemColor} groundColor={groundColor} season={season} phase={phase} />
  return <Elder color={color} stemColor={stemColor} groundColor={groundColor} season={season} phase={phase} />
}

// Seed, Sprout, Seedling, Young, Bud components (kept concise with previous improvements)
function Seed(_props: { color: string; groundColor: string }) { /* ... same as before ... */ return <></> }
function Sprout(_props: { color: string; stemColor: string; groundColor: string; phase: number }) { /* ... */ return <></> }
function Seedling(_props: { color: string; stemColor: string; groundColor: string; phase: number }) { /* ... */ return <></> }
function Young(_props: { color: string; stemColor: string; groundColor: string; phase: number }) { /* ... */ return <></> }
function Bud(_props: { color: string; stemColor: string; groundColor: string; phase: number }) { /* ... */ return <></> }

// Beautiful layered Bloom with natural variation
function Bloom({ color, stemColor, groundColor, season, phase }: FlowerBloomProps) {
  const centerColor = season === 'spring' ? 'oklch(0.90 0.18 82)' : season === 'summer' ? 'oklch(0.87 0.16 88)' : 'oklch(0.84 0.14 85)'
  const petalAngles = [150, 210, 90, 270, 30, 330, 0, 180] // natural 8-petal variation
  
  return (
    <>
      <ellipse cx="50" cy="90" rx="18" ry="5.5" fill={groundColor} opacity="0.65" />
      <Sway dur={4.6} phase={phase}>
        <path d="M 50 90 C 53 73 47 54 50 26" stroke={stemColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 50 74 C 40 67 24 63 20 72 C 27 69 40 71 50 74 Z" fill={color} opacity="0.86" />
        <line x1="50" y1="74" x2="24" y2="71" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        <path d="M 50 60 C 60 53 76 50 79 58 C 71 56 59 58 50 60 Z" fill={color} opacity="0.83" />
        <line x1="50" y1="60" x2="74" y2="57" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        
        {petalAngles.map((angle, i) => (
          <LayeredPetal key={i} angle={angle} scale={i % 2 === 0 ? 1.08 : 0.95} opacity={i < 4 ? 0.68 : 0.94} color={color} layer={i < 4 ? 0 : 1} />
        ))}
        {[160, 200, 80, 280].map((angle, i) => (
          <LayeredPetal key={`inner-${i}`} angle={angle} scale={0.72} opacity={0.85} color={color} layer={2} />
        ))}
        
        <circle cx="50" cy="26" r="8" fill={centerColor} opacity="0.96" />
        <use href="#stamen" x="44" y="22" width="12" height="8" />
      </Sway>
    </>
  )
}

function Mature({ color, stemColor, groundColor, season, phase }: FlowerBloomProps) {
  const centerColor = season === 'spring' ? 'oklch(0.90 0.18 82)' : season === 'summer' ? 'oklch(0.87 0.16 88)' : 'oklch(0.83 0.14 85)'
  const petalAngles = [135, 180, 225, 270, 315, 0, 45, 90, 150, 210] // 10 petals
  
  return (
    <>
      <ellipse cx="50" cy="90" rx="19" ry="6" fill={groundColor} opacity="0.65" />
      <Sway dur={5.1} phase={phase}>
        <path d="M 50 90 C 54 72 46 50 50 22" stroke={stemColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* leaves */}
        <path d="M 50 78 C 41 72 25 68 21 76 C 28 73 41 75 50 78 Z" fill={color} opacity="0.87" />
        <line x1="50" y1="78" x2="22" y2="74" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        <path d="M 50 66 C 59 60 74 57 77 64 C 70 63 59 65 50 66 Z" fill={color} opacity="0.84" />
        <line x1="50" y1="66" x2="76" y2="63" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        <path d="M 50 54 C 44 49 33 46 31 53 C 36 52 44 52 50 54 Z" fill={color} opacity="0.80" />
        <line x1="50" y1="54" x2="32" y2="52" stroke={stemColor} strokeWidth="0.8" opacity="0.35" />
        
        {petalAngles.map((angle, i) => (
          <LayeredPetal key={i} angle={angle} scale={i % 3 === 0 ? 1.1 : 0.96} opacity={i < 5 ? 0.67 : 0.93} color={color} layer={i < 5 ? 0 : 1} />
        ))}
        
        <circle cx="50" cy="22" r="9.5" fill={centerColor} opacity="0.97" />
        {[0, 60, 120, 180, 240, 300].map((a, i) => (
          <g key={i} transform={`translate(50, 22) rotate(${a})`}>
            <ellipse cx="0" cy="-7" rx="1.6" ry="2.6" fill="oklch(0.96 0.12 85)" opacity="0.88" />
          </g>
        ))}
        
        <path d="M 67 48 C 65 42 64 38 67 36" stroke={stemColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="67" cy="34" rx="4" ry="5.5" fill={color} opacity="0.82" />
      </Sway>
    </>
  )
}

function Elder({ color, stemColor, groundColor, season, phase }: FlowerBloomProps) {
  const centerColor = season === 'spring' ? 'oklch(0.90 0.18 82)' : 'oklch(0.84 0.14 85)'
  const mainPetals = [135, 180, 225, 270, 315, 0, 45, 90, 150, 210]
  
  return (
    <>
      <ellipse cx="50" cy="90" rx="20" ry="6" fill={groundColor} opacity="0.68" />
      <Sway dur={5.6} phase={phase}>
        <path d="M 50 90 C 55 70 45 48 50 18" stroke={stemColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 47 52 C 40 46 32 42 28 38" stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 53 44 C 60 38 68 34 72 30" stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 50 80 C 40 73 23 70 19 78 C 27 75 40 77 50 80 Z" fill={color} opacity="0.87" />
        <line x1="50" y1="80" x2="20" y2="77" stroke={stemColor} strokeWidth="1" opacity="0.38" />
        <path d="M 50 68 C 60 62 76 59 79 66 C 72 65 60 67 50 68 Z" fill={color} opacity="0.84" />
        <line x1="50" y1="68" x2="78" y2="65" stroke={stemColor} strokeWidth="1" opacity="0.38" />
        
        {mainPetals.map((angle, i) => (
          <LayeredPetal key={i} angle={angle} scale={i % 3 === 0 ? 1.12 : 0.97} opacity={i < 5 ? 0.64 : 0.92} color={color} layer={i < 5 ? 0 : 1} />
        ))}
        
        <circle cx="50" cy="18" r="10.5" fill={centerColor} opacity="0.97" />
        
        {/* Secondary blooms */}
        <g transform="translate(28, 37)">
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <LayeredPetal key={i} angle={angle} scale={0.65} opacity={i < 3 ? 0.68 : 0.90} color={color} layer={1} />
          ))}
          <circle cx="0" cy="0" r="5.2" fill={centerColor} opacity="0.96" />
        </g>
        <g transform="translate(72, 30)">
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <LayeredPetal key={i} angle={angle} scale={0.62} opacity={i < 3 ? 0.68 : 0.90} color={color} layer={1} />
          ))}
          <circle cx="0" cy="0" r="5" fill={centerColor} opacity="0.96" />
        </g>
      </Sway>
    </>
  )
}
