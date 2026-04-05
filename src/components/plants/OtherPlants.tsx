import type { PlantStage } from '@/lib/types'

interface PlantProps {
  stage: PlantStage
  color: string
  stemColor: string
  groundColor: string
}

export function TreePlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const stageIndex = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'].indexOf(stage)
  const height = 10 + (stageIndex * 10)
  const width = 5 + (stageIndex * 3)
  const trunkWidth = 2 + (stageIndex * 0.5)
  
  return (
    <>
      <path 
        d={`M 50 95 Q ${48 - trunkWidth / 2} ${95 - height} 50 ${95 - height} Q ${52 + trunkWidth / 2} ${95 - height} 50 95`}
        fill={stemColor}
        stroke={stemColor}
        strokeWidth={trunkWidth}
      />
      {stageIndex >= 2 && (
        <ellipse cx="50" cy={95 - height} rx={width * 3} ry={height * 0.8} fill={color} opacity="0.8" />
      )}
      {stageIndex >= 4 && (
        <>
          <path d={`M 35 ${65 - stageIndex * 2} Q 25 ${70 - stageIndex} 20 ${75 - stageIndex}`} stroke={stemColor} strokeWidth="2" fill="none" />
          <ellipse cx="18" cy={77 - stageIndex} rx={8 + stageIndex} ry={12 + stageIndex} fill={color} opacity="0.75" />
        </>
      )}
      {stageIndex >= 4 && (
        <>
          <path d={`M 65 ${65 - stageIndex * 2} Q 75 ${70 - stageIndex} 80 ${75 - stageIndex}`} stroke={stemColor} strokeWidth="2" fill="none" />
          <ellipse cx="82" cy={77 - stageIndex} rx={8 + stageIndex} ry={12 + stageIndex} fill={color} opacity="0.75" />
        </>
      )}
      <ellipse cx="50" cy="96" rx={10 + stageIndex} ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

export function SucculentPlant({ stage, color, groundColor }: PlantProps) {
  const stageIndex = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'].indexOf(stage)
  const size = 8 + (stageIndex * 4)
  
  if (stageIndex < 2) {
    return (
      <>
        <circle cx="50" cy="75" r={size} fill={color} opacity="0.8" />
        <ellipse cx="50" cy="88" rx={size * 0.8} ry="3" fill={groundColor} opacity="0.3" />
      </>
    )
  }
  
  return (
    <>
      <ellipse cx="50" cy="75" rx={size * 1.2} ry={size} fill={color} opacity="0.85" />
      {stageIndex >= 3 && (
        <>
          <ellipse cx={50 - size * 0.7} cy={75 - size * 0.3} rx={size * 0.7} ry={size * 0.6} fill={color} opacity="0.75" />
          <ellipse cx={50 + size * 0.7} cy={75 - size * 0.3} rx={size * 0.7} ry={size * 0.6} fill={color} opacity="0.75" />
        </>
      )}
      {stageIndex >= 5 && (
        <>
          <ellipse cx={50} cy={75 - size * 0.8} rx={size * 0.5} ry={size * 0.4} fill={color} opacity="0.7" />
          <circle cx={50 - 3} cy={75 - size * 0.9} r="3" fill="oklch(0.85 0.18 90)" opacity="0.9" />
        </>
      )}
      <ellipse cx="50" cy={90} rx={size * 1.3} ry="4" fill={groundColor} opacity="0.3" />
    </>
  )
}

export function VinePlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const stageIndex = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'].indexOf(stage)
  
  return (
    <>
      <path 
        d={`M 50 95 Q 45 ${90 - stageIndex * 5} ${40 + stageIndex} ${85 - stageIndex * 6} T ${30 + stageIndex * 2} ${70 - stageIndex * 7}`}
        stroke={stemColor}
        strokeWidth={1.5 + stageIndex * 0.3}
        fill="none"
      />
      {stageIndex >= 2 && (
        <>
          {[...Array(stageIndex)].map((_, i) => (
            <ellipse 
              key={i}
              cx={45 - i * 3}
              cy={85 - i * 8}
              rx={5 + i * 0.5}
              ry={7 + i * 0.7}
              fill={color}
              opacity={0.7 + i * 0.02}
            />
          ))}
        </>
      )}
      <ellipse cx="50" cy="96" rx={8 + stageIndex} ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

export function HerbPlant({ stage, color, stemColor, groundColor }: PlantProps) {
  const stageIndex = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'].indexOf(stage)
  const stemCount = Math.min(stageIndex + 1, 5)
  
  return (
    <>
      {[...Array(stemCount)].map((_, i) => {
        const offset = (i - stemCount / 2) * 8
        return (
          <g key={i}>
            <path 
              d={`M ${50 + offset} 95 Q ${48 + offset} ${80 - stageIndex * 5} ${50 + offset} ${75 - stageIndex * 6}`}
              stroke={stemColor}
              strokeWidth="1.2"
              fill="none"
            />
            {stageIndex >= 2 && (
              <>
                <ellipse cx={45 + offset} cy={80 - stageIndex * 5} rx="4" ry="6" fill={color} opacity="0.75" />
                <ellipse cx={55 + offset} cy={82 - stageIndex * 5} rx="4" ry="6" fill={color} opacity="0.75" />
              </>
            )}
          </g>
        )
      })}
      <ellipse cx="50" cy="96" rx={10 + stageIndex * 1.5} ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

export function WildflowerPlant({ stage, color, stemColor, groundColor, season }: PlantProps & { season: any }) {
  const stageIndex = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'].indexOf(stage)
  const flowerCount = Math.min(stageIndex, 4)
  
  return (
    <>
      {[...Array(flowerCount + 1)].map((_, i) => {
        const offset = (i - flowerCount / 2) * 12
        const height = 90 - stageIndex * 6 - i * 3
        return (
          <g key={i}>
            <path 
              d={`M ${50 + offset} 95 L ${50 + offset} ${height}`}
              stroke={stemColor}
              strokeWidth="1"
              fill="none"
            />
            {stageIndex >= 3 && (
              <circle cx={50 + offset} cy={height} r={3 + stageIndex * 0.5} fill={color} opacity="0.85" />
            )}
          </g>
        )
      })}
      <ellipse cx="50" cy="96" rx={8 + stageIndex * 1.2} ry="2.5" fill={groundColor} opacity="0.3" />
    </>
  )
}
