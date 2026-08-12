import { ArrowLeft, Users, Heart } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { GardenCanvas } from './GardenCanvas'
import type { Memory } from '@/lib/types'
import { WaterPlantButton } from './WaterPlantButton'

interface VisitGardenViewProps {
  gardenName: string
  owner: string
  memories: Memory[]
  onWaterPlant: (memoryId: string) => void
  onBack: () => void
}

export function VisitGardenView({ 
  gardenName, 
  owner, 
  memories, 
  onWaterPlant, 
  onBack 
}: VisitGardenViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft size={16} /> Back to Explore
          </Button>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">{gardenName}</h2>
            <p className="text-sm text-muted-foreground">by {owner}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users size={16} /> {memories.length} memories
          </div>
          <div className="flex items-center gap-1.5">
            <Heart size={16} className="text-red-500" /> Community tended
          </div>
        </div>
      </div>

      {/* Garden Canvas with Watering enabled */}
      <div className="flex-1 relative">
        <GardenCanvas
          memories={memories}
          onMemoryClick={() => {}}
          onMemoryMove={() => {}}
          season="spring"
          growingMemories={new Set()}
          memoryBoostTiers={new Map()}
          highlightedMemoryIds={null}
        />

        {/* Floating watering hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-background/95 border px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow">
          <span>Water plants to help them grow</span>
          <WaterPlantButton memoryId="demo" onWater={onWaterPlant} />
        </div>
      </div>
    </div>
  )
}
