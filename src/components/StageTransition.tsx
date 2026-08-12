import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StageTransitionProps {
  stage: string
  children: ReactNode
}

export const StageTransition = ({ stage, children }: StageTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
