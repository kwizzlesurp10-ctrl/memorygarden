import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Plant as PlantIcon, PencilSimple } from '@phosphor-icons/react'
import type { Memory, PlantStage, PlantTraits, PlantVariety, UnlockState } from '@/lib/types'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'
import { canSelectPlantVarietyForEdit } from '@/lib/garden/plant-variety-access'
import { memoryHasPlantableContent, parseHttpHttpsLinkUrl } from '@/lib/memory-link'
import { PlantCustomizer } from '@/components/PlantCustomizer'
import { toast } from 'sonner'

const EDITABLE_VARIETIES: { id: PlantVariety; label: string }[] = [
  { id: 'flower', label: 'Flower' },
  { id: 'tree', label: 'Tree' },
  { id: 'succulent', label: 'Succulent' },
  { id: 'vine', label: 'Vine' },
  { id: 'herb', label: 'Herb' },
  { id: 'wildflower', label: 'Wildflower' },
  { id: 'fern', label: 'Fern' },
  { id: 'mushroom', label: 'Mushroom' },
  { id: 'lotus', label: 'Lotus' },
  { id: 'ancient_oak', label: 'Ancient Oak' },
  { id: 'eternal_rose', label: 'Eternal Rose' },
  { id: 'phoenix_vine', label: 'Phoenix Vine' },
  { id: 'starlight_succulent', label: 'Starlight Succulent' },
]

export interface EditPlantPayload {
  text: string
  linkUrl?: string
  plantVariety: PlantVariety
  plantStage: PlantStage
  traits: PlantTraits
}

interface EditPlantDialogProps {
  open: boolean
  memory: Memory | null
  unlockState?: UnlockState
  onClose: () => void
  onSave: (memoryId: string, payload: EditPlantPayload) => void
}

function EditPlantDialogBody({
  memory,
  unlockState,
  onClose,
  onSave,
}: {
  memory: Memory
  unlockState?: UnlockState
  onClose: () => void
  onSave: (memoryId: string, payload: EditPlantPayload) => void
}) {
  const [text, setText] = useState(memory.text)
  const [linkUrl, setLinkUrl] = useState(memory.linkUrl ?? '')
  const [variety, setVariety] = useState<PlantVariety>(memory.plantVariety)
  const [stage, setStage] = useState<PlantStage>(memory.plantStage)
  const [traits, setTraits] = useState<PlantTraits>(memory.traits ?? {})

  const linkValidation = useMemo(() => parseHttpHttpsLinkUrl(linkUrl), [linkUrl])
  const hasContent = memoryHasPlantableContent({
    text,
    photoUrl: memory.photoUrl,
    linkUrl: linkValidation.valid ? linkValidation.normalized : undefined,
  })

  const handleSave = () => {
    if (!hasContent) {
      toast.error('Keep at least one of text, photo, or link on this memory.')
      return
    }
    if (linkUrl.trim() && !linkValidation.valid) {
      toast.error(linkValidation.error ?? 'Invalid link URL')
      return
    }
    if (!canSelectPlantVarietyForEdit(variety, memory, unlockState)) {
      toast.error('That variety is still locked.')
      return
    }
    onSave(memory.id, {
      text: text.trim(),
      linkUrl: linkValidation.valid ? linkValidation.normalized : undefined,
      plantVariety: variety,
      plantStage: stage,
      traits,
    })
    onClose()
  }

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="edit-memory-text">Memory text</Label>
          <Textarea
            id="edit-memory-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-memory-link">Link (optional)</Label>
          <Input
            id="edit-memory-link"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label>Plant variety</Label>
          <div className="grid grid-cols-3 gap-2">
            {EDITABLE_VARIETIES.map((v) => {
              const locked = !canSelectPlantVarietyForEdit(v.id, memory, unlockState)
              const selected = variety === v.id
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={locked}
                  onClick={() => setVariety(v.id)}
                  title={locked ? 'Unlock this variety through garden milestones' : v.label}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    selected ? 'border-primary bg-primary/10' : 'border-border'
                  } ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary/50'}`}
                >
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Growth stage</Label>
          <div className="flex flex-wrap gap-1.5">
            {PLANT_STAGES_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={`rounded-full border px-2.5 py-1 text-xs capitalize ${
                  stage === s ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <PlantCustomizer memory={{ ...memory, traits }} onUpdateTraits={(_, t) => setTraits(t)} />

        {!hasContent ? (
          <p className="text-xs text-destructive">Add text, keep the photo, or provide a valid link.</p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={!hasContent}>
          <PlantIcon size={18} weight="fill" className="mr-1.5" />
          Save changes
        </Button>
      </div>
    </>
  )
}

export function EditPlantDialog({ open, memory, unlockState, onClose, onSave }: EditPlantDialogProps) {
  return (
    <Dialog open={open && memory !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilSimple size={22} weight="duotone" className="text-primary" />
            Edit plant
          </DialogTitle>
          <DialogDescription>
            Change how this memory appears in the garden. Growth from visits and reflections continues from the stage you choose.
          </DialogDescription>
        </DialogHeader>

        {memory ? (
          <EditPlantDialogBody
            key={memory.id}
            memory={memory}
            unlockState={unlockState}
            onClose={onClose}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
