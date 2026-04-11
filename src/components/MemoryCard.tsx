import { useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Drop, Sparkle, MapPin, CalendarBlank, ShareNetwork, ChartBar, Lightning, Palette, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { AudioPlayer } from '@/components/AudioPlayer'
import { PlantCustomizer } from '@/components/PlantCustomizer'
import { format } from 'date-fns'
import type { Memory, PlantTraits } from '@/lib/types'
import { toast } from 'sonner'
import { calculateGrowthMetrics } from '@/lib/garden-helpers'
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts'
import { useIsMobile } from '@/hooks/use-mobile'

interface MemoryCardProps {
  memory: Memory | null
  open: boolean
  onClose: () => void
  onWater: (memoryId: string, reflection: string) => void
  onAskAI: (memoryId: string) => void
  onShare?: (memoryId: string) => void
  onBoost?: (memoryId: string) => void
  onUpdateTraits?: (memoryId: string, traits: PlantTraits) => void
  onCustomize?: () => void
  aiReflection?: string
  isLoadingAI?: boolean
  allMemories?: Memory[]
  onNavigate?: (memoryId: string) => void
}

export function MemoryCard({
  memory,
  open,
  onClose,
  onWater,
  onAskAI,
  onShare,
  onBoost,
  onUpdateTraits,
  onCustomize,
  aiReflection,
  isLoadingAI,
  allMemories = [],
  onNavigate,
}: MemoryCardProps) {
  const [newReflection, setNewReflection] = useState('')
  const [isAddingReflection, setIsAddingReflection] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)
  const [isSwipeTransitioning, setIsSwipeTransitioning] = useState(false)
  const isMobile = useIsMobile()

  const dragX = useMotionValue(0)
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5])
  const dragScale = useTransform(dragX, [-200, 0, 200], [0.95, 1, 0.95])

  if (!memory) return null

  const metrics = calculateGrowthMetrics(memory, [])
  const isLegendary = metrics.rarityScore > 90

  const sortedMemories = [...allMemories].sort((a, b) => 
    new Date(b.plantedAt).getTime() - new Date(a.plantedAt).getTime()
  )
  const currentIndex = sortedMemories.findIndex(m => m.id === memory.id)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < sortedMemories.length - 1

  const handlePrevious = () => {
    if (hasPrevious && onNavigate && !isSwipeTransitioning) {
      setIsSwipeTransitioning(true)
      onNavigate(sortedMemories[currentIndex - 1].id)
      setTimeout(() => setIsSwipeTransitioning(false), 300)
    }
  }

  const handleNext = () => {
    if (hasNext && onNavigate && !isSwipeTransitioning) {
      setIsSwipeTransitioning(true)
      onNavigate(sortedMemories[currentIndex + 1].id)
      setTimeout(() => setIsSwipeTransitioning(false), 300)
    }
  }

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100
    const swipeVelocityThreshold = 500

    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > swipeVelocityThreshold) {
      if (info.offset.x > 0 && hasPrevious) {
        handlePrevious()
      } else if (info.offset.x < 0 && hasNext) {
        handleNext()
      }
    }
  }

  useKeyboardShortcuts({
    shortcuts: [
      {
        id: 'memory-card-previous',
        descriptor: {
          key: 'ArrowLeft',
          description: 'Previous memory',
          category: 'Memory Navigation',
          global: true,
        },
        handler: handlePrevious,
      },
      {
        id: 'memory-card-next',
        descriptor: {
          key: 'ArrowRight',
          description: 'Next memory',
          category: 'Memory Navigation',
          global: true,
        },
        handler: handleNext,
      },
      {
        id: 'memory-card-previous-j',
        descriptor: {
          key: 'j',
          description: 'Previous memory (J)',
          category: 'Memory Navigation',
        },
        handler: handlePrevious,
      },
      {
        id: 'memory-card-next-k',
        descriptor: {
          key: 'k',
          description: 'Next memory (K)',
          category: 'Memory Navigation',
        },
        handler: handleNext,
      },
    ],
    enabled: open && allMemories.length > 1 && !!onNavigate,
  })

  const handleWater = async () => {
    if (newReflection.trim().length < 3) {
      toast.error('Please write a few words of reflection')
      return
    }
    
    setIsAddingReflection(true)
    try {
      await onWater(memory.id, newReflection.trim())
      setNewReflection('')
      toast.success('Reflection added! Your plant has grown.')
    } catch (error) {
      toast.error('Failed to add reflection')
    } finally {
      setIsAddingReflection(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">Memory Details</DialogTitle>
        <DialogDescription className="sr-only">View and reflect on your memory</DialogDescription>
        
        {allMemories.length > 1 && onNavigate && (
          <>
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-10 pointer-events-none flex items-center justify-between px-4">
              <Button
                size="icon"
                variant="secondary"
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="pointer-events-auto rounded-full bg-card/90 backdrop-blur-sm hover:bg-card shadow-lg disabled:opacity-30"
                title="Previous memory (← or J)"
              >
                <CaretLeft size={24} weight="bold" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={handleNext}
                disabled={!hasNext}
                className="pointer-events-auto rounded-full bg-card/90 backdrop-blur-sm hover:bg-card shadow-lg disabled:opacity-30"
                title="Next memory (→ or K)"
              >
                <CaretRight size={24} weight="bold" />
              </Button>
            </div>

            {isMobile && (
              <div className="absolute top-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
                <div className="px-4 py-2 bg-card/90 backdrop-blur-sm rounded-full shadow-lg text-xs text-muted-foreground">
                  Swipe to navigate
                </div>
              </div>
            )}
          </>
        )}
        
        <motion.div
          key={memory.id}
          className="flex-1 overflow-y-auto"
          drag={isMobile && allMemories.length > 1 && onNavigate ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{
            x: dragX,
            opacity: dragOpacity,
            scale: dragScale,
          }}
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative w-full h-80 flex-shrink-0 overflow-hidden"
          >
            <img
              src={memory.photoUrl}
              alt="Memory"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                  {memory.emotionalTone}
                </Badge>
                <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                  {memory.plantStage}
                </Badge>
                <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                  Visited {memory.visitCount} times
                </Badge>
                {isLegendary && (
                  <Badge variant="default" className="bg-accent/90 backdrop-blur-sm">
                    ✨ Legendary
                  </Badge>
                )}
                {allMemories.length > 1 && (
                  <Badge variant="outline" className="bg-card/80 backdrop-blur-sm">
                    {currentIndex + 1} / {sortedMemories.length}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setShowMetrics(!showMetrics)}
                  className="bg-card/80 backdrop-blur-sm hover:bg-card"
                  title="View growth metrics"
                >
                  <ChartBar size={20} weight="bold" />
                </Button>
                {onShare && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => onShare(memory.id)}
                    className="bg-card/80 backdrop-blur-sm hover:bg-card"
                    title="Share this memory"
                  >
                    <ShareNetwork size={20} weight="bold" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          <div className="p-6 space-y-6">
              <div>
                <p className="text-lg leading-relaxed">{memory.text}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarBlank size={16} />
                  <span>{format(new Date(memory.date), 'MMMM d, yyyy')}</span>
                </div>
                {memory.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{memory.location}</span>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showMetrics && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Growth Metrics
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Vitality</div>
                          <div className="font-semibold">{Math.round(metrics.vitality)}/100</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Height</div>
                          <div className="font-semibold">{metrics.height}px</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Blooms</div>
                          <div className="font-semibold">{metrics.bloomCount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Foliage Density</div>
                          <div className="font-semibold">{Math.round(metrics.foliageDensity * 100)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Rarity Score</div>
                          <div className="font-semibold">{metrics.rarityScore}/100</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Width</div>
                          <div className="font-semibold">{metrics.width}px</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {memory.reflections.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Reflections
                    </h3>
                    {memory.reflections.map((reflection) => (
                      <motion.div
                        key={reflection.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="pl-4 border-l-2 border-primary/30"
                      >
                        <p className="text-sm leading-relaxed mb-1">{reflection.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(reflection.createdAt), 'MMM d, yyyy')}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {memory.audioRecordings && memory.audioRecordings.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Audio Recordings
                    </h3>
                    {memory.audioRecordings.map((recording) => (
                      <AudioPlayer key={recording.id} recording={recording} />
                    ))}
                  </div>
                </>
              )}

              {aiReflection && (
                <>
                  <Separator />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-accent/10 rounded-lg border border-accent/20"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkle className="text-accent flex-shrink-0 mt-0.5" size={18} weight="fill" />
                      <h3 className="font-semibold text-sm">Garden Reflection</h3>
                    </div>
                    <p className="text-sm leading-relaxed italic">{aiReflection}</p>
                  </motion.div>
                </>
              )}

              {onUpdateTraits && (
                <>
                  <Separator />
                  <PlantCustomizer
                    memory={memory}
                    onUpdateTraits={onUpdateTraits}
                  />
                </>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Add a Reflection
                  </label>
                  <Textarea
                    placeholder="What new thoughts arise when you revisit this memory?"
                    value={newReflection}
                    onChange={(e) => setNewReflection(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleWater}
                    disabled={isAddingReflection || newReflection.trim().length < 3}
                    className="flex-1"
                  >
                    <Drop size={18} weight="fill" className="mr-2" />
                    Water & Reflect
                  </Button>
                  <Button
                    onClick={() => onAskAI(memory.id)}
                    disabled={isLoadingAI}
                    variant="outline"
                    className="flex-1"
                  >
                    <AnimatePresence mode="wait">
                      {isLoadingAI ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Reflecting...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="ask"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Sparkle size={18} weight="fill" />
                          Ask the Garden
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
                
                {onBoost && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      onClick={() => onBoost(memory.id)}
                      variant="outline"
                      className="w-full border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <Lightning size={18} weight="fill" className="mr-2 text-primary" />
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-semibold">
                        Apply Premium Fertilizer
                      </span>
                    </Button>
                  </motion.div>
                )}

                {onCustomize && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      onClick={onCustomize}
                      variant="outline"
                      className="w-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <Palette size={18} weight="duotone" className="mr-2 text-primary" />
                      Customize Plant
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }
