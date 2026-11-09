import { useMemo, useState } from 'react'
import type { HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { dreamPlant } from '@/lib/garden/dream-plant'
import { getPlantOfWeek } from '@/lib/garden/plant-of-week'
import { HybridGrowthStrip } from '@/components/plants/hybrid-builder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface DreamPlantPanelProps {
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  onPlant: (genome: HybridGenome, idea: string) => void
  onAddWeeklyToShed?: (genome: HybridGenome, idea: string, isoWeek: string) => boolean
  weeklyAlreadySaved?: boolean
  onClose?: () => void
}

const dockInputClass =
  'h-10 border-[#f0e7da]/28 bg-[#0d0913]/85 text-[#f5efe6] shadow-sm placeholder:text-[#f0e7da]/55 focus-visible:border-[#ffb877]/50 focus-visible:ring-[#ffb877]/35'

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
    <div className="mg-garden-dock-panel max-h-[min(70vh,520px)] overflow-y-auto p-4 font-sans space-y-3">
      <div className="flex w-full items-center gap-2">
        <span className="rounded-md border border-[#ffb877]/45 bg-[#ffb877]/18 px-2 py-0.5 font-mono text-xs font-medium text-[#ffddb0]">
          3a
        </span>
        <h3 className="text-lg font-semibold text-[#faf4ec]">Dream a plant</h3>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-auto size-8 text-[#f0e7da]/80 hover:bg-[#f0e7da]/10 hover:text-[#faf4ec]"
            aria-label="Close dream a plant panel"
          >
            ✕
          </Button>
        )}
      </div>

      <div className="mg-garden-dock-panel-inset space-y-2.5 p-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#d4c4ff]">
            Plant of the week
          </span>
          <span className="text-xs text-[#f0e7da]/75">
            {weekly.daysLeft} day{weekly.daysLeft === 1 ? '' : 's'} left
          </span>
        </div>
        <p className="text-sm font-semibold text-[#faf4ec]">{weekly.genome.name}</p>
        <p className="text-xs text-[#f0e7da]/85">{weekly.genome.essence}</p>
        {weekly.evolvedFromName && (
          <p className="text-[11px] text-[#f0e7da]/70">Evolved from {weekly.evolvedFromName}</p>
        )}
        <p className="text-[11px] font-mono text-[#d4c4ff]/85">theme: {weekly.theme}</p>
        <HybridGrowthStrip
          genome={weekly.genome}
          palette={palette}
          rimStrength={rimStrength}
          motion={motion}
          density="dock"
        />
        <Button
          type="button"
          disabled={weeklySaved}
          size="default"
          variant="secondary"
          className={cn(
            'h-10 w-full border border-[#d4c4ff]/45 bg-[#d4c4ff]/18 text-sm font-medium text-[#f0e8ff]',
            'hover:bg-[#d4c4ff]/28 disabled:opacity-45',
          )}
          onClick={() => onAddWeeklyToShed?.(weekly.genome, weekly.theme, weekly.isoWeek)}
        >
          {weeklySaved ? 'Already in your shed this week' : 'Add to my shed'}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <Input
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleDream()}
          placeholder="e.g. my grandmother's typewriter · the smell of rain"
          className={cn(dockInputClass, 'flex-1')}
        />
        <Button
          type="button"
          onClick={() => void handleDream()}
          disabled={dreaming}
          size="lg"
          className="h-10 shrink-0 bg-[#ffb877] px-6 text-sm font-semibold text-[#1c1408] shadow-sm hover:bg-[#ffc98f] sm:min-w-[7.5rem]"
        >
          {dreaming ? 'Dreaming…' : 'Dream it'}
        </Button>
      </div>
      {genome && (
        <div className="space-y-3 rounded-xl border border-[#f0e7da]/18 bg-[#0d0913]/65 p-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-xl font-semibold text-[#faf4ec]">{genome.name}</span>
            <span className="font-mono text-xs text-[#f0e7da]/80">
              {genome.base} × {genome.graft}
            </span>
            <span className="font-mono text-xs text-[#ffb877]">glyph: {genome.motif.label}</span>
            <span className="text-xs text-[#f0e7da]/70">
              {source === 'local' ? 'offline dream — seeded from your words' : 'dreamt by AI'}
            </span>
          </div>
          <p className="text-sm text-[#f0e7da]/90">{genome.essence}</p>
          <HybridGrowthStrip genome={genome} palette={palette} rimStrength={rimStrength} motion={motion} density="dock" />
          <Button
            type="button"
            variant="outline"
            className="h-10 border-[#f0e7da]/40 bg-[#f0e7da]/10 text-[#faf4ec] hover:bg-[#f0e7da]/16"
            onClick={() => onPlant(genome, idea.trim())}
          >
            Plant it in the garden
          </Button>
        </div>
      )}
    </div>
  )
}
