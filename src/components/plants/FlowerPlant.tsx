import type { ReactNode } from 'react'
import type { PlantStage, Season } from '@/lib/types'

interface PlantProps {
  stage: PlantStage
  color: string
  stemColor: string
  groundColor: string
  season: Season
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

// Seed — a small mound with a seed visible
function Seed({ color, groundColor }: { color: string; groundColor: string }) {
  return (
    <>
      {/* Ground mound */}
      <ellipse cx="50" cy="86" rx="14" ry="5" fill={groundColor} opacity="0.7" />
      {/* Small dirt pile */}
      <path 
        d="M 40 86 C 40 80 45 76 50 76 C 55 76 60 80 60 86 Z" 
        fill={groundColor} 
        opacity="0.85" 
      />
      {/* Seed peeking out */}
      <ellipse cx="50" cy="78" rx="4" ry="3" fill={color} opacity="0.9" />
      <ellipse cx="50" cy="77" rx="2.5" ry="1.5" fill={color} opacity="0.5" style={{ filter: 'brightness(1.2)' }} />
    </>
  )
}

// Sprout — first tiny green shoot emerges
function Sprout({ color, stemColor, groundColor, phase }: { color: string; stemColor: string; groundColor: string; phase: number }) {
  return (
    <>
      <ellipse cx="50" cy="86" rx="12" ry="4.5" fill={groundColor} opacity="0.65" />
      <Sway dur={3.5} phase={phase}>
        {/* Tiny stem */}
        <path 
          d="M 50 86 C 50 80 50 76 50 72" 
          stroke={stemColor} 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round" 
        />
        {/* Two tiny cotyledon leaves */}
        <path 
          d="M 50 72 C 45 70 42 68 44 65 C 47 66 50 69 50 72 Z" 
          fill={color} 
          opacity="0.85" 
        />
        <path 
          d="M 50 72 C 55 70 58 68 56 65 C 53 66 50 69 50 72 Z" 
          fill={color} 
          opacity="0.85" 
        />
      </Sway>
    </>
  )
}

// Seedling — a bit taller with small leaves forming
function Seedling({ color, stemColor, groundColor, phase }: { color: string; stemColor: string; groundColor: string; phase: number }) {
  return (
    <>
      <ellipse cx="50" cy="88" rx="14" ry="5" fill={groundColor} opacity="0.65" />
      <Sway dur={4} phase={phase}>
        {/* Slightly taller stem */}
        <path 
          d="M 50 88 C 50 78 50 68 50 58" 
          stroke={stemColor} 
          strokeWidth="2.2" 
          fill="none" 
          strokeLinecap="round" 
        />
        {/* Small leaves emerging */}
        <path 
          d="M 50 70 C 42 66 36 64 38 58 C 43 60 50 66 50 70 Z" 
          fill={color} 
          opacity="0.82" 
        />
        <line x1="50" y1="70" x2="39" y2="62" stroke={stemColor} strokeWidth="0.6" opacity="0.3" />
        <path 
          d="M 50 65 C 58 61 64 59 62 53 C 57 55 50 61 50 65 Z" 
          fill={color} 
          opacity="0.82" 
        />
        <line x1="50" y1="65" x2="61" y2="57" stroke={stemColor} strokeWidth="0.6" opacity="0.3" />
        {/* Tiny top leaves */}
        <path 
          d="M 50 58 C 46 55 44 52 47 50 C 49 52 50 55 50 58 Z" 
          fill={color} 
          opacity="0.78" 
        />
        <path 
          d="M 50 58 C 54 55 56 52 53 50 C 51 52 50 55 50 58 Z" 
          fill={color} 
          opacity="0.78" 
        />
      </Sway>
    </>
  )
}

// Young — taller plant with more developed leaves
function Young({ color, stemColor, groundColor, phase }: { color: string; stemColor: string; groundColor: string; phase: number }) {
  return (
    <>
      <ellipse cx="50" cy="90" rx="16" ry="5" fill={groundColor} opacity="0.65" />
      <Sway dur={4.3} phase={phase}>
        {/* Main stem getting stronger */}
        <path 
          d="M 50 90 C 51 75 49 55 50 40" 
          stroke={stemColor} 
          strokeWidth="2.5" 
          fill="none" 
          strokeLinecap="round" 
        />
        {/* Developed leaves */}
        <path 
          d="M 50 78 C 40 72 28 68 26 74 C 32 73 42 75 50 78 Z" 
          fill={color} 
          opacity="0.84" 
        />
        <line x1="50" y1="78" x2="28" y2="73" stroke={stemColor} strokeWidth="0.7" opacity="0.35" />
        <path 
          d="M 50 68 C 60 62 72 58 74 64 C 68 63 58 65 50 68 Z" 
          fill={color} 
          opacity="0.84" 
        />
        <line x1="50" y1="68" x2="72" y2="63" stroke={stemColor} strokeWidth="0.7" opacity="0.35" />
        <path 
          d="M 50 56 C 42 50 32 47 33 53 C 38 52 45 53 50 56 Z" 
          fill={color} 
          opacity="0.80" 
        />
        <line x1="50" y1="56" x2="35" y2="52" stroke={stemColor} strokeWidth="0.6" opacity="0.3" />
        {/* Top growth starting */}
        <path 
          d="M 50 40 C 45 38 42 36 45 33 C 48 35 50 38 50 40 Z" 
          fill={color} 
          opacity="0.75" 
        />
        <path 
          d="M 50 40 C 55 38 58 36 55 33 C 52 35 50 38 50 40 Z" 
          fill={color} 
          opacity="0.75" 
        />
      </Sway>
    </>
  )
}

// Bud — plant with a forming flower bud at top
function Bud({ color, stemColor, groundColor, phase }: { color: string; stemColor: string; groundColor: string; phase: number }) {
  return (
    <>
      <ellipse cx="50" cy="90" rx="17" ry="5.5" fill={groundColor} opacity="0.65" />
      <Sway dur={4.5} phase={phase}>
        {/* Strong stem */}
        <path 
          d="M 50 90 C 52 72 48 50 50 32" 
          stroke={stemColor} 
          strokeWidth="2.8" 
          fill="none" 
          strokeLinecap="round" 
        />
        {/* Full leaves */}
        <path 
          d="M 50 76 C 40 70 26 66 23 73 C 30 71 42 73 50 76 Z" 
          fill={color} 
          opacity="0.85" 
        />
        <line x1="50" y1="76" x2="26" y2="72" stroke={stemColor} strokeWidth="0.8" opacity="0.35" />
        <path 
          d="M 50 64 C 60 58 74 54 76 61 C 69 60 58 62 50 64 Z" 
          fill={color} 
          opacity="0.85" 
        />
        <line x1="50" y1="64" x2="74" y2="60" stroke={stemColor} strokeWidth="0.8" opacity="0.35" />
        <path 
          d="M 50 52 C 42 47 32 44 31 50 C 37 49 45 50 50 52 Z" 
          fill={color} 
          opacity="0.82" 
        />
        <line x1="50" y1="52" x2="33" y2="49" stroke={stemColor} strokeWidth="0.7" opacity="0.3" />
        {/* The bud! */}
        <ellipse cx="50" cy="30" rx="8" ry="10" fill={color} opacity="0.9" />
        <ellipse cx="50" cy="28" rx="5" ry="7" fill={color} opacity="0.5" style={{ filter: 'brightness(1.15)' }} />
        {/* Sepals (green parts holding the bud) */}
        <path 
          d="M 42 34 C 44 28 48 26 50 26 L 50 38 C 47 38 43 37 42 34 Z" 
          fill={stemColor} 
          opacity="0.8" 
        />
        <path 
          d="M 58 34 C 56 28 52 26 50 26 L 50 38 C 53 38 57 37 58 34 Z" 
          fill={stemColor} 
          opacity="0.8" 
        />
      </Sway>
    </>
  )
}

// Beautiful layered Bloom with natural variation
function Bloom({ color, stemColor, groundColor, season, phase }: any) {
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

function Mature({ color, stemColor, groundColor, season, phase }: any) {
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

function Elder({ color, stemColor, groundColor, season, phase }: any) {
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
