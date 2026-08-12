import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import type { Memory, Season, StorageShedData, ShedSeed, PlantedHybrid } from '@/lib/types'
import { WeatherEffects } from './WeatherEffects'
import { GardenClusterPaths } from './GardenClusterPaths'
import { getPlantSize } from '@/lib/garden-helpers'
import { plantStageToIndex } from '@/lib/garden/stage'
import { todPalette, realClockTod } from '@/lib/garden/day-night'
import { GardenSceneSvg, SCENE_W, SCENE_H } from '@/components/garden/GardenSceneSvg'
import { GardenTodControls } from '@/components/garden/GardenTodControls'
import { GardenLensDetail } from '@/components/garden/GardenLensDetail'
import { StorageShedPanel } from '@/components/garden/StorageShedPanel'
import { DreamPlantPanel } from '@/components/garden/DreamPlantPanel'
import { RemembranceCandlesPanel } from '@/components/garden/RemembranceCandlesPanel'
import { GrowthCeremony } from '@/components/garden/GrowthCeremony'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { HybridPlantSvg } from '@/components/plants/hybrid-builder'
import type { SeededVariety } from '@/components/plants/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useParallaxCursor } from '@/hooks/useParallaxCursor'
import { loadShed, saveShed } from '@/lib/garden/shed-storage'
import { getLocalUser } from '@/lib/local-user'
import { getDayPeriod, getSeason, getSeasonalSky, getPlantSize } from '@/lib/garden-helpers'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

const RIM_STRENGTH = 0.6
const GARDEN_SEED = 7
const LENS_ZOOM_MIN = 1.6
const LENS_ZOOM_MAX = 4
const LENS_ZOOM_DEFAULT = 2.4

interface GardenCanvasProps {
  memories: Memory[]
  onMemoryClick: (memory: Memory) => void
  onMemoryMove: (memoryId: string, newPosition: { x: number; y: number }) => void
  season?: Season
  growingMemories?: Set<string>
  memoryBoostTiers?: Map<string, 'standard' | 'premium' | 'legendary'>
  highlightedMemoryIds?: Set<string> | null
  mood?: import('@/lib/types').GardenMood | null
  onPlantHybrid?: (genome: import('@/lib/types').HybridGenome, idea: string, position: { x: number; y: number }) => void
}

function clampScenePosition(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(80, Math.min(SCENE_W - 80, x % SCENE_W)),
    y: Math.max(420, Math.min(468, y % SCENE_H)),
  }
}

