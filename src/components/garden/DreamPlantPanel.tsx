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
    <div className="mg-garden-dock-panel p-4 font-serif space-y-3">
      <div className="flex w-full items-center gap-2">
        <span className="rounded-md border border-[#ffb877]/45 bg-[#ffb877]/18 px-2 py-0.5 font-mono text-xs font-medium text-[#ffddb0]">
          3a
        </span>
        <h3 className="text-lg font-semibold text-[#faf4ec]">Dream a plant</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-sm text-[#f0e7da]/80 hover:text-[#faf4ec] mg-focus-ring rounded px-1"
            aria-label="Close dream a plant panel"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mg-garden-dock-panel-inset p-3 space-y-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#d4c4ff]">
            Plant of the week
          </span>
          <span className="text-xs text-[#f0e7da]/75">
            {weekly.daysLeft} day{weekly.daysLeft === 1 ? '' : 's'} left
          </span>
        </div>
        <p className="text-sm font-semibold text-[#faf4ec]">{weekly.genome.name}</p>
        <p className="text-xs italic text-[#f0e7da]/85">{weekly.genome.essence}</p>
        {weekly.evolvedFromName && (
          <p className="text-[11px] text-[#f0e7da]/70">Evolved from {weekly.evolvedFromName}</p>
        )}
        <p className="text-[11px] font-mono text-[#d4c4ff]/85">theme: {weekly.theme}</p>
        <HybridGrowthStrip genome={weekly.genome} palette={palette} rimStrength={rimStrength} motion={motion} />
        <button
          type="button"
          disabled={weeklySaved}
          onClick={() => onAddWeeklyToShed?.(weekly.genome, weekly.theme, weekly.isoWeek)}
          className="mg-garden-dock-btn-secondary"
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
          className="mg-garden-dock-input flex-1"
        />
        <button type="button" onClick={() => void handleDream()} disabled={dreaming} className="mg-garden-dock-btn-primary shrink-0">
          {dreaming ? 'Dreaming…' : 'Dream it'}
        </button>
      </div>
      {genome && (
        <div className="rounded-xl border border-[#f0e7da]/18 bg-[#0d0913]/65 p-4 space-y-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-xl font-semibold text-[#faf4ec]">{genome.name}</span>
            <span className="font-mono text-xs text-[#f0e7da]/80">
              {genome.base} × {genome.graft}
            </span>
            <span className="font-mono text-xs text-[#ffb877]">glyph: {genome.motif.label}</span>
            <span className="text-xs italic text-[#f0e7da]/70">
              {source === 'local' ? 'offline dream — seeded from your words' : 'dreamt by AI'}
            </span>
          </div>
          <p className="text-sm italic text-[#f0e7da]/90">{genome.essence}</p>
          <HybridGrowthStrip genome={genome} palette={palette} rimStrength={rimStrength} motion={motion} />
          <button
            type="button"
            onClick={() => onPlant(genome, idea.trim())}
            className="rounded-lg border border-[#f0e7da]/40 bg-[#f0e7da]/12 px-4 py-2 text-sm font-medium tracking-wide text-[#faf4ec] hover:bg-[#f0e7da]/18"
          >
            Plant it in the garden
          </button>
        </div>
      )}
    </div>
  )
}
