import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Palette, Sparkle, ArrowsClockwise, Drop } from '@phosphor-icons/react'
import type { Memory, PaletteId, AdornmentId, PatternId, PlantCosmetics, UnlockState } from '@/lib/types'
import { PALETTE_COLORS, getRarityInfo, UNLOCKABLE_ITEMS, REROLL_COST, canAffordReroll, ensureUnlockState } from '@/lib/unlock-system'

interface PlantCosmeticsEditorProps {
  open: boolean
  onClose: () => void
  memory: Memory | null
  unlockState: UnlockState | undefined
  onSave: (memoryId: string, cosmetics: PlantCosmetics) => void
  onReroll: (memoryId: string) => void
}

export function PlantCosmeticsEditor({
  open,
  onClose,
  memory,
  unlockState,
  onSave,
  onReroll,
}: PlantCosmeticsEditorProps) {
  const state = ensureUnlockState(unlockState)
  const [selectedPalette, setSelectedPalette] = useState<PaletteId | undefined>(
    memory?.cosmetics?.paletteId
  )
  const [selectedAdornment, setSelectedAdornment] = useState<AdornmentId | undefined>(
    memory?.cosmetics?.adornmentId
  )
  const [selectedPattern, setSelectedPattern] = useState<PatternId | undefined>(
    memory?.cosmetics?.patternId
  )

  // Sync state when the memory prop changes
  useEffect(() => {
    setSelectedPalette(memory?.cosmetics?.paletteId)
    setSelectedAdornment(memory?.cosmetics?.adornmentId)
    setSelectedPattern(memory?.cosmetics?.patternId)
  }, [memory?.id, memory?.cosmetics?.paletteId, memory?.cosmetics?.adornmentId, memory?.cosmetics?.patternId])

  if (!memory) return null

  const handleSave = () => {
    onSave(memory.id, {
      paletteId: selectedPalette,
      adornmentId: selectedAdornment,
      patternId: selectedPattern,
    })
    onClose()
  }

  const handleReroll = () => {
    if (canAffordReroll(state.wallet)) {
      onReroll(memory.id)
    }
  }

  const paletteItems = UNLOCKABLE_ITEMS.filter(i => i.type === 'palette')
  const adornmentItems = UNLOCKABLE_ITEMS.filter(i => i.type === 'adornment')
  const patternItems = UNLOCKABLE_ITEMS.filter(i => i.type === 'pattern')

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette size={24} weight="duotone" className="text-primary" />
            Customize Plant
          </DialogTitle>
          <DialogDescription>
            Apply cosmetics to this plant. Cosmetics are purely visual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Re-roll genetics */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium">Re-roll Appearance</p>
              <p className="text-xs text-muted-foreground">
                Regenerates unique petal shapes and stem curves
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReroll}
              disabled={!canAffordReroll(state.wallet)}
              className="flex items-center gap-1"
            >
              <ArrowsClockwise size={14} />
              <Drop size={14} weight="fill" className="text-blue-400" />
              {REROLL_COST}
            </Button>
          </div>

          <Separator />

          {/* Palette selection */}
          <div>
            <Label className="mb-2 block text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Color Palette
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {paletteItems.map((item) => {
                const isAvailable = state.unlockedPalettes.includes(item.id as PaletteId)
                const isSelected = selectedPalette === item.id
                const colors = PALETTE_COLORS[item.id as PaletteId]
                return (
                  <motion.button
                    key={item.id}
                    whileHover={isAvailable ? { scale: 1.02 } : {}}
                    whileTap={isAvailable ? { scale: 0.98 } : {}}
                    onClick={() => isAvailable && setSelectedPalette(item.id as PaletteId)}
                    disabled={!isAvailable}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : isAvailable
                          ? 'border-border hover:border-primary/50'
                          : 'border-border opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      {!isAvailable && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">🔒</Badge>
                      )}
                    </div>
                    {colors && (
                      <div className="flex gap-1 mb-1">
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ background: colors.primary }} />
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ background: colors.secondary }} />
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ background: colors.accent }} />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </motion.button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Pattern selection */}
          <div>
            <Label className="mb-2 block text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Pattern
            </Label>
            <div className="flex flex-wrap gap-2">
              {patternItems.map((item) => {
                const isAvailable = state.unlockedPatterns.includes(item.id as PatternId)
                const isSelected = selectedPattern === item.id
                return (
                  <motion.button
                    key={item.id}
                    whileHover={isAvailable ? { scale: 1.05 } : {}}
                    whileTap={isAvailable ? { scale: 0.95 } : {}}
                    onClick={() => isAvailable && setSelectedPattern(item.id as PatternId)}
                    disabled={!isAvailable}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 font-medium'
                        : isAvailable
                          ? 'border-border hover:border-primary/50'
                          : 'border-border opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {item.name} {!isAvailable && '🔒'}
                  </motion.button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Adornment selection */}
          <div>
            <Label className="mb-2 block text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Adornment
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {adornmentItems.map((item) => {
                const isAvailable = state.unlockedAdornments.includes(item.id as AdornmentId)
                const isSelected = selectedAdornment === item.id
                const rarity = getRarityInfo(item.rarity)
                return (
                  <motion.button
                    key={item.id}
                    whileHover={isAvailable ? { scale: 1.02 } : {}}
                    whileTap={isAvailable ? { scale: 0.98 } : {}}
                    onClick={() => isAvailable && setSelectedAdornment(item.id as AdornmentId)}
                    disabled={!isAvailable}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : isAvailable
                          ? 'border-border hover:border-primary/50'
                          : 'border-border opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium">{item.name}</p>
                      {!isAvailable && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">🔒</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Sparkle size={16} className="mr-1" />
            Apply Cosmetics
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
