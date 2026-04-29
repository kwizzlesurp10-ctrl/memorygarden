import type { ReactNode } from 'react'
import type { PlantStage, Season } from '@/lib/types'

interface PlantProps {
  stage: PlantStage
  color: string
  stemColor: string
  groundColor: string
  season: Season
}

// Pivots the plant body from (50, 90) — the soil line — in SVG user-unit space.
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

export function FlowerPlant({ stage, color, stemColor, groundColor, season }: PlantProps) {
  if (stage === 'seed')     return <Seed color={color} groundColor={groundColor} />
  if (stage === 'sprout')   return <Sprout color={color} stemColor={stemColor} groundColor={groundColor} />
  if (stage === 'seedling') return <Seedling color={color} stemColor={stemColor} groundColor={groundColor} />
  if (stage === 'young')    return <Young color={color} stemColor={stemColor} groundColor={groundColor} />
  if (stage === 'bud')      return <Bud color={color} stemColor={stemColor} groundColor={groundColor} />
  if (stage === 'bloom')    return <Bloom color={color} stemColor={stemColor} groundColor={groundColor} season={season} />
  if (stage === 'mature')   return <Mature color={color} stemColor={stemColor} groundColor={groundColor} season={season} />
  return <Elder color={color} stemColor={stemColor} groundColor={groundColor} season={season} />
}

function Seed({ color, groundColor }: { color: string; groundColor: string }) {
  return (
    <>
      <ellipse cx="50" cy="86" rx="16" ry="5" fill={groundColor} opacity="0.7" />
      <ellipse cx="50" cy="83" rx="9" ry="3" fill={groundColor} opacity="0.38" />
      {/* Bean-shaped seed */}
      <path d="M 43 79 C 42 71 50 68 58 71 C 61 74 61 82 57 84 C 52 87 42 85 43 79 Z"
        fill={color} opacity="0.93" />
      {/* Specular highlight */}
      <path d="M 46 73 C 44 71 51 70 53 73"
        stroke="white" strokeWidth="1.2" fill="none" opacity="0.28" strokeLinecap="round" />
      {/* Longitudinal crease */}
      <path d="M 50 69 C 50 76 50 81 50 85"
        stroke={color} strokeWidth="0.8" fill="none" opacity="0.28" strokeLinecap="round" />
    </>
  )
}

function Sprout({ color, stemColor, groundColor }: { color: string; stemColor: string; groundColor: string }) {
  return (
    <>
      <ellipse cx="50" cy="88" rx="13" ry="4" fill={groundColor} opacity="0.6" />
      <Sway dur={3.6}>
        {/* Hooked hypocotyl emerging from soil */}
        <path d="M 50 88 C 50 80 46 70 47 61 C 49 53 55 53 55 53"
          stroke={stemColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Left cotyledon */}
        <path d="M 55 53 C 50 47 43 48 44 55 C 47 58 53 57 55 53 Z"
          fill={color} opacity="0.85" />
        {/* Right cotyledon */}
        <path d="M 55 53 C 60 47 67 49 66 56 C 63 58 57 57 55 53 Z"
          fill={color} opacity="0.82" />
        {/* Midribs */}
        <line x1="55" y1="53" x2="44" y2="55" stroke={stemColor} strokeWidth="0.6" opacity="0.38" />
        <line x1="55" y1="53" x2="65" y2="55" stroke={stemColor} strokeWidth="0.6" opacity="0.38" />
      </Sway>
    </>
  )
}

function Seedling({ color, stemColor, groundColor }: { color: string; stemColor: string; groundColor: string }) {
  return (
    <>
      <ellipse cx="50" cy="90" rx="14" ry="4" fill={groundColor} opacity="0.6" />
      <Sway dur={3.9}>
        {/* Gently curved stem */}
        <path d="M 50 90 C 51 79 49 64 50 44"
          stroke={stemColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Left leaf — pointing lower-left */}
        <path d="M 50 72 C 45 67 33 63 30 69 C 35 68 44 70 50 72 Z"
          fill={color} opacity="0.88" />
        <line x1="50" y1="72" x2="31" y2="68" stroke={stemColor} strokeWidth="0.7" opacity="0.42" />
        {/* Right leaf — pointing upper-right */}
        <path d="M 50 60 C 55 55 67 52 70 58 C 65 57 56 59 50 60 Z"
          fill={color} opacity="0.85" />
        <line x1="50" y1="60" x2="69" y2="57" stroke={stemColor} strokeWidth="0.7" opacity="0.42" />
        {/* Tiny terminal bud with sepal hints */}
        <path d="M 47 44 C 46 38 50 35 54 38 C 52 41 50 45 47 44 Z"
          fill={stemColor} opacity="0.65" />
        <path d="M 53 44 C 54 38 50 35 46 38 C 48 41 50 45 53 44 Z"
          fill={stemColor} opacity="0.60" />
        <ellipse cx="50" cy="40" rx="4" ry="5.5" fill={color} opacity="0.80" />
      </Sway>
    </>
  )
}

function Young({ color, stemColor, groundColor }: { color: string; stemColor: string; groundColor: string }) {
  return (
    <>
      <ellipse cx="50" cy="90" rx="16" ry="5" fill={groundColor} opacity="0.62" />
      <Sway dur={4.1}>
        {/* S-curved stem */}
        <path d="M 50 90 C 53 76 47 60 50 36"
          stroke={stemColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Lower left leaf */}
        <path d="M 50 80 C 43 74 29 70 25 77 C 31 75 42 77 50 80 Z"
          fill={color} opacity="0.88" />
        <line x1="50" y1="80" x2="26" y2="76" stroke={stemColor} strokeWidth="0.8" opacity="0.38" />
        {/* Lower right leaf */}
        <path d="M 50 70 C 57 64 71 61 74 68 C 68 67 58 69 50 70 Z"
          fill={color} opacity="0.85" />
        <line x1="50" y1="70" x2="73" y2="67" stroke={stemColor} strokeWidth="0.8" opacity="0.38" />
        {/* Upper left leaf */}
        <path d="M 50 57 C 45 52 36 50 34 56 C 38 55 45 55 50 57 Z"
          fill={color} opacity="0.82" />
        <line x1="50" y1="57" x2="35" y2="55" stroke={stemColor} strokeWidth="0.7" opacity="0.35" />
        {/* Closed bud at tip */}
        <path d="M 47 36 C 46 30 50 26 54 30 C 52 33 50 37 47 36 Z"
          fill={stemColor} opacity="0.70" />
        <path d="M 53 36 C 54 30 50 26 46 30 C 48 33 50 37 53 36 Z"
          fill={stemColor} opacity="0.65" />
        <ellipse cx="50" cy="30" rx="5" ry="7.5" fill={color} opacity="0.84" />
      </Sway>
    </>
  )
}

function Bud({ color, stemColor, groundColor }: { color: string; stemColor: string; groundColor: string }) {
  return (
    <>
      <ellipse cx="50" cy="90" rx="17" ry="5" fill={groundColor} opacity="0.63" />
      <Sway dur={4.3}>
        {/* Taller S-curve stem */}
        <path d="M 50 90 C 54 74 46 56 50 26"
          stroke={stemColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Left leaf */}
        <path d="M 50 76 C 42 70 27 67 23 74 C 30 72 42 74 50 76 Z"
          fill={color} opacity="0.88" />
        <line x1="50" y1="76" x2="24" y2="73" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        {/* Right leaf */}
        <path d="M 50 62 C 58 56 72 53 75 60 C 68 59 58 61 50 62 Z"
          fill={color} opacity="0.85" />
        <line x1="50" y1="62" x2="74" y2="59" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        {/* Sepals — four pointed green bracts */}
        <path d="M 50 34 C 44 28 44 20 50 18 C 50 22 49 30 50 34 Z" fill={stemColor} opacity="0.82" />
        <path d="M 50 34 C 56 28 56 20 50 18 C 50 22 51 30 50 34 Z" fill={stemColor} opacity="0.78" />
        <path d="M 50 34 C 43 27 40 18 44 14 C 46 18 48 28 50 34 Z" fill={stemColor} opacity="0.72" />
        <path d="M 50 34 C 57 27 60 18 56 14 C 54 18 52 28 50 34 Z" fill={stemColor} opacity="0.70" />
        {/* Tightly furled petals — just visible edges */}
        <path d="M 50 34 C 44 28 45 20 50 18 C 48 22 48 30 50 34 Z" fill={color} opacity="0.92" />
        <path d="M 50 34 C 56 28 55 20 50 18 C 52 22 52 30 50 34 Z" fill={color} opacity="0.88" />
        <ellipse cx="50" cy="24" rx="6.5" ry="9" fill={color} opacity="0.91" />
      </Sway>
    </>
  )
}

// Render back petals first (lower z), front petal last (on top).
const BLOOM_PETAL_ANGLES = [144, 216, 72, 288, 0]
const MATURE_PETAL_ANGLES = [135, 180, 225, 270, 315, 0, 45, 90]

function Bloom({ color, stemColor, groundColor, season }: { color: string; stemColor: string; groundColor: string; season: Season }) {
  const centerColor = season === 'spring'
    ? 'oklch(0.88 0.18 85)'
    : season === 'summer'
    ? 'oklch(0.86 0.20 80)'
    : 'oklch(0.82 0.16 90)'

  return (
    <>
      <ellipse cx="50" cy="90" rx="18" ry="5.5" fill={groundColor} opacity="0.63" />
      <Sway dur={4.6}>
        <path d="M 50 90 C 53 73 47 54 50 26"
          stroke={stemColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Leaf pair */}
        <path d="M 50 74 C 42 68 27 65 23 72 C 30 70 42 72 50 74 Z"
          fill={color} opacity="0.85" />
        <line x1="50" y1="74" x2="24" y2="71" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        <path d="M 50 60 C 58 54 72 51 75 58 C 68 57 58 59 50 60 Z"
          fill={color} opacity="0.82" />
        <line x1="50" y1="60" x2="74" y2="57" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        {/* 5 teardrop petals — back to front z-order */}
        {BLOOM_PETAL_ANGLES.map((angle, i) => (
          <g key={i} transform={`translate(50, 26) rotate(${angle})`}>
            <path d="M 0 2 C -8 -4 -11 -19 0 -26 C 11 -19 8 -4 0 2 Z"
              fill={color} opacity={i < 2 ? 0.70 : 0.93} />
          </g>
        ))}
        {/* Stamen disc */}
        <circle cx="50" cy="26" r="7.5" fill={centerColor} opacity="0.97" />
        {/* Pollen dots */}
        <circle cx="50"   cy="21.5" r="1.8" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="54.5" cy="24.5" r="1.8" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="54"   cy="30"   r="1.8" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="46"   cy="30"   r="1.8" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="45.5" cy="24.5" r="1.8" fill="oklch(0.96 0.08 85)" opacity="0.85" />
      </Sway>
    </>
  )
}

