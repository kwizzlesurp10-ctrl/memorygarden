import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Heart, Tree, Sparkle, Eye, ArrowRight, Flower, Plant, CircleNotch, MagnifyingGlass, Clock } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { fetchPublicGardens, joinCommunityGarden, type PublicGarden } from '@/lib/community-gardens-api'
import { toast } from 'sonner'

interface ExploreViewProps {
  onVisitGarden: (gardenId: string, gardenName: string) => void
  onJoinGarden: (gardenId: string, gardenName: string) => void
  userId?: string
  userName?: string
}

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
  const [gardens, setGardens] = useState<PublicGarden[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [joiningGarden, setJoiningGarden] = useState<string | null>(null)
  const [joinedGardens, setJoinedGardens] = useState<Set<string>>(new Set())

  useEffect(() => {
  let cancelled = false
  async function loadGardens() {
    setLoading(true)
    setError(null)
    const result = await fetchPublicGardens(userId)
    if (cancelled) return
    if (!result.ok) {
      setError(result.error)
      setGardens([])
    } else {
      setGardens(result.value)
      setJoinedGardens(
        new Set(result.value.filter((g) => g.viewer_is_member).map((g) => g.id)),
      )
    }
    setLoading(false)
  }
  void loadGardens()
  return () => {
    cancelled = true
  }
  }, [userId])

  async function handleJoinGarden(garden: PublicGarden) {
    if (!userId || !userName) {
      toast.error('Sign in to join a community garden')
      return
    }
    setJoiningGarden(garden.id)
    const result = await joinCommunityGarden({
      gardenId: garden.id,
      userId,
      userName,
    })
    setJoiningGarden(null)
    if (!result.ok) {
      toast.error('Could not join garden', { description: result.error })
      return
    }
    setJoinedGardens((prev) => new Set([...prev, garden.id]))
    onJoinGarden(garden.id, garden.name)
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
      <div className="mg-page-hero w-full h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mg-empty-state"
          role="status"
          aria-live="polite"
        >
          <CircleNotch size={48} className="animate-spin text-primary" aria-hidden />
          <p className="text-muted-foreground">Discovering gardens...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mg-page-hero w-full h-full flex items-center justify-center">
        <div className="mg-empty-state max-w-md">
          <Tree size={56} className="text-muted-foreground/50" aria-hidden />
          <p className="text-foreground font-medium mb-2">Could not load community gardens</p>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <Button
            type="button"
            onClick={() => {
              setLoading(true)
              setError(null)
              void fetchPublicGardens(userId).then((result) => {
                if (result.ok) {
                  setGardens(result.value)
                  setJoinedGardens(
                    new Set(result.value.filter((g) => g.viewer_is_member).map((g) => g.id)),
                  )
                  setError(null)
                } else {
                  setError(result.error)
                }
                setLoading(false)
              })
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (gardens.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center px-6">
          <Tree size={64} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No community gardens are public yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mg-page-hero w-full h-full overflow-y-auto">
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
                                  alt={garden.owner_name ?? 'Garden owner'}
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
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log("[v0] Visit button clicked for garden:", garden.id)
                              onVisitGarden(garden.id, garden.name)
                            }}
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
                            onClick={() => handleJoinGarden(garden)}
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
