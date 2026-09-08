import { useEffect, useRef, useState } from 'react'
import { Flame, Plant } from '@phosphor-icons/react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DreamPlantPanel } from '@/components/garden/DreamPlantPanel'
import { RemembranceCandlesPanel } from '@/components/garden/RemembranceCandlesPanel'
import type { Candle, HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'

type RitualSection = 'dream' | 'candles'

interface GardenRitualsSheetProps {
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  candles: Candle[]
  onPlant: (genome: HybridGenome, idea: string) => void
  onLight: (candle: Omit<Candle, 'id'>) => void
  onExtinguish: (id: string) => void
}

const launcherClass =
  'flex h-[54px] w-[54px] items-center justify-center rounded-full border bg-black/40 backdrop-blur-sm hover:bg-black/55'

export function GardenRitualsSheet({
  palette,
  rimStrength,
  motion,
  candles,
  onPlant,
  onLight,
  onExtinguish,
}: GardenRitualsSheetProps) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<RitualSection>('dream')
  const dreamRef = useRef<HTMLDivElement>(null)
  const candlesRef = useRef<HTMLDivElement>(null)

  const openRitual = (next: RitualSection) => {
    setSection(next)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      const node = section === 'candles' ? candlesRef.current : dreamRef.current
      node?.scrollIntoView({ block: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open, section])

  return (
    <>
      <div className="absolute left-3 top-3 z-40 flex flex-col gap-2">
        <button
          type="button"
          aria-label="Dream a plant"
          aria-expanded={open && section === 'dream'}
          title="Dream a plant"
          onClick={() => openRitual('dream')}
          className={`${launcherClass} border-[oklch(0.84_0.12_62/0.35)] text-[oklch(0.84_0.12_62)]`}
        >
          <Plant size={22} weight="duotone" />
        </button>
        <button
          type="button"
          aria-label="Floating candles"
          aria-expanded={open && section === 'candles'}
          title="Floating candles"
          onClick={() => openRitual('candles')}
          className={`${launcherClass} border-[oklch(0.88_0.12_85/0.35)] text-[oklch(0.88_0.12_85)]`}
        >
          <Flame size={22} weight="duotone" />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[min(92vw,28rem)] gap-0 border-[oklch(0.93_0.02_85/0.12)] bg-[oklch(0.18_0.04_300/0.96)] p-0 text-[oklch(0.93_0.02_85)] sm:max-w-md"
          onOpenAutoFocus={(event) => {
            if (section !== 'candles') return
            event.preventDefault()
            const target = candlesRef.current?.querySelector('input')
            if (target instanceof HTMLElement) target.focus()
          }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Garden rituals</SheetTitle>
            <SheetDescription>
              Dream a plant from a memory, or light a candle on the water.
            </SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col gap-3 overflow-y-auto p-4 pt-12 font-serif">
            <div ref={dreamRef}>
              <DreamPlantPanel
                palette={palette}
                rimStrength={rimStrength}
                motion={motion}
                onPlant={onPlant}
              />
            </div>
            <div ref={candlesRef}>
              <RemembranceCandlesPanel
                candles={candles}
                onLight={onLight}
                onExtinguish={onExtinguish}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
