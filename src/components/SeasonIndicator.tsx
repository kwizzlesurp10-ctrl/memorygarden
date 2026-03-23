import { motion } from 'framer-motion'
import type { Season } from '@/lib/types'
import { Flower, Sun, Leaf, Snowflake } from '@phosphor-icons/react'

interface SeasonIndicatorProps {
  season: Season
}

export function SeasonIndicator({ season }: SeasonIndicatorProps) {
  const seasonConfig = {
    spring: {
      icon: Flower,
      label: 'Spring',
      color: 'oklch(0.75 0.16 330)',
      bgColor: 'oklch(0.94 0.08 330 / 0.2)',
    },
    summer: {
      icon: Sun,
      label: 'Summer',
      color: 'oklch(0.75 0.18 90)',
      bgColor: 'oklch(0.95 0.10 90 / 0.2)',
    },
    autumn: {
      icon: Leaf,
      label: 'Autumn',
      color: 'oklch(0.68 0.18 45)',
      bgColor: 'oklch(0.92 0.12 45 / 0.2)',
    },
    winter: {
      icon: Snowflake,
      label: 'Winter',
      color: 'oklch(0.72 0.10 240)',
      bgColor: 'oklch(0.94 0.08 240 / 0.2)',
    },
  }

  const config = seasonConfig[season]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      <Icon size={16} weight="fill" />
      <span className="text-sm font-medium hidden sm:inline">{config.label}</span>
    </motion.div>
  )
}
