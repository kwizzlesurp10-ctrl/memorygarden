import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { ArtStyle, GardenGiftType, GardenStreak, Memory, Season } from '@/lib/types'
import { todPalette, realClockTod } from '@/lib/garden/day-night'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { PlayerState, WorldPlant } from '@/lib/open-world/types'
import { layoutGardenWorld } from '@/lib/open-world/layout'
import { createPlayer } from '@/lib/open-world/locomotion'
import {
  canQuickWater,
  computeCurrentMoisture,
  getHealthStatus,
  waterPlant,
  type WateringResult,
} from '@/lib/tending-logic'
import {
  canHarvestMorningDew,
  evaluateStreakTransition,
  isNearPond,
  loadDewCurrency,
  loadGardenStreak,
  loadLastDewHarvestDate,
  recordTendingAction,
  saveDewCurrency,
  saveGardenStreak,
  saveLastDewHarvestDate,
} from '@/lib/gentle-streaks'
import { toLocalISODate } from '@/lib/date-utils'
import {
  playDewHarvestSfx,
  playGiftChimeSfx,
  playHealingSeedSfx,
} from '@/lib/water-sound'
import { getLocalUser } from '@/lib/local-user'
import { recordReciprocalWatering, syncRemoteWatering } from '@/lib/social-tending'
import {
  GIFT_METADATA,
  incrementCommunityWaterings,
  openGardenGift,
  placeGardenGift,
} from '@/lib/garden-gifts'
import {
  isWalkCaptureSession,
  registerWalkCaptureBridge,
} from '@/lib/open-world/walk-capture-bridge'
import { CC0_MODEL_BY_ID, type Cc0ModelId } from '@/lib/open-world/cc0-catalog'
import { CC0_WALK_CAPTURE_POSE, cc0ShowcaseCapturePose } from '@/lib/open-world/cc0-placement'
import { STAGE_ROW_CAMERA_POSE } from '@/lib/open-world/stage-capture-layout'
import { OpenWorldEngine } from './engine'
import { OpenWorldHud } from './OpenWorldHud'

export interface OpenWorldGardenProps {
  memories: Memory[]
  season: Season
  highlightedMemoryIds?: Set<string> | null
  growingMemories?: Set<string>
  paused?: boolean
  onMemoryClick: (memory: Memory) => void
  onWaterMemory?: (memoryId: string, result: WateringResult) => void
  onExit: () => void
  plantArtStyle?: ArtStyle
}

