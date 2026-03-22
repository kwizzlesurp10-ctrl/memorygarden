import { motion } from 'framer-motion'
import type { Memory, PlantStage } from '@/lib/types'
import { getPlantColor, getPlantSize } from '@/lib/garden-helpers'

interface PlantProps {
  memory: Memory
  onClick: () => void
  isDragging?: boolean
}

export function Plant({ memory, onClick, isDragging }: PlantProps) {
  const color = getPlantColor(memory.emotionalTone)
  const size = getPlantSize(memory.plantStage)
  const stage = memory.plantStage

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isDragging ? 0.9 : 1,
        opacity: isDragging ? 0.6 : 1,
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className="cursor-pointer animate-breathe"
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {stage === 'seed' && <SeedSVG color={color} />}
        {stage === 'sprout' && <SproutSVG color={color} />}
        {stage === 'bud' && <BudSVG color={color} />}
        {stage === 'bloom' && <BloomSVG color={color} />}
        {stage === 'mature' && <MatureSVG color={color} />}
        {stage === 'evergreen' && <EvergreenSVG color={color} />}
      </svg>
    </motion.div>
  )
}

function SeedSVG({ color }: { color: string }) {
  return (
    <>
      <circle cx="50" cy="70" r="15" fill={color} opacity="0.8" />
      <ellipse cx="50" cy="85" rx="10" ry="3" fill="oklch(0.45 0.05 65)" opacity="0.3" />
    </>
  )
}

function SproutSVG({ color }: { color: string }) {
  return (
    <>
      <path
        d="M 50 90 Q 48 70 50 60 Q 52 70 50 90"
        fill="oklch(0.55 0.08 155)"
        stroke="oklch(0.45 0.08 155)"
        strokeWidth="1"
      />
      <ellipse cx="45" cy="55" rx="8" ry="12" fill={color} opacity="0.7" />
      <ellipse cx="55" cy="58" rx="7" ry="10" fill={color} opacity="0.7" />
      <ellipse cx="50" cy="92" rx="8" ry="2" fill="oklch(0.45 0.05 65)" opacity="0.3" />
    </>
  )
}

function BudSVG({ color }: { color: string }) {
  return (
    <>
      <path
        d="M 50 95 Q 48 60 50 40 Q 52 60 50 95"
        fill="oklch(0.55 0.08 155)"
        stroke="oklch(0.45 0.08 155)"
        strokeWidth="2"
      />
      <ellipse cx="50" cy="35" rx="12" ry="18" fill={color} opacity="0.8" />
      <ellipse cx="40" cy="45" rx="6" ry="10" fill={color} opacity="0.6" />
      <ellipse cx="60" cy="45" rx="6" ry="10" fill={color} opacity="0.6" />
      <path d="M 45 50 Q 40 60 38 65" stroke="oklch(0.50 0.08 155)" strokeWidth="1.5" fill="none" />
      <path d="M 55 50 Q 60 60 62 65" stroke="oklch(0.50 0.08 155)" strokeWidth="1.5" fill="none" />
      <ellipse cx="50" cy="96" rx="10" ry="3" fill="oklch(0.45 0.05 65)" opacity="0.3" />
    </>
  )
}

function BloomSVG({ color }: { color: string }) {
  return (
    <>
      <path
        d="M 50 95 Q 47 55 50 30 Q 53 55 50 95"
        fill="oklch(0.55 0.08 155)"
        stroke="oklch(0.45 0.08 155)"
        strokeWidth="2"
      />
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x = 50 + Math.cos(rad) * 18
        const y = 30 + Math.sin(rad) * 18
        return (
          <ellipse
            key={angle}
            cx={x}
            cy={y}
            rx="10"
            ry="14"
            fill={color}
            opacity="0.9"
            transform={`rotate(${angle} ${x} ${y})`}
          />
        )
      })}
      <circle cx="50" cy="30" r="8" fill="oklch(0.78 0.14 85)" opacity="0.9" />
      <path d="M 45 40 Q 35 55 30 65" stroke="oklch(0.50 0.08 155)" strokeWidth="2" fill="none" />
      <path d="M 55 40 Q 65 55 70 65" stroke="oklch(0.50 0.08 155)" strokeWidth="2" fill="none" />
      <ellipse cx="27" cy="67" rx="8" ry="12" fill="oklch(0.55 0.08 155)" opacity="0.7" />
      <ellipse cx="73" cy="67" rx="8" ry="12" fill="oklch(0.55 0.08 155)" opacity="0.7" />
      <ellipse cx="50" cy="96" rx="12" ry="3" fill="oklch(0.45 0.05 65)" opacity="0.3" />
    </>
  )
}

function MatureSVG({ color }: { color: string }) {
  return (
    <>
      <path
        d="M 50 95 Q 45 50 50 20 Q 55 50 50 95"
        fill="oklch(0.50 0.06 155)"
        stroke="oklch(0.40 0.06 155)"
        strokeWidth="3"
      />
      <ellipse cx="50" cy="15" rx="25" ry="30" fill={color} opacity="0.8" />
      <circle cx="50" cy="10" r="6" fill="oklch(0.78 0.14 85)" opacity="0.9" />
      <circle cx="42" cy="18" r="5" fill="oklch(0.78 0.14 85)" opacity="0.8" />
      <circle cx="58" cy="18" r="5" fill="oklch(0.78 0.14 85)" opacity="0.8" />
      <path d="M 40 35 Q 25 50 18 62" stroke="oklch(0.48 0.07 155)" strokeWidth="2.5" fill="none" />
      <path d="M 60 35 Q 75 50 82 62" stroke="oklch(0.48 0.07 155)" strokeWidth="2.5" fill="none" />
      <ellipse cx="15" cy="65" rx="12" ry="18" fill="oklch(0.55 0.08 155)" opacity="0.8" />
      <ellipse cx="85" cy="65" rx="12" ry="18" fill="oklch(0.55 0.08 155)" opacity="0.8" />
      <ellipse cx="50" cy="96" rx="14" ry="4" fill="oklch(0.45 0.05 65)" opacity="0.3" />
    </>
  )
}

function EvergreenSVG({ color }: { color: string }) {
  return (
    <>
      <path
        d="M 50 95 Q 42 50 50 10 Q 58 50 50 95"
        fill="oklch(0.48 0.06 155)"
        stroke="oklch(0.38 0.06 155)"
        strokeWidth="4"
      />
      <path d="M 30 75 Q 40 50 50 45 Q 60 50 70 75" fill={color} opacity="0.7" />
      <path d="M 32 60 Q 42 38 50 32 Q 58 38 68 60" fill={color} opacity="0.75" />
      <path d="M 35 45 Q 43 26 50 20 Q 57 26 65 45" fill={color} opacity="0.8" />
      <path d="M 38 30 Q 45 15 50 10 Q 55 15 62 30" fill={color} opacity="0.85" />
      <path d="M 35 55 Q 25 65 20 75" stroke="oklch(0.46 0.07 155)" strokeWidth="2.5" fill="none" />
      <path d="M 65 55 Q 75 65 80 75" stroke="oklch(0.46 0.07 155)" strokeWidth="2.5" fill="none" />
      <ellipse cx="17" cy="78" rx="10" ry="15" fill="oklch(0.55 0.08 155)" opacity="0.75" />
      <ellipse cx="83" cy="78" rx="10" ry="15" fill="oklch(0.55 0.08 155)" opacity="0.75" />
      <ellipse cx="50" cy="97" rx="16" ry="4" fill="oklch(0.45 0.05 65)" opacity="0.3" />
    </>
  )
}
