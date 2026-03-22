import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Memory } from '@/lib/types'
import { Plant } from './Plant'
import { getDayPeriod, getBackgroundGradient } from '@/lib/garden-helpers'

interface GardenCanvasProps {
  memories: Memory[]
  onMemoryClick: (memory: Memory) => void
  onMemoryMove: (memoryId: string, newPosition: { x: number; y: number }) => void
}

export function GardenCanvas({ memories, onMemoryClick, onMemoryMove }: GardenCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [draggingMemory, setDraggingMemory] = useState<string | null>(null)
  const [dayPeriod, setDayPeriod] = useState(getDayPeriod())

  useEffect(() => {
    const interval = setInterval(() => {
      setDayPeriod(getDayPeriod())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY * -0.001
      const newScale = Math.min(Math.max(0.5, scale + delta), 2)
      setScale(newScale)
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }))
    }
  }

  const backgroundGradient = getBackgroundGradient(dayPeriod)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onWheel={handleWheel}
      style={{
        background: backgroundGradient,
        cursor: draggingMemory ? 'grabbing' : 'grab',
      }}
    >
      <ParallaxBackground dayPeriod={dayPeriod} />
      
      <motion.div
        className="absolute inset-0"
        style={{
          x: pan.x,
          y: pan.y,
          scale: scale,
        }}
      >
        <div className="relative w-full h-full min-w-[2000px] min-h-[2000px]">
          {memories.map((memory) => (
            <motion.div
              key={memory.id}
              drag
              dragMomentum={false}
              dragElastic={0.1}
              onDragStart={() => setDraggingMemory(memory.id)}
              onDragEnd={(_, info) => {
                setDraggingMemory(null)
                const newX = memory.position.x + info.offset.x / scale
                const newY = memory.position.y + info.offset.y / scale
                onMemoryMove(memory.id, { x: newX, y: newY })
              }}
              className="absolute"
              style={{
                left: memory.position.x,
                top: memory.position.y,
              }}
            >
              <Plant
                memory={memory}
                onClick={() => {
                  if (!draggingMemory) {
                    onMemoryClick(memory)
                  }
                }}
                isDragging={draggingMemory === memory.id}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function ParallaxBackground({ dayPeriod }: { dayPeriod: 'dawn' | 'day' | 'dusk' | 'night' }) {
  const isNight = dayPeriod === 'night' || dayPeriod === 'dusk'
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, oklch(0.55 0.08 155 / 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 70%, oklch(0.55 0.08 155 / 0.08) 0%, transparent 50%)`,
          backgroundSize: '400% 400%',
        }}
      />
      
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 23) % 90}%`,
            width: `${30 + (i % 3) * 15}px`,
            height: `${30 + (i % 3) * 15}px`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, (i % 2 === 0 ? 10 : -10), 0],
            rotate: [0, (i % 2 === 0 ? 5 : -5), 0],
          }}
          transition={{
            duration: 8 + (i % 4) * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        >
          <svg viewBox="0 0 50 50" fill="none">
            <path
              d="M25 5 Q 20 15 15 25 Q 20 35 25 45 Q 30 35 35 25 Q 30 15 25 5"
              fill="oklch(0.55 0.08 155)"
              opacity={isNight ? '0.2' : '0.15'}
            />
          </svg>
        </motion.div>
      ))}
      
      {isNight && [...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${(i * 19) % 98}%`,
            top: `${(i * 13) % 40}%`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}
