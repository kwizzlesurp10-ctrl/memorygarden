import type { Season } from '@/lib/types'
import { getClockTime, todName } from '@/lib/garden/day-night'

interface GardenTodControlsProps {
  tod: number
  playing: boolean
  season: Season
  onTodChange: (tod: number) => void
  onPlayToggle: () => void
  onSeasonChange: (season: Season) => void
  devMode?: boolean
}

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export function GardenTodControls({
  tod,
  playing,
  season,
  onTodChange,
  onPlayToggle,
  onSeasonChange,
  devMode = import.meta.env.DEV,
}: GardenTodControlsProps) {
  if (!devMode) return null

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-black/40 px-4 py-3 text-[oklch(0.93_0.02_85)] backdrop-blur-sm">
      <div className="flex gap-1 rounded-lg border border-white/15 p-1">
        {SEASONS.map((sn) => (
          <button
            key={sn}
            type="button"
            onClick={() => onSeasonChange(sn)}
            className="rounded-md px-3 py-1 text-xs tracking-wide capitalize"
            style={{
              background: season === sn ? 'oklch(0.93 0.02 85 / 0.16)' : 'transparent',
              color: season === sn ? 'oklch(0.93 0.02 85)' : 'oklch(0.93 0.02 85 / 0.5)',
            }}
          >
            {sn}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onPlayToggle}
        className="rounded-lg border border-white/25 px-4 py-1.5 text-xs tracking-wide min-w-[52px]"
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        min={0}
        max={24}
        step={0.05}
        value={tod}
        onChange={(e) => onTodChange(parseFloat(e.target.value))}
        className="flex-1 min-w-[120px] accent-[oklch(0.84_0.12_62)]"
      />
      <span className="font-mono text-sm min-w-[140px] text-right">
        {getClockTime(tod)} <span className="opacity-55">· {todName(tod)}</span>
      </span>
    </div>
  )
}