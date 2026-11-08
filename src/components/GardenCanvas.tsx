import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import type { GardenLandscapeView, GardenStarterDecor, Memory, Season, StorageShedData, ShedSeed, PlantedHybrid } from '@/lib/types'
import { resolveGardenLandscapeView } from '@/lib/garden/landscape-view'
import { projectMemoryToSceneWorld } from '@/lib/garden/landscape-world'
import { GardenViewPicker } from '@/components/garden/GardenViewPicker'
import { WeatherEffects } from './WeatherEffects'
import { GardenClusterPaths } from './GardenClusterPaths'
import { getPlantSize } from '@/lib/garden-helpers'
import { plantStageToIndex } from '@/lib/garden/stage'
import { todPalette, realClockTod } from '@/lib/garden/day-night'
import {
  computeLoupeLayout,
  LENS_SIZE,
  LENS_ZOOM_DEFAULT,
  stepLensZoom,
  type Point,
  type Size,
} from '@/lib/garden/lens'
import { GardenSceneSvg, SCENE_W, SCENE_H } from '@/components/garden/GardenSceneSvg'
import { GardenTodControls } from '@/components/garden/GardenTodControls'
import { GardenLensDetail } from '@/components/garden/GardenLensDetail'
import { StorageShedPanel } from '@/components/garden/StorageShedPanel'
import { GardenLayoutToolDock } from '@/components/garden/GardenLayoutToolDock'
import { GrowthCeremony } from '@/components/garden/GrowthCeremony'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { HybridPlantSvg } from '@/components/plants/hybrid-builder'
import type { SeededVariety } from '@/components/plants/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useParallaxCursor } from '@/hooks/useParallaxCursor'
import { getPlantOfWeek, hasWeeklySeedForWeek } from '@/lib/garden/plant-of-week'
import { loadShed, saveShed } from '@/lib/garden/shed-storage'
import { getLocalUser } from '@/lib/local-user'
import { toast } from 'sonner'

const RIM_STRENGTH = 0.6
const GARDEN_SEED = 7

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
  onEnterWalk?: () => void
  landscapeView?: GardenLandscapeView
  onLandscapeViewChange?: (view: GardenLandscapeView) => void
  starterDecor?: GardenStarterDecor
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
  onEnterWalk,
  landscapeView,
  onLandscapeViewChange,
  starterDecor,
}: GardenCanvasProps) {
  const reducedMotion = useReducedMotion()
  const motion = !reducedMotion
  const userId = getLocalUser().id

  const [localSeason, setLocalSeason] = useState<Season>(propSeason ?? 'summer')
  const season = propSeason ?? localSeason
  const [tod, setTod] = useState(realClockTod)
  const [playing, setPlaying] = useState(true)
  const [lensOn, setLensOn] = useState(false)
  const [lensZoom, setLensZoom] = useState(LENS_ZOOM_DEFAULT)
  /** Cursor in CSS px relative to the unscaled scene wrap; null until first move/seed. */
  const [lensPos, setLensPos] = useState<Point | null>(null)
  /** Measured CSS size of the scene wrap (matches rendered SVG when wrap is tight). */
  const [sceneSize, setSceneSize] = useState<Size>({ w: SCENE_W, h: SCENE_H })
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
  const resolvedView = useMemo(() => resolveGardenLandscapeView(landscapeView), [landscapeView])

  // Parallax tilt fights the loupe (and confuses pointer→scene mapping) — off while lens is active.
  useParallaxCursor(
    { sky: skyRef, far: farRef, mid: midRef, foreground: fgRef, frame: frameRef },
    motion && !detailMemory && !lensOn,
  )

  const measureScene = useCallback((): Size => {
    const wrap = sceneWrapRef.current
    if (!wrap) return { w: SCENE_W, h: SCENE_H }
    const svg = wrap.querySelector('svg')
    const rect = (svg ?? wrap).getBoundingClientRect()
    return {
      w: Math.max(1, rect.width),
      h: Math.max(1, rect.height),
    }
  }, [])

  const seedLensAtCenter = useCallback(() => {
    const size = measureScene()
    setSceneSize(size)
    setLensPos({ x: size.w / 2, y: size.h / 2 })
  }, [measureScene])

  const toggleLens = useCallback(() => {
    setLensOn((on) => {
      const next = !on
      if (next) {
        // Defer measure until after paint so wrap has layout; seed center so we never
        // open with (0,0) which previously scaled the whole garden off-screen.
        queueMicrotask(() => seedLensAtCenter())
      } else {
        setLensPos(null)
      }
      return next
    })
  }, [seedLensAtCenter])

  useEffect(() => {
    if (!playing) return
    const tick = setInterval(() => setTod(realClockTod()), 70)
    return () => clearInterval(tick)
  }, [playing])

  const quotaWarnedRef = useRef(false)

  useEffect(() => {
    const result = saveShed(userId, shedData)
    if (!result.ok && result.error === 'quota') {
      if (!quotaWarnedRef.current) {
        quotaWarnedRef.current = true
        toast.error('Your storage shed is full — free some browser space or remove older seeds.')
      }
    } else if (result.ok) {
      quotaWarnedRef.current = false
    }
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

  const weekly = useMemo(() => getPlantOfWeek(), [])
  const weeklyAlreadySaved = useMemo(
    () => hasWeeklySeedForWeek(shedData.seeds, weekly.isoWeek),
    [shedData.seeds, weekly.isoWeek],
  )

  const handleDreamPlant = useCallback((genome: import('@/lib/types').HybridGenome, idea: string) => {
    const seed: ShedSeed = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      idea,
      note: '',
      when: Date.now(),
      g: genome,
      source: 'dream',
    }
    persistShed((d) => ({ ...d, seeds: [seed, ...d.seeds].slice(0, 60) }))
    handlePlantFromShed(seed)
  }, [handlePlantFromShed, persistShed])

  const handleAddWeeklyToShed = useCallback(
    (genome: import('@/lib/types').HybridGenome, idea: string, isoWeek: string): boolean => {
      if (hasWeeklySeedForWeek(shedData.seeds, isoWeek)) return false
      const potw = getPlantOfWeek()
      const seed: ShedSeed = {
        id: `weekly-${isoWeek}`,
        idea,
        note: '',
        when: Date.now(),
        g: genome,
        source: 'weekly',
        weeklyIsoWeek: isoWeek,
        lineage: {
          evolvedFromName: potw.evolvedFromName ?? undefined,
          parentWeek: potw.parentWeek ?? undefined,
        },
      }
      persistShed((d) => ({ ...d, seeds: [seed, ...d.seeds].filter((s) => s.weeklyIsoWeek !== isoWeek).slice(0, 60) }))
      toast.success('Plant of the Week tucked into your shed.')
      return true
    },
    [persistShed, shedData.seeds],
  )

  const memoryPlants = useMemo(() => (
    [...memories]
      .map((memory) => {
      const pos = projectMemoryToSceneWorld(memory.position, resolvedView)
      const isDimmed = highlightedMemoryIds !== null && !highlightedMemoryIds.has(memory.id)
      const isGrowing = growingMemories.has(memory.id)
      const size = getPlantSize(memory.plantStage) as number
      const baseSc = Math.max(0.55, Math.min(1.4, size / 90))
      const sc = baseSc * pos.scale

      return {
        depth: pos.depth,
        node: (
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
                  facing={pos.facing}
                  rimFromLeft={pos.rimFromLeft}
                />
              )}
            </g>
          </GrowthCeremony>
        </g>
      ),
      }
    })
      .sort((a, b) => a.depth - b.depth)
      .map((item) => item.node)
  ), [memories, highlightedMemoryIds, growingMemories, lensOn, palette, motion, resolvedView, draggingMemory, onMemoryClick])

  const onLensMove = useCallback((e: React.PointerEvent) => {
    if (!lensOn || !sceneWrapRef.current) return
    // Measure against the unscaled wrap — never against a scaled parent (that caused
    // runaway origins like 180000px when the whole garden was wrongly scaled).
    const rect = sceneWrapRef.current.getBoundingClientRect()
    const size = measureScene()
    setSceneSize(size)
    setLensPos({
      x: Math.min(size.w, Math.max(0, e.clientX - rect.left)),
      y: Math.min(size.h, Math.max(0, e.clientY - rect.top)),
    })
  }, [lensOn, measureScene])

  const loupe = useMemo(() => {
    if (!lensOn || !lensPos) return null
    return computeLoupeLayout(lensPos, lensZoom, sceneSize, LENS_SIZE)
  }, [lensOn, lensPos, lensZoom, sceneSize])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0d0913]">
      {mood && <WeatherEffects mood={mood} season={season} />}

      {onLandscapeViewChange ? (
        <GardenViewPicker
          className="absolute z-40 left-3 top-3 max-w-[min(100%,420px)]"
          value={landscapeView}
          onChange={onLandscapeViewChange}
        />
      ) : null}

      <GardenLayoutToolDock
        palette={palette}
        rimStrength={RIM_STRENGTH}
        motion={motion}
        candles={shedData.candles}
        onPlant={handleDreamPlant}
        onAddWeeklyToShed={handleAddWeeklyToShed}
        weeklyAlreadySaved={weeklyAlreadySaved}
        onLightCandle={(c) => persistShed((d) => ({
          ...d,
          candles: [...d.candles, { ...c, id: `${Date.now()}-${Math.random()}` }].slice(0, 40),
        }))}
        onExtinguishCandle={(id) => persistShed((d) => ({ ...d, candles: d.candles.filter((c) => c.id !== id) }))}
      />

      {onEnterWalk && (
        <button
          type="button"
          aria-label="Walk through the garden"
          onClick={onEnterWalk}
          className="absolute z-40 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-[#f0e7da]/30 bg-black/40 text-[#f0e7da] backdrop-blur-sm hover:bg-black/55"
          style={{ top: 12, right: 74 }}
          data-testid="enter-walk-button"
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <circle cx="12" cy="4.2" r="1.6" />
            <path d="M9.5 21 L11 13 L8.5 11 L10 8 L14.5 10.5 L17 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 13 L14 21" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <button
        type="button"
        aria-label={lensOn ? 'Disable magnifying lens' : 'Enable magnifying lens'}
        aria-pressed={lensOn}
        onClick={toggleLens}
        className="absolute z-40 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-[#f0e7da]/30 bg-black/40 text-[#f0e7da] backdrop-blur-sm hover:bg-black/55"
        style={{ top: 12, right: 12 }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx={10} cy={10} r={6.5} />
          <path d="M15 15 L21 21" strokeLinecap="round" />
        </svg>
      </button>

      {lensOn && (
        <div
          className="absolute top-16 right-3 z-40 flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs text-[#f0e7da]"
          role="group"
          aria-label="Lens zoom"
        >
          <button
            type="button"
            aria-label="Decrease lens zoom"
            onClick={() => setLensZoom((z) => stepLensZoom(z, -1))}
          >
            −
          </button>
          <span className="font-mono min-w-[36px] text-center" data-testid="lens-zoom-label">
            {lensZoom.toFixed(1)}×
          </span>
          <button
            type="button"
            aria-label="Increase lens zoom"
            onClick={() => setLensZoom((z) => stepLensZoom(z, 1))}
          >
            +
          </button>
        </div>
      )}

      <div
        ref={frameRef}
        className="relative w-full h-full flex items-center justify-center"
        // Perspective only when parallax is active — avoid 3D tilt while loupe tracking.
        style={{ perspective: motion && !lensOn ? '1100px' : undefined }}
        onPointerMove={onLensMove}
      >
        {/*
          CRITICAL: scene wrap must stay at scale(1). Scaling the whole garden was the
          production bug that flung content off-screen and broke pointer→origin math.
        */}
        <div
          ref={sceneWrapRef}
          className="relative max-w-full max-h-full"
          data-testid="garden-scene-wrap"
          data-lens-on={lensOn ? 'true' : 'false'}
        >
          <GardenSceneSvg
            palette={palette}
            sceneKey="d"
            gardenSeed={GARDEN_SEED}
            rimStrength={RIM_STRENGTH}
            motion={motion}
            landscapeView={resolvedView}
            shedStyle={shedData.shedStyle}
            onShedClick={() => setShedOpen(true)}
            planted={shedData.planted}
            candles={shedData.candles}
            memoryPlants={memoryPlants}
            starterDecor={starterDecor}
            layerRefs={{ sky: skyRef, far: farRef, mid: midRef, foreground: fgRef }}
          />

          {loupe && (
            <div
              data-testid="garden-loupe"
              className="pointer-events-none absolute z-20 rounded-full border-2 border-[#f0e7da]/45 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-black/30"
              style={{
                width: loupe.outer.width,
                height: loupe.outer.height,
                left: loupe.outer.left,
                top: loupe.outer.top,
              }}
            >
              <div
                data-testid="garden-loupe-inner"
                className="absolute top-0 left-0"
                style={{
                  width: loupe.innerWidth,
                  height: loupe.innerHeight,
                  transform: loupe.innerTransform,
                  transformOrigin: loupe.transformOrigin,
                }}
              >
                <GardenSceneSvg
                  palette={palette}
                  sceneKey="lens"
                  gardenSeed={GARDEN_SEED}
                  rimStrength={RIM_STRENGTH}
                  motion={false}
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
        onSeasonChange={setLocalSeason}
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
