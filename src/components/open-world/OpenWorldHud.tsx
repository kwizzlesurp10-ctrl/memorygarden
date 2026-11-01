import { ArrowLeft, PersonSimpleWalk } from '@phosphor-icons/react'
import type { PlayerState, WorldPlant, GardenWorld } from '@/lib/open-world/types'
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
          <p className="mt-1 text-xs text-[#f0e7da]/70">WASD walk · Shift run · E remember · Esc release look</p>
        </button>
      ) : null}

      {nearby && !webglFailed ? (
        <div className="pointer-events-auto absolute bottom-28 left-1/2 w-[min(92vw,420px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#f0e7da]/25 bg-black/55 shadow-2xl backdrop-blur-md">
          <div className="flex gap-3 p-3">
            {nearby.photoUrl ? (
              <img
                src={nearby.photoUrl}
                alt=""
                className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wide text-[#f0e7da]/55">A memory grows here</p>
              <p className="line-clamp-2 text-sm">{nearby.title}</p>
              <button
                type="button"
                onClick={onInteract}
                className="mt-2 rounded-full bg-[#f0e7da] px-3 py-1 text-xs font-medium text-[#1a1220]"
              >
                {coarse ? 'Remember' : 'E · Remember'}
              </button>
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
