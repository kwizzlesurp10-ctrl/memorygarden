import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Lock, 
  Check, 
  Palette, 
  Leaf, 
  Butterfly, 
  Star, 
  Sun,
  Drop,
  Fire,
  Sparkle,
  CircleNotch,
  Eye,
  CaretDown
} from '@phosphor-icons/react'
import type { Memory, PlantTraits, TraitSlot } from '@/lib/types'
import { getSlotStatus, PALETTE_COLORS, TRAIT_CATALOG, type TraitCandidate } from '@/lib/trait-system'

interface PlantCustomizerProps {
  memory: Memory
  onUpdateTraits: (memoryId: string, traits: PlantTraits) => void
}

const SLOT_ICONS: Record<TraitSlot, React.ReactNode> = {
  palette: <Palette size={18} weight="duotone" />,
  pattern: <Leaf size={18} weight="duotone" />,
  adornment: <Butterfly size={18} weight="duotone" />,
  accent: <Star size={18} weight="duotone" />,
  aura: <Sun size={18} weight="duotone" />,
}

const SLOT_LABELS: Record<TraitSlot, string> = {
  palette: 'Color Palette',
  pattern: 'Pattern',
  adornment: 'Adornment',
  accent: 'Accent Effect',
  aura: 'Aura',
}

const SLOT_DESCRIPTIONS: Record<TraitSlot, string> = {
  palette: 'Change the color theme of your plant',
  pattern: 'Add visual patterns to petals and leaves',
  adornment: 'Animated decorations around your plant',
  accent: 'Highlight effects and visual flourishes',
  aura: 'Ambient glow surrounding your plant',
}

// Visual preview components for each trait type
const PALETTE_PREVIEW: Record<string, { colors: string[], gradient?: string }> = {
  default: { colors: ['#8BC34A', '#4CAF50', '#388E3C'] },
  dawn: { colors: ['#FFB74D', '#FF9800', '#F57C00'], gradient: 'linear-gradient(135deg, #FFB74D, #FF9800, #F57C00)' },
  twilight: { colors: ['#9575CD', '#7E57C2', '#5E35B1'], gradient: 'linear-gradient(135deg, #9575CD, #7E57C2, #5E35B1)' },
  forest: { colors: ['#4CAF50', '#2E7D32', '#1B5E20'], gradient: 'linear-gradient(135deg, #4CAF50, #2E7D32, #1B5E20)' },
  coral: { colors: ['#FF8A80', '#FF5252', '#E53935'], gradient: 'linear-gradient(135deg, #FF8A80, #FF5252, #E53935)' },
  lavender: { colors: ['#CE93D8', '#BA68C8', '#9C27B0'], gradient: 'linear-gradient(135deg, #CE93D8, #BA68C8, #9C27B0)' },
}

const PATTERN_PREVIEW: Record<string, React.ReactNode> = {
  solid: (
    <div className="w-8 h-8 rounded-md bg-primary/60" />
  ),
  speckle: (
    <div className="w-8 h-8 rounded-md bg-primary/40 relative overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div 
          key={i} 
          className="absolute w-1 h-1 rounded-full bg-primary/80"
          style={{ 
            left: `${(i % 3) * 30 + 10}%`, 
            top: `${Math.floor(i / 3) * 30 + 15}%` 
          }}
        />
      ))}
    </div>
  ),
  gradient: (
    <div className="w-8 h-8 rounded-md bg-gradient-to-b from-primary/80 to-primary/20" />
  ),
  stripe: (
    <div className="w-8 h-8 rounded-md overflow-hidden">
      {[...Array(4)].map((_, i) => (
        <div 
          key={i} 
          className={`h-2 ${i % 2 === 0 ? 'bg-primary/60' : 'bg-primary/30'}`}
        />
      ))}
    </div>
  ),
}

const ADORNMENT_ICONS: Record<string, React.ReactNode> = {
  none: <CircleNotch size={18} className="opacity-40" />,
  dew: <Drop size={18} weight="fill" className="text-blue-400" />,
  butterflies: <Butterfly size={18} weight="fill" className="text-pink-400" />,
  fireflies: <Fire size={18} weight="fill" className="text-yellow-400" />,
  pollen: <Sparkle size={18} weight="fill" className="text-amber-400" />,
}

const ACCENT_ICONS: Record<string, React.ReactNode> = {
  none: <CircleNotch size={18} className="opacity-40" />,
  sparkle: <Sparkle size={18} weight="fill" className="text-yellow-300" />,
  rings: <Eye size={18} weight="fill" className="text-emerald-400" />,
  halo: <Sun size={18} weight="fill" className="text-amber-300" />,
}

