import { useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Palette, Sparkle } from '@phosphor-icons/react'
import type { PlantStylePreference, ArtStyle } from '@/lib/types'

interface PlantStyleCustomizerProps {
  open: boolean
  onClose: () => void
  currentStyle: PlantStylePreference | undefined
  onSave: (style: PlantStylePreference) => void
}

const ART_STYLES: { value: ArtStyle; label: string; description: string }[] = [
  { value: 'watercolor', label: 'Watercolor', description: 'Soft, flowing brushstrokes with translucent colors' },
  { value: 'botanical-illustration', label: 'Botanical', description: 'Detailed scientific illustration style' },
  { value: 'pixel-art', label: 'Pixel Art', description: 'Retro pixel-perfect nostalgic style' },
  { value: 'oil-painting', label: 'Oil Painting', description: 'Rich, textured classical art style' },
  { value: 'studio-ghibli', label: 'Studio Ghibli', description: 'Whimsical anime-inspired nature art' },
  { value: 'photorealistic', label: 'Photorealistic', description: 'Lifelike photographic quality' },
]

export function PlantStyleCustomizer({ open, onClose, currentStyle, onSave }: PlantStyleCustomizerProps) {
  const [artStyle, setArtStyle] = useState<ArtStyle>(currentStyle?.artStyle || 'watercolor')
  const [customHints, setCustomHints] = useState(currentStyle?.customPromptHints || '')

  const handleSave = () => {
    onSave({
      artStyle,
      customPromptHints: customHints.trim() || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette size={24} weight="duotone" className="text-primary" />
            Plant Art Style
          </DialogTitle>
          <DialogDescription>
            Choose how AI-generated plants will look in your garden. Plants will be generated in the background.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-2 block">Art Style</Label>
            <div className="grid grid-cols-2 gap-2">
              {ART_STYLES.map((style) => (
                <motion.button
                  key={style.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setArtStyle(style.value)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    artStyle === style.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="text-sm font-medium">{style.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{style.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-hints">Custom Description (optional)</Label>
            <Input
              id="custom-hints"
              placeholder="e.g., Japanese ink painting style, warm earthy tones..."
              value={customHints}
              onChange={(e) => setCustomHints(e.target.value)}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground">
              Add custom hints to guide the AI art generation.
            </p>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg flex items-start gap-2">
            <Sparkle size={16} weight="duotone" className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              AI plant images are generated in the background using your chosen style.
              SVG plants are shown instantly while images generate. Generated images are cached for each growth stage.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Sparkle size={16} className="mr-1" />
            Save Style
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
