import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { Memory, Season } from '@/lib/types'
import { Plant } from './Plant'
import { WeatherEffects } from './WeatherEffects'
import { GardenClusterPaths } from './GardenClusterPaths'
import { getDayPeriod, getSeason, getSeasonalSky, getPlantSize } from '@/lib/garden-helpers'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

const MIN_CANVAS_SIZE = 2000
const CANVAS_PADDING = 200

interface GardenCanvasProps {
  memories: Memory[]
  onMemoryClick: (memory: Memory) => void
  onMemoryMove: (memoryId: string, newPosition: { x: number; y: number }) => void
  season?: Season
  growingMemories?: Set<string>
  memoryBoostTiers?: Map<string, 'standard' | 'premium' | 'legendary'>
  highlightedMemoryIds?: Set<string> | null
  mood?: import('@/lib/types').GardenMood | null
}

export function GardenCanvas({ memories, onMemoryClick, onMemoryMove, season: propSeason, growingMemories = new Set(), memoryBoostTiers = new Map(), highlightedMemoryIds = null, mood = null }: GardenCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [draggingMemory, setDraggingMemory] = useState<string | null>(null)
  const [dayPeriod, setDayPeriod] = useState(getDayPeriod())
  const [season, setSeason] = useState<Season>(propSeason || getSeason())
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const interval = setInterval(() => {
      setDayPeriod(getDayPeriod())
      if (!propSeason) {
        setSeason(getSeason())
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [propSeason])

  useEffect(() => {
    if (!propSeason) return
    queueMicrotask(() => {
      setSeason(propSeason)
    })
  }, [propSeason])

  const canvasSize = useMemo(() => {
    if (memories.length === 0) {
      return { width: MIN_CANVAS_SIZE, height: MIN_CANVAS_SIZE }
    }

    let maxX = 0
    let maxY = 0
    for (const memory of memories) {
      const plantSize = getPlantSize(memory.plantStage) as number
      maxX = Math.max(maxX, memory.position.x + plantSize)
      maxY = Math.max(maxY, memory.position.y + plantSize)
    }

    return {
      width: Math.max(MIN_CANVAS_SIZE, maxX + CANVAS_PADDING),
      height: Math.max(MIN_CANVAS_SIZE, maxY + CANVAS_PADDING),
    }
  }, [memories])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY * -0.001
      setScale((prev) => Math.min(Math.max(0.5, prev + delta), 2))
    }
  }, [])

  // ── Pinch-to-zoom for touch devices ────────────────────────────────────
  // We track active pointers with `pointerdown/move/up`. With two pointers
  // active, the distance between them drives `scale`. Single-pointer moves
  // are left to the browser so panning still uses the native scroll.
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null)

  const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }): number => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.hypot(dx, dy)
  }

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      pinchStartRef.current = { distance: distanceBetween(pts[0], pts[1]), scale }
    }
  }, [scale])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(pointersRef.current.values())
      const current = distanceBetween(pts[0], pts[1])
      const ratio = current / pinchStartRef.current.distance
      const next = Math.min(2, Math.max(0.5, pinchStartRef.current.scale * ratio))
      setScale(next)
      e.preventDefault()
    }
  }, [])

  const handlePointerEnd = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null
    }
  }, [])

  const handleDragEnd = useCallback(
    (memory: Memory, info: { offset: { x: number; y: number } }) => {
      setDraggingMemory(null)
      const newX = Math.max(0, memory.position.x + info.offset.x / scale)
      const newY = Math.max(0, memory.position.y + info.offset.y / scale)
      onMemoryMove(memory.id, { x: newX, y: newY })
    },
    [scale, onMemoryMove]
  )

  const backgroundGradient = getSeasonalSky(season, dayPeriod)

  const scaledWidth = canvasSize.width * scale
  const scaledHeight = canvasSize.height * scale

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto touch-pan-x touch-pan-y"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{
        background: backgroundGradient,
      }}
    >
      <ParallaxBackground dayPeriod={dayPeriod} season={season} shouldReduceMotion={shouldReduceMotion} />
      <SeasonalEffects season={season} dayPeriod={dayPeriod} shouldReduceMotion={shouldReduceMotion} />
      {mood && <WeatherEffects mood={mood} season={season} />}
      
      <div
        style={{
          width: scaledWidth,
          height: scaledHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            cursor: draggingMemory ? 'grabbing' : 'default',
          }}
        >
          <GardenClusterPaths
            memories={memories}
            highlightedMemoryIds={highlightedMemoryIds}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
          />
          {memories.map((memory) => {
            const nearbyMemories = memories.filter(
              (m) =>
                m.id !== memory.id &&
                Math.abs(m.position.x - memory.position.x) < 300 &&
                Math.abs(m.position.y - memory.position.y) < 300
            )
            const isDimmed = highlightedMemoryIds !== null && !highlightedMemoryIds.has(memory.id)
            
            return (
              <motion.div
                key={memory.id}
                drag={!isDimmed}
                dragMomentum={false}
                dragElastic={0.1}
                onDragStart={() => setDraggingMemory(memory.id)}
                onDragEnd={(_, info) => handleDragEnd(memory, info)}
                className="absolute"
                style={{
                  left: memory.position.x,
                  top: memory.position.y,
                  opacity: isDimmed ? 0.15 : 1,
                  pointerEvents: isDimmed ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease',
                }}
              >
                <Plant
                  memory={memory}
                  onClick={() => {
                    if (!draggingMemory) {
                      onMemoryClick(memory)
                    }
                  }}
                  isDragging={draggingMemory === memory.id}
                  season={season}
                  nearbyMemories={nearbyMemories}
                  isGrowing={growingMemories.has(memory.id)}
                  boostTier={memoryBoostTiers.get(memory.id)}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ParallaxBackground({ dayPeriod, season, shouldReduceMotion }: { dayPeriod: 'dawn' | 'day' | 'dusk' | 'night'; season: Season; shouldReduceMotion: boolean }) {
  const isNight = dayPeriod === 'night' || dayPeriod === 'dusk'
  
  const getLeafColor = () => {
    switch (season) {
      case 'spring':
        return 'oklch(0.65 0.12 140)'
      case 'summer':
        return 'oklch(0.55 0.14 155)'
      case 'autumn':
        return 'oklch(0.68 0.16 45)'
      case 'winter':
        return 'oklch(0.45 0.06 160)'
    }
  }
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={shouldReduceMotion ? false : {
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${getLeafColor()} / 0.1 0%, transparent 50%),
                           radial-gradient(circle at 80% 70%, ${getLeafColor()} / 0.08 0%, transparent 50%)`,
          backgroundSize: '400% 400%',
        }}
      />
      
      {!shouldReduceMotion && [...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 23) % 90}%`,
            width: `${30 + (i % 3) * 15}px`,
            height: `${30 + (i % 3) * 15}px`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, (i % 2 === 0 ? 10 : -10), 0],
            rotate: [0, (i % 2 === 0 ? 5 : -5), 0],
          }}
          transition={{
            duration: 8 + (i % 4) * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        >
          <svg viewBox="0 0 50 50" fill="none">
            <path
              d="M25 5 Q 20 15 15 25 Q 20 35 25 45 Q 30 35 35 25 Q 30 15 25 5"
              fill={getLeafColor()}
              opacity={isNight ? '0.2' : '0.15'}
            />
          </svg>
        </motion.div>
      ))}
      
      {isNight && !shouldReduceMotion && [...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${(i * 19) % 98}%`,
            top: `${(i * 13) % 40}%`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}

function SeasonalEffects({ season, dayPeriod, shouldReduceMotion }: { season: Season; dayPeriod: 'dawn' | 'day' | 'dusk' | 'night'; shouldReduceMotion: boolean }) {
  if (season === 'spring') {
    return <FallingPetals shouldReduceMotion={shouldReduceMotion} />
  }
  if (season === 'summer') {
    return <FloatingFireflies dayPeriod={dayPeriod} shouldReduceMotion={shouldReduceMotion} />
  }
  if (season === 'autumn') {
    return <FallingLeaves shouldReduceMotion={shouldReduceMotion} />
  }
  if (season === 'winter') {
    return <FallingSnow shouldReduceMotion={shouldReduceMotion} />
  }
  return null
}

function FallingPetals({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  if (shouldReduceMotion) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`petal-${i}`}
          className="absolute w-2 h-3 rounded-full"
          style={{
            left: `${(i * 13) % 100}%`,
            top: '-5%',
            backgroundColor: i % 3 === 0 ? 'oklch(0.90 0.12 340)' : i % 3 === 1 ? 'oklch(0.92 0.10 350)' : 'oklch(0.88 0.14 330)',
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, (i % 2 === 0 ? 30 : -30), 0, (i % 2 === 0 ? -20 : 20)],
            rotate: [0, 360, 720],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 12 + (i % 4) * 3,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  )
}

function FloatingFireflies({ dayPeriod, shouldReduceMotion }: { dayPeriod: 'dawn' | 'day' | 'dusk' | 'night'; shouldReduceMotion: boolean }) {
  const isVisible = dayPeriod === 'dusk' || dayPeriod === 'night'
  if (!isVisible || shouldReduceMotion) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`firefly-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${(i * 18 + 10) % 90}%`,
            top: `${(i * 23 + 20) % 80}%`,
            backgroundColor: 'oklch(0.85 0.18 110)',
            boxShadow: '0 0 8px oklch(0.85 0.18 110)',
          }}
          animate={{
            x: [(i % 2 === 0 ? -50 : 50), (i % 2 === 0 ? 50 : -50)],
            y: [(i % 3 === 0 ? -30 : 30), (i % 3 === 0 ? 30 : -30)],
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 4 + (i % 3) * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  )
}

function FallingLeaves({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  if (shouldReduceMotion) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => {
        const leafColors = [
          'oklch(0.75 0.18 50)',
          'oklch(0.70 0.20 40)',
          'oklch(0.68 0.16 35)',
          'oklch(0.72 0.15 60)',
        ]
        
        return (
          <motion.div
            key={`leaf-${i}`}
            className="absolute"
            style={{
              left: `${(i * 7) % 100}%`,
              top: '-5%',
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, (i % 2 === 0 ? 50 : -50), (i % 2 === 0 ? -30 : 30), 0],
              rotate: [0, (i % 2 === 0 ? 360 : -360), (i % 2 === 0 ? 720 : -720)],
              opacity: [0, 1, 1, 0.6],
            }}
            transition={{
              duration: 10 + (i % 5) * 2,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.5,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2 Q 12 4 12 8 Q 12 12 8 14 Q 4 12 4 8 Q 4 4 8 2"
                fill={leafColors[i % leafColors.length]}
              />
            </svg>
          </motion.div>
        )
      })}
    </div>
  )
}

function FallingSnow({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  if (shouldReduceMotion) return null
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`snow-${i}`}
          className="absolute w-1.5 h-1.5 bg-white rounded-full"
          style={{
            left: `${(i * 5) % 100}%`,
            top: '-5%',
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, (i % 2 === 0 ? 20 : -20), 0],
            opacity: [0, 1, 1, 0.5],
          }}
          transition={{
            duration: 8 + (i % 4) * 2,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  )
}
