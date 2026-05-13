import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarBlank, Image as ImageIcon, MapPin, Plant as PlantIcon, Sparkle } from '@phosphor-icons/react'
import { AudioRecorder } from '@/components/AudioRecorder'
import { FlowerPlant } from '@/components/plants/FlowerPlant'
import { TreePlant, SucculentPlant, VinePlant, HerbPlant, WildflowerPlant } from '@/components/plants/OtherPlants'
import { classifyEmotionalTone, selectPlantVariety } from '@/lib/garden-helpers'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { AudioRecording, PlantVariety } from '@/lib/types'

interface PlantMemoryModalProps {
  open: boolean
  onClose: () => void
  onPlant: (data: {
    photoFile: File
    text: string
    date: string
    location?: string
    audioRecordings: AudioRecording[]
    plantVariety: PlantVariety   // now required
  }) => void
}

// ... (PLANT_VARIETIES, colors, etc. remain the same)

const PLANT_VARIETIES: { id: PlantVariety; label: string; color: string; tagline: string }[] = [
  { id: 'flower',     label: 'Flower',     color: 'oklch(0.82 0.16 340)', tagline: 'Open & warm' },
  { id: 'tree',       label: 'Tree',       color: 'oklch(0.58 0.12 155)', tagline: 'Deep & enduring' },
  { id: 'succulent',  label: 'Succulent',  color: 'oklch(0.68 0.14 155)', tagline: 'Calm & resilient' },
  { id: 'herb',       label: 'Herb',       color: 'oklch(0.64 0.14 140)', tagline: 'Grounded & steady' },
  { id: 'vine',       label: 'Vine',       color: 'oklch(0.72 0.14 100)', tagline: 'Nostalgic & twining' },
  { id: 'wildflower', label: 'Wildflower', color: 'oklch(0.80 0.16 90)',  tagline: 'Free & joyful' },
]

const STEM_COLOR   = 'oklch(0.52 0.09 155)'
const GROUND_COLOR = 'oklch(0.45 0.05 65)'
const PLANTING_CELEBRATION_MS = 3000

export function PlantMemoryModal({ open, onClose, onPlant }: PlantMemoryModalProps) {
  // ... existing state
  const [selectedVariety, setSelectedVariety] = useState<PlantVariety | null>(null)
  const [suggestedVariety, setSuggestedVariety] = useState<PlantVariety>('flower')

  // ... existing effects

  const handlePlant = async () => {
    if (!photoFile) { toast.error('Please select a photo'); return }
    if (text.trim().length < 5) { toast.error('Please write at least a few words'); return }

    setIsPlanting(true)
    try {
      const finalVariety: PlantVariety = selectedVariety ?? suggestedVariety ?? 'flower'

      await onPlant({
        photoFile,
        text: text.trim(),
        date: date.toISOString(),
        location: location.trim() || undefined,
        audioRecordings,
        plantVariety: finalVariety,   // always a valid value now
      })

      // reset state...
      setIsPlanted(true)
    } catch (_) {
      toast.error('Failed to plant memory. Please try again.')
    } finally {
      setIsPlanting(false)
    }
  }

  // ... rest of component (UI is already good)
}