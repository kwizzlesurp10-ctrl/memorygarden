import { ArrowLeft, PersonSimpleWalk } from '@phosphor-icons/react'
import type { PlayerState, WorldPlant, GardenWorld } from '@/lib/open-world/types'
import type { GardenGiftType } from '@/lib/types'
import type { PlantHealthStatus } from '@/lib/tending-logic'
import { GIFT_METADATA } from '@/lib/garden-gifts'
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
  streak?: { currentStreak: number; streakShields: number }
  dewCurrency?: number
  canHarvestDew?: boolean
  onHarvestDew?: () => void
  bondPartnerName?: string
  onLeaveGift?: (giftType: GardenGiftType) => void
  onOpenGift?: (giftId: string) => void
  captureMode?: boolean
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
  streak,
  dewCurrency,
  canHarvestDew = false,
  onHarvestDew,
  bondPartnerName,
  onLeaveGift,
  onOpenGift,
  captureMode = false,
}: OpenWorldHudProps) {
  if (captureMode) return null
  const groveMilestone = world.groveMilestone
  const activeGifts = nearby?.activeGifts ?? []
  const firstUnopenedGift = activeGifts[0] ?? null
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-[#f0e7da]">
      <div className="pointer-events-auto absolute left-3 top-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-2 rounded-full border border-[#f0e7da]/25 bg-black/45 px-3 py-2 text-sm backdrop-blur-sm hover:bg-black/60 transition-colors"
          aria-label="Leave the garden path"
        >
          <ArrowLeft size={16} />
          Leave path
        </button>

        {streak ? (
          <div className="flex items-center gap-2 rounded-full border border-[#f0e7da]/20 bg-black/45 px-3 py-2 text-xs backdrop-blur-sm shadow-sm">
            <span className="flex items-center gap-1 font-semibold text-amber-300" title="Daily Mindful Stewardship Streak">
              🔥 {streak.currentStreak}d
            </span>
            <span className="text-[#f0e7da]/30">·</span>
            <span className="flex items-center gap-1 text-cyan-300 font-medium" title="Dewdrops of Grace (Missed Day Protection)">
              💧 ×{streak.streakShields}
            </span>
            {dewCurrency !== undefined ? (
              <>
                <span className="text-[#f0e7da]/30">·</span>
                <span className="flex items-center gap-1 text-emerald-300 font-medium" title="Spendable Dew Currency">
                  ✨ {dewCurrency} Dew
                </span>
              </>
            ) : null}
          </div>
        ) : null}

        {bondPartnerName ? (
          <div
            className="flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-950/45 px-3 py-2 text-xs text-amber-200 backdrop-blur-sm shadow-sm"
            title="Active 48-Hour Garden Bond (Twin Fireflies at Entrance)"
          >
            <span>💕</span>
            <span className="font-medium">Bond · {bondPartnerName}</span>
          </div>
        ) : null}

        {groveMilestone ? (
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200 backdrop-blur-sm shadow-sm"
            title="The Grove Project — Collective Sanctuary Unlocks"
          >
            <span>🌸</span>
            <span className="font-medium">
              Grove Tier {groveMilestone.currentTier} · {groveMilestone.totalCommunityWaterings}/
              {groveMilestone.nextMilestoneAt}
            </span>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-auto absolute right-3 top-3">
        <OpenWorldMinimap world={world} player={player} hasMorningDew={canHarvestDew} />
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

      {canHarvestDew && !nearby && !webglFailed ? (
        <div className="pointer-events-auto absolute bottom-28 left-1/2 w-[min(92vw,400px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-emerald-400/40 bg-black/65 p-4 text-center shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <span>✨</span>
            <span>Dawn Morning Dew Gathered</span>
          </div>
          <p className="mt-1 text-sm text-[#f0e7da]/90">
            Shimmering morning mist drifts over the pond waters.
          </p>
          <button
            type="button"
            onClick={onHarvestDew}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400 hover:bg-emerald-300 px-4 py-1.5 text-xs font-semibold text-slate-950 transition-colors shadow-md"
          >
            {coarse ? 'Harvest Morning Dew (+3 Dew)' : 'E · Harvest Morning Dew (+3 Dew)'}
          </button>
        </div>
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
                <p className="text-[11px] uppercase tracking-wide text-[#f0e7da]/60 truncate">
                  {nearby.plantedBy
                    ? `Planted with love by ${nearby.plantedBy.login}`
                    : nearby.isSanctuaryCircle
                    ? 'The Sanctuary Circle'
                    : 'A memory grows here'}
                </p>
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
              
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {onWater ? (
                  canWater ? (
                    <button
                      type="button"
                      onClick={onWater}
                      className="rounded-full bg-cyan-500/90 hover:bg-cyan-400 px-3 py-1 text-xs font-semibold text-slate-950 transition-colors shadow-sm"
                    >
                      {nearby.isSleepingSeed
                        ? coarse
                          ? '💧 Send Gentle Care'
                          : 'Q · Send Gentle Care'
                        : coarse
                        ? nearby.plantedBy
                          ? '💧 Water with Care'
                          : moistureLevel !== undefined && moistureLevel <= 0
                          ? '✨ Revive'
                          : '💧 Water'
                        : nearby.plantedBy
                        ? 'Q · Water with Care'
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

                {!nearby.isSleepingSeed ? (
                  <button
                    type="button"
                    onClick={onInteract}
                    className="rounded-full bg-[#f0e7da] hover:bg-white px-3 py-1 text-xs font-medium text-[#1a1220] transition-colors"
                  >
                    {coarse
                      ? nearby.plantedBy
                        ? 'Read Memory'
                        : 'Remember'
                      : nearby.plantedBy
                      ? 'E · Read Memory'
                      : 'E · Remember'}
                  </button>
                ) : null}

                {firstUnopenedGift && onOpenGift ? (
                  <button
                    type="button"
                    onClick={() => onOpenGift(firstUnopenedGift.id)}
                    className="rounded-full bg-amber-400/90 hover:bg-amber-300 px-3 py-1 text-xs font-semibold text-slate-950 transition-colors shadow-sm"
                  >
                    {GIFT_METADATA[firstUnopenedGift.giftType].icon} Open {GIFT_METADATA[firstUnopenedGift.giftType].label}
                  </button>
                ) : null}
              </div>

              {onLeaveGift && !nearby.isSleepingSeed ? (
                <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#f0e7da]/15 pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#f0e7da]/55">
                    Leave 3D Gift:
                  </span>
                  {(['blossom_note', 'paper_lantern', 'dew_vial', 'wind_chime'] as const).map(
                    (gType) => (
                      <button
                        key={gType}
                        type="button"
                        onClick={() => onLeaveGift(gType)}
                        title={`Leave ${GIFT_METADATA[gType].label}: ${GIFT_METADATA[gType].description}`}
                        className="rounded-full border border-[#f0e7da]/20 bg-white/5 hover:bg-white/15 px-2 py-0.5 text-[11px] transition-colors"
                      >
                        {GIFT_METADATA[gType].icon} {GIFT_METADATA[gType].label.split(' ')[0]}
                      </button>
                    ),
                  )}
                </div>
              ) : null}
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
