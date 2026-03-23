import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkle, Lightning, Crown, Drop, CheckCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { Memory } from '@/lib/types'

interface FertilizerBoostModalProps {
  open: boolean
  onClose: () => void
  memory: Memory | null
  onApplyBoost: (boostLevel: 'standard' | 'premium' | 'legendary') => void
}

type BoostLevel = 'standard' | 'premium' | 'legendary'

interface BoostOption {
  level: BoostLevel
  name: string
  icon: React.ElementType
  color: string
  glowColor: string
  vitality: number
  price?: string
  popular?: boolean
  description: string
}

const boostOptions: BoostOption[] = [
  {
    level: 'standard',
    name: 'Garden Boost',
    icon: Drop,
    color: 'oklch(0.65 0.12 160)',
    glowColor: 'oklch(0.65 0.12 160 / 0.3)',
    vitality: 18,
    description: 'Nourish your memory with organic growth',
  },
  {
    level: 'premium',
    name: 'Premium Fertilizer',
    icon: Sparkle,
    color: 'oklch(0.75 0.18 280)',
    glowColor: 'oklch(0.75 0.18 280 / 0.4)',
    vitality: 34,
    price: '$2.99',
    popular: true,
    description: 'Accelerate growth with premium nutrients',
  },
  {
    level: 'legendary',
    name: 'Legendary Elixir',
    icon: Crown,
    color: 'oklch(0.78 0.20 50)',
    glowColor: 'oklch(0.78 0.20 50 / 0.5)',
    vitality: 55,
    price: '$4.99',
    description: 'Transform your memory into a legendary plant',
  },
]

export function FertilizerBoostModal({ open, onClose, memory, onApplyBoost }: FertilizerBoostModalProps) {
  const [selectedBoost, setSelectedBoost] = useState<BoostLevel | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleApply = async () => {
    if (!selectedBoost) return

    setIsApplying(true)
    
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    onApplyBoost(selectedBoost)
    setIsApplying(false)
    setShowSuccess(true)
    
    setTimeout(() => {
      setShowSuccess(false)
      setSelectedBoost(null)
      onClose()
    }, 2200)
  }

  if (!memory) return null

  const currentVitality = memory.growthMetrics?.vitality || 0
  const selectedOption = boostOptions.find(opt => opt.level === selectedBoost)
  const projectedVitality = selectedOption 
    ? Math.min(100, currentVitality + selectedOption.vitality)
    : currentVitality

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-2 border-primary/20">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative p-12 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, times: [0, 0.6, 1] }}
              >
                <CheckCircle size={80} weight="fill" className="text-primary" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold mb-2">Boost Applied!</h2>
                <p className="text-muted-foreground">Your memory is flourishing...</p>
              </motion.div>
              
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {Array.from({ length: 30 }).map((_, i) => {
                  const angle = (i * 360) / 30
                  const distance = 150 + Math.random() * 100
                  
                  return (
                    <motion.div
                      key={i}
                      className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full"
                      style={{
                        background: selectedOption?.color,
                      }}
                      initial={{ 
                        scale: 0, 
                        opacity: 1,
                        x: '-50%',
                        y: '-50%',
                      }}
                      animate={{
                        scale: [0, 2, 0],
                        opacity: [1, 0.8, 0],
                        x: `calc(-50% + ${Math.cos(angle * Math.PI / 180) * distance}px)`,
                        y: `calc(-50% + ${Math.sin(angle * Math.PI / 180) * distance}px)`,
                      }}
                      transition={{
                        duration: 1.2,
                        delay: i * 0.02,
                        ease: 'easeOut',
                      }}
                    />
                  )
                })}
                
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      background: selectedOption?.color,
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0],
                      y: [0, -100],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.05,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <div className="relative p-8 pb-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
                <motion.div
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30"
                  style={{ background: selectedOption?.color || 'oklch(0.65 0.12 160)' }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                <div className="relative">
                  <div className="flex items-start gap-4 mb-6">
                    <Lightning size={32} weight="duotone" className="text-primary flex-shrink-0" />
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Boost Your Memory</h2>
                      <p className="text-muted-foreground">
                        Apply fertilizer to accelerate growth and unlock new stages
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Current Vitality</span>
                      <span className="text-lg font-bold">{currentVitality.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${currentVitality}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    
                    {selectedBoost && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-primary">
                            Projected Vitality
                          </span>
                          <motion.span
                            className="text-lg font-bold text-primary"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            +{selectedOption?.vitality} → {projectedVitality.toFixed(0)}
                          </motion.span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full relative"
                            style={{
                              background: `linear-gradient(to right, ${selectedOption?.color}, ${selectedOption?.glowColor})`,
                            }}
                            initial={{ width: `${currentVitality}%` }}
                            animate={{ width: `${projectedVitality}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          >
                            <motion.div
                              className="absolute inset-0"
                              animate={{
                                opacity: [0.5, 1, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                            />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 pt-4">
                <div className="grid gap-4 mb-6">
                  {boostOptions.map((option, index) => {
                    const isSelected = selectedBoost === option.level
                    
                    return (
                      <motion.button
                        key={option.level}
                        onClick={() => setSelectedBoost(option.level)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          'relative p-5 rounded-xl border-2 transition-all text-left',
                          'hover:scale-[1.02] active:scale-[0.98]',
                          isSelected
                            ? 'border-transparent shadow-lg'
                            : 'border-border hover:border-primary/30'
                        )}
                        style={{
                          background: isSelected
                            ? `linear-gradient(135deg, ${option.glowColor}, transparent)`
                            : 'transparent',
                        }}
                      >
                        {option.popular && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                          >
                            Most Popular
                          </motion.div>
                        )}

                        <div className="flex items-start gap-4">
                          <motion.div
                            className="p-3 rounded-xl"
                            style={{
                              background: option.glowColor,
                            }}
                            animate={isSelected ? {
                              boxShadow: [
                                `0 0 0px ${option.color}`,
                                `0 0 20px ${option.glowColor}`,
                                `0 0 0px ${option.color}`,
                              ],
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <option.icon
                              size={32}
                              weight={isSelected ? 'fill' : 'duotone'}
                              style={{ color: option.color }}
                            />
                          </motion.div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-bold">{option.name}</h3>
                              {option.price && (
                                <span className="text-xl font-bold" style={{ color: option.color }}>
                                  {option.price}
                                </span>
                              )}
                              {!option.price && (
                                <span className="text-sm font-medium text-muted-foreground">
                                  Free
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {option.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Sparkle size={16} style={{ color: option.color }} />
                              <span className="text-sm font-medium">
                                +{option.vitality} Vitality
                              </span>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute top-4 right-4"
                            >
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: option.color }}
                              >
                                <CheckCircle size={20} weight="fill" className="text-white" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    )
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={isApplying}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={!selectedBoost || isApplying}
                    className="flex-1 relative overflow-hidden"
                    style={
                      selectedOption
                        ? {
                            background: `linear-gradient(135deg, ${selectedOption.color}, ${selectedOption.glowColor})`,
                          }
                        : undefined
                    }
                  >
                    {isApplying ? (
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkle size={20} weight="fill" />
                        </motion.div>
                        Applying...
                      </motion.div>
                    ) : (
                      <>
                        <Lightning size={20} weight="fill" className="mr-2" />
                        Apply Boost
                      </>
                    )}
                    
                    {isApplying && selectedOption && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${selectedOption.glowColor}, transparent)`,
                        }}
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
