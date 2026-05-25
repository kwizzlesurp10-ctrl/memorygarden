import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Heart, Tree, Sparkle, Eye, ArrowRight, Flower, Plant, CircleNotch, MagnifyingGlass, Clock } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface GardenMemorySample {
  id: string
  photo_url: string
  text: string
  contributor_name: string
  plant_stage: string
  plant_variety: string
  emotional_tone: string
}

interface PublicGarden {
  id: string
  name: string
  description: string
  owner_name: string
  owner_avatar_url: string
  cover_image_url: string
  member_count: number
  memory_count: number
  created_at: string
  sample_memories: GardenMemorySample[]
}

interface ExploreViewProps {
  onVisitGarden: (gardenId: string) => void
  onJoinGarden: (gardenId: string) => void
  userId?: string
  userName?: string
}

// Hardcoded beautiful community gardens seeded from the database
const COMMUNITY_GARDENS: PublicGarden[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Sakura Reflections',
    description: 'A tranquil space celebrating Japanese aesthetics and mindful moments. Share memories of peace, nature, and quiet beauty.',
    owner_name: 'Yuki Tanaka',
    owner_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
    cover_image_url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800',
    member_count: 12,
    memory_count: 3,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sample_memories: [
      {
        id: 'sakura-mem-1',
        photo_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
        text: 'Morning meditation under the cherry blossoms',
        contributor_name: 'Yuki Tanaka',
        plant_stage: 'bloom',
        plant_variety: 'flower',
        emotional_tone: 'peaceful'
      },
      {
        id: 'sakura-mem-2',
        photo_url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400',
        text: 'Found this quiet temple garden on a rainy afternoon',
        contributor_name: 'Kenji M.',
        plant_stage: 'mature',
        plant_variety: 'tree',
        emotional_tone: 'contemplative'
      },
      {
        id: 'sakura-mem-3',
        photo_url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400',
        text: 'Tea ceremony with grandmother',
        contributor_name: 'Sakura L.',
        plant_stage: 'flowering',
        plant_variety: 'flower',
        emotional_tone: 'nostalgic'
      }
    ]
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Ocean Whispers',
    description: 'For those who find solace by the sea. Plant memories of coastal adventures, sunset walks, and the rhythm of waves.',
    owner_name: 'Marina Costa',
    owner_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marina',
    cover_image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    member_count: 29,
    memory_count: 4,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    sample_memories: [
      {
        id: 'ocean-mem-1',
        photo_url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400',
        text: 'Sunrise surf session. Just me and the waves.',
        contributor_name: 'Marina Costa',
        plant_stage: 'bloom',
        plant_variety: 'wildflower',
        emotional_tone: 'joyful'
      },
      {
        id: 'ocean-mem-2',
        photo_url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400',
        text: 'Watching dolphins play from the pier at sunset',
        contributor_name: 'Carlos R.',
        plant_stage: 'mature',
        plant_variety: 'flower',
        emotional_tone: 'wonder'
      },
      {
        id: 'ocean-mem-3',
        photo_url: 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=400',
        text: 'The day I proposed, right here on this beach',
        contributor_name: 'James T.',
        plant_stage: 'bloom',
        plant_variety: 'flower',
        emotional_tone: 'love'
      }
    ]
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'The Little Wild',
    description: 'Celebrating childhood wonder and family adventures. A garden for precious moments with little ones and the magic of growing up.',
    owner_name: 'Emma Wilde',
    owner_avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    cover_image_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800',
    member_count: 8,
    memory_count: 4,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sample_memories: [
      {
        id: 'wild-mem-1',
        photo_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
        text: 'First day of kindergarten. She was so brave.',
        contributor_name: 'Emma Wilde',
        plant_stage: 'mature',
        plant_variety: 'tree',
        emotional_tone: 'bittersweet'
      },
      {
        id: 'wild-mem-2',
        photo_url: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=400',
        text: 'Teaching my son to ride a bike. Pure triumph!',
        contributor_name: 'David P.',
        plant_stage: 'bloom',
        plant_variety: 'flower',
        emotional_tone: 'proud'
      },
      {
        id: 'wild-mem-3',
        photo_url: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=400',
        text: 'Camping under the stars',
        contributor_name: 'Sophie M.',
        plant_stage: 'flowering',
        plant_variety: 'wildflower',
        emotional_tone: 'wonder'
      }
    ]
  }
]

const EMOTIONAL_COLORS: Record<string, string> = {
  peaceful: 'from-emerald-500/20 to-teal-500/20',
  joyful: 'from-amber-500/20 to-yellow-500/20',
  nostalgic: 'from-purple-500/20 to-indigo-500/20',
  contemplative: 'from-slate-500/20 to-blue-500/20',
  wonder: 'from-pink-500/20 to-rose-500/20',
  happy: 'from-orange-500/20 to-amber-500/20',
  love: 'from-rose-500/20 to-pink-500/20',
  proud: 'from-blue-500/20 to-cyan-500/20',
  bittersweet: 'from-violet-500/20 to-purple-500/20',
}

