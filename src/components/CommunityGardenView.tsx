import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Heart, Drop, ChatCircle, Sparkle, 
  CircleNotch, Tree, MapPin, Calendar, X, Plus
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  fetchGardenDetail,
  leaveCommunityGarden,
  reflectOnGardenMemory,
  waterGardenMemory,
  type GardenActivity,
  type GardenMemory,
} from '@/lib/community-gardens-api'
import type { CommunityPrivacyMode } from '../../api/gardens/lib/community-memory-privacy'
import { toast } from 'sonner'

interface Garden {
  id: string
  name: string
  description?: string | null
  owner_name?: string | null
  owner_avatar_url?: string | null
  cover_image_url?: string | null
  member_count?: number
  memory_count?: number
  allow_reflections?: boolean
  viewer_is_member?: boolean
}

interface CommunityGardenViewProps {
  gardenId: string
  gardenName?: string
  userId?: string
  userName?: string
  privacyMode?: CommunityPrivacyMode
  onBack: () => void
  onPlantMemory?: (gardenName: string) => void
}

const STAGE_SIZES: Record<string, number> = {
  seed: 24,
  sprout: 32,
  seedling: 40,
  young: 52,
  bud: 60,
  flowering: 72,
  bloom: 80,
  mature: 90,
}

const EMOTIONAL_COLORS: Record<string, { bg: string; accent: string }> = {
  peaceful: { bg: 'bg-emerald-500/10', accent: 'text-emerald-600' },
  joyful: { bg: 'bg-amber-500/10', accent: 'text-amber-600' },
  nostalgic: { bg: 'bg-purple-500/10', accent: 'text-purple-600' },
  contemplative: { bg: 'bg-slate-500/10', accent: 'text-slate-600' },
  wonder: { bg: 'bg-pink-500/10', accent: 'text-pink-600' },
  happy: { bg: 'bg-orange-500/10', accent: 'text-orange-600' },
  love: { bg: 'bg-rose-500/10', accent: 'text-rose-600' },
  proud: { bg: 'bg-blue-500/10', accent: 'text-blue-600' },
  bittersweet: { bg: 'bg-violet-500/10', accent: 'text-violet-600' },
}

export function CommunityGardenView({ 
  gardenId,
  gardenName: gardenNameProp,
  userId, 
  userName,
  privacyMode = 'camouflage',
  onBack,
  onPlantMemory
}: CommunityGardenViewProps) {
  const [garden, setGarden] = useState<Garden | null>(null)
  const [memories, setMemories] = useState<GardenMemory[]>([])
  const [activity, setActivity] = useState<GardenActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<GardenMemory | null>(null)
  const [reflection, setReflection] = useState('')
  const [submittingReflection, setSubmittingReflection] = useState(false)
  const [wateringMemory, setWateringMemory] = useState<string | null>(null)

  const displayGardenName = garden?.name ?? gardenNameProp ?? 'Community garden'

  const fetchGarden = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const result = await fetchGardenDetail(gardenId, { viewerId: userId, privacyMode })
    if (!result.ok) {
      setGarden(null)
      setMemories([])
      setActivity([])
      setLoadError(result.error)
      setLoading(false)
      return
    }
    setGarden(result.value.garden as Garden)
    setMemories(result.value.memories)
    setActivity(result.value.activity)
    setIsMember(Boolean(result.value.garden.viewer_is_member))
    setLoading(false)
  }, [gardenId, userId, privacyMode])

  useEffect(() => {
    // Loads synchronous mock garden data when the selected garden changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: load on gardenId change
    fetchGarden()
  }, [fetchGarden])

  async function handleWaterMemory(memoryId: string) {
    if (!userId || !userName) {
      toast.error('Sign in to water memories')
      return
    }
    
    setWateringMemory(memoryId)
    const result = await waterGardenMemory({ memoryId, userId, userName })
    setWateringMemory(null)
    if (!result.ok) {
      toast.error('Could not water memory', { description: result.error })
      return
    }
    
    setMemories(prev => prev.map(m => 
      m.id === memoryId 
        ? {
            ...m,
            visit_count: result.value.visitCount,
            plant_stage: result.value.newStage ?? m.plant_stage,
          }
        : m
    ))
    
    if (selectedMemory?.id === memoryId) {
      setSelectedMemory(prev => prev ? { 
        ...prev, 
        visit_count: result.value.visitCount,
        plant_stage: result.value.newStage ?? prev.plant_stage,
      } : null)
    }
    void fetchGarden()
  }

  async function handleLeaveGarden() {
    if (!userId || !userName || !isMember) return
    setLeaving(true)
    const result = await leaveCommunityGarden({ gardenId, userId, userName })
    setLeaving(false)
    if (!result.ok) {
      toast.error('Could not leave garden', { description: result.error })
      return
    }
    toast.success(`Left ${displayGardenName}`)
    onBack()
  }

  async function handleAddReflection() {
    if (!selectedMemory || !reflection.trim() || !userId || !userName) return
    
    setSubmittingReflection(true)
    const result = await reflectOnGardenMemory({
      memoryId: selectedMemory.id,
      userId,
      userName,
      reflection: reflection.trim(),
    })
    setSubmittingReflection(false)
    if (!result.ok) {
      toast.error('Could not add reflection', { description: result.error })
      return
    }
    
    const newReflection = {
      id: result.value.reflection.id,
      userId,
      userName: result.value.reflection.userName ?? userName,
      text: result.value.reflection.text,
      createdAt: result.value.reflection.createdAt,
    }
    
    const newReflections = [...(selectedMemory.reflections || []), newReflection]
    setSelectedMemory(prev => prev ? { ...prev, reflections: newReflections } : null)
    setMemories(prev => prev.map(m => 
      m.id === selectedMemory.id ? { ...m, reflections: newReflections } : m
    ))
    setReflection('')
    void fetchGarden()
  }

  function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-background to-primary/5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <CircleNotch size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Entering garden...</p>
        </motion.div>
      </div>
    )
  }

  if (!garden) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Tree size={64} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{loadError ?? 'Garden not found'}</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-background to-primary/5">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">{garden.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {garden.member_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={14} />
                  {memories.length}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isMember && userId && (
              <Button variant="outline" size="sm" onClick={() => void handleLeaveGarden()} disabled={leaving}>
                {leaving ? <CircleNotch size={16} className="animate-spin" /> : 'Leave'}
              </Button>
            )}
            {onPlantMemory && (
              <Button onClick={() => onPlantMemory(displayGardenName)} size="sm">
                <Plus size={16} className="mr-2" />
                Plant Memory
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Garden Canvas */}
      <div className="flex-1 relative overflow-auto">
        <div 
          className="relative min-h-full"
          style={{ 
            width: Math.max(1200, ...memories.map(m => m.position_x + 150)),
            height: Math.max(800, ...memories.map(m => m.position_y + 150))
          }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="garden-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="currentColor" className="text-primary/20" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#garden-grid)" />
            </svg>
          </div>

          {/* Memory Plants */}
          {memories.map((memory, i) => {
            const size = STAGE_SIZES[memory.plant_stage] || 40
            const colors = EMOTIONAL_COLORS[memory.emotional_tone] || EMOTIONAL_COLORS.peaceful
            const isWatering = wateringMemory === memory.id
            
            return (
              <motion.div
                key={memory.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.05, type: 'spring' }}
                className="absolute cursor-pointer group"
                style={{
                  left: memory.position_x,
                  top: memory.position_y,
                  width: size,
                  height: size,
                }}
                onClick={() => setSelectedMemory(memory)}
              >
                {/* Plant visual */}
                <div 
                  className={cn(
                    "w-full h-full rounded-full overflow-hidden border-2 border-white/50 shadow-lg transition-transform group-hover:scale-110",
                    colors.bg
                  )}
                >
                  <img 
                    src={memory.photo_url} 
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Watering animation */}
                <AnimatePresence>
                  {isWatering && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2"
                    >
                      <Drop size={24} weight="fill" className="text-blue-400 animate-bounce" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Visit count */}
                {memory.visit_count > 0 && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {memory.visit_count}
                  </div>
                )}

                {/* Contributor name on hover */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs text-muted-foreground bg-background/90 px-2 py-0.5 rounded">
                  {memory.contributor_name}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Activity Feed Sidebar (hidden on mobile) */}
      <div className="hidden lg:block absolute right-4 top-20 w-72 max-h-[calc(100%-6rem)] overflow-y-auto bg-card/95 backdrop-blur rounded-2xl border border-border/50 shadow-xl">
        <div className="p-4 border-b border-border/50">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkle size={16} className="text-primary" />
            Recent Activity
          </h3>
        </div>
        <div className="p-2 space-y-1">
          {activity.slice(0, 10).map((act) => (
            <div key={act.id} className="px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <p className="text-sm">{act.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(act.created_at)}</p>
            </div>
          ))}
          {activity.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
          )}
        </div>
      </div>

      {/* Selected Memory Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedMemory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Memory Image */}
              <div className="relative h-64">
                <img 
                  src={selectedMemory.photo_url} 
                  alt=""
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white"
                  onClick={() => setSelectedMemory(null)}
                >
                  <X size={20} />
                </Button>
                
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    EMOTIONAL_COLORS[selectedMemory.emotional_tone]?.bg || 'bg-muted',
                    EMOTIONAL_COLORS[selectedMemory.emotional_tone]?.accent || 'text-foreground'
                  )}>
                    {selectedMemory.emotional_tone}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-black/30 text-white text-xs">
                    {selectedMemory.plant_stage}
                  </span>
                </div>
              </div>

              {/* Memory Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {selectedMemory.contributor_avatar_url ? (
                    <img 
                      src={selectedMemory.contributor_avatar_url} 
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {(selectedMemory.contributor_name ?? 'G')[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedMemory.contributor_name ?? 'A gardener'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {selectedMemory.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {selectedMemory.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(selectedMemory.planted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-foreground leading-relaxed mb-6">{selectedMemory.text}</p>

                {/* Stats & Actions */}
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWaterMemory(selectedMemory.id)}
                    disabled={wateringMemory === selectedMemory.id || !userId}
                  >
                    <Drop size={16} className="mr-2 text-blue-500" />
                    Water ({selectedMemory.visit_count})
                  </Button>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <ChatCircle size={16} />
                    {selectedMemory.reflections?.length || 0} reflections
                  </div>
                </div>

                {/* Reflections */}
                {selectedMemory.reflections && selectedMemory.reflections.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-medium text-muted-foreground">Reflections</h4>
                    {selectedMemory.reflections.map((ref) => (
                      <div key={ref.id} className="p-3 rounded-xl bg-muted/50">
                        <p className="text-sm">{ref.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ref.userName} &middot; {formatTimeAgo(ref.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Reflection */}
                {garden.allow_reflections && userId && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Share a thought or feeling about this memory..."
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <Button 
                      onClick={handleAddReflection}
                      disabled={!reflection.trim() || submittingReflection}
                      className="w-full"
                    >
                      {submittingReflection ? (
                        <CircleNotch size={16} className="animate-spin mr-2" />
                      ) : (
                        <ChatCircle size={16} className="mr-2" />
                      )}
                      Add Reflection
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
