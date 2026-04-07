import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Lock, Check, Palette, Leaf, Butterfly, Star, Sun } from '@phosphor-icons/react'
import type { Memory, PlantTraits, TraitSlot } from '@/lib/types'
import { getSlotStatus, type TraitCandidate } from '@/lib/trait-system'

interface PlantCustomizerProps {
  memory: Memory
  onUpdateTraits: (memoryId: string, traits: PlantTraits) => void
}

const SLOT_ICONS: Record<TraitSlot, React.ReactNode> = {
  palette: <Palette size={16} weight="bold" />,
  pattern: <Leaf size={16} weight="bold" />,
  adornment: <Butterfly size={16} weight="bold" />,
  accent: <Star size={16} weight="bold" />,
  aura: <Sun size={16} weight="bold" />,
}

const SLOT_LABELS: Record<TraitSlot, string> = {
  palette: 'Palette',
  pattern: 'Pattern',
  adornment: 'Adornment',
  accent: 'Accent',
  aura: 'Aura',
}

export function PlantCustomizer({ memory, onUpdateTraits }: PlantCustomizerProps) {
  const [expandedSlot, setExpandedSlot] = useState<TraitSlot | null>(null)
  const slots = getSlotStatus(memory)

  const handleSelectTrait = (slot: TraitSlot, traitId: string) => {
    const currentTraits = memory.traits || {}
    const updatedTraits: PlantTraits = { ...currentTraits }

    switch (slot) {
      case 'palette':
        updatedTraits.paletteId = traitId as PlantTraits['paletteId']
        break
      case 'pattern':
        updatedTraits.pattern = traitId as PlantTraits['pattern']
        break
      case 'adornment':
        updatedTraits.adornment = traitId as PlantTraits['adornment']
        break
      case 'accent':
        updatedTraits.accent = traitId as PlantTraits['accent']
        break
      case 'aura':
        updatedTraits.aura = traitId as PlantTraits['aura']
        break
    }

    onUpdateTraits(memory.id, updatedTraits)
    setExpandedSlot(null)
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Customize Plant
      </h3>
      <div className="space-y-2">
        {slots.map((slotInfo) => (
          <div key={slotInfo.slot}>
            <SlotRow
              slot={slotInfo.slot}
              unlocked={slotInfo.unlocked}
              unlocksAtStage={slotInfo.unlocksAtStage}
              activeTrait={slotInfo.activeTrait}
              candidates={slotInfo.candidates}
              isExpanded={expandedSlot === slotInfo.slot}
              onToggle={() =>
                setExpandedSlot(
                  expandedSlot === slotInfo.slot ? null : slotInfo.slot
                )
              }
              onSelect={(traitId) => handleSelectTrait(slotInfo.slot, traitId)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function SlotRow({
  slot,
  unlocked,
  unlocksAtStage,
  activeTrait,
  candidates,
  isExpanded,
  onToggle,
  onSelect,
}: {
  slot: TraitSlot
  unlocked: boolean
  unlocksAtStage: string
  activeTrait: string | undefined
  candidates: TraitCandidate[]
  isExpanded: boolean
  onToggle: () => void
  onSelect: (traitId: string) => void
}) {
  const activeCandidate = candidates.find((c) => c.traitId === activeTrait)

  if (!unlocked) {
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/20 opacity-60">
        <Lock size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground flex-1">
          {SLOT_LABELS[slot]}
        </span>
        <Badge variant="outline" className="text-xs">
          Unlocks at {unlocksAtStage}
        </Badge>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 w-full py-2 px-3 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="text-primary">{SLOT_ICONS[slot]}</span>
        <span className="text-sm font-medium flex-1">{SLOT_LABELS[slot]}</span>
        {activeCandidate ? (
          <Badge variant="secondary" className="text-xs">
            {activeCandidate.label}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs opacity-50">
            Choose
          </Badge>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <Separator />
            <div className="p-2 space-y-1">
              {candidates.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-1">
                  Keep tending this plant to unlock traits!
                </p>
              ) : (
                candidates.map((candidate) => (
                  <CandidateButton
                    key={candidate.traitId}
                    candidate={candidate}
                    isActive={activeTrait === candidate.traitId}
                    onSelect={() => onSelect(candidate.traitId)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CandidateButton({
  candidate,
  isActive,
  onSelect,
}: {
  candidate: TraitCandidate
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      className="w-full justify-start gap-2 h-auto py-2"
      onClick={onSelect}
    >
      {isActive && <Check size={14} weight="bold" className="text-primary flex-shrink-0" />}
      <div className="text-left">
        <div className="text-sm font-medium">{candidate.label}</div>
        <div className="text-xs text-muted-foreground">{candidate.description}</div>
      </div>
    </Button>
  )
}
