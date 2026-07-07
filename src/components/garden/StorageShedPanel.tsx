import type { ShedSeed, PlantedHybrid } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { HybridPlantSvg } from '@/components/plants/hybrid-builder'

interface StorageShedPanelProps {
  open: boolean
  onClose: () => void
  seeds: ShedSeed[]
  planted: PlantedHybrid[]
  palette: ScenePalette
  rimStrength: number
  onNoteChange: (id: string, note: string) => void
  onPlant: (seed: ShedSeed) => void
  onDiscard: (id: string) => void
  onClearGarden: () => void
}

function ShedThumb({ seed, palette, rimStrength }: { seed: ShedSeed; palette: ScenePalette; rimStrength: number }) {
  return (
    <svg width={76} height={84} viewBox="0 0 76 84">
      <ellipse cx={38} cy={78} rx={17} ry={3} fill={palette.hills[2]} opacity={0.85} />
      <g transform="translate(38 77) scale(0.68)">
        <HybridPlantSvg genome={seed.g} palette={palette} rimStrength={rimStrength} motion={false} stage={6} x={0} y={0} scale={1} />
      </g>
    </svg>
  )
}

export function StorageShedPanel({
  open,
  onClose,
  seeds,
  planted,
  palette,
  rimStrength,
  onNoteChange,
  onPlant,
  onDiscard,
  onClearGarden,
}: StorageShedPanelProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 p-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mt-8 w-full max-w-4xl rounded-2xl border border-white/10 bg-[#12091f]/95 p-6 text-[#f0e7da] font-serif shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-baseline gap-3">
          <span className="rounded-md border border-[#d8e89a]/35 bg-[#d8e89a]/12 px-2 py-0.5 font-mono text-xs text-[#d8e89a]">4a</span>
          <h2 className="text-2xl font-semibold">Storage Shed</h2>
          <p className="text-sm italic opacity-60">your private seed store — only you can see it</p>
          <button type="button" onClick={onClose} className="ml-auto text-sm opacity-50 hover:opacity-90">✕</button>
        </div>

        {seeds.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/25 p-8 text-center italic opacity-60">
            The shed is empty. Dream a plant — every dreamt seed is stored here automatically.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              {seeds.map((sd) => {
                const plantedCount = planted.filter((p) => p.seedId === sd.id).length
                return (
                  <div key={sd.id} className="w-72 rounded-xl border border-white/8 bg-white/[0.03] p-4 space-y-2">
                    <div className="flex gap-3 items-center">
                      <ShedThumb seed={sd} palette={palette} rimStrength={rimStrength} />
                      <div className="min-w-0">
                        <div className="font-semibold text-lg">{sd.g.name}</div>
                        <div className="font-mono text-xs opacity-55">{sd.g.base} × {sd.g.graft}</div>
                        <div className="text-xs opacity-45">
                          {new Date(sd.when).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm italic opacity-70 leading-snug">{sd.g.essence}</p>
                    <input
                      type="text"
                      value={sd.note}
                      onChange={(e) => onNoteChange(sd.id, e.target.value)}
                      placeholder="add a private note…"
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm italic outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => onPlant(sd)} className="rounded-lg border border-white/30 px-3 py-1 text-xs tracking-wide">
                        Plant
                      </button>
                      {plantedCount > 0 && <span className="text-xs opacity-50">{plantedCount} in garden</span>}
                      <button type="button" onClick={() => onDiscard(sd.id)} className="ml-auto text-xs opacity-45 hover:opacity-90">
                        discard
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm opacity-55">
              <span>{seeds.length} seed{seeds.length === 1 ? '' : 's'} stored · {planted.length} hybrid{planted.length === 1 ? '' : 's'} planted</span>
              <button type="button" onClick={onClearGarden} className="ml-auto underline hover:opacity-90">
                uproot all planted hybrids
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}