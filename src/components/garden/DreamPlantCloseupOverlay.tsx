import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import XIcon from 'lucide-react/dist/esm/icons/x'
import type { HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { indexToPlantStage } from '@/lib/garden/stage'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'
import { buildMiniHybrid } from '@/components/plants/hybrid-builder'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const HISTORY_KEY = 'mgDreamCloseup'

export interface DreamPlantCloseupOverlayProps {
  open: boolean
  onClose: () => void
  genome: HybridGenome
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  returnFocusRef?: RefObject<HTMLButtonElement | null>
}

export function DreamPlantCloseupOverlay({
  open,
  onClose,
  genome,
  palette,
  rimStrength,
  motion,
  returnFocusRef,
}: DreamPlantCloseupOverlayProps) {
  const reducedMotion = useReducedMotion()
  const titleId = useId()
  const descId = useId()
  const [stageIndex, setStageIndex] = useState(7)
  const historyPushedRef = useRef(false)
  const plantMotion = motion && !reducedMotion

  const finishClose = useCallback(() => {
    onClose()
  }, [onClose])

  const requestClose = useCallback(() => {
    if (historyPushedRef.current) {
      historyPushedRef.current = false
      history.back()
      return
    }
    finishClose()
  }, [finishClose])

  useEffect(() => {
    if (!open) {
      historyPushedRef.current = false
      return
    }
    history.pushState({ [HISTORY_KEY]: 1 }, '')
    historyPushedRef.current = true

    const onPopState = () => {
      historyPushedRef.current = false
      finishClose()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [open, finishClose])

  const handleOpenChange = (next: boolean) => {
    if (!next) requestClose()
  }

  const stage = indexToPlantStage(stageIndex)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay
          data-testid="dream-plant-closeup-overlay"
          className={cn(
            'bg-[#0d0913]/95 backdrop-blur-md',
            'motion-reduce:animate-none motion-reduce:transition-none',
          )}
        />
        <DialogPrimitive.Content
          data-testid="dream-plant-closeup-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className={cn(
            'pointer-events-none fixed inset-0 z-50 flex flex-col',
            'pt-[max(env(safe-area-inset-top),0px)] pb-[max(env(safe-area-inset-bottom),0px)]',
            'pl-[max(env(safe-area-inset-left),0px)] pr-[max(env(safe-area-inset-right),0px)]',
            'bg-transparent text-[#f5efe6] outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'motion-reduce:animate-none motion-reduce:transition-none',
          )}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            returnFocusRef?.current?.focus()
          }}
        >
          <div className="pointer-events-auto flex items-start justify-between gap-3 border-b border-[#f0e7da]/15 bg-[#120e18]/92 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="min-w-0 space-y-1">
              <DialogTitle id={titleId} className="truncate text-xl font-semibold text-[#faf4ec] sm:text-2xl">
                {genome.name}
              </DialogTitle>
              <DialogDescription id={descId} className="text-sm text-[#f0e7da]/85">
                {genome.base} × {genome.graft} · stage: {stage} · motif: {genome.motif.label}
              </DialogDescription>
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 shrink-0 text-[#f0e7da]/85 hover:bg-[#f0e7da]/10 hover:text-[#faf4ec]"
                aria-label="Close plant close-up"
                data-testid="dream-plant-closeup-close-icon"
              >
                <XIcon className="size-5" aria-hidden />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="pointer-events-none flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 py-6 sm:gap-6 sm:px-8">
            <svg
              viewBox="0 0 132 150"
              className="pointer-events-auto h-[min(52vh,440px)] w-full max-w-[min(92vw,420px)]"
              preserveAspectRatio="xMidYMax meet"
              role="img"
              aria-label={`${genome.name} at ${stage} growth stage`}
              data-testid="dream-plant-closeup-svg"
            >
              {buildMiniHybrid(stageIndex, genome, palette, rimStrength, plantMotion, 1.5)}
            </svg>

            <div className="pointer-events-auto w-full max-w-lg">
              <p className="mb-2 text-center font-mono text-[10px] font-semibold uppercase tracking-widest text-[#d4c4ff]">
                Growth stage
              </p>
              <div
                className="flex flex-wrap justify-center gap-1.5"
                role="group"
                aria-label="Switch growth stage preview"
              >
                {PLANT_STAGES_ORDER.map((s, i) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant="ghost"
                    data-testid={`dream-plant-closeup-stage-${s}`}
                    className={cn(
                      'h-8 border px-2.5 text-xs font-medium capitalize',
                      stageIndex === i
                        ? 'border-[#ffb877]/55 bg-[#ffb877]/20 text-[#ffddb0]'
                        : 'border-[#f0e7da]/25 bg-[#0d0913]/50 text-[#f0e7da]/85 hover:bg-[#f0e7da]/10',
                    )}
                    aria-pressed={stageIndex === i}
                    onClick={() => setStageIndex(i)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-auto border-t border-[#f0e7da]/15 bg-[#120e18]/92 px-4 py-3 backdrop-blur-md sm:px-6">
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full border border-[#f0e7da]/35 bg-[#f0e7da]/12 text-[#faf4ec] hover:bg-[#f0e7da]/18 sm:max-w-xs sm:mx-auto sm:block"
                data-testid="dream-plant-closeup-back"
              >
                Back to dream panel
              </Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