const AURA_PREVIEWS: Record<string, { color: string, animation: string }> = {
  none: { color: 'transparent', animation: '' },
  softGlow: { color: 'rgba(255, 193, 7, 0.3)', animation: 'pulse' },
  starlight: { color: 'rgba(156, 39, 176, 0.3)', animation: 'pulse' },
  aurora: { color: 'rgba(0, 230, 118, 0.3)', animation: 'pulse' },
}

// Unlock requirements for showing progress
const UNLOCK_REQUIREMENTS: Record<string, { type: string; current: (m: Memory) => number; target: number; label: string }> = {
  'adornment:dew': { type: 'visits', current: (m) => m.visitCount, target: 3, label: 'visits' },
  'accent:sparkle': { type: 'visits', current: (m) => m.visitCount, target: 5, label: 'visits' },
  'palette:dawn': { type: 'visits', current: (m) => m.visitCount, target: 8, label: 'visits' },
  'aura:softGlow': { type: 'visits', current: (m) => m.visitCount, target: 12, label: 'visits' },
  'palette:coral': { type: 'reflections', current: (m) => m.reflections.length, target: 1, label: 'reflection' },
  'accent:rings': { type: 'reflections', current: (m) => m.reflections.length, target: 3, label: 'reflections' },
  'palette:forest': { type: 'days', current: (m) => Math.floor((Date.now() - new Date(m.plantedAt).getTime()) / 86400000), target: 7, label: 'days old' },
  'adornment:fireflies': { type: 'days', current: (m) => Math.floor((Date.now() - new Date(m.plantedAt).getTime()) / 86400000), target: 14, label: 'days old' },
  'aura:starlight': { type: 'days', current: (m) => Math.floor((Date.now() - new Date(m.plantedAt).getTime()) / 86400000), target: 30, label: 'days old' },
  'adornment:butterflies': { type: 'shares', current: (m) => m.shareCount || 0, target: 1, label: 'share' },
  'adornment:pollen': { type: 'shares', current: (m) => m.shareCount || 0, target: 3, label: 'shares' },
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Customize Plant
        </h3>
        <Badge variant="outline" className="text-xs">
          {slots.filter(s => s.unlocked).length}/{slots.length} slots
        </Badge>
      </div>
      
      <div className="space-y-2">
        {slots.map((slotInfo) => (
          <SlotRow
            key={slotInfo.slot}
            memory={memory}
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
        ))}
      </div>
    </div>
  )
}

