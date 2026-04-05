import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Memory, Season } from '@/lib/types'

interface AIPlantRendererProps {
  memory: Memory
  svgFallback: React.ReactNode
  size: number
}

export function AIPlantRenderer({ memory, svgFallback, size }: AIPlantRendererProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const aiImage = memory.generatedPlantImages?.[memory.plantStage]

  useEffect(() => {
    setImageLoaded(false)
  }, [memory.plantStage])

  if (!aiImage) {
    return <>{svgFallback}</>
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <AnimatePresence mode="wait">
        {!imageLoaded && (
          <motion.div
            key="svg"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {svgFallback}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        src={aiImage}
        alt={`${memory.plantVariety} at ${memory.plantStage} stage`}
        className="absolute inset-0 w-full h-full object-contain"
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        onLoad={() => setImageLoaded(true)}
      />

      {/* Subtle generation indicator */}
      {!imageLoaded && aiImage && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  )
}
