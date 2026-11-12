import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import type {
  ArtStyle,
  GardenLandscapeView,
  GardenStarterDecor,
  Memory,
  Season,
  StorageShedData,
  ShedSeed,
  PlantedHybrid,
} from '@/lib/types'
import { DEFAULT_PLANT_ART_STYLE } from '@/lib/garden/plant-art-style'
import { resolveGardenLandscapeView } from '@/lib/garden/landscape-view'
import { layoutMemoryPlantsForView } from '@/lib/garden/memory-scene-layout'
import { frameMemoryPlantsForMobile } from '@/lib/garden/garden-mobile-framing'
import { GardenViewPicker } from '@/components/garden/GardenViewPicker'
import { WeatherEffects } from './WeatherEffects'
import { GardenClusterPaths } from './GardenClusterPaths'
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
import { GardenPlantAccessibilityLayer } from '@/components/garden/GardenPlantAccessibilityLayer'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useParallaxCursor } from '@/hooks/useParallaxCursor'
import { getPlantOfWeek, hasWeeklySeedForWeek } from '@/lib/garden/plant-of-week'
import { loadShed, saveShed } from '@/lib/garden/shed-storage'
import { getLocalUser } from '@/lib/local-user'
import { toast } from 'sonner'
import { GardenSceneMemoryPlant } from '@/components/garden/GardenSceneMemoryPlant'

