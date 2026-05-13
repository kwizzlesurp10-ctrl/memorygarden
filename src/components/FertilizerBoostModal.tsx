import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Sparkle, Lightning, Crown, Drop, CheckCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { FertilizerParticles } from '@/components/FertilizerParticles'
import type { Memory } from '@/lib/types'

// ... (interfaces and boostOptions remain the same)

export function FertilizerBoostModal({ open, onClose, memory, onApplyBoost }: FertilizerBoostModalProps) {
  // ... existing state and logic

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-2 border-primary/20">
        <VisuallyHidden>
          <DialogTitle>Boost Your Memory</DialogTitle>
          <DialogDescription>
            Apply fertilizer to accelerate growth and unlock new stages for this memory.
          </DialogDescription>
        </VisuallyHidden>

        <AnimatePresence mode="wait">
          {/* existing success and content blocks remain unchanged */}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}