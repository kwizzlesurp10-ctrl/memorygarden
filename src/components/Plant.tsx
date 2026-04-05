import { motion, useAnimation } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { Memory, PlantStage, Season, PlantVariety } from '@/lib/types'
import { getPlantColor, getPlantSize, getSeasonalPlantModifier, getSeason, calculateGrowthMetrics, getVisualParams } from '@/lib/garden-helpers'
import { FlowerPlant } from './plants/FlowerPlant'
import { TreePlant, SucculentPlant, VinePlant, HerbPlant, WildflowerPlant } from './plants/OtherPlants'

interface PlantProps {
  memory: Memory
  onClick: () => void
  isDragging?: boolean
  season?: Season
  nearbyMemories?: Memory[]
  isGrowing?: boolean
  boostTier?: 'standard' | 'premium' | 'legendary'
}

export function Plant({ memory, onClick, isDragging, season, nearbyMemories = [], isGrowing = false, boostTier }: PlantProps) {
  const currentSeason = season || getSeason()
  const metrics = calculateGrowthMetrics(memory, nearbyMemories)
  const visual = getVisualParams(memory, metrics)
  
  const isLegendary = visual.specialClass === 'legendary'
  const controls = useAnimation()
  const previousVisitCount = useRef(memory.visitCount)

  useEffect(() => {
    if (memory.visitCount > previousVisitCount.current) {
      controls.start({
        scale: [1, 1.3, 1.15, 1.05, 1],
        rotate: [0, -5, 5, -3, 0],
        transition: {
          duration: 1.2,
          times: [0, 0.3, 0.5, 0.8, 1],
          ease: [0.68, -0.55, 0.265, 1.55],
        },
      })
    }
    previousVisitCount.current = memory.visitCount
  }, [memory.visitCount, controls])

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={controls}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={`cursor-pointer animate-breathe ${isLegendary ? 'legendary-plant' : ''} ${isGrowing ? 'relative' : ''}`}
      onClick={onClick}
      style={{ 
        width: visual.size, 
        height: visual.size,
        filter: visual.glow !== 'none' ? `drop-shadow(${visual.glow})` : 'none',
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <PlantSVG 
        variety={memory.plantVariety}
        stage={memory.plantStage}
        color={visual.color}
        season={currentSeason}
        size={visual.size}
        scaleX={visual.scaleX}
        leafOpacity={visual.leafOpacity}
        bloomOpacity={visual.bloomOpacity}
      />
      
      {isGrowing && (
        <PlantGrowthParticles color={visual.color} tier={boostTier} />
      )}
    </motion.div>
  )
}

function PlantGrowthParticles({ color, tier }: { color: string; tier?: 'standard' | 'premium' | 'legendary' }) {
  if (!tier) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 bottom-0 w-2 h-2 rounded-full"
            style={{ background: color }}
            initial={{ 
              scale: 0, 
              opacity: 1,
              x: '-50%',
              y: 0,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [1, 0.8, 0],
              y: [-20, -60, -100],
              x: `calc(-50% + ${(Math.random() - 0.5) * 60}px)`,
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.08,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    )
  }

  if (tier === 'standard') {
    return (
      <div className="absolute inset-0 pointer-events-none -inset-8">
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i * 360) / 20
          const distance = 40 + Math.random() * 20
          
          return (
            <motion.div
              key={i}
              className="absolute left-1/2 bottom-1/4 w-2 h-2 rounded-full"
              style={{ 
                background: 'oklch(0.65 0.12 160)',
                boxShadow: '0 0 8px oklch(0.65 0.12 160 / 0.5)',
              }}
              initial={{ 
                scale: 0, 
                opacity: 0,
                x: '-50%',
                y: 0,
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                x: `calc(-50% + ${Math.cos(angle * Math.PI / 180) * distance}px)`,
                y: `${Math.sin(angle * Math.PI / 180) * distance}px`,
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.04,
                ease: 'easeOut',
              }}
            />
          )
        })}
      </div>
    )
  }

  if (tier === 'premium') {
    return (
      <div className="absolute inset-0 pointer-events-none -inset-12">
        {Array.from({ length: 30 }).map((_, i) => {
          const angle = Math.random() * 360
          const spiralRadius = 30 + (i / 30) * 50
          
          return (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2"
              initial={{ 
                x: '-50%',
                y: '-50%',
              }}
              animate={{
                x: `calc(-50% + ${Math.cos((angle + i * 40) * Math.PI / 180) * spiralRadius}px)`,
                y: `calc(-50% + ${Math.sin((angle + i * 40) * Math.PI / 180) * spiralRadius}px)`,
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.03,
                ease: 'easeOut',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path
                  d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z"
                  fill="oklch(0.75 0.18 280)"
                  style={{
                    filter: 'drop-shadow(0 0 6px oklch(0.75 0.18 280 / 0.6))',
                  }}
                />
              </svg>
            </motion.div>
          )
        })}
      </div>
    )
  }

  if (tier === 'legendary') {
    return (
      <div className="absolute inset-0 pointer-events-none -inset-16">
        {Array.from({ length: 50 }).map((_, i) => {
          const angle = (i * 360) / 50
          const burstDistance = 60 + Math.random() * 40
          
          return (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 w-3 h-3"
              initial={{ 
                x: '-50%',
                y: '-50%',
              }}
              animate={{
                x: `calc(-50% + ${Math.cos(angle * Math.PI / 180) * burstDistance}px)`,
                y: `calc(-50% + ${Math.sin(angle * Math.PI / 180) * burstDistance}px)`,
                scale: [0, 2, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.8,
                delay: i * 0.02,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  d="M9 0 L11 7 L18 9 L11 11 L9 18 L7 11 L0 9 L7 7 Z"
                  fill="oklch(0.78 0.20 50)"
                  style={{
                    filter: 'drop-shadow(0 0 10px oklch(0.78 0.20 50 / 0.8)) drop-shadow(0 0 5px oklch(0.78 0.20 50))',
                  }}
                />
              </svg>
            </motion.div>
          )
        })}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute left-1/2 top-1/2 rounded-full border-2"
            style={{
              borderColor: 'oklch(0.78 0.20 50 / 0.5)',
              width: '40px',
              height: '40px',
              x: '-50%',
              y: '-50%',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 4],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    )
  }

  return null
}

function PlantSVG({ variety, stage, color, season, size, scaleX, leafOpacity, bloomOpacity }: { 
  variety: PlantVariety
  stage: PlantStage
  color: string
  season: Season
  size: number
  scaleX: number
  leafOpacity: number
  bloomOpacity: number
}) {
  const stemColor = season === 'autumn' ? 'oklch(0.52 0.10 145)' : season === 'winter' ? 'oklch(0.48 0.06 160)' : 'oklch(0.55 0.08 155)'
  const groundColor = season === 'winter' ? 'oklch(0.82 0.02 220)' : 'oklch(0.45 0.05 65)'
  
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform={`scale(${scaleX}, 1)`} transform-origin="50 50">
        {variety === 'flower' && <FlowerPlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} season={season} />}
        {variety === 'tree' && <TreePlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} />}
        {variety === 'succulent' && <SucculentPlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} />}
        {variety === 'vine' && <VinePlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} />}
        {variety === 'herb' && <HerbPlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} />}
        {variety === 'wildflower' && <WildflowerPlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} season={season} />}
        {(variety === 'ancient_oak' || variety === 'eternal_rose' || variety === 'phoenix_vine' || variety === 'starlight_succulent') && 
          <LegendaryPlant variety={variety} stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} season={season} />}
      </g>
    </svg>
  )
}

