import { useState } from 'react'
import type { HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { dreamPlant } from '@/lib/garden/dream-plant'
import { HybridGrowthStrip } from '@/components/plants/hybrid-builder'

interface DreamPlantPanelProps {
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  onPlant: (genome: HybridGenome, idea: string) => void
}

export function DreamPlantPanel({ palette, rimStrength, motion, onPlant }: DreamPlantPanelProps) {
  const [idea, setIdea] = useState('')
  const [dreaming, setDreaming] = useState(false)
  const [genome, setGenome] = useState<HybridGenome | null>(null)
  const [source, setSource] = useState<'ai' | 'local'>('ai')

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
    <div className="rounded-xl border border-white/8 bg-black/30 p-4 text-[oklch(0.93_0.02_85)] font-serif space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="rounded-md border border-[oklch(0.84_0.12_62/0.35)] bg-[oklch(0.84_0.12_62/0.14)] px-2 py-0.5 font-mono text-xs text-[oklch(0.84_0.12_62)]">3a</span>
        <h3 className="text-lg font-semibold">Dream a plant</h3>
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
          className="rounded-lg border border-[oklch(0.84_0.12_62/0.4)] bg-[oklch(0.84_0.12_62/0.12)] px-5 text-sm tracking-wide text-[oklch(0.84_0.12_62)] disabled:opacity-50"
        >
          {dreaming ? 'Dreaming…' : 'Dream it'}
        </button>
      </div>
      {genome && (
        <div className="rounded-xl border border-white/6 bg-white/[0.03] p-4 space-y-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-xl font-semibold">{genome.name}</span>
            <span className="font-mono text-xs opacity-55">{genome.base} × {genome.graft}</span>
            <span className="font-mono text-xs text-[oklch(0.84_0.12_62)]">glyph: {genome.motif.label}</span>
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