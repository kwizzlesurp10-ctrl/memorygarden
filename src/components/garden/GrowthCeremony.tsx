import { useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const MG_GROW_EASE = [0.34, 1.56, 0.64, 1] as const

export interface GrowthCeremonyProps {
  active: boolean
  rim: string
  glow: string
  onComplete?: () => void
  children?: ReactNode
}

export function GrowthCeremony({ active, rim: _rim, glow, onComplete, children }: GrowthCeremonyProps) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (active && reducedMotion) {
      onComplete?.()
    }
  }, [active, reducedMotion, onComplete])

  const growKeyframes = reducedMotion
    ? { scaleX: 1, scaleY: 1 }
    : { scaleX: [0.55, 0.97, 1.02, 1], scaleY: [0.06, 1.09, 0.96, 1] }

  const growTransition = reducedMotion
    ? { duration: 0 }
    : {
        duration: 0.9,
        ease: MG_GROW_EASE,
        times: [0, 0.55, 0.78, 1],
      }

  return (
    <>
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        initial={reducedMotion ? false : { scaleX: 0.55, scaleY: 0.06 }}
        animate={active ? growKeyframes : { scaleX: 1, scaleY: 1 }}
        transition={growTransition}
        onAnimationComplete={() => {
          if (active && !reducedMotion) onComplete?.()
        }}
      >
        {children}
      </motion.g>

      {active && !reducedMotion ? (
        <motion.circle
          cx={66}
          cy={80}
          r={20}
          fill="none"
          stroke={glow}
          strokeWidth={1.6}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      ) : null}
    </>
  )
}