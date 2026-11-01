import { useCallback, useEffect, useRef, useState } from 'react'
import type { Memory, Season } from '@/lib/types'
import { todPalette, realClockTod } from '@/lib/garden/day-night'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { PlayerState, WorldPlant } from '@/lib/open-world/types'
import { layoutGardenWorld } from '@/lib/open-world/layout'
import { createPlayer } from '@/lib/open-world/locomotion'
import { OpenWorldEngine } from './engine'
import { OpenWorldHud } from './OpenWorldHud'

export interface OpenWorldGardenProps {
  memories: Memory[]
  season: Season
  highlightedMemoryIds?: Set<string> | null
  growingMemories?: Set<string>
  paused?: boolean
  onMemoryClick: (memory: Memory) => void
  onExit: () => void
}

export function OpenWorldGarden({
  memories,
  season,
  highlightedMemoryIds = null,
  growingMemories = new Set(),
  paused = false,
  onMemoryClick,
  onExit,
}: OpenWorldGardenProps) {
  const reducedMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<OpenWorldEngine | null>(null)
  const lookPointer = useRef<number | null>(null)
  const lastLook = useRef({ x: 0, y: 0 })
  const memoriesRef = useRef(memories)

  const [world, setWorld] = useState(() => layoutGardenWorld(memories))
  const [player, setPlayer] = useState(() => createPlayer(world))
  const [nearby, setNearby] = useState<WorldPlant | null>(null)
  const [locked, setLocked] = useState(false)
  const [failed, setFailed] = useState(false)
  const [coarse, setCoarse] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  )

  const onProximity = useCallback((plant: WorldPlant | null) => {
    setNearby(plant)
  }, [])

  const onPlayer = useCallback((next: PlayerState, isLocked: boolean) => {
    setPlayer(next)
    setLocked(isLocked)
  }, [])

  const onInteractPlant = useCallback((plant: WorldPlant) => {
    const memory = memoriesRef.current.find((m) => m.id === plant.id)
    if (memory) onMemoryClick(memory)
  }, [onMemoryClick])

  useEffect(() => {
    memoriesRef.current = memories
  }, [memories])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const palette = todPalette(realClockTod(), season)
    const engine = new OpenWorldEngine(canvas, memories, palette, {
      reducedMotion,
      hooks: {
        onProximity,
        onPlayer,
        onInteract: onInteractPlant,
      },
    })
    engineRef.current = engine
    setFailed(engine.failed)
    setWorld(engine.getWorld())
    return () => {
      engine.dispose()
      engineRef.current = null
    }
    // Mount once; memories/palette stream in via setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    engineRef.current?.setMemories(memories)
    const w = engineRef.current?.getWorld()
    if (w) setWorld(w)
  }, [memories])

  useEffect(() => {
    engineRef.current?.setHighlighted(highlightedMemoryIds)
  }, [highlightedMemoryIds])

  useEffect(() => {
    engineRef.current?.setGrowing(growingMemories)
  }, [growingMemories])

  useEffect(() => {
    engineRef.current?.setPaused(paused)
  }, [paused])

  useEffect(() => {
    const id = window.setInterval(() => {
      engineRef.current?.setPalette(todPalette(realClockTod(), season))
    }, 4000)
    engineRef.current?.setPalette(todPalette(realClockTod(), season))
    return () => window.clearInterval(id)
  }, [season])

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const onChange = () => setCoarse(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const interactNearby = useCallback(() => {
    if (!nearby) return
    onInteractPlant(nearby)
  }, [nearby, onInteractPlant])

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#0d0913]"
      data-testid="open-world-garden"
      aria-label="Walkable garden"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        tabIndex={0}
        onClick={() => {
          if (!coarse) engineRef.current?.requestLock()
        }}
        onPointerDown={(e) => {
          if (!coarse) return
          if ((e.target as HTMLElement).closest('[data-testid="open-world-joystick"]')) return
          lookPointer.current = e.pointerId
          lastLook.current = { x: e.clientX, y: e.clientY }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (lookPointer.current !== e.pointerId) return
          const dx = e.clientX - lastLook.current.x
          const dy = e.clientY - lastLook.current.y
          lastLook.current = { x: e.clientX, y: e.clientY }
          engineRef.current?.addLook(dx, dy)
        }}
        onPointerUp={() => {
          lookPointer.current = null
        }}
      />
      <OpenWorldHud
        world={world}
        player={player}
        nearby={nearby}
        locked={locked}
        coarse={coarse}
        webglFailed={failed}
        onExit={onExit}
        onLock={() => engineRef.current?.requestLock()}
        onInteract={interactNearby}
        onStick={(stick) => engineRef.current?.setStick(stick)}
      />
    </div>
  )
}
