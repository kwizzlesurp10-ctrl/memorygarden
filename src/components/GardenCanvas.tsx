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

  useEffect(() => {
    if (propSeason) setSeason(propSeason)
  }, [propSeason])

  useEffect(() => {
    if (!playing) return
    const tick = setInterval(() => setTod(realClockTod()), 70)
    return () => clearInterval(tick)
  }, [playing])

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
    <div className="relative w-full h-full overflow-hidden bg-[#0d0913]">
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
        />
      )}
    </div>
  )
}