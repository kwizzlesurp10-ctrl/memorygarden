import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkle, CalendarBlank, MapPin } from '@phosphor-icons/react'
import type { Memory } from '@/lib/types'
import { format } from 'date-fns'

interface MemoryClustersProps {
  memories: Memory[]
  onMemoryClick: (memory: Memory) => void
}

interface Cluster {
  id: string
  name: string
  description: string
  memories: Memory[]
  theme: string
}

export function MemoryClusters({ memories, onMemoryClick }: MemoryClustersProps) {
  const [clusters, setClusters] = useState<Cluster[]>([])

  useEffect(() => {
    if (memories.length > 0) {
      analyzeClusters()
    }
  }, [memories])

  const analyzeClusters = async () => {
    if (memories.length < 3) {
      const simpleClusters: Cluster[] = [{
        id: 'all',
        name: 'All Memories',
        description: 'Your collection is just beginning. Plant more memories to discover meaningful patterns and connections.',
        memories: memories,
        theme: 'peaceful',
      }]
      setClusters(simpleClusters)
      return
    }

    setClusters(getDefaultClusters())
  }

  const getDefaultClusters = (): Cluster[] => {
    const emotionalClusters = new Map<string, Memory[]>()
    
    memories.forEach(memory => {
      const tone = memory.emotionalTone
      if (!emotionalClusters.has(tone)) {
        emotionalClusters.set(tone, [])
      }
      emotionalClusters.get(tone)!.push(memory)
    })

    const clusterNames: Record<string, { name: string; description: string }> = {
      happy: {
        name: 'Joyful Moments',
        description: 'Memories filled with happiness and light',
      },
      nostalgic: {
        name: 'Looking Back',
        description: 'Reflections on times past',
      },
      peaceful: {
        name: 'Quiet Calm',
        description: 'Moments of serenity and peace',
      },
      reflective: {
        name: 'Deep Thoughts',
        description: 'Memories that inspired contemplation',
      },
      bittersweet: {
        name: 'Mixed Feelings',
        description: 'Beautiful moments tinged with complexity',
      },
    }

    return Array.from(emotionalClusters.entries())
      .filter(([_, mems]) => mems.length > 0)
      .map(([tone, mems]) => ({
        id: `cluster-${tone}`,
        name: clusterNames[tone]?.name || 'Memories',
        description: clusterNames[tone]?.description || 'Connected moments',
        memories: mems,
        theme: tone,
      }))
  }

  if (memories.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4 max-w-md px-6">
          <Sparkle size={64} weight="duotone" className="text-muted-foreground mx-auto" />
          <h3 className="text-xl font-semibold">No Memories Yet</h3>
          <p className="text-muted-foreground">
            Plant some memories to discover meaningful patterns and connections
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Memory Clusters</h2>
          <p className="text-muted-foreground">
            Discover meaningful patterns and connections across your memories
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clusters.map((cluster, index) => (
            <motion.div
              key={cluster.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:border-primary/50 transition-colors">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {cluster.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {cluster.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {cluster.memories.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {cluster.memories.slice(0, 4).map((memory) => (
                      <motion.div
                        key={memory.id}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => onMemoryClick(memory)}
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden group">
                          <img
                            src={memory.photoUrl}
                            alt="Memory"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-white text-xs line-clamp-2">
                                {memory.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {cluster.memories.length > 4 && (
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      +{cluster.memories.length - 4} more memories
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {getClusterMetadata(cluster.memories).locations.slice(0, 3).map((loc) => (
                        <Badge key={loc} variant="outline" className="text-xs">
                          <MapPin size={12} className="mr-1" />
                          {loc}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <CalendarBlank size={12} className="inline mr-1" />
                      {format(new Date(getClusterMetadata(cluster.memories).dateRange.start), 'MMM yyyy')}
                      {' → '}
                      {format(new Date(getClusterMetadata(cluster.memories).dateRange.end), 'MMM yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getClusterMetadata(memories: Memory[]) {
  const dates = memories.map(m => new Date(m.date).getTime()).sort((a, b) => a - b)
  const locations = Array.from(new Set(memories.map(m => m.location).filter(Boolean)))
  
  return {
    dateRange: {
      start: new Date(dates[0]).toISOString(),
      end: new Date(dates[dates.length - 1]).toISOString(),
    },
    locations,
  }
}
