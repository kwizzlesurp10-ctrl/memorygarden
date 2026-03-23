import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tree, CalendarBlank, MapPin, Plant } from '@phosphor-icons/react'
import { AudioPlayer } from '@/components/AudioPlayer'
import { format } from 'date-fns'
import type { SharedMemory } from '@/lib/types'

interface SharedMemoryViewProps {
  memory: SharedMemory
}

export function SharedMemoryView({ memory }: SharedMemoryViewProps) {
  const handleOpenApp = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-primary/5">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tree size={28} weight="duotone" className="text-primary" />
            <h1 className="text-xl font-bold">MemoryGarden</h1>
          </div>
          <Button onClick={handleOpenApp} size="sm">
            <Plant size={16} className="mr-2" />
            Create Your Garden
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {memory.sharedBy} shared a memory with you
            </p>
            <h2 className="text-3xl font-bold">A Shared Memory</h2>
          </div>

          <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border">
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <img
                src={memory.photoUrl}
                alt="Shared memory"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                    {memory.emotionalTone}
                  </Badge>
                  <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                    {memory.plantStage}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <p className="text-xl leading-relaxed">{memory.text}</p>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarBlank size={18} />
                  <span>{format(new Date(memory.date), 'MMMM d, yyyy')}</span>
                </div>
                {memory.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>{memory.location}</span>
                  </div>
                )}
              </div>

              {memory.audioRecordings && memory.audioRecordings.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Audio Recordings</h3>
                    <div className="space-y-3">
                      {memory.audioRecordings.map((recording) => (
                        <AudioPlayer
                          key={recording.id}
                          recording={recording}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Tree size={32} weight="duotone" className="text-primary" />
            </div>
            <h3 className="text-xl font-bold">Create Your Own Memory Garden</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Plant and nurture your own memories in a beautiful, private digital garden where moments grow and flourish over time.
            </p>
            <Button size="lg" onClick={handleOpenApp} className="mt-4">
              <Plant size={20} weight="fill" className="mr-2" />
              Start Your Garden
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>Shared on {format(new Date(memory.sharedAt), 'MMMM d, yyyy')}</p>
        </div>
      </footer>
    </div>
  )
}
