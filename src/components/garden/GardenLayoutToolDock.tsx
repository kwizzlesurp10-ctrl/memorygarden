import { useCallback, useEffect, useState } from 'react'
import type { Candle, HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { DreamPlantPanel } from '@/components/garden/DreamPlantPanel'
import { RemembranceCandlesPanel } from '@/components/garden/RemembranceCandlesPanel'

type LayoutTool = 'dream' | 'candles'

interface GardenLayoutToolDockProps {
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  candles: Candle[]
  onPlant: (genome: HybridGenome, idea: string) => void
  onLightCandle: (candle: Omit<Candle, 'id'>) => void
  onExtinguishCandle: (id: string) => void
}

const iconButtonBase =
  'flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border bg-black/40 text-[#f0e7da] backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0e7da]/40'

export function GardenLayoutToolDock({
  palette,
  rimStrength,
  motion,
  candles,
  onPlant,
  onLightCandle,
  onExtinguishCandle,
}: GardenLayoutToolDockProps) {
  const [openTool, setOpenTool] = useState<LayoutTool | null>(null)

  const close = useCallback(() => setOpenTool(null), [])

  const toggle = useCallback((tool: LayoutTool) => {
    setOpenTool((prev) => (prev === tool ? null : tool))
  }, [])

  useEffect(() => {
    if (!openTool) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openTool, close])

  return (
    <>
      {openTool !== null && (
        <div
          className="fixed inset-0 z-20"
          aria-hidden
          onClick={close}
          data-testid="garden-layout-tool-backdrop"
        />
      )}

      <div
        className="absolute bottom-20 left-3 z-30 flex max-w-md w-[min(100%,420px)] flex-col items-start gap-2 pointer-events-none"
        role="group"
        aria-label="Garden layout tools"
      >
        {openTool === 'dream' && (
          <div id="garden-tool-dream-panel" className="pointer-events-auto w-full" data-testid="garden-tool-dream-panel">
            <DreamPlantPanel
              palette={palette}
              rimStrength={rimStrength}
              motion={motion}
              onPlant={onPlant}
              onClose={close}
            />
          </div>
        )}

        {openTool === 'candles' && (
          <div id="garden-tool-candles-panel" className="pointer-events-auto w-full" data-testid="garden-tool-candles-panel">
            <RemembranceCandlesPanel
              candles={candles}
              onLight={onLightCandle}
              onExtinguish={onExtinguishCandle}
              onClose={close}
            />
          </div>
        )}

        <div className="flex flex-row gap-2 pointer-events-auto">
          <button
            type="button"
            aria-label="Dream a plant"
            aria-expanded={openTool === 'dream'}
            aria-controls="garden-tool-dream-panel"
            data-testid="garden-tool-dream-toggle"
            onClick={() => toggle('dream')}
            className={`${iconButtonBase} border-[#ffb877]/35 ${openTool === 'dream' ? 'bg-[#ffb877]/20 ring-1 ring-[#ffb877]/45' : ''}`}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#ffb877" strokeWidth={1.6} aria-hidden="true">
              <path d="M12 3v3M12 18v3M4.5 7.5l2.2 2.2M17.3 14.3l2.2 2.2M3 12h3M18 12h3M4.5 16.5l2.2-2.2M17.3 9.7l2.2-2.2" strokeLinecap="round" />
              <path d="M12 8c-2.2 0-4 1.6-4 3.6 0 2.8 4 6.4 4 6.4s4-3.6 4-6.4C16 9.6 14.2 8 12 8z" fill="#ffb877" fillOpacity={0.25} stroke="#ffb877" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Floating candles"
            aria-expanded={openTool === 'candles'}
            aria-controls="garden-tool-candles-panel"
            data-testid="garden-tool-candles-toggle"
            onClick={() => toggle('candles')}
            className={`${iconButtonBase} border-[#ffd88a]/35 ${openTool === 'candles' ? 'bg-[#ffd88a]/18 ring-1 ring-[#ffd88a]/45' : ''}`}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 4c0 2-1.5 3.2-1.5 5.2 0 1.2.6 2.2 1.5 2.8v6.5c0 .8-.6 1.5-1.4 1.5h2.8c-.8 0-1.4-.7-1.4-1.5v-6.5c.9-.6 1.5-1.6 1.5-2.8C13.5 7.2 12 6 12 4z"
                fill="#ffd88a"
                fillOpacity={0.35}
                stroke="#ffd88a"
                strokeWidth={1.4}
                strokeLinejoin="round"
              />
              <ellipse cx={12} cy={20.5} rx={5} ry={1.2} fill="#ffd88a" fillOpacity={0.2} />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
