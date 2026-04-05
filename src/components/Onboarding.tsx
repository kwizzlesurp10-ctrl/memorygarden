import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plant, Drop, Sparkle, Tree } from '@phosphor-icons/react'

interface OnboardingProps {
  open: boolean
  onComplete: () => void
}

const steps = [
  {
    icon: Tree,
    title: 'Welcome to MemoryGarden',
    description: 'A peaceful space to plant and nurture your most precious memories. Unlike traditional photo albums, your memories here will grow, evolve, and reveal new connections over time.',
  },
  {
    icon: Plant,
    title: 'Plant Your Memories',
    description: 'Each memory starts as a small seed. Add a photo, write a few sentences, and choose when it happened. Your memory will sprout and begin its journey.',
  },
  {
    icon: Drop,
    title: 'Tend & Reflect',
    description: 'Visit your memories to watch them grow. Add reflections, see how your feelings have changed, and let your plants mature from buds to blooms to evergreens.',
  },
  {
    icon: Sparkle,
    title: 'Discover Connections',
    description: 'The garden\'s AI will help you see patterns and connections between memories you might not notice. Ask questions, receive gentle reflections, and explore your life\'s tapestry.',
  },
]

export function Onboarding({ open, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="sr-only">Onboarding</DialogTitle>
        <DialogDescription className="sr-only">Information about how to use Memory Garden.</DialogDescription>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center text-center space-y-6 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Icon size={48} weight="duotone" className="text-primary" />
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold">{step.title}</h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                {step.description}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-border'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3 w-full pt-4">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrev} className="flex-1">
                  Back
                </Button>
              )}
              <Button onClick={handleNext} className="flex-1">
                {currentStep < steps.length - 1 ? 'Next' : 'Begin Your Garden'}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