export function OpenWorldGarden({
  memories,
  season,
  highlightedMemoryIds = null,
  growingMemories = new Set(),
  paused = false,
  onMemoryClick,
  onWaterMemory,
  onExit,
  plantArtStyle,
}: OpenWorldGardenProps) {
  const reducedMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<OpenWorldEngine | null>(null)
  const lookPointer = useRef<number | null>(null)
  const lastLook = useRef({ x: 0, y: 0 })
  const memoriesRef = useRef(memories)
  const onWaterMemoryRef = useRef(onWaterMemory)

  const [world, setWorld] = useState(() => layoutGardenWorld(memories, season))
  const [player, setPlayer] = useState(() => createPlayer(world))
  const [nearby, setNearby] = useState<WorldPlant | null>(null)
  const [locked, setLocked] = useState(false)
  const [failed, setFailed] = useState(false)
  const [coarse, setCoarse] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  )
  const captureMode = isWalkCaptureSession()

  // Gentle Streaks & Dew Currency
  const [streak, setStreak] = useState<GardenStreak>(() => loadGardenStreak())
  const bootStreakEvaluated = useRef(false)
  const [dew, setDew] = useState<number>(() => loadDewCurrency())
  const [lastDewHarvestDate, setLastDewHarvestDate] = useState<string>(() => loadLastDewHarvestDate())

  useEffect(() => {
    if (bootStreakEvaluated.current) return
    bootStreakEvaluated.current = true
    const res = evaluateStreakTransition(streak)
    if (res.shieldConsumed) {
      toast.info('A Dewdrop of Grace protected your unbroken streak while you were away!')
    }
    if (res.isNewDay) {
      queueMicrotask(() => {
        setStreak(res.streak)
        saveGardenStreak(res.streak)
      })
    }
  }, [streak])

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

  const onWaterPlant = useCallback((plant: WorldPlant) => {
    if (!engineRef.current) return
    const mem = memoriesRef.current.find((m) => m.id === plant.id)
    if (!mem) return

    const initM = mem.growthMetrics?.vitality ?? 80.0
    const lastW = mem.growthMetrics?.lastInteractionAt
    const curM = computeCurrentMoisture(initM, lastW, mem.plantVariety, season)

    if (!canQuickWater(curM)) return

    const result = waterPlant(curM, 'quick')
    if (result.success) {
      if (plant.isSleepingSeed) {
        playHealingSeedSfx()
      }
      engineRef.current.waterPlantAnimation(plant)
      onWaterMemoryRef.current?.(mem.id, result)
      incrementCommunityWaterings(1, memoriesRef.current)

      // Advance daily gentle streak & award +2 Dew Currency
      setStreak((prev) => {
        const streakRes = recordTendingAction(prev)
        saveGardenStreak(streakRes.streak)
        return streakRes.streak
      })
      setDew((prev) => {
        const nextDew = prev + 2
        saveDewCurrency(nextDew)
        return nextDew
      })

      // Reciprocal Social Tending: if watering another gardener's planted memory
      const localUser = getLocalUser()
      const isOtherPlanter = Boolean(mem.plantedBy && mem.plantedBy.id !== localUser.id)
      if (isOtherPlanter) {
        const recip = recordReciprocalWatering(mem, localUser)
        void syncRemoteWatering(mem.id, localUser)
        toast.success(recip.notificationMessage, {
          description: `Garden Bond with ${mem.plantedBy?.login ?? 'host'} strengthened (Level ${recip.bond.bondLevel})!`,
        })
      }
    }
  }, [season])

  const onWaterPlantRef = useRef(onWaterPlant)
  useEffect(() => {
    onWaterPlantRef.current = onWaterPlant
    onWaterMemoryRef.current = onWaterMemory
  }, [onWaterPlant, onWaterMemory])

  const handleHarvestDew = useCallback(() => {
    playDewHarvestSfx()
    const todayStr = toLocalISODate(new Date())
    setLastDewHarvestDate(todayStr)
    saveLastDewHarvestDate(todayStr)

    setDew((prev) => {
      const nextDew = prev + 3
      saveDewCurrency(nextDew)
      return nextDew
    })

    setStreak((prev) => {
      const streakRes = recordTendingAction(prev)
      saveGardenStreak(streakRes.streak)
      return streakRes.streak
    })

    toast.success('Morning Dew collected! +3 Dew Currency gathered.')
  }, [])

  const handleHarvestDewRef = useRef(handleHarvestDew)
  useEffect(() => {
    handleHarvestDewRef.current = handleHarvestDew
  }, [handleHarvestDew])

  useEffect(() => {
    memoriesRef.current = memories
  }, [memories])

  const lastDewHarvestDateRef = useRef(lastDewHarvestDate)
  useEffect(() => {
    lastDewHarvestDateRef.current = lastDewHarvestDate
  }, [lastDewHarvestDate])

  const playerRef = useRef(player)
  useEffect(() => {
    playerRef.current = player
  }, [player])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const palette = todPalette(realClockTod(), season)
    const engine = new OpenWorldEngine(canvas, memories, palette, {
      reducedMotion,
      coarsePointer: coarse,
      plantArtStyle,
      hooks: {
        onProximity,
        onPlayer,
        onInteract: onInteractPlant,
        onWater: (plant) => onWaterPlantRef.current(plant),
        onPondInteract: () => {
          const p = playerRef.current
          if (isNearPond(p.x, p.z) && canHarvestMorningDew(lastDewHarvestDateRef.current)) {
            handleHarvestDewRef.current()
          }
        },
      },
    })
    engineRef.current = engine
    setFailed(engine.failed)
    setWorld(engine.getWorld())
    if (captureMode) {
      registerWalkCaptureBridge({
        setPose: (pose) => engine.setPlayerPose(pose.x, pose.z, pose.yaw, pose.pitch),
        setPalette: (palette) => engine.setPalette(palette),
        setPlantArtStyle: (style) => engine.setPlantArtStyle(style),
        showcaseModel: (id: Cc0ModelId | null) => engine.setCc0Showcase(id),
        showcasePoseFor: (id: Cc0ModelId) =>
          cc0ShowcaseCapturePose(CC0_MODEL_BY_ID[id].targetHeight),
        ready: () => engine.failed === false,
        worldPlants: () =>
          engine.getWorld().plants.map((p) => ({
            id: p.id,
            x: p.x,
            z: p.z,
            variety: p.variety,
            stage: p.stage,
            height: p.height,
          })),
        voxelMeshCount: () => engine.countVoxelMeshes(),
        voxelPlantGroupCount: () => engine.countVoxelPlantGroups(),
        plantCount: () => engine.getWorld().plants.length,
        plantCapturePose: (plantId, distance) => engine.capturePoseForPlant(plantId, distance),
      })
      if (sessionStorage.getItem('mg:stage-row-capture') !== '1') {
        engine.setPlayerPose(
          CC0_WALK_CAPTURE_POSE.x,
          CC0_WALK_CAPTURE_POSE.z,
          CC0_WALK_CAPTURE_POSE.yaw,
          0.2,
        )
      } else {
        engine.setPlayerPose(
          STAGE_ROW_CAMERA_POSE.x,
          STAGE_ROW_CAMERA_POSE.z,
          STAGE_ROW_CAMERA_POSE.yaw,
          STAGE_ROW_CAMERA_POSE.pitch,
        )
      }
    }
    return () => {
      registerWalkCaptureBridge(null)
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
    engineRef.current?.setPlantArtStyle(plantArtStyle ?? 'watercolor')
  }, [plantArtStyle])

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
    if (!nearby || nearby.isSleepingSeed) return
    onInteractPlant(nearby)
  }, [nearby, onInteractPlant])

  const handleLeaveGift = useCallback(
    (giftType: GardenGiftType) => {
      if (!nearby) return
      const mem = memoriesRef.current.find((m) => m.id === nearby.id)
      if (!mem) return
      const localUser = getLocalUser()
      const { gift } = placeGardenGift(mem, localUser, giftType)
      playGiftChimeSfx()
      engineRef.current?.setMemories(memoriesRef.current)
      const w = engineRef.current?.getWorld()
      if (w) {
        setWorld(w)
        const updatedNearby = w.plants.find((p) => p.id === nearby.id) ?? null
        setNearby(updatedNearby)
      }
      toast.success(
        `${GIFT_METADATA[gift.giftType].icon} Left a ${GIFT_METADATA[gift.giftType].label} beside this plant!`,
      )
    },
    [nearby],
  )

  const handleOpenGift = useCallback(
    (giftId: string) => {
      if (!nearby) return
      const mem = memoriesRef.current.find((m) => m.id === nearby.id)
      if (!mem) return
      const { gift, vitalityAdded } = openGardenGift(mem, giftId)
      if (!gift) return
      playGiftChimeSfx()
      if (vitalityAdded > 0) {
        const initM = mem.growthMetrics?.vitality ?? 80
        const waterRes = waterPlant(initM, 'quick')
        onWaterMemoryRef.current?.(mem.id, waterRes)
      }
      engineRef.current?.setMemories(memoriesRef.current)
      const w = engineRef.current?.getWorld()
      if (w) {
        setWorld(w)
        const updatedNearby = w.plants.find((p) => p.id === nearby.id) ?? null
        setNearby(updatedNearby)
      }
      toast.success(
        `${GIFT_METADATA[gift.giftType].icon} Opened ${GIFT_METADATA[gift.giftType].label} from ${gift.senderLogin}`,
        {
          description:
            vitalityAdded > 0
              ? `${gift.message} (+${vitalityAdded}% Pure Dew vitality boost!)`
              : gift.message,
        },
      )
    },
    [nearby],
  )

  const targetMemory = nearby ? memories.find((m) => m.id === nearby.id) : null
  const initialMoisture = targetMemory?.growthMetrics?.vitality ?? 80.0
  const lastWateredAt = targetMemory?.growthMetrics?.lastInteractionAt
  const currentMoisture = targetMemory
    ? computeCurrentMoisture(initialMoisture, lastWateredAt, targetMemory.plantVariety, season)
    : 100.0
  const canWater = targetMemory ? canQuickWater(currentMoisture) : false
  const healthStatus = targetMemory ? getHealthStatus(currentMoisture) : undefined

  const canHarvestDew = isNearPond(player.x, player.z) && canHarvestMorningDew(lastDewHarvestDate)

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
        onWater={() => nearby && onWaterPlant(nearby)}
        canWater={canWater}
        moistureLevel={targetMemory ? currentMoisture : undefined}
        healthStatus={healthStatus}
        onStick={(stick) => engineRef.current?.setStick(stick)}
        streak={streak}
        dewCurrency={dew}
        canHarvestDew={canHarvestDew}
        onHarvestDew={handleHarvestDew}
        bondPartnerName={world.bondPartnerName}
        onLeaveGift={handleLeaveGift}
        onOpenGift={handleOpenGift}
        captureMode={captureMode}
      />
    </div>
  )
}
