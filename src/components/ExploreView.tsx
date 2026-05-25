import { motion } from 'framer-motion'
import { Users, Heart, Tree } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { Memory } from '@/lib/types'

interface PublicGarden {
  id: string
  name: string
  owner: string
  description: string
  memoryCount: number
  memberCount: number
  coverPlantStage: string
  lastActivity: string
  isPublic: boolean
  sampleMemories: Memory[]
}

interface ExploreViewProps {
  onVisitGarden: (gardenId: string) => void
  onJoinGarden: (gardenId: string) => void
}

// Temporary beautiful mock data until we have real public gardens
const mockPublicGardens: PublicGarden[] = [
  {
    id: 'garden-sakura-2025',
    name: "Sakura Reflections",
    owner: "Elena Voss",
    description: "A garden of quiet moments under cherry blossoms. Memories of love, loss, and the gentle passing of seasons.",
    memoryCount: 47,
    memberCount: 12,
    coverPlantStage: 'bloom',
    lastActivity: "2 hours ago",
    isPublic: true,
    sampleMemories: []
  },
  {
    id: 'garden-ocean-whispers',
    name: "Ocean Whispers",
    owner: "Kai Nakamura",
    description: "Waves, shells, and conversations with the sea. A place for memories that feel like salt air and distant horizons.",
    memoryCount: 83,
    memberCount: 29,
    coverPlantStage: 'mature',
    lastActivity: "yesterday",
    isPublic: true,
    sampleMemories: []
  },
  {
    id: 'garden-little-wild',
    name: "The Little Wild",
    owner: "Mira Sol",
    description: "For the untamed memories — road trips, late-night conversations, and moments that refused to be ordinary.",
    memoryCount: 31,
    memberCount: 8,
    coverPlantStage: 'bud',
    lastActivity: "3 days ago",
    isPublic: true,
    sampleMemories: []
  }
]

export function ExploreView({ onVisitGarden, onJoinGarden }: ExploreViewProps) {
  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-b from-background to-primary/5 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Users size={16} weight="fill" />
            Community Gardens
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Discover Living Gardens</h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Wander through other people’s memories. Water their plants. Grow together.
          </p>
        </div>

        {/* Gardens Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPublicGardens.map((garden, index) => (
            <motion.div
              key={garden.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-card border border-border/60 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-300 flex flex-col"
            >
              {/* Garden Header Visual */}
              <div className="h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 relative flex items-center justify-center">
                <div className="text-center">
                  <Tree size={64} weight="duotone" className="mx-auto text-primary/80 mb-2" />
                  <div className="text-xs uppercase tracking-[3px] text-muted-foreground">
                    {garden.coverPlantStage.toUpperCase()}
                  </div>
                </div>
                
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-background/90 text-xs font-medium flex items-center gap-1.5">
                  <Heart size={12} weight="fill" className="text-red-500" />
                  {garden.memoryCount}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div>
                  <h3 className="font-semibold text-2xl tracking-tight mb-1 group-hover:text-primary transition-colors">
                    {garden.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">by {garden.owner}</p>
                  <p className="text-muted-foreground leading-relaxed line-clamp-3 text-[15px]">
                    {garden.description}
                  </p>
                </div>

                <div className="mt-auto pt-6 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users size={15} />
                      {garden.memberCount}
                    </div>
                    <div className="text-xs opacity-60">•</div>
                    <div>{garden.lastActivity}</div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => onVisitGarden(garden.id)}
                  >
                    Visit Garden
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => onJoinGarden(garden.id)}
                  >
                    Join & Grow
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          More gardens blooming every day. 
          <span className="text-primary font-medium"> Create a public garden →</span>
        </div>
      </div>
    </div>
  )
}
