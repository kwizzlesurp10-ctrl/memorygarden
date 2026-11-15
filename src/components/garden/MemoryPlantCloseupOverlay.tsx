import { useCallback, useEffect, useId, useRef, type RefObject } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import XIcon from 'lucide-react/dist/esm/icons/x'
import type { ArtStyle, Memory } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import {
  closeupPlantStage,
  memoryHasDisplayPhoto,
  memoryLastTendedLabel,
  memoryPlantStageProgress,
} from '@/lib/garden/memory-plant-closeup'
import { PlantArtStyleDefs } from '@/components/plants/PlantArtStyleDefs'
import { MemoryPlantCloseupSvg } from '@/components/garden/MemoryPlantCloseupSvg'
import { formatMemoryDateLabel, memoryBodyFallback, memoryPrimaryLabel } from '@/lib/memory-display'
import { plantVarietyDisplayLabel } from '@/lib/garden/plant-variety-labels'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

export interface MemoryPlantCloseupOverlayProps {
  open: boolean
  memory: Memory
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  plantArtStyle?: ArtStyle
  onClose: () => void
  onOpenMemoryDetail?: (memory: Memory) => void
  returnFocusRef?: RefObject<HTMLElement | null>
}

export function MemoryPlantCloseupOverlay({
  open,
  memory,
  palette,
  rimStrength,
  motion,
  plantArtStyle,
  onClose,
  onOpenMemoryDetail,
  returnFocusRef,
}: MemoryPlantCloseupOverlayProps) {
  const reducedMotion = useReducedMotion()
  const titleId = useId()
  const descId = useId()
  const plantMotion = motion && !reducedMotion
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  const { stage, nextStage, progress01 } = memoryPlantStageProgress(memory)
  const stageLabel = closeupPlantStage(memory)
  const displayTitle =
    memory.isHybrid && memory.hybridGenome?.name
      ? memory.hybridGenome.name
      : memoryPrimaryLabel(memory)
  const varietyLabel = memory.isHybrid && memory.hybridGenome
    ? `${memory.hybridGenome.base} × ${memory.hybridGenome.graft}`
    : plantVarietyDisplayLabel(memory.plantVariety)
  const memoryText = memory.text?.trim()
    ? memory.text
    : memoryBodyFallback(memory)
  const lastTended = memoryLastTendedLabel(memory)
  const plantedLabel = (() => {
    try {
      return new Date(memory.plantedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return formatMemoryDateLabel(memory.date)
    }
  })()

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => {
      firstFocusRef.current?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [open, memory.id])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay
          data-testid="memory-plant-closeup-overlay"
          className="bg-[#0d0913]/88 backdrop-blur-md motion-reduce:animate-none"
        />
        <DialogPrimitive.Content
          data-testid="memory-plant-closeup-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            returnFocusRef?.current?.focus()
          }}
          className={cn(
            'fixed z-50 flex max-h-[min(96dvh,920px)] w-full flex-col overflow-hidden',
            'border border-[#f0e7da]/20 bg-[#120e18] text-[#f5efe6] shadow-2xl outline-none',
            'inset-x-0 bottom-0 rounded-t-2xl',
            'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            'sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95',
            'motion-reduce:animate-none motion-reduce:transition-none',
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#f0e7da]/12 px-4 py-3 sm:px-5">
            <div className="min-w-0 space-y-0.5">
              <DialogTitle id={titleId} className="truncate text-lg font-semibold text-[#faf4ec] sm:text-xl">
                {displayTitle}
              </DialogTitle>
              <DialogDescription id={descId} className="text-xs text-[#f0e7da]/78 sm:text-sm">
                {varietyLabel}
                {' · '}
                {formatMemoryDateLabel(memory.date)}
              </DialogDescription>
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                ref={firstFocusRef}
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 text-[#f0e7da]/85 hover:bg-[#f0e7da]/10"
                aria-label="Close plant close-up"
                data-testid="memory-plant-closeup-close"
              >
                <XIcon className="size-5" aria-hidden />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div
              className="flex min-h-[min(44dvh,280px)] items-end justify-center px-2 py-2 sm:px-3"
              data-testid="memory-plant-closeup-art-panel"
              style={{ background: `linear-gradient(180deg, ${palette.sky[0]}28 0%, ${palette.bank} 72%)` }}
            >
              <svg width={0} height={0} className="absolute overflow-hidden" aria-hidden>
                <PlantArtStyleDefs />
              </svg>
              <MemoryPlantCloseupSvg
                memory={memory}
                palette={palette}
                rimStrength={rimStrength}
                motion={plantMotion}
                plantArtStyle={plantArtStyle}
                className="max-h-[min(48dvh,300px)]"
              />
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-5">
              <section aria-labelledby={`${titleId}-growth`}>
                <h3 id={`${titleId}-growth`} className="text-[10px] font-semibold uppercase tracking-widest text-[#d4c4ff]">
                  Growth
                </h3>
                <p className="mt-1 text-sm capitalize text-[#faf4ec]">
                  Stage: <span data-testid="memory-plant-closeup-stage">{stageLabel}</span>
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between text-xs text-[#f0e7da]/75">
                    <span>
                      {nextStage ? `Toward ${nextStage}` : 'Fully grown'}
                    </span>
                    <span data-testid="memory-plant-closeup-progress-pct">
                      {Math.round((nextStage ? progress01 : 1) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(nextStage ? progress01 : 1) * 100}
                    className="h-2.5 bg-[#f0e7da]/15"
                    data-testid="memory-plant-closeup-progress"
                  />
                </div>
              </section>

              <section aria-labelledby={`${titleId}-memory`}>
                <h3 id={`${titleId}-memory`} className="text-[10px] font-semibold uppercase tracking-widest text-[#d4c4ff]">
                  Memory
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#f0e7da]/92" data-testid="memory-plant-closeup-text">
                  {memoryText}
                </p>
                {memoryHasDisplayPhoto(memory) ? (
                  <img
                    src={memory.photoUrl}
                    alt=""
                    className="mt-3 max-h-36 w-full rounded-lg border border-[#f0e7da]/15 object-cover"
                    data-testid="memory-plant-closeup-photo"
                  />
                ) : null}
              </section>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-[#f0e7da]/80">
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-[#f0e7da]/55">Planted</dt>
                  <dd data-testid="memory-plant-closeup-planted">{plantedLabel}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-[#f0e7da]/55">Last tended</dt>
                  <dd data-testid="memory-plant-closeup-last-tended">{lastTended ?? '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-[#f0e7da]/55">Visits</dt>
                  <dd>{memory.visitCount}</dd>
                </div>
                {memory.location?.trim() ? (
                  <div className="col-span-2">
                    <dt className="font-semibold uppercase tracking-wide text-[#f0e7da]/55">Location</dt>
                    <dd>{memory.location}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          <div className="shrink-0 border-t border-[#f0e7da]/12 px-4 py-3 sm:px-5">
            {onOpenMemoryDetail ? (
              <Button
                type="button"
                className="mb-2 h-11 w-full border border-[#f0e7da]/30 bg-[#ffb877]/20 text-[#faf4ec] hover:bg-[#ffb877]/30"
                data-testid="memory-plant-closeup-open-detail"
                onClick={() => {
                  onOpenMemoryDetail(memory)
                  onClose()
                }}
              >
                Open memory card — tend &amp; reflect
              </Button>
            ) : null}
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full border border-[#f0e7da]/25 bg-[#f0e7da]/8 text-[#faf4ec]"
                data-testid="memory-plant-closeup-dismiss"
              >
                Back to garden
              </Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}