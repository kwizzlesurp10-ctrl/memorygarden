import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Drop, Sparkle, MapPin, CalendarBlank } from '@phosphor-icons/react'
import { AudioPlayer } from '@/components/AudioPlayer'
import { format } from 'date-fns'
import type { Memory } from '@/lib/types'
import { toast } from 'sonner'

interface MemoryCardProps {
  memory: Memory | null
  open: boolean
  onClose: () => void
  onWater: (memoryId: string, reflection: string) => void
  onAskAI: (memoryId: string) => void
  aiReflection?: string
  isLoadingAI?: boolean
}

export function MemoryCard({
  memory,
  open,
  onClose,
  onWater,
  onAskAI,
  aiReflection,
  isLoadingAI,
}: MemoryCardProps) {
  const [newReflection, setNewReflection] = useState('')
  const [isAddingReflection, setIsAddingReflection] = useState(false)

  if (!memory) return null

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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="flex flex-col h-full"
        >
          <div className="relative w-full h-80 overflow-hidden">
            <img
              src={memory.photoUrl}
              alt="Memory"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                  {memory.emotionalTone}
                </Badge>
                <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                  {memory.plantStage}
                </Badge>
                <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                  Visited {memory.visitCount} times
                </Badge>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
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
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
