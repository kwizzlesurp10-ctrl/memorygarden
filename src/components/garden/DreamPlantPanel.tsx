import { useMemo, useState } from 'react'
import type { HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { dreamPlant } from '@/lib/garden/dream-plant'
import { getPlantOfWeek } from '@/lib/garden/plant-of-week'
import { HybridGrowthStrip } from '@/components/plants/hybrid-builder'

interface DreamPlantPanelProps {
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  onPlant: (genome: HybridGenome, idea: string) => void
  onAddWeeklyToShed?: (genome: HybridGenome, idea: string, isoWeek: string) => boolean
  weeklyAlreadySaved?: boolean
  onClose?: () => void
}

export function DreamPlantPanel({
  palette,
  rimStrength,
  motion,
  onPlant,
  onAddWeeklyToShed,
  weeklyAlreadySaved = false,
  onClose,
}: DreamPlantPanelProps) {
  const [idea, setIdea] = useState('')
  const [dreaming, setDreaming] = useState(false)
  const [genome, setGenome] = useState<HybridGenome | null>(null)
  const [source, setSource] = useState<'ai' | 'local'>('ai')

  const weekly = useMemo(() => getPlantOfWeek(), [])
  const weeklySaved = weeklyAlreadySaved

  const handleDream = async () => {
    const trimmed = idea.trim()
    if (!trimmed || dreaming) return
    setDreaming(true)
    try {
      const result = await dreamPlant(trimmed)
      setGenome(result.genome)
      setSource(result.source)
    } finally {
      setDreaming(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/8 bg-black/30 p-4 text-[#f0e7da] font-serif space-y-3">
      <div className="flex w-full items-center gap-2">
        <span className="rounded-md border border-[#ffb877]/35 bg-[#ffb877]/14 px-2 py-0.5 font-mono text-xs text-[#ffb877]">3a</span>
        <h3 className="text-lg font-semibold">Dream a plant</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="ml-auto text-sm opacity-50 hover:opacity-90" aria-label="Close dream a plant panel">
            ✕
          </button>
        )}
      </div>

      <div className="rounded-xl border border-[#d4c4ff]/25 bg-[#d4c4ff]/[0.06] p-3 space-y-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#d4c4ff]">Plant of the week</span>
          <span className="text-xs opacity-55">{weekly.daysLeft} day{weekly.daysLeft === 1 ? '' : 's'} left</span>
        </div>
        <p className="text-sm font-semibold">{weekly.genome.name}</p>
        <p className="text-xs italic opacity-75">{weekly.genome.essence}</p>
        {weekly.evolvedFromName && (
          <p className="text-[11px] opacity-50">Evolved from {weekly.evolvedFromName}</p>
        )}
        <p className="text-[11px] opacity-45 font-mono">theme: {weekly.theme}</p>
        <HybridGrowthStrip genome={weekly.genome} palette={palette} rimStrength={rimStrength} motion={motion} />
        <button
          type="button"
          disabled={weeklySaved}
          onClick={() => onAddWeeklyToShed?.(weekly.genome, weekly.theme, weekly.isoWeek)}
          className="rounded-lg border border-[#d4c4ff]/35 bg-[#d4c4ff]/10 px-4 py-1.5 text-xs tracking-wide text-[#ece4ff] disabled:opacity-40"
        >
          {weeklySaved ? 'Already in your shed this week' : 'Add to my shed'}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleDream()}
          placeholder="e.g. my grandmother's typewriter · the smell of rain"
          className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => void handleDream()}
          disabled={dreaming}
          className="rounded-lg border border-[#ffb877]/40 bg-[#ffb877]/12 px-5 text-sm tracking-wide text-[#ffb877] disabled:opacity-50"
        >
          {dreaming ? 'Dreaming…' : 'Dream it'}
        </button>
      </div>
      {genome && (
        <div className="rounded-xl border border-white/6 bg-white/[0.03] p-4 space-y-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-xl font-semibold">{genome.name}</span>
            <span className="font-mono text-xs opacity-55">{genome.base} × {genome.graft}</span>
            <span className="font-mono text-xs text-[#ffb877]">glyph: {genome.motif.label}</span>
            <span className="text-xs italic opacity-40">
              {source === 'local' ? 'offline dream — seeded from your words' : 'dreamt by AI'}
            </span>
          </div>
          <p className="text-sm italic opacity-80">{genome.essence}</p>
          <HybridGrowthStrip genome={genome} palette={palette} rimStrength={rimStrength} motion={motion} />
          <button
            type="button"
            onClick={() => onPlant(genome, idea.trim())}
            className="rounded-lg border border-white/30 px-4 py-2 text-sm tracking-wide"
          >
            Plant it in the garden
          </button>
        </div>
      )}
    </div>
  )
}