function Mature({ color, stemColor, groundColor, season }: { color: string; stemColor: string; groundColor: string; season: Season }) {
  const centerColor = season === 'spring'
    ? 'oklch(0.88 0.18 85)'
    : season === 'summer'
    ? 'oklch(0.86 0.20 80)'
    : 'oklch(0.80 0.16 90)'

  return (
    <>
      <ellipse cx="50" cy="90" rx="19" ry="6" fill={groundColor} opacity="0.65" />
      <Sway dur={5.1}>
        <path d="M 50 90 C 54 72 46 50 50 22"
          stroke={stemColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* Three leaves */}
        <path d="M 50 78 C 41 72 25 68 21 76 C 28 73 41 75 50 78 Z"
          fill={color} opacity="0.87" />
        <line x1="50" y1="78" x2="22" y2="74" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        <path d="M 50 66 C 59 60 74 57 77 64 C 70 63 59 65 50 66 Z"
          fill={color} opacity="0.84" />
        <line x1="50" y1="66" x2="76" y2="63" stroke={stemColor} strokeWidth="0.9" opacity="0.38" />
        <path d="M 50 54 C 44 49 33 46 31 53 C 36 52 44 52 50 54 Z"
          fill={color} opacity="0.80" />
        <line x1="50" y1="54" x2="32" y2="52" stroke={stemColor} strokeWidth="0.8" opacity="0.35" />
        {/* 8 teardrop petals — back to front */}
        {MATURE_PETAL_ANGLES.map((angle, i) => (
          <g key={i} transform={`translate(50, 22) rotate(${angle})`}>
            <path d="M 0 2 C -9 -5 -13 -22 0 -30 C 13 -22 9 -5 0 2 Z"
              fill={color} opacity={i < 4 ? 0.67 : 0.92} />
          </g>
        ))}
        <circle cx="50" cy="22" r="9" fill={centerColor} opacity="0.97" />
        <circle cx="50"   cy="17"   r="2"   fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="55"   cy="20"   r="2"   fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="55"   cy="26"   r="2"   fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="50"   cy="29"   r="2"   fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="45"   cy="26"   r="2"   fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="45"   cy="20"   r="2"   fill="oklch(0.96 0.08 85)" opacity="0.85" />
        {/* Side bud on lateral peduncle */}
        <path d="M 67 48 C 65 42 64 38 67 36"
          stroke={stemColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="67" cy="34" rx="4" ry="5.5" fill={color} opacity="0.82" />
      </Sway>
    </>
  )
}

function Elder({ color, stemColor, groundColor, season }: { color: string; stemColor: string; groundColor: string; season: Season }) {
  const centerColor = season === 'spring'
    ? 'oklch(0.88 0.18 85)'
    : 'oklch(0.82 0.14 85)'

  return (
    <>
      <ellipse cx="50" cy="90" rx="20" ry="6" fill={groundColor} opacity="0.68" />
      <Sway dur={5.6}>
        {/* Stout main stem */}
        <path d="M 50 90 C 55 70 45 48 50 18"
          stroke={stemColor} strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Lateral peduncles */}
        <path d="M 47 52 C 40 46 32 42 28 38"
          stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 53 44 C 60 38 68 34 72 30"
          stroke={stemColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Main leaves */}
        <path d="M 50 80 C 40 73 23 70 19 78 C 27 75 40 77 50 80 Z"
          fill={color} opacity="0.87" />
        <line x1="50" y1="80" x2="20" y2="77" stroke={stemColor} strokeWidth="1" opacity="0.38" />
        <path d="M 50 68 C 60 62 76 59 79 66 C 72 65 60 67 50 68 Z"
          fill={color} opacity="0.84" />
        <line x1="50" y1="68" x2="78" y2="65" stroke={stemColor} strokeWidth="1" opacity="0.38" />
        {/* Primary flower — 8 petals */}
        {MATURE_PETAL_ANGLES.map((angle, i) => (
          <g key={i} transform={`translate(50, 18) rotate(${angle})`}>
            <path d="M 0 2 C -10 -5 -14 -24 0 -33 C 14 -24 10 -5 0 2 Z"
              fill={color} opacity={i < 4 ? 0.64 : 0.92} />
          </g>
        ))}
        <circle cx="50" cy="18" r="10" fill={centerColor} opacity="0.97" />
        <circle cx="50"   cy="12"   r="2.2" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="56"   cy="15"   r="2.2" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="55"   cy="22"   r="2.2" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="50"   cy="26"   r="2.2" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="45"   cy="22"   r="2.2" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        <circle cx="44"   cy="15"   r="2.2" fill="oklch(0.96 0.08 85)" opacity="0.85" />
        {/* Left secondary flower — 6 petals */}
        <g transform="translate(28, 37)">
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <g key={i} transform={`rotate(${angle})`}>
              <path d="M 0 1 C -5 -3 -7 -13 0 -17 C 7 -13 5 -3 0 1 Z"
                fill={color} opacity={i < 3 ? 0.68 : 0.90} />
            </g>
          ))}
          <circle cx="0" cy="0" r="5" fill={centerColor} opacity="0.96" />
        </g>
        {/* Right secondary flower — 6 petals */}
        <g transform="translate(72, 30)">
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <g key={i} transform={`rotate(${angle})`}>
              <path d="M 0 1 C -5 -3 -7 -13 0 -17 C 7 -13 5 -3 0 1 Z"
                fill={color} opacity={i < 3 ? 0.68 : 0.90} />
            </g>
          ))}
          <circle cx="0" cy="0" r="5" fill={centerColor} opacity="0.96" />
        </g>
      </Sway>
    </>
  )
}