export function GardenCanvas({
  memories,
  onMemoryClick,
  onMemoryMove,
  season: propSeason,
  growingMemories = new Set(),
  highlightedMemoryIds = null,
  mood = null,
  onPlantHybrid,
}: GardenCanvasProps) {
  const reducedMotion = useReducedMotion()
  const motion = !reducedMotion
  const userId = getLocalUser().id

  const [season, setSeason] = useState<Season>(propSeason ?? 'summer')
  const [tod, setTod] = useState(realClockTod)
  const [playing, setPlaying] = useState(true)
  const [lensOn, setLensOn] = useState(false)
  const [lensZoom, setLensZoom] = useState(LENS_ZOOM_DEFAULT)
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 })
  const [detailMemory, setDetailMemory] = useState<Memory | null>(null)
  const [shedOpen, setShedOpen] = useState(false)
  const [draggingMemory, setDraggingMemory] = useState<string | null>(null)
  const [shedData, setShedData] = useState<StorageShedData>(() => loadShed(userId))

  const skyRef = useRef<SVGGElement>(null)
  const farRef = useRef<SVGGElement>(null)
  const midRef = useRef<SVGGElement>(null)
  const fgRef = useRef<SVGGElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const sceneWrapRef = useRef<HTMLDivElement>(null)

  const palette = useMemo(() => todPalette(tod, season), [tod, season])

  useParallaxCursor(
    { sky: skyRef, far: farRef, mid: midRef, foreground: fgRef, frame: frameRef },
    motion && !detailMemory,
  )
  const [dayPeriod, setDayPeriod] = useState(getDayPeriod())
  const [season, setSeason] = useState<Season>(propSeason || getSeason())
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (propSeason) setSeason(propSeason)
  }, [propSeason])

  useEffect(() => {
    if (!playing) return
    const tick = setInterval(() => setTod(realClockTod()), 70)
    return () => clearInterval(tick)
  }, [playing])
    if (!propSeason) return
    queueMicrotask(() => {
      setSeason(propSeason)
    })
  }, [propSeason])

  useEffect(() => {
    saveShed(userId, shedData)
  }, [shedData, userId])

  const persistShed = useCallback((patch: Partial<StorageShedData> | ((d: StorageShedData) => StorageShedData)) => {
    setShedData((d) => (typeof patch === 'function' ? patch(d) : { ...d, ...patch }))
  }, [])

  const handlePlantFromShed = useCallback((seed: ShedSeed) => {
    const p: PlantedHybrid = {
      g: seed.g,
      seedId: seed.id,
      x: 240 + Math.random() * 880,
      y: 456 + Math.random() * 6,
      sc: 1 + Math.random() * 0.35,
    }
    persistShed((d) => ({ ...d, planted: [...d.planted, p] }))
    if (onPlantHybrid) {
      onPlantHybrid(seed.g, seed.idea, { x: p.x, y: p.y })
    }
  }, [onPlantHybrid, persistShed])

  const handleDreamPlant = useCallback((genome: import('@/lib/types').HybridGenome, idea: string) => {
    const seed: ShedSeed = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      idea,
      note: '',
      when: Date.now(),
      g: genome,
    }
    persistShed((d) => ({ ...d, seeds: [seed, ...d.seeds].slice(0, 60) }))
    handlePlantFromShed(seed)
  }, [handlePlantFromShed, persistShed])

  const memoryPlants = useMemo(() => (
    memories.map((memory) => {
      const pos = clampScenePosition(memory.position.x, memory.position.y)
      const isDimmed = highlightedMemoryIds !== null && !highlightedMemoryIds.has(memory.id)
      const isGrowing = growingMemories.has(memory.id)
      const size = getPlantSize(memory.plantStage) as number
      const sc = Math.max(0.55, Math.min(1.4, size / 90))
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

      return (
        <g
          key={memory.id}
          transform={`translate(${pos.x} ${pos.y})`}
          opacity={isDimmed ? 0.15 : 1}
          style={{ pointerEvents: isDimmed ? 'none' : 'auto', cursor: lensOn ? 'pointer' : 'grab' }}
          onClick={(e) => {
            e.stopPropagation()
            if (lensOn) {
              setDetailMemory(memory)
            } else if (!draggingMemory) {
              onMemoryClick(memory)
            }
          }}
        >
          <GrowthCeremony active={isGrowing} glow={palette.glow} rim={palette.rim}>
            <g transform={`scale(${sc})`}>
              {memory.isHybrid && memory.hybridGenome ? (
                <HybridPlantSvg
                  genome={memory.hybridGenome}
                  palette={palette}
                  rimStrength={RIM_STRENGTH}
                  motion={motion}
                  stage={plantStageToIndex(memory.plantStage)}
                  x={0}
                  y={0}
                  scale={1}
                />
              ) : (
                <SeededPlantSvg
                  variety={memory.plantVariety as SeededVariety}
                  stage={memory.plantStage}
                  geneticsSeed={memory.geneticsSeed || memory.id}
                  palette={palette}
                  rimStrength={RIM_STRENGTH}
                  motion={motion}
                />
              )}
            </g>
          </GrowthCeremony>
        </g>
      )
    })
  ), [memories, highlightedMemoryIds, growingMemories, lensOn, palette, motion])

  const onLensMove = useCallback((e: React.PointerEvent) => {
    if (!lensOn || !sceneWrapRef.current) return
    const rect = sceneWrapRef.current.getBoundingClientRect()
    setLensPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [lensOn])

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

      <div className="absolute bottom-20 left-3 z-30 flex flex-col gap-2 max-w-md w-[min(100%,420px)] pointer-events-none">
        <div className="pointer-events-auto">
          <DreamPlantPanel palette={palette} rimStrength={RIM_STRENGTH} motion={motion} onPlant={handleDreamPlant} />
        </div>
        <div className="pointer-events-auto">
          <RemembranceCandlesPanel
            candles={shedData.candles}
            onLight={(c) => persistShed((d) => ({
              ...d,
              candles: [...d.candles, { ...c, id: `${Date.now()}-${Math.random()}` }].slice(0, 40),
            }))}
            onExtinguish={(id) => persistShed((d) => ({ ...d, candles: d.candles.filter((c) => c.id !== id) }))}
          />
        </div>
      </div>

      <button
        type="button"
        aria-label={lensOn ? 'Disable magnifying lens' : 'Enable magnifying lens'}
        onClick={() => setLensOn((v) => !v)}
        className="absolute z-40 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-[#f0e7da]/30 bg-black/40 text-[#f0e7da] backdrop-blur-sm hover:bg-black/55"
        style={{ top: 12, right: 12 }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx={10} cy={10} r={6.5} />
          <path d="M15 15 L21 21" strokeLinecap="round" />
        </svg>
      </button>

      {lensOn && (
        <div className="absolute top-16 right-3 z-40 flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-[#f0e7da]">
          <button type="button" onClick={() => setLensZoom((z) => Math.max(LENS_ZOOM_MIN, z - 0.2))}>−</button>
          <span className="font-mono min-w-[36px] text-center">{lensZoom.toFixed(1)}×</span>
          <button type="button" onClick={() => setLensZoom((z) => Math.min(LENS_ZOOM_MAX, z + 0.2))}>+</button>
        </div>
      )}

      <div
        ref={frameRef}
        className="relative w-full h-full flex items-center justify-center"
        style={{ perspective: motion ? '1100px' : undefined }}
        onPointerMove={onLensMove}
      >
        <div
          ref={sceneWrapRef}
          className="relative max-w-full max-h-full"
          style={{
            transform: lensOn ? `scale(${lensZoom})` : undefined,
            transformOrigin: lensOn ? `${lensPos.x}px ${lensPos.y}px` : undefined,
            transition: lensOn ? 'transform 0.15s ease-out' : undefined,
          }}
        >
          <GardenSceneSvg
            palette={palette}
            sceneKey="d"
            gardenSeed={GARDEN_SEED}
            rimStrength={RIM_STRENGTH}
            motion={motion}
            shedStyle={shedData.shedStyle}
            onShedClick={() => setShedOpen(true)}
            planted={shedData.planted}
            candles={shedData.candles}
            memoryPlants={memoryPlants}
            layerRefs={{ sky: skyRef, far: farRef, mid: midRef, foreground: fgRef }}
          />

          {lensOn && (
            <div
              className="pointer-events-none absolute rounded-full border-2 border-[#f0e7da]/35 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
              style={{
                width: 260,
                height: 260,
                left: lensPos.x - 130,
                top: lensPos.y - 130,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${lensZoom})`,
                  transformOrigin: `${lensPos.x}px ${lensPos.y}px`,
                }}
              >
                <GardenSceneSvg
                  palette={palette}
                  sceneKey="lens"
                  gardenSeed={GARDEN_SEED}
                  rimStrength={RIM_STRENGTH}
                  motion={motion}
                  shedStyle={shedData.shedStyle}
                  planted={shedData.planted}
                  candles={shedData.candles}
                  memoryPlants={memoryPlants}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <GardenClusterPaths
        memories={memories}
        highlightedMemoryIds={highlightedMemoryIds}
        canvasWidth={SCENE_W}
        canvasHeight={SCENE_H}
      />

      <GardenTodControls
        tod={tod}
        playing={playing}
        season={season}
        onTodChange={(t) => { setTod(t); setPlaying(false) }}
        onPlayToggle={() => setPlaying((p) => !p)}
        onSeasonChange={setSeason}
      />

      <StorageShedPanel
        open={shedOpen}
        onClose={() => setShedOpen(false)}
        seeds={shedData.seeds}
        planted={shedData.planted}
        palette={palette}
        rimStrength={RIM_STRENGTH}
        onNoteChange={(id, note) => persistShed((d) => ({
          ...d,
          seeds: d.seeds.map((s) => (s.id === id ? { ...s, note } : s)),
        }))}
        onPlant={handlePlantFromShed}
        onDiscard={(id) => persistShed((d) => ({ ...d, seeds: d.seeds.filter((s) => s.id !== id) }))}
        onClearGarden={() => persistShed((d) => ({ ...d, planted: [] }))}
      />

      {detailMemory && (
        <GardenLensDetail
          memory={detailMemory}
          palette={palette}
          rimStrength={RIM_STRENGTH}
          motion={motion}
          onClose={() => setDetailMemory(null)}
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
      )}
    </div>
  )
}