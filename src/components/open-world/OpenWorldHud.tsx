import { ArrowLeft, PersonSimpleWalk } from '@phosphor-icons/react'
import type { PlayerState, WorldPlant, GardenWorld } from '@/lib/open-world/types'
import type { PlantHealthStatus } from '@/lib/tending-logic'
import { OpenWorldMinimap } from './OpenWorldMinimap'
import { VirtualJoystick } from './VirtualJoystick'

interface OpenWorldHudProps {
  world: GardenWorld
  player: PlayerState
  nearby: WorldPlant | null
  locked: boolean
  coarse: boolean
  webglFailed: boolean
  onExit: () => void
  onLock: () => void
  onInteract: () => void
  onWater?: () => void
  canWater?: boolean
  moistureLevel?: number
  healthStatus?: PlantHealthStatus
  onStick: (stick: { x: number; y: number } | null) => void
}

export function OpenWorldHud({
  world,
  player,
  nearby,
  locked,
  coarse,
  webglFailed,
  onExit,
  onLock,
  onInteract,
  onWater,
  canWater = true,
  moistureLevel,
  healthStatus,
  onStick,
}: OpenWorldHudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-[#f0e7da]">
      <div className="pointer-events-auto absolute left-3 top-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 rounded-full border border-[#f0e7da]/25 bg-black/45 px-3 py-2 text-sm backdrop-blur-sm hover:bg-black/60"
          aria-label="Leave the garden path"
        >
          <ArrowLeft size={16} />
          Leave path
        </button>
      </div>

      <div className="pointer-events-auto absolute right-3 top-3">
        <OpenWorldMinimap world={world} player={player} />
      </div>

      {webglFailed ? (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-[#0d0913]/90 px-6 text-center">
          <div className="max-w-md space-y-3">
            <PersonSimpleWalk size={36} className="mx-auto" />
            <p className="text-lg font-medium">This device cannot open the walkable garden.</p>
            <p className="text-sm text-[#f0e7da]/70">WebGL is unavailable. Return to the illustrated garden to keep tending memories.</p>
            <button
              type="button"
              onClick={onExit}
              className="rounded-full border border-[#f0e7da]/30 px-4 py-2 text-sm"
            >
              Back to garden
            </button>
          </div>
        </div>
      ) : null}

      {!webglFailed && !locked && !coarse ? (
        <button
          type="button"
          onClick={onLock}
          className="pointer-events-auto absolute left-1/2 top-[42%] -translate-x-1/2 rounded-2xl border border-[#f0e7da]/25 bg-black/50 px-5 py-4 text-center backdrop-blur-md"
        >
          <p className="text-sm font-medium">Click to look around</p>
          <p className="mt-1 text-xs text-[#f0e7da]/70">WASD walk · Shift run · Q water · E remember · Esc release look</p>
        </button>
      ) : null}

      {nearby && !webglFailed ? (
        <div className="pointer-events-auto absolute bottom-28 left-1/2 w-[min(92vw,440px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#f0e7da]/25 bg-black/60 shadow-2xl backdrop-blur-md">
          <div className="flex gap-3 p-3.5">
            {nearby.photoUrl ? (
              <img
                src={nearby.photoUrl}
                alt=""
                className="h-16 w-16 flex-shrink-0 rounded-lg object-cover border border-[#f0e7da]/20"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wide text-[#f0e7da]/60">A memory grows here</p>
                {moistureLevel !== undefined ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                      healthStatus === 'thriving'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : healthStatus === 'healthy'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : healthStatus === 'thirsty'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : healthStatus === 'wilting'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    💧 {Math.round(moistureLevel)}% · {healthStatus ?? 'healthy'}
                  </span>
                ) : null}
              </div>
              <p className="line-clamp-2 text-sm font-medium mt-0.5">{nearby.title}</p>
              
              <div className="mt-2.5 flex items-center gap-2">
                {onWater ? (
                  canWater ? (
                    <button
                      type="button"
                      onClick={onWater}
                      className="rounded-full bg-cyan-500/90 hover:bg-cyan-400 px-3 py-1 text-xs font-semibold text-slate-950 transition-colors shadow-sm"
                    >
                      {coarse
                        ? moistureLevel !== undefined && moistureLevel <= 0
                          ? '✨ Revive'
                          : '💧 Water'
                        : moistureLevel !== undefined && moistureLevel <= 0
                        ? 'Q · Revive (80%)'
                        : 'Q · Water (+25%)'}
                    </button>
                  ) : (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-xs text-emerald-300/80">
                      ✓ Soil is moist
                    </span>
                  )
                ) : null}

                <button
                  type="button"
                  onClick={onInteract}
                  className="rounded-full bg-[#f0e7da] hover:bg-white px-3 py-1 text-xs font-medium text-[#1a1220] transition-colors"
                >
                  {coarse ? 'Remember' : 'E · Remember'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {coarse && !webglFailed ? (
        <div className="pointer-events-auto absolute bottom-6 left-4">
          <VirtualJoystick onChange={onStick} />
        </div>
      ) : (
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] tracking-wide text-[#f0e7da]/45">
          Walk your garden · plants keep their stories
        </p>
      )}
    </div>
  )
}
