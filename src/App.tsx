import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plant as PlantIcon, Tree, List, GridFour, Export, DotsThree } from '@phosphor-icons/react'
import { GardenCanvas } from '@/components/GardenCanvas'
import { PlantMemoryModal } from '@/components/PlantMemoryModal'
import { MemoryCard } from '@/components/MemoryCard'
import { Onboarding } from '@/components/Onboarding'
import { ExportGarden } from '@/components/ExportGarden'
import { MemoryClusters } from '@/components/MemoryClusters'
import { SeasonIndicator } from '@/components/SeasonIndicator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Memory, UserPreferences, AudioRecording } from '@/lib/types'
import { classifyEmotionalTone, generateAIReflection, getPlantStage, getSeason } from '@/lib/garden-helpers'

type ViewMode = 'garden' | 'timeline' | 'clusters'

function App() {
  const [user, setUser] = useState<{ login: string; avatarUrl: string } | null>(null)
  const [memories, setMemories] = useKV<Memory[]>('memories', [])
  const [preferences, setPreferences] = useKV<UserPreferences>('preferences', {
    hasCompletedOnboarding: false,
    soundEnabled: false,
    lastVisit: new Date().toISOString(),
  })

  const [viewMode, setViewMode] = useState<ViewMode>('garden')
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [aiReflection, setAiReflection] = useState<string>('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [season, setSeason] = useState(getSeason())

  useEffect(() => {
    window.spark.user().then(setUser).catch(() => {
      toast.error('Failed to load user. Please refresh the page.')
    })
  }, [])

  useEffect(() => {
    if (preferences && memories && memories.length === 0 && preferences.hasCompletedOnboarding) {
      setTimeout(() => setIsPlantModalOpen(true), 1000)
    }
  }, [preferences, memories])

  useEffect(() => {
    const interval = setInterval(() => {
      setSeason(getSeason())
    }, 3600000)
    return () => clearInterval(interval)
  }, [])

  const handleCompleteOnboarding = () => {
    setPreferences((current) => ({
      soundEnabled: current?.soundEnabled || false,
      lastVisit: current?.lastVisit || new Date().toISOString(),
      hasCompletedOnboarding: true,
    }))
    setIsPlantModalOpen(true)
  }

  const handlePlantMemory = async (data: {
    photoFile: File
    text: string
    date: string
    location?: string
    audioRecordings: AudioRecording[]
  }) => {
    const reader = new FileReader()
    reader.readAsDataURL(data.photoFile)
    
    return new Promise<void>((resolve, reject) => {
      reader.onload = async () => {
        try {
          const photoUrl = reader.result as string
          
          const emotionalTone = await classifyEmotionalTone(data.text)
          
          const newMemory: Memory = {
            id: `memory-${Date.now()}`,
            photoUrl,
            text: data.text,
            date: data.date,
            location: data.location,
            plantedAt: new Date().toISOString(),
            position: {
              x: 400 + Math.random() * 800,
              y: 400 + Math.random() * 800,
            },
            emotionalTone,
            plantStage: 'seed',
            visitCount: 0,
            reflections: [],
            audioRecordings: data.audioRecordings,
          }

          setMemories((currentMemories) => [...(currentMemories || []), newMemory])
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  }

  const handleMemoryClick = (memory: Memory) => {
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) =>
        m.id === memory.id
          ? {
              ...m,
              visitCount: m.visitCount + 1,
              lastVisited: new Date().toISOString(),
              plantStage: getPlantStage({ ...m, visitCount: m.visitCount + 1 }),
            }
          : m
      )
    )
    
    const updatedMemory = (memories || []).find((m) => m.id === memory.id)
    setSelectedMemory(updatedMemory || memory)
    setAiReflection('')
  }

  const handleMemoryMove = (memoryId: string, newPosition: { x: number; y: number }) => {
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) =>
        m.id === memoryId ? { ...m, position: newPosition } : m
      )
    )
  }

  const handleWater = async (memoryId: string, reflectionText: string) => {
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) =>
        m.id === memoryId
          ? {
              ...m,
              reflections: [
                ...m.reflections,
                {
                  id: `reflection-${Date.now()}`,
                  text: reflectionText,
                  createdAt: new Date().toISOString(),
                },
              ],
              plantStage: getPlantStage({ ...m, visitCount: m.visitCount + 1 }),
            }
          : m
      )
    )
    
    const updatedMemory = (memories || []).find((m) => m.id === memoryId)
    if (updatedMemory) {
      setSelectedMemory(updatedMemory)
    }
  }

  const handleAskAI = async (memoryId: string) => {
    const memory = (memories || []).find((m) => m.id === memoryId)
    if (!memory) return

    setIsLoadingAI(true)
    try {
      const nearbyMemories = (memories || []).filter(
        (m) =>
          m.id !== memoryId &&
          Math.abs(m.position.x - memory.position.x) < 300 &&
          Math.abs(m.position.y - memory.position.y) < 300
      ).slice(0, 3)

      const reflection = await generateAIReflection(memory, nearbyMemories)
      setAiReflection(reflection)
    } catch (error) {
      toast.error('Failed to generate reflection. Please try again.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  const safeMemories = memories || []
  const safePreferences = preferences || { hasCompletedOnboarding: false, soundEnabled: false, lastVisit: '' }

  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Tree size={64} weight="duotone" className="text-primary mx-auto" />
          <h1 className="text-3xl font-bold">MemoryGarden</h1>
          <p className="text-muted-foreground">Loading your garden...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      
      <Onboarding
        open={!safePreferences.hasCompletedOnboarding}
        onComplete={handleCompleteOnboarding}
      />

      <div className="w-full h-screen flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <Tree size={32} weight="duotone" className="text-primary" />
            <h1 className="text-xl font-bold">MemoryGarden</h1>
            <SeasonIndicator season={season} />
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="hidden md:block">
            <TabsList>
              <TabsTrigger value="garden" className="flex items-center gap-2">
                <Tree size={18} />
                Garden
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <List size={18} />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="clusters" className="flex items-center gap-2">
                <GridFour size={18} />
                Clusters
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <DotsThree size={24} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsExportModalOpen(true)}>
                  <Export size={16} className="mr-2" />
                  Export Garden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Avatar className="w-9 h-9">
              <AvatarImage src={user.avatarUrl} alt={user.login} />
              <AvatarFallback>{user.login[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === 'garden' && (
              <motion.div
                key="garden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                {safeMemories.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-primary/5">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center space-y-4 max-w-md px-6"
                    >
                      <PlantIcon size={80} weight="duotone" className="text-primary mx-auto" />
                      <h2 className="text-2xl font-bold">Your garden awaits</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        Plant your first memory to begin growing your personal sanctuary of
                        moments, reflections, and connections.
                      </p>
                      <Button size="lg" onClick={() => setIsPlantModalOpen(true)} className="mt-6">
                        <PlantIcon size={20} weight="fill" className="mr-2" />
                        Plant Your First Memory
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <GardenCanvas
                    memories={safeMemories}
                    onMemoryClick={handleMemoryClick}
                    onMemoryMove={handleMemoryMove}
                    season={season}
                  />
                )}
              </motion.div>
            )}

            {viewMode === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full overflow-y-auto p-8 bg-background"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  <h2 className="text-2xl font-bold mb-8">Timeline</h2>
                  {safeMemories.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">
                      No memories yet. Plant your first one to get started!
                    </p>
                  ) : (
                    [...safeMemories]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((memory) => (
                        <motion.div
                          key={memory.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleMemoryClick(memory)}
                          className="flex gap-4 p-4 bg-card rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <img
                            src={memory.photoUrl}
                            alt="Memory"
                            className="w-32 h-32 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground mb-2">
                              {new Date(memory.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="line-clamp-2">{memory.text}</p>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </motion.div>
            )}

            {viewMode === 'clusters' && (
              <motion.div
                key="clusters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <MemoryClusters memories={safeMemories} onMemoryClick={handleMemoryClick} />
              </motion.div>
            )}
          </AnimatePresence>

          {safeMemories.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="fixed bottom-8 right-8 z-20"
            >
              <Button
                size="lg"
                onClick={() => setIsPlantModalOpen(true)}
                className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-shadow"
              >
                <PlantIcon size={28} weight="fill" />
              </Button>
            </motion.div>
          )}
        </main>
      </div>

      <PlantMemoryModal
        open={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        onPlant={handlePlantMemory}
      />

      <MemoryCard
        memory={selectedMemory}
        open={selectedMemory !== null}
        onClose={() => {
          setSelectedMemory(null)
          setAiReflection('')
        }}
        onWater={handleWater}
        onAskAI={handleAskAI}
        aiReflection={aiReflection}
        isLoadingAI={isLoadingAI}
      />

      <ExportGarden
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        memories={safeMemories}
      />
    </>
  )
}

export default App