export function ExploreView({ onVisitGarden, onJoinGarden, userId, userName }: ExploreViewProps) {
  const [gardens] = useState<PublicGarden[]>(COMMUNITY_GARDENS)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [joiningGarden, setJoiningGarden] = useState<string | null>(null)
  const [joinedGardens, setJoinedGardens] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Simulate loading for a smooth experience
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  async function handleJoinGarden(gardenId: string) {
    setJoiningGarden(gardenId)
    
    // Simulate joining (in production this would call the API)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setJoinedGardens(prev => new Set([...prev, gardenId]))
    setJoiningGarden(null)
    onJoinGarden(gardenId)
  }

  const filteredGardens = gardens.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function formatTimeAgo(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-background to-primary/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CircleNotch size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Discovering gardens...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0 opacity-30">
          {/* Floating sparkles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full"
              style={{
                left: `${10 + (i * 7)}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + (i % 2),
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        
        <div className="relative px-6 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <Sparkle size={16} weight="fill" className="animate-pulse" />
              <span className="font-medium">Community Gardens</span>
              <span className="text-primary/60">|</span>
              <span className="text-primary/80">{gardens.length} gardens growing</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              Discover Living Gardens
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
              Wander through shared memories. Water plants that aren&apos;t yours. 
              Watch them bloom together.
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search gardens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-full bg-background/80 backdrop-blur border-primary/20 focus:border-primary/40"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gardens Grid */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {filteredGardens.length === 0 ? (
            <div className="text-center py-16">
              <Tree size={64} className="text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No gardens found matching your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredGardens.map((garden, index) => {
                  const isJoined = joinedGardens.has(garden.id)
                  const isJoining = joiningGarden === garden.id
                  const primaryEmotion = garden.sample_memories?.[0]?.emotional_tone || 'peaceful'
                  const gradientClass = EMOTIONAL_COLORS[primaryEmotion] || EMOTIONAL_COLORS.peaceful
                  
                  return (
                    <motion.div
                      key={garden.id}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative bg-card border border-border/60 rounded-3xl overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
                    >
                      {/* Cover Image / Visual */}
                      <div className={cn(
                        "h-56 relative overflow-hidden bg-gradient-to-br",
                        gradientClass
                      )}>
                        {garden.cover_image_url ? (
                          <img 
                            src={garden.cover_image_url} 
                            alt={garden.name}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tree size={80} weight="duotone" className="text-primary/40" />
                          </div>
                        )}
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                        
                        {/* Memory count badge */}
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-sm font-medium flex items-center gap-2 shadow-lg">
                          <Heart size={14} weight="fill" className="text-rose-500" />
                          <span>{garden.memory_count}</span>
                        </div>

                        {/* Sample memory photos */}
                        {garden.sample_memories && garden.sample_memories.length > 0 && (
                          <div className="absolute bottom-4 left-4 flex -space-x-3">
                            {garden.sample_memories.slice(0, 3).map((mem, i) => (
                              <motion.div
                                key={mem.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="w-10 h-10 rounded-full border-2 border-card overflow-hidden shadow-md"
                              >
                                <img 
                                  src={mem.photo_url} 
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </motion.div>
                            ))}
                            {(garden.memory_count || 0) > 3 && (
                              <div className="w-10 h-10 rounded-full border-2 border-card bg-primary/90 flex items-center justify-center text-xs font-medium text-primary-foreground shadow-md">
                                +{(garden.memory_count || 0) - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-xl tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                              {garden.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              {garden.owner_avatar_url && (
                                <img 
                                  src={garden.owner_avatar_url} 
                                  alt={garden.owner_name}
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span>by {garden.owner_name}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground leading-relaxed line-clamp-2 text-[15px] mb-4">
                          {garden.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                          <div className="flex items-center gap-1.5">
                            <Users size={15} />
                            <span>{garden.member_count || 0} members</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={15} />
                            <span>{formatTimeAgo(garden.created_at)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button 
                            variant="outline" 
                            className="flex-1 group/btn"
                            onClick={() => onVisitGarden(garden.id)}
                          >
                            <Eye size={16} className="mr-2" />
                            Visit
                            <ArrowRight size={14} className="ml-2 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                          </Button>
                          <Button 
                            className={cn(
                              "flex-1 transition-all",
                              isJoined && "bg-primary/20 text-primary hover:bg-primary/30"
                            )}
                            onClick={() => handleJoinGarden(garden.id)}
                            disabled={isJoining || isJoined}
                          >
                            {isJoining ? (
                              <CircleNotch size={16} className="animate-spin mr-2" />
                            ) : isJoined ? (
                              <Sparkle size={16} weight="fill" className="mr-2" />
                            ) : (
                              <Plant size={16} className="mr-2" />
                            )}
                            {isJoined ? 'Joined' : 'Join Garden'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-12 px-6">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Flower size={16} className="text-primary" />
          <span>New gardens bloom every day</span>
        </div>
      </div>
    </div>
  )
}