function SeedSVG({ color, season }: { color: string; season: Season }) {
  const groundColor = season === 'winter' ? 'oklch(0.82 0.02 220)' : 'oklch(0.45 0.05 65)'
  return (
    <>
      <circle cx="50" cy="70" r="15" fill={color} opacity="0.8" />
      <ellipse cx="50" cy="85" rx="10" ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

function SproutSVG({ color, season }: { color: string; season: Season }) {
  const stemColor = season === 'autumn' ? 'oklch(0.52 0.10 145)' : season === 'winter' ? 'oklch(0.48 0.06 160)' : 'oklch(0.55 0.08 155)'
  const groundColor = season === 'winter' ? 'oklch(0.82 0.02 220)' : 'oklch(0.45 0.05 65)'
  return (
    <>
      <path
        d="M 50 90 Q 48 70 50 60 Q 52 70 50 90"
        fill={stemColor}
        stroke={stemColor}
        strokeWidth="1"
      />
      <ellipse cx="45" cy="55" rx="8" ry="12" fill={color} opacity="0.7" />
      <ellipse cx="55" cy="58" rx="7" ry="10" fill={color} opacity="0.7" />
      <ellipse cx="50" cy="92" rx="8" ry="2" fill={groundColor} opacity="0.3" />
    </>
  )
}

function BudSVG({ color, season }: { color: string; season: Season }) {
  const stemColor = season === 'autumn' ? 'oklch(0.52 0.10 145)' : season === 'winter' ? 'oklch(0.48 0.06 160)' : 'oklch(0.55 0.08 155)'
  const leafColor = season === 'autumn' ? 'oklch(0.68 0.16 45)' : stemColor
  const groundColor = season === 'winter' ? 'oklch(0.82 0.02 220)' : 'oklch(0.45 0.05 65)'
  return (
    <>
      <path
        d="M 50 95 Q 48 60 50 40 Q 52 60 50 95"
        fill={stemColor}
        stroke={stemColor}
        strokeWidth="2"
      />
      <ellipse cx="50" cy="35" rx="12" ry="18" fill={color} opacity="0.8" />
      <ellipse cx="40" cy="45" rx="6" ry="10" fill={color} opacity="0.6" />
      <ellipse cx="60" cy="45" rx="6" ry="10" fill={color} opacity="0.6" />
      <path d="M 45 50 Q 40 60 38 65" stroke={leafColor} strokeWidth="1.5" fill="none" />
      <path d="M 55 50 Q 60 60 62 65" stroke={leafColor} strokeWidth="1.5" fill="none" />
      <ellipse cx="50" cy="96" rx="10" ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

function BloomSVG({ color, season }: { color: string; season: Season }) {
  const stemColor = season === 'autumn' ? 'oklch(0.52 0.10 145)' : season === 'winter' ? 'oklch(0.48 0.06 160)' : 'oklch(0.55 0.08 155)'
  const leafColor = season === 'autumn' ? 'oklch(0.68 0.16 45)' : season === 'summer' ? 'oklch(0.60 0.12 155)' : stemColor
  const centerColor = season === 'spring' ? 'oklch(0.82 0.16 95)' : season === 'summer' ? 'oklch(0.85 0.18 90)' : 'oklch(0.78 0.14 85)'
  const groundColor = season === 'winter' ? 'oklch(0.82 0.02 220)' : 'oklch(0.45 0.05 65)'
  
  return (
    <>
      <path
        d="M 50 95 Q 47 55 50 30 Q 53 55 50 95"
        fill={stemColor}
        stroke={stemColor}
        strokeWidth="2"
      />
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
      <path d="M 45 40 Q 35 55 30 65" stroke={leafColor} strokeWidth="2" fill="none" />
      <path d="M 55 40 Q 65 55 70 65" stroke={leafColor} strokeWidth="2" fill="none" />
      <ellipse cx="27" cy="67" rx="8" ry="12" fill={leafColor} opacity="0.7" />
      <ellipse cx="73" cy="67" rx="8" ry="12" fill={leafColor} opacity="0.7" />
      <ellipse cx="50" cy="96" rx="12" ry="3" fill={groundColor} opacity="0.3" />
    </>
  )
}

function MatureSVG({ color, season }: { color: string; season: Season }) {
  const stemColor = season === 'autumn' ? 'oklch(0.50 0.08 145)' : season === 'winter' ? 'oklch(0.45 0.06 160)' : 'oklch(0.50 0.06 155)'
  const leafColor = season === 'autumn' ? 'oklch(0.68 0.16 45)' : season === 'summer' ? 'oklch(0.60 0.12 155)' : 'oklch(0.55 0.08 155)'
  const fruitColor = season === 'autumn' ? 'oklch(0.72 0.18 35)' : season === 'summer' ? 'oklch(0.80 0.18 60)' : 'oklch(0.78 0.14 85)'
  const groundColor = season === 'winter' ? 'oklch(0.82 0.02 220)' : 'oklch(0.45 0.05 65)'
  
  return (
    <>
      <path
        d="M 50 95 Q 45 50 50 20 Q 55 50 50 95"
        fill={stemColor}
        stroke={stemColor}
        strokeWidth="3"
      />
      <ellipse cx="50" cy="15" rx="25" ry="30" fill={color} opacity="0.8" />
      <circle cx="50" cy="10" r="6" fill={fruitColor} opacity="0.9" />
      <circle cx="42" cy="18" r="5" fill={fruitColor} opacity="0.8" />
      <circle cx="58" cy="18" r="5" fill={fruitColor} opacity="0.8" />
      <path d="M 40 35 Q 25 50 18 62" stroke={stemColor} strokeWidth="2.5" fill="none" />
      <path d="M 60 35 Q 75 50 82 62" stroke={stemColor} strokeWidth="2.5" fill="none" />
      <ellipse cx="15" cy="65" rx="12" ry="18" fill={leafColor} opacity="0.8" />
      <ellipse cx="85" cy="65" rx="12" ry="18" fill={leafColor} opacity="0.8" />
      <ellipse cx="50" cy="96" rx="14" ry="4" fill={groundColor} opacity="0.3" />
    </>
  )
}

function EvergreenSVG({ color, season }: { color: string; season: Season }) {
  const stemColor = season === 'autumn' ? 'oklch(0.48 0.06 155)' : season === 'winter' ? 'oklch(0.42 0.06 160)' : 'oklch(0.48 0.06 155)'
  const branchColor = season === 'autumn' ? 'oklch(0.46 0.07 155)' : season === 'winter' ? 'oklch(0.40 0.06 160)' : 'oklch(0.46 0.07 155)'
  const leafColor = season === 'autumn' ? 'oklch(0.68 0.16 45)' : season === 'winter' ? 'oklch(0.50 0.08 155)' : 'oklch(0.55 0.08 155)'
  const groundColor = season === 'winter' ? 'oklch(0.82 0.02 220)' : 'oklch(0.45 0.05 65)'
  
  return (
    <>
      <path
        d="M 50 95 Q 42 50 50 10 Q 58 50 50 95"
        fill={stemColor}
        stroke={stemColor}
        strokeWidth="4"
      />
      <path d="M 30 75 Q 40 50 50 45 Q 60 50 70 75" fill={color} opacity="0.7" />
      <path d="M 32 60 Q 42 38 50 32 Q 58 38 68 60" fill={color} opacity="0.75" />
      <path d="M 35 45 Q 43 26 50 20 Q 57 26 65 45" fill={color} opacity="0.8" />
      <path d="M 38 30 Q 45 15 50 10 Q 55 15 62 30" fill={color} opacity="0.85" />
      <path d="M 35 55 Q 25 65 20 75" stroke={branchColor} strokeWidth="2.5" fill="none" />
      <path d="M 65 55 Q 75 65 80 75" stroke={branchColor} strokeWidth="2.5" fill="none" />
      <ellipse cx="17" cy="78" rx="10" ry="15" fill={leafColor} opacity="0.75" />
      <ellipse cx="83" cy="78" rx="10" ry="15" fill={leafColor} opacity="0.75" />
      <ellipse cx="50" cy="97" rx="16" ry="4" fill={groundColor} opacity="0.3" />
    </>
  )
}

function LegendaryPlant({ variety, stage, color, stemColor, groundColor, season }: {
  variety: PlantVariety
  stage: PlantStage
  color: string
  stemColor: string
  groundColor: string
  season: Season
}) {
  if (variety === 'ancient_oak') {
    return <TreePlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} />
  }
  if (variety === 'eternal_rose') {
    return <FlowerPlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} season={season} />
  }
  if (variety === 'phoenix_vine') {
    return <VinePlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} />
  }
  if (variety === 'starlight_succulent') {
    return <SucculentPlant stage={stage} color={color} stemColor={stemColor} groundColor={groundColor} />
  }
  return null
}
