import { motion } from 'framer-motion'
import { Plant as PlantIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface EmptyGardenProps {
  onPlantFirst: () => void
}

export function EmptyGarden({ onPlantFirst }: EmptyGardenProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 max-w-md px-6"
      >
        <PlantIcon size={80} weight="duotone" className="text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Your garden awaits</h2>
        <p className="text-muted-foreground leading-relaxed">
          Plant your first memory to begin growing your personal sanctuary of moments,
          reflections, and connections.
        </p>
        <Button size="lg" onClick={onPlantFirst} className="mt-6">
          <PlantIcon size={20} weight="fill" className="mr-2" />
          Plant Your First Memory
        </Button>
      </motion.div>
    </div>
  )
}
