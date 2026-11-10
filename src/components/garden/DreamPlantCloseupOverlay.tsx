import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import ChevronLeftIcon from 'lucide-react/dist/esm/icons/chevron-left'
import ChevronRightIcon from 'lucide-react/dist/esm/icons/chevron-right'
import XIcon from 'lucide-react/dist/esm/icons/x'
import type { HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { clampCloseupStageIndex, DREAM_CLOSEUP_DEFAULT_STAGE_INDEX } from '@/lib/garden/dream-closeup'
import { indexToPlantStage } from '@/lib/garden/stage'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'
import { DreamPlantCloseupSvg } from '@/components/garden/DreamPlantCloseupSvg'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const HISTORY_KEY = 'mgDreamCloseup'
const STAGE_COUNT = PLANT_STAGES_ORDER.length

export interface DreamPlantCloseupOverlayProps {
  open: boolean
  onClose: () => void
  genome: HybridGenome
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  initialStageIndex?: number
  returnFocusRef?: RefObject<HTMLButtonElement | null>
}

export function DreamPlantCloseupOverlay({
  open,
  onClose,
  genome,
  palette,
  rimStrength,
  motion,
  initialStageIndex = DREAM_CLOSEUP_DEFAULT_STAGE_INDEX,
  returnFocusRef,
}: DreamPlantCloseupOverlayProps) {
  const reducedMotion = useReducedMotion()
  const titleId = useId()
  const descId = useId()
  const [stageIndex, setStageIndex] = useState(() => clampCloseupStageIndex(initialStageIndex))
  const historyPushedRef = useRef(false)
  const touchStartXRef = useRef<number | null>(null)
  const plantMotion = motion && !reducedMotion
  const showDebugFrame =
    typeof window !== 'undefined' && window.localStorage?.getItem('memorygarden:debug-closeup-frame') === '1'
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

  const goPrev = useCallback(() => {
    setStageIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setStageIndex((i) => Math.min(STAGE_COUNT - 1, i + 1))
  }, [])

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
  }, [open, finishClose, initialStageIndex])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, goPrev, goNext])

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
            'pointer-events-none fixed inset-0 z-50 flex flex-col overflow-visible',
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
          <div className="pointer-events-auto flex shrink-0 items-start justify-between gap-3 border-b border-[#f0e7da]/15 bg-[#120e18]/92 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="min-w-0 space-y-1">
              <DialogTitle id={titleId} className="truncate text-xl font-semibold text-[#faf4ec] sm:text-2xl">
                {genome.name}
              </DialogTitle>
              <DialogDescription id={descId} className="font-sans text-sm text-[#f0e7da]/85">
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

          <div className="pointer-events-none flex min-h-0 flex-1 flex-col overflow-visible">
            <div
              className="pointer-events-auto relative flex min-h-0 flex-1 items-center justify-center gap-2 overflow-visible px-2 py-3 sm:gap-3 sm:px-4"
              onTouchStart={(event) => {
                touchStartXRef.current = event.changedTouches[0]?.clientX ?? null
              }}
              onTouchEnd={(event) => {
                const start = touchStartXRef.current
                if (start == null) return
                const dx = (event.changedTouches[0]?.clientX ?? start) - start
                if (dx > 52) goPrev()
                else if (dx < -52) goNext()
                touchStartXRef.current = null
              }}
            >
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="pointer-events-auto hidden size-9 shrink-0 border-[#f0e7da]/30 bg-[#120e18]/80 text-[#f0e7da] sm:inline-flex"
                aria-label="Previous growth stage"
                data-testid="dream-plant-closeup-prev"
                disabled={stageIndex === 0}
                onClick={goPrev}
              >
                <ChevronLeftIcon className="size-5" aria-hidden />
              </Button>

              <div className="flex h-full min-h-[100px] w-full min-w-0 flex-1 items-center justify-center overflow-visible">
                <DreamPlantCloseupSvg
                  stageIndex={stageIndex}
                  genome={genome}
                  palette={palette}
                  rimStrength={rimStrength}
                  motion={plantMotion}
                  stageLabel={stage}
                  dialogOpen={open}
                  showDebugFrame={showDebugFrame}
                  className="max-h-full max-w-full"
                />
              </div>

              <Button
                type="button"
                size="icon"
                variant="outline"
                className="pointer-events-auto hidden size-9 shrink-0 border-[#f0e7da]/30 bg-[#120e18]/80 text-[#f0e7da] sm:inline-flex"
                aria-label="Next growth stage"
                data-testid="dream-plant-closeup-next"
                disabled={stageIndex === STAGE_COUNT - 1}
                onClick={goNext}
              >
                <ChevronRightIcon className="size-5" aria-hidden />
              </Button>
            </div>

            <div className="pointer-events-auto w-full shrink-0 px-4 pb-3 pt-1 sm:px-6">
              <p className="mb-2 text-center font-mono text-[10px] font-semibold uppercase tracking-widest text-[#d4c4ff]">
                Growth stage
              </p>
              <div
                className="flex flex-wrap justify-center gap-1.5"
                role="group"
                aria-label="Switch growth stage preview"
              >
                {PLANT_STAGES_ORDER.map((s, i) => {
                  const selected = stageIndex === i
                  return (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid={`dream-plant-closeup-stage-${s}`}
                      className={cn(
                        'h-8 border px-2.5 text-xs font-medium capitalize shadow-none',
                        'focus-visible:border-[#f0e7da]/25 focus-visible:ring-2 focus-visible:ring-[#ffb877]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#120e18]',
                        selected
                          ? 'border-[#ffb877] bg-[#ffb877]/55 font-semibold text-[#1a1208] shadow-[inset_0_0_0_1px_rgba(255,216,160,0.35)] hover:bg-[#ffb877]/55 hover:text-[#1a1208]'
                          : cn(
                              'border-[#f0e7da]/25 bg-[#0d0913]/50 text-[#f0e7da]/85',
                              'hover:bg-[#0d0913]/50 hover:text-[#f0e7da]/85',
                              '[@media(hover:hover)]:hover:border-[#f0e7da]/40 [@media(hover:hover)]:hover:bg-[#f0e7da]/10',
                            ),
                      )}
                      aria-pressed={selected}
                      onClick={(event) => {
                        setStageIndex(i)
                        event.currentTarget.blur()
                      }}
                    >
                      {s}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="pointer-events-auto shrink-0 border-t border-[#f0e7da]/15 bg-[#120e18]/92 px-4 py-3 backdrop-blur-md sm:px-6">
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full border border-[#f0e7da]/35 bg-[#f0e7da]/12 text-[#faf4ec] hover:bg-[#f0e7da]/18 sm:mx-auto sm:block sm:max-w-xs"
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