const RIM_STRENGTH = 0.66
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
  /** True when filters/search are active but no memories match (garden view only). */
  searchHasNoMatches?: boolean
  onClearSearch?: () => void
  plantArtStyle?: ArtStyle
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
  searchHasNoMatches = false,
  onClearSearch,
  plantArtStyle = DEFAULT_PLANT_ART_STYLE,
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
  const [dockPanelOpen, setDockPanelOpen] = useState(false)
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

  useEffect(() => {
    const svg = sceneWrapRef.current?.querySelector('svg')
    if (!(svg instanceof SVGSVGElement)) return
    if (reducedMotion) {
      svg.pauseAnimations()
    } else {
      svg.unpauseAnimations()
    }
  }, [reducedMotion, memories.length, landscapeView, season, tod])

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

  useEffect(() => {
    const wrap = sceneWrapRef.current
    if (!wrap) return
    const sync = () => setSceneSize(measureScene())
    sync()
    const ro = new ResizeObserver(() => sync())
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [measureScene, landscapeView, memories.length])

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

  const memorySceneLayout = useMemo(
    () => layoutMemoryPlantsForView(memories, resolvedView),
    [memories, resolvedView],
  )

  const mobileFraming = useMemo(
    () => frameMemoryPlantsForMobile(memorySceneLayout, memories, sceneSize),
    [memorySceneLayout, memories, sceneSize],
  )

  const activeLayout = mobileFraming?.layout ?? memorySceneLayout

  const focusGardenPlant = useCallback((memoryId: string) => {
    const root = sceneWrapRef.current
    if (!root) return
    const el = root.querySelector<SVGGElement>(`[data-memory-id="${CSS.escape(memoryId)}"]`)
    el?.focus()
  }, [])

  const memoryPlants = useMemo(() => (
    [...memories]
      .map((memory) => {
      const pos = activeLayout.get(memory.id)
      if (!pos) return null
      const isDimmed = highlightedMemoryIds !== null && !highlightedMemoryIds.has(memory.id)
      const isGrowing = growingMemories.has(memory.id)

      return {
        depth: pos.depth,
        node: (
          <GardenSceneMemoryPlant
            key={memory.id}
            memory={memory}
            pos={pos}
            isDimmed={isDimmed}
            isGrowing={isGrowing}
            palette={palette}
            rimStrength={RIM_STRENGTH}
            motion={motion}
            lensOn={lensOn}
            draggingMemory={draggingMemory}
            activeLayout={activeLayout}
            memories={memories}
            highlightedMemoryIds={highlightedMemoryIds}
            onMemoryClick={onMemoryClick}
            onMemoryMove={onMemoryMove}
            onLensDetail={setDetailMemory}
            focusGardenPlant={focusGardenPlant}
            plantArtStyle={plantArtStyle}
          />
        ),
      }
    })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.depth - b.depth)
      .map((item) => item.node)
  ), [
    memories,
    activeLayout,
    highlightedMemoryIds,
    growingMemories,
    lensOn,
    palette,
    motion,
    draggingMemory,
    onMemoryClick,
    onMemoryMove,
    focusGardenPlant,
    plantArtStyle,
  ])

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
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-[#0d0913]">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {searchHasNoMatches
          ? 'No memories match your search or filters in the garden view.'
          : ''}
      </div>
      <p className="sr-only">
        Garden plants: Tab to focus a plant. Arrow keys move between plants. Control and arrow keys nudge the selected plant position. Enter or Space opens the memory.
      </p>
      {searchHasNoMatches ? (
        <div
          className="absolute left-1/2 top-20 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border border-[#f0e7da]/25 bg-[#120e18]/92 p-4 text-center text-[#f0e7da] shadow-xl backdrop-blur-md"
          data-testid="garden-search-no-match"
        >
          <p className="text-sm font-medium text-[#faf4ec]">No memories match your search</p>
          <p className="mt-1 text-xs text-[#f0e7da]/75">Try adjusting your filters or search terms.</p>
          {onClearSearch ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-3 inline-flex min-h-8 items-center justify-center rounded-md border border-[#f0e7da]/30 bg-[#f0e7da]/10 px-3 text-xs font-medium hover:bg-[#f0e7da]/18"
            >
              Clear search &amp; filters
            </button>
          ) : null}
        </div>
      ) : null}
      {mood && <WeatherEffects mood={mood} season={season} />}

      {onLandscapeViewChange ? (
        <GardenViewPicker
          className="absolute left-3 top-3 z-40 max-w-[min(100%,calc(100%-5.5rem))] sm:max-w-[min(100%,420px)]"
          value={landscapeView}
          onChange={onLandscapeViewChange}
        />
      ) : null}

      <GardenPlantAccessibilityLayer
        memories={memories}
        landscapeView={landscapeView}
        plantLayout={activeLayout}
        highlightedMemoryIds={highlightedMemoryIds}
        onMemoryClick={onMemoryClick}
      />

      <GardenLayoutToolDock
        palette={palette}
        rimStrength={RIM_STRENGTH}
        motion={motion}
        candles={shedData.candles}
        onPlant={handleDreamPlant}
        onAddWeeklyToShed={handleAddWeeklyToShed}
        weeklyAlreadySaved={weeklyAlreadySaved}
        onDockPanelOpenChange={setDockPanelOpen}
        onLightCandle={(c) => persistShed((d) => ({
          ...d,
          candles: [...d.candles, { ...c, id: `${Date.now()}-${Math.random()}` }].slice(0, 40),
        }))}
        onExtinguishCandle={(id) => persistShed((d) => ({ ...d, candles: d.candles.filter((c) => c.id !== id) }))}
      />

      {onEnterWalk && !dockPanelOpen && (
        <button
          type="button"
          aria-label="Walk through the garden"
          onClick={onEnterWalk}
          className="absolute z-40 hidden h-[54px] w-[54px] items-center justify-center rounded-full border border-[#f0e7da]/35 bg-black/55 text-[#f5efe6] backdrop-blur-sm hover:bg-black/65 sm:flex"
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

      {!dockPanelOpen ? (
        <button
          type="button"
          aria-label={lensOn ? 'Disable magnifying lens' : 'Enable magnifying lens'}
          aria-pressed={lensOn}
          onClick={toggleLens}
          className="absolute right-3 top-3 z-40 flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-full border border-[#f0e7da]/35 bg-black/55 text-[#f5efe6] backdrop-blur-sm hover:bg-black/65 sm:right-3 sm:top-3 sm:h-[54px] sm:w-[54px]"
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx={10} cy={10} r={6.5} />
            <path d="M15 15 L21 21" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}

      {lensOn && (
        <div
          className="absolute top-16 right-3 z-40 flex items-center gap-2 rounded-lg border border-[#f0e7da]/28 bg-[#0d0913]/88 px-2 py-1 text-xs text-[#faf4ec]"
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
        className="relative flex h-full min-h-0 w-full items-stretch justify-center"
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
          className="relative h-full min-h-0 w-full max-w-full"
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
            sceneViewBox={mobileFraming?.viewBox}
            shedStyle={shedData.shedStyle}
            onShedClick={() => setShedOpen(true)}
            planted={shedData.planted}
            candles={shedData.candles}
            memoryPlants={memoryPlants}
            starterDecor={starterDecor}
            layerRefs={{ sky: skyRef, far: farRef, mid: midRef, foreground: fgRef }}
            plantArtStyle={plantArtStyle}
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
                  plantArtStyle={plantArtStyle}
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