function SlotRow({
  memory,
  slot,
  unlocked,
  unlocksAtStage,
  activeTrait,
  candidates,
  isExpanded,
  onToggle,
  onSelect,
}: {
  memory: Memory
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
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-dashed border-border/50 bg-muted/10 p-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
            <Lock size={18} className="text-muted-foreground/50" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground/70">
                {SLOT_LABELS[slot]}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-dashed">
                {unlocksAtStage}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/50 truncate">
              {SLOT_DESCRIPTIONS[slot]}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-card/50 overflow-hidden shadow-sm"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 w-full p-3 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {SLOT_ICONS[slot]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{SLOT_LABELS[slot]}</span>
            {activeCandidate ? (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                {activeCandidate.label}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs opacity-60">
                Select
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {candidates.length} option{candidates.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <CaretDown size={18} className="text-muted-foreground" />
        </motion.div>
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
            <div className="p-3 space-y-2">
              {candidates.length === 0 ? (
                <EmptySlotMessage memory={memory} slot={slot} />
              ) : (
                <>
                  {/* Available traits */}
                  <div className="grid grid-cols-1 gap-2">
                    {candidates.map((candidate) => (
                      <CandidateButton
                        key={candidate.traitId}
                        slot={slot}
                        candidate={candidate}
                        isActive={activeTrait === candidate.traitId}
                        onSelect={() => onSelect(candidate.traitId)}
                      />
                    ))}
                  </div>
                  
                  {/* Locked traits with progress */}
                  <LockedTraitsPreview memory={memory} slot={slot} unlockedIds={candidates.map(c => c.traitId)} />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EmptySlotMessage({ memory, slot }: { memory: Memory; slot: TraitSlot }) {
  // Find a locked trait to show progress for
  const allTraitsForSlot = TRAIT_CATALOG.filter(t => t.slot === slot)
  const requirement = allTraitsForSlot
    .map(t => UNLOCK_REQUIREMENTS[`${slot}:${t.traitId}`])
    .find(r => r && r.current(memory) < r.target)

  if (requirement) {
    const progress = Math.min(100, (requirement.current(memory) / requirement.target) * 100)
    return (
      <div className="p-3 bg-muted/20 rounded-lg space-y-2">
        <p className="text-xs text-muted-foreground">
          Keep tending this plant to unlock traits!
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Next unlock</span>
            <span className="font-medium">{requirement.current(memory)}/{requirement.target} {requirement.label}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
    )
  }

  return (
    <p className="text-xs text-muted-foreground px-2 py-3 text-center">
      Keep tending this plant to unlock traits!
    </p>
  )
}

function LockedTraitsPreview({ memory, slot, unlockedIds }: { memory: Memory; slot: TraitSlot; unlockedIds: string[] }) {
  const allTraitsForSlot = TRAIT_CATALOG.filter(t => t.slot === slot)
  const lockedTraits = allTraitsForSlot.filter(t => !unlockedIds.includes(t.traitId))
  
  if (lockedTraits.length === 0) return null

  // Find next unlockable trait
  const nextUnlock = lockedTraits.find(t => {
    const req = UNLOCK_REQUIREMENTS[`${slot}:${t.traitId}`]
    return req && req.current(memory) < req.target
  })

  if (!nextUnlock) return null

  const requirement = UNLOCK_REQUIREMENTS[`${slot}:${nextUnlock.traitId}`]
  if (!requirement) return null

  const progress = Math.min(100, (requirement.current(memory) / requirement.target) * 100)

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-3 p-3 bg-muted/20 rounded-lg border border-dashed border-border/50"
    >
      <div className="flex items-center gap-2 mb-2">
        <Lock size={14} className="text-muted-foreground/60" />
        <span className="text-xs font-medium text-muted-foreground">Next: {nextUnlock.label}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground/80">{nextUnlock.description}</span>
          <span className="font-medium text-muted-foreground">{requirement.current(memory)}/{requirement.target}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    </motion.div>
  )
}

function CandidateButton({
  slot,
  candidate,
  isActive,
  onSelect,
}: {
  slot: TraitSlot
  candidate: TraitCandidate
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      className={`w-full justify-start gap-3 h-auto py-2.5 px-3 ${
        isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/30'
      }`}
      onClick={onSelect}
    >
      {/* Visual preview based on slot type */}
      <div className="flex-shrink-0">
        <TraitPreview slot={slot} traitId={candidate.traitId} isActive={isActive} />
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{candidate.label}</span>
          {isActive && (
            <Check size={14} weight="bold" className="text-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{candidate.description}</p>
      </div>
    </Button>
  )
}

function TraitPreview({ slot, traitId, isActive }: { slot: TraitSlot; traitId: string; isActive: boolean }) {
  switch (slot) {
    case 'palette': {
      const preview = PALETTE_PREVIEW[traitId]
      if (!preview) return <div className="w-8 h-8 rounded-md bg-muted" />
      return (
        <div className="flex gap-0.5">
          {preview.colors.map((color, i) => (
            <motion.div
              key={i}
              className="w-2.5 h-8 first:rounded-l-md last:rounded-r-md"
              style={{ backgroundColor: color }}
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      )
    }
    
    case 'pattern':
      return PATTERN_PREVIEW[traitId] || <div className="w-8 h-8 rounded-md bg-muted" />
    
    case 'adornment':
      return (
        <motion.div 
          className="w-8 h-8 rounded-md bg-muted/30 flex items-center justify-center"
          animate={isActive && traitId !== 'none' ? { 
            y: [0, -2, 0],
            rotate: traitId === 'butterflies' ? [0, 5, -5, 0] : 0
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {ADORNMENT_ICONS[traitId] || <CircleNotch size={18} className="opacity-40" />}
        </motion.div>
      )
    
    case 'accent':
      return (
        <motion.div 
          className="w-8 h-8 rounded-md bg-muted/30 flex items-center justify-center"
          animate={isActive && traitId !== 'none' ? { 
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {ACCENT_ICONS[traitId] || <CircleNotch size={18} className="opacity-40" />}
        </motion.div>
      )
    
    case 'aura': {
      const aura = AURA_PREVIEWS[traitId]
      return (
        <motion.div 
          className="w-8 h-8 rounded-full flex items-center justify-center relative"
          style={{ backgroundColor: aura?.color || 'transparent' }}
          animate={isActive && traitId !== 'none' ? { 
            boxShadow: [
              `0 0 8px 2px ${aura?.color || 'transparent'}`,
              `0 0 16px 4px ${aura?.color || 'transparent'}`,
              `0 0 8px 2px ${aura?.color || 'transparent'}`
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sun size={18} weight="fill" className={traitId === 'none' ? 'opacity-40' : 'text-white/80'} />
        </motion.div>
      )
    }
    
    default:
      return <div className="w-8 h-8 rounded-md bg-muted" />
  }
}
