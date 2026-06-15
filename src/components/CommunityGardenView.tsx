import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Users, Heart, Drop, ChatCircle, Sparkle, 
  CircleNotch, Tree, MapPin, Calendar, X, Plus
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface GardenMemory {
  id: string
  garden_id: string
  contributor_id: string
  contributor_name: string
  contributor_avatar_url?: string
  photo_url: string
  text: string
  memory_date?: string
  location?: string
  planted_at: string
  position_x: number
  position_y: number
  emotional_tone: string
  plant_stage: string
  plant_variety: string
  visit_count: number
  reflections: Array<{
    id: string
    userId: string
    userName: string
    text: string
    createdAt: string
  }>
}

interface GardenActivity {
  id: string
  user_name: string
  activity_type: 'plant' | 'water' | 'reflect' | 'join' | 'leave'
  description: string
  created_at: string
}

interface Garden {
  id: string
  name: string
  description: string
  owner_name: string
  owner_avatar_url?: string
  cover_image_url?: string
  member_count: number
  memory_count: number
  allow_reflections: boolean
}

interface CommunityGardenViewProps {
  gardenId: string
  userId?: string
  userName?: string
  onBack: () => void
  onPlantMemory?: (gardenId: string) => void
}

// Hardcoded garden data matching the database
const GARDEN_DATA: Record<string, { garden: Garden; memories: GardenMemory[]; activity: GardenActivity[] }> = {
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890': {
    garden: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Sakura Reflections',
      description: 'A tranquil space celebrating Japanese aesthetics and mindful moments.',
      owner_name: 'Yuki Tanaka',
      owner_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
      cover_image_url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800',
      member_count: 12,
      memory_count: 3,
      allow_reflections: true
    },
    memories: [
      {
        id: 'sakura-1',
        garden_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        contributor_id: 'system-sakura',
        contributor_name: 'Yuki Tanaka',
        photo_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
        text: 'Morning meditation under the cherry blossoms. The petals fell like pink snow, each one a reminder to breathe and be present.',
        location: 'Kyoto, Japan',
        planted_at: new Date().toISOString(),
        position_x: 300,
        position_y: 400,
        emotional_tone: 'peaceful',
        plant_stage: 'bloom',
        plant_variety: 'flower',
        visit_count: 24,
        reflections: []
      },
      {
        id: 'sakura-2',
        garden_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        contributor_id: 'visitor-1',
        contributor_name: 'Kenji M.',
        photo_url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
        text: 'Found this quiet temple garden on a rainy afternoon. The sound of water on stone was like music.',
        location: 'Nara, Japan',
        planted_at: new Date().toISOString(),
        position_x: 550,
        position_y: 350,
        emotional_tone: 'contemplative',
        plant_stage: 'mature',
        plant_variety: 'tree',
        visit_count: 18,
        reflections: []
      },
      {
        id: 'sakura-3',
        garden_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        contributor_id: 'visitor-2',
        contributor_name: 'Sakura L.',
        photo_url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400',
        text: 'Tea ceremony with grandmother. She taught me that every gesture has meaning, every moment is precious.',
        location: 'Tokyo, Japan',
        planted_at: new Date().toISOString(),
        position_x: 450,
        position_y: 520,
        emotional_tone: 'nostalgic',
        plant_stage: 'flowering',
        plant_variety: 'flower',
        visit_count: 31,
        reflections: []
      }
    ],
    activity: [
      { id: '1', user_name: 'Sakura L.', activity_type: 'plant', description: 'Sakura L. planted a new memory', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: '2', user_name: 'Kenji M.', activity_type: 'water', description: 'Kenji M. watered a memory', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      { id: '3', user_name: 'Yuki Tanaka', activity_type: 'join', description: 'Yuki Tanaka joined the garden', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  'b2c3d4e5-f6a7-8901-bcde-f12345678901': {
    garden: {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      name: 'Ocean Whispers',
      description: 'For those who find solace by the sea. Plant memories of coastal adventures.',
      owner_name: 'Marina Costa',
      owner_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marina',
      cover_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      member_count: 29,
      memory_count: 4,
      allow_reflections: true
    },
    memories: [
      {
        id: 'ocean-1',
        garden_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        contributor_id: 'system-ocean',
        contributor_name: 'Marina Costa',
        photo_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400',
        text: 'Sunrise surf session. Just me and the waves, feeling completely alive and free.',
        location: 'Malibu, California',
        planted_at: new Date().toISOString(),
        position_x: 280,
        position_y: 380,
        emotional_tone: 'joyful',
        plant_stage: 'bloom',
        plant_variety: 'wildflower',
        visit_count: 42,
        reflections: []
      },
      {
        id: 'ocean-2',
        garden_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        contributor_id: 'visitor-3',
        contributor_name: 'Carlos R.',
        photo_url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400',
        text: "Watching dolphins play from the pier at sunset. Nature's reminder that magic is everywhere.",
        location: 'Santa Monica, California',
        planted_at: new Date().toISOString(),
        position_x: 520,
        position_y: 300,
        emotional_tone: 'wonder',
        plant_stage: 'mature',
        plant_variety: 'flower',
        visit_count: 28,
        reflections: []
      },
      {
        id: 'ocean-3',
        garden_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        contributor_id: 'visitor-4',
        contributor_name: 'Lina W.',
        photo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
        text: 'Building sandcastles with my niece. She said we were making homes for mermaids.',
        location: 'Cancun, Mexico',
        planted_at: new Date().toISOString(),
        position_x: 400,
        position_y: 480,
        emotional_tone: 'happy',
        plant_stage: 'flowering',
        plant_variety: 'herb',
        visit_count: 15,
        reflections: []
      },
      {
        id: 'ocean-4',
        garden_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        contributor_id: 'visitor-5',
        contributor_name: 'James T.',
        photo_url: 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=400',
        text: 'The day I proposed, right here on this beach. She said yes as the waves crashed behind us.',
        location: 'Maui, Hawaii',
        planted_at: new Date().toISOString(),
        position_x: 620,
        position_y: 420,
        emotional_tone: 'love',
        plant_stage: 'bloom',
        plant_variety: 'flower',
        visit_count: 56,
        reflections: []
      }
    ],
    activity: [
      { id: '4', user_name: 'James T.', activity_type: 'plant', description: 'James T. planted a new memory', created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
      { id: '5', user_name: 'Lina W.', activity_type: 'reflect', description: 'Lina W. added a reflection', created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
      { id: '6', user_name: 'Marina Costa', activity_type: 'water', description: 'Marina Costa watered a memory', created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() }
    ]
  },
  'c3d4e5f6-a7b8-9012-cdef-123456789012': {
    garden: {
      id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      name: 'The Little Wild',
      description: 'Celebrating childhood wonder and family adventures.',
      owner_name: 'Emma Wilde',
      owner_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      cover_image_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
      member_count: 8,
      memory_count: 4,
      allow_reflections: true
    },
    memories: [
      {
        id: 'wild-1',
        garden_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        contributor_id: 'system-wild',
        contributor_name: 'Emma Wilde',
        photo_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
        text: 'First day of kindergarten. She was so brave, waving goodbye with that huge backpack. I cried in the car.',
        location: 'Portland, Oregon',
        planted_at: new Date().toISOString(),
        position_x: 350,
        position_y: 360,
        emotional_tone: 'bittersweet',
        plant_stage: 'mature',
        plant_variety: 'tree',
        visit_count: 67,
        reflections: []
      },
      {
        id: 'wild-2',
        garden_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        contributor_id: 'visitor-6',
        contributor_name: 'David P.',
        photo_url: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=400',
        text: 'Teaching my son to ride a bike. That moment when he finally got it - pure triumph on his face!',
        location: 'Austin, Texas',
        planted_at: new Date().toISOString(),
        position_x: 500,
        position_y: 450,
        emotional_tone: 'proud',
        plant_stage: 'bloom',
        plant_variety: 'flower',
        visit_count: 34,
        reflections: []
      },
      {
        id: 'wild-3',
        garden_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        contributor_id: 'visitor-7',
        contributor_name: 'Sophie M.',
        photo_url: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=400',
        text: 'Camping under the stars. My daughter asked if we could catch a star and keep it as a nightlight.',
        location: 'Yellowstone',
        planted_at: new Date().toISOString(),
        position_x: 280,
        position_y: 520,
        emotional_tone: 'wonder',
        plant_stage: 'flowering',
        plant_variety: 'wildflower',
        visit_count: 23,
        reflections: []
      },
      {
        id: 'wild-4',
        garden_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        contributor_id: 'visitor-8',
        contributor_name: 'Michael K.',
        photo_url: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400',
        text: 'Snow day! We built the most lopsided snowman ever, but the kids thought it was perfect.',
        location: 'Denver, Colorado',
        planted_at: new Date().toISOString(),
        position_x: 600,
        position_y: 340,
        emotional_tone: 'happy',
        plant_stage: 'mature',
        plant_variety: 'flower',
        visit_count: 41,
        reflections: []
      }
    ],
    activity: [
      { id: '7', user_name: 'Michael K.', activity_type: 'plant', description: 'Michael K. planted a new memory', created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
      { id: '8', user_name: 'Sophie M.', activity_type: 'water', description: 'Sophie M. watered a memory', created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
      { id: '9', user_name: 'Emma Wilde', activity_type: 'reflect', description: 'Emma Wilde added a reflection', created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }
    ]
  }
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
  userId, 
  userName, 
  onBack,
  onPlantMemory
}: CommunityGardenViewProps) {
  const [garden, setGarden] = useState<Garden | null>(null)
  const [memories, setMemories] = useState<GardenMemory[]>([])
  const [activity, setActivity] = useState<GardenActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMemory, setSelectedMemory] = useState<GardenMemory | null>(null)
  const [reflection, setReflection] = useState('')
  const [submittingReflection, setSubmittingReflection] = useState(false)
  const [wateringMemory, setWateringMemory] = useState<string | null>(null)

  const fetchGarden = useCallback(async () => {
    setLoading(true)
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const data = GARDEN_DATA[gardenId]
    if (data) {
      setGarden(data.garden)
      setMemories(data.memories)
      setActivity(data.activity)
    }
    setLoading(false)
  }, [gardenId])

  useEffect(() => {
    // Loads synchronous mock garden data when the selected garden changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: load on gardenId change
    fetchGarden()
  }, [fetchGarden])

  async function handleWaterMemory(memoryId: string) {
    if (!userId || !userName) return
    
    setWateringMemory(memoryId)
    
    // Simulate watering
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setMemories(prev => prev.map(m => 
      m.id === memoryId 
        ? { ...m, visit_count: m.visit_count + 1 }
        : m
    ))
    
    if (selectedMemory?.id === memoryId) {
      setSelectedMemory(prev => prev ? { 
        ...prev, 
        visit_count: prev.visit_count + 1
      } : null)
    }
    
    setWateringMemory(null)
  }

  async function handleAddReflection() {
    if (!selectedMemory || !reflection.trim() || !userId || !userName) return
    
    setSubmittingReflection(true)
    
    // Simulate adding reflection
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newReflection = {
      id: `ref-${Date.now()}`,
      userId,
      userName,
      text: reflection.trim(),
      createdAt: new Date().toISOString()
    }
    
    const newReflections = [...(selectedMemory.reflections || []), newReflection]
    setSelectedMemory(prev => prev ? { ...prev, reflections: newReflections } : null)
    setMemories(prev => prev.map(m => 
      m.id === selectedMemory.id ? { ...m, reflections: newReflections } : m
    ))
    setReflection('')
    setSubmittingReflection(false)
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
        <div className="text-center">
          <Tree size={64} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Garden not found</p>
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
          
          {onPlantMemory && (
            <Button onClick={() => onPlantMemory(gardenId)} size="sm">
              <Plus size={16} className="mr-2" />
              Plant Memory
            </Button>
          )}
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
                      <span className="text-sm font-medium">{selectedMemory.contributor_name[0]}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedMemory.contributor_name}</p>
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
