import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CircleNotch, Plant as PlantIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Memory } from '@/lib/types'
import {
  COMMUNITY_TEXT_ONLY_PHOTO,
  memoryToPlantPayload,
  plantMemoryInGarden,
  randomGardenPlantPosition,
  type PlantInGardenPayload,
} from '@/lib/community-gardens-api'

interface PlantCommunityGardenModalProps {
  open: boolean
  gardenId: string
  gardenName: string
  userId: string
  userName: string
  userAvatar?: string
  memories: Memory[]
  onClose: () => void
  onPlanted: () => void
}

type SourceMode = 'existing' | 'new'

export function PlantCommunityGardenModal({
  open,
  gardenId,
  gardenName,
  userId,
  userName,
  userAvatar,
  memories,
  onClose,
  onPlanted,
}: PlantCommunityGardenModalProps) {
  const [mode, setMode] = useState<SourceMode>('existing')
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null)
  const [newText, setNewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmShareOpen, setConfirmShareOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<PlantInGardenPayload | null>(null)

  const plantableMemories = useMemo(
    () => memories.filter((m) => m.text?.trim() || m.photoUrl),
    [memories],
  )

  const selectedMemory = plantableMemories.find((m) => m.id === selectedMemoryId) ?? null

  function resetForm(): void {
    setMode('existing')
    setSelectedMemoryId(null)
    setNewText('')
    setPendingPayload(null)
    setConfirmShareOpen(false)
  }

  function handleClose(): void {
    if (submitting) return
    resetForm()
    onClose()
  }

  function buildPayload(visibility: 'public' | 'private'): PlantInGardenPayload | null {
    if (mode === 'existing' && selectedMemory) {
      return memoryToPlantPayload(
        selectedMemory,
        gardenId,
        { id: userId, name: userName, avatar: userAvatar },
        visibility,
      )
    }
    const text = newText.trim()
    if (mode === 'new' && text.length >= 3) {
      const { x, y } = randomGardenPlantPosition()
      return {
        gardenId,
        contributorId: userId,
        contributorName: userName,
        contributorAvatar: userAvatar,
        photoUrl: COMMUNITY_TEXT_ONLY_PHOTO,
        text,
        positionX: x,
        positionY: y,
        emotionalTone: 'peaceful',
        plantVariety: 'flower',
        visibility,
      }
    }
    return null
  }

  async function submitPayload(payload: PlantInGardenPayload): Promise<void> {
    setSubmitting(true)
    const result = await plantMemoryInGarden(payload)
    setSubmitting(false)
    if (!result.ok) {
      toast.error('Could not plant memory', { description: result.error })
      return
    }
    toast.success(`Memory planted in ${gardenName}`)
    resetForm()
    onPlanted()
    onClose()
  }

  function handlePlantClick(): void {
    const requiresPrivateShare =
      mode === 'existing' && selectedMemory?.visibility === 'private'
    const payload = buildPayload(requiresPrivateShare ? 'public' : 'public')
    if (!payload) {
      toast.error('Choose a memory or write at least a few words')
      return
    }

    if (requiresPrivateShare) {
      setPendingPayload(payload)
      setConfirmShareOpen(true)
      return
    }

    void submitPayload(payload)
  }

  function handleConfirmShare(): void {
    if (!pendingPayload) return
    setConfirmShareOpen(false)
    void submitPayload(pendingPayload)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plant a memory in {gardenName}</DialogTitle>
            <DialogDescription>
              Share something from your garden or write a short new memory. Nothing private is shared
              unless you confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={mode === 'existing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('existing')}
            >
              From my garden
            </Button>
            <Button
              type="button"
              variant={mode === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('new')}
            >
              Write new
            </Button>
          </div>

          {mode === 'existing' ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {plantableMemories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Plant a memory in your personal garden first, or write a new one here.
                </p>
              ) : (
                plantableMemories.map((memory) => (
                  <button
                    key={memory.id}
                    type="button"
                    onClick={() => setSelectedMemoryId(memory.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      selectedMemoryId === memory.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex gap-3">
                      {memory.photoUrl ? (
                        <img
                          src={memory.photoUrl}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm line-clamp-2">{memory.text || 'Linked memory'}</p>
                        {memory.visibility === 'private' && (
                          <p className="text-xs text-amber-600 mt-1">Private — requires confirmation to share</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="community-new-memory">Your memory</Label>
              <Textarea
                id="community-new-memory"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="A few words about this moment..."
                className="min-h-[120px] resize-none"
                maxLength={2000}
              />
            </div>
          )}

          <Button
            type="button"
            className="w-full mt-4"
            disabled={submitting}
            onClick={handlePlantClick}
          >
            {submitting ? (
              <CircleNotch size={18} className="animate-spin mr-2" />
            ) : (
              <PlantIcon size={18} className="mr-2" />
            )}
            Plant in {gardenName}
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmShareOpen} onOpenChange={setConfirmShareOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share this private memory?</AlertDialogTitle>
            <AlertDialogDescription>
              This memory is private in your personal garden. Planting it in {gardenName} will share its
              photo and text with other gardeners. Continue only if you want it visible here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Keep private</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={handleConfirmShare}>
              Share in {gardenName}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
