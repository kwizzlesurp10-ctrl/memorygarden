import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drop } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface WaterPlantButtonProps {
  memoryId: string
  onWater?: (memoryId: string) => void
  visitorName?: string
}

export function WaterPlantButton({ memoryId, onWater, visitorName = "A friend" }: WaterPlantButtonProps) {
  const [isWatering, setIsWatering] = useState(false)

  const handleWater = async () => {
    setIsWatering(true)
    
    // Small delay for nice animation feel
    await new Promise(resolve => setTimeout(resolve, 400))
    
    onWater?.(memoryId)
    
    toast.success(`${visitorName} watered this plant`, {
      description: "It will grow stronger from this care.",
      icon: <Drop size={18} weight="fill" className="text-sky-500" />,
    })
    
    setIsWatering(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleWater}
      disabled={isWatering}
      className="flex items-center gap-2 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
    >
      <AnimatePresence mode="wait">
        {isWatering ? (
          <motion.div
            key="watering"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
          >
            <Drop size={18} weight="fill" className="animate-pulse" />
          </motion.div>
        ) : (
          <Drop size={18} weight="duotone" />
        )}
      </AnimatePresence>
      Water this plant
    </Button>
  )
}
