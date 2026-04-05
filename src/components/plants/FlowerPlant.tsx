import type { PlantStage, Season } from '@/lib/types'

interface PlantProps {
  stage: PlantStage
  color: string
  stemColor: string
  groundColor: string
  season: Season
}

export function FlowerPlant({ stage, color, stemColor, groundColor, season }: PlantProps) {
  if (stage === 'seed') return <Seed color={color} groundColor={groundColor} />
  if (stage === 'sprout') return <Sprout color={color} stemColor={stemColor} groundColor={groundColor} />
  if (stage === 'seedling') return <Seedling color={color} stemColor={stemColor} groundColor={groundColor} />
  if (stage === 'young') return <Young color={color} stemColor={stemColor} groundColor={groundColor} />
  if (stage === 'bud') return <Bud color={color} stemColor={stemColor} groundColor={groundColor} />
  if (stage === 'bloom') return <Bloom color={color} stemColor={stemColor} groundColor={groundColor} season={season} />
  if (stage === 'mature') return <Mature color={color} stemColor={stemColor} groundColor={groundColor} season={season} />
  return <Elder color={color} stemColor={stemColor} groundColor={groundColor} season={season} />
}

function Seed({ color, groundColor }: { color: string; groundColor: string }) {
  return (
    <>
      <circle cx="50" cy="70" r="15" fill={color} opacity="0.8" />
      <ellipse cx="50" cy="85" rx="10" ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

function Sprout({ color, stemColor, groundColor }: { color: string; stemColor: string; groundColor: string }) {
  return (
    <>
      <path d="M 50 90 Q 48 70 50 60 Q 52 70 50 90" fill={stemColor} stroke={stemColor} strokeWidth="1" />
      <ellipse cx="45" cy="55" rx="8" ry="12" fill={color} opacity="0.7" />
      <ellipse cx="55" cy="58" rx="7" ry="10" fill={color} opacity="0.7" />
      <ellipse cx="50" cy="92" rx="8" ry="2" fill={groundColor} opacity="0.3" />
    </>
  )
}

function Seedling({ color, stemColor, groundColor }: { color: string; stemColor: string; groundColor: string }) {
  return (
    <>
      <path d="M 50 95 Q 48 70 50 50 Q 52 70 50 95" fill={stemColor} stroke={stemColor} strokeWidth="1.5" />
      <ellipse cx="43" cy="45" rx="9" ry="14" fill={color} opacity="0.75" />
      <ellipse cx="57" cy="48" rx="8" ry="12" fill={color} opacity="0.75" />
      <ellipse cx="50" cy="40" rx="6" ry="9" fill={color} opacity="0.8" />
      <ellipse cx="50" cy="95" rx="9" ry="2.5" fill={groundColor} opacity="0.3" />
    </>
  )
}

function Young({ color, stemColor, groundColor }: { color: string; stemColor: string; groundColor: string }) {
  return (
    <>
      <path d="M 50 95 Q 48 60 50 40 Q 52 60 50 95" fill={stemColor} stroke={stemColor} strokeWidth="2" />
      <ellipse cx="50" cy="35" rx="12" ry="18" fill={color} opacity="0.8" />
      <ellipse cx="40" cy="45" rx="6" ry="10" fill={color} opacity="0.6" />
      <ellipse cx="60" cy="45" rx="6" ry="10" fill={color} opacity="0.6" />
      <path d="M 45 50 Q 40 60 38 65" stroke={stemColor} strokeWidth="1.5" fill="none" />
      <path d="M 55 50 Q 60 60 62 65" stroke={stemColor} strokeWidth="1.5" fill="none" />
      <ellipse cx="50" cy="96" rx="10" ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

function Bud({ color, stemColor, groundColor }: { color: string; stemColor: string; groundColor: string }) {
  return (
    <>
      <path d="M 50 95 Q 47 60 50 35 Q 53 60 50 95" fill={stemColor} stroke={stemColor} strokeWidth="2" />
      <ellipse cx="50" cy="30" rx="14" ry="20" fill={color} opacity="0.85" />
      <ellipse cx="38" cy="42" rx="7" ry="11" fill={color} opacity="0.7" />
      <ellipse cx="62" cy="42" rx="7" ry="11" fill={color} opacity="0.7" />
      <path d="M 43 48 Q 35 58 32 68" stroke={stemColor} strokeWidth="1.8" fill="none" />
      <path d="M 57 48 Q 65 58 68 68" stroke={stemColor} strokeWidth="1.8" fill="none" />
      <ellipse cx="50" cy="96" rx="11" ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

function Bloom({ color, stemColor, groundColor, season }: { color: string; stemColor: string; groundColor: string; season: Season }) {
  const centerColor = season === 'spring' ? 'oklch(0.82 0.16 95)' : season === 'summer' ? 'oklch(0.85 0.18 90)' : 'oklch(0.78 0.14 85)'
  
  return (
    <>
      <path d="M 50 95 Q 47 55 50 30 Q 53 55 50 95" fill={stemColor} stroke={stemColor} strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x = 50 + Math.cos(rad) * 18
        const y = 30 + Math.sin(rad) * 18
        return (
          <ellipse
            key={angle}
            cx={x}
            cy={y}
            rx="10"
            ry="14"
            fill={color}
            opacity="0.9"
            transform={`rotate(${angle} ${x} ${y})`}
          />
        )
      })}
      <circle cx="50" cy="30" r="8" fill={centerColor} opacity="0.9" />
      <path d="M 45 40 Q 35 55 30 65" stroke={stemColor} strokeWidth="2" fill="none" />
      <path d="M 55 40 Q 65 55 70 65" stroke={stemColor} strokeWidth="2" fill="none" />
      <ellipse cx="27" cy="67" rx="8" ry="12" fill={stemColor} opacity="0.7" />
      <ellipse cx="73" cy="67" rx="8" ry="12" fill={stemColor} opacity="0.7" />
      <ellipse cx="50" cy="96" rx="12" ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

function Mature({ color, stemColor, groundColor, season }: { color: string; stemColor: string; groundColor: string; season: Season }) {
  const fruitColor = season === 'autumn' ? 'oklch(0.72 0.18 35)' : season === 'summer' ? 'oklch(0.80 0.18 60)' : 'oklch(0.78 0.14 85)'
  
  return (
    <>
      <path d="M 50 95 Q 45 50 50 20 Q 55 50 50 95" fill={stemColor} stroke={stemColor} strokeWidth="3" />
      <ellipse cx="50" cy="15" rx="25" ry="30" fill={color} opacity="0.8" />
      <circle cx="50" cy="10" r="6" fill={fruitColor} opacity="0.9" />
      <circle cx="42" cy="18" r="5" fill={fruitColor} opacity="0.8" />
      <circle cx="58" cy="18" r="5" fill={fruitColor} opacity="0.8" />
      <path d="M 40 35 Q 25 50 18 62" stroke={stemColor} strokeWidth="2.5" fill="none" />
      <path d="M 60 35 Q 75 50 82 62" stroke={stemColor} strokeWidth="2.5" fill="none" />
      <ellipse cx="15" cy="65" rx="12" ry="18" fill={stemColor} opacity="0.8" />
      <ellipse cx="85" cy="65" rx="12" ry="18" fill={stemColor} opacity="0.8" />
      <ellipse cx="50" cy="96" rx="14" ry="4" fill={groundColor} opacity="0.3" />
    </>
  )
}

function Elder({ color, stemColor, groundColor, season }: { color: string; stemColor: string; groundColor: string; season: Season }) {
  const fruitColor = season === 'autumn' ? 'oklch(0.72 0.18 35)' : 'oklch(0.78 0.14 85)'
  
  return (
    <>
      <path d="M 50 95 Q 42 50 50 10 Q 58 50 50 95" fill={stemColor} stroke={stemColor} strokeWidth="4" />
      <ellipse cx="50" cy="12" rx="28" ry="35" fill={color} opacity="0.85" />
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x = 50 + Math.cos(rad) * 22
        const y = 12 + Math.sin(rad) * 25
        return <circle key={angle} cx={x} cy={y} r="4" fill={fruitColor} opacity="0.85" />
      })}
      <path d="M 35 35 Q 20 50 15 65" stroke={stemColor} strokeWidth="3" fill="none" />
      <path d="M 65 35 Q 80 50 85 65" stroke={stemColor} strokeWidth="3" fill="none" />
      <ellipse cx="12" cy="68" rx="14" ry="22" fill={stemColor} opacity="0.85" />
      <ellipse cx="88" cy="68" rx="14" ry="22" fill={stemColor} opacity="0.85" />
      <ellipse cx="50" cy="97" rx="16" ry="4" fill={groundColor} opacity="0.3" />
    </>
  )
}
