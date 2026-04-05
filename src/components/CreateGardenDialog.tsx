import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tree } from '@phosphor-icons/react'
import type { GardenSettings } from '@/lib/types'

interface CreateGardenDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (data: { name: string; description: string; settings: GardenSettings }) => void
}

export function CreateGardenDialog({ open, onClose, onCreate }: CreateGardenDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [settings, setSettings] = useState<GardenSettings>({
    allowReflections: true,
    allowRearrange: false,
    isPublic: false,
    maxMembers: 10,
  })

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate({ name: name.trim(), description: description.trim(), settings })
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tree size={24} weight="duotone" className="text-primary" />
            Create Shared Garden
          </DialogTitle>
          <DialogDescription>
            Create a garden where multiple people can plant and nurture memories together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="garden-name">Garden Name</Label>
            <Input
              id="garden-name"
              placeholder="e.g., Family Memories, Travel Adventures"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="garden-desc">Description</Label>
            <Textarea
              id="garden-desc"
              placeholder="What is this garden about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={200}
            />
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">Settings</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Allow reflections</p>
                <p className="text-xs text-muted-foreground">Members can add reflections</p>
              </div>
              <Switch
                checked={settings.allowReflections}
                onCheckedChange={(checked) => setSettings({ ...settings, allowReflections: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Allow rearranging</p>
                <p className="text-xs text-muted-foreground">Members can move their own plants</p>
              </div>
              <Switch
                checked={settings.allowRearrange}
                onCheckedChange={(checked) => setSettings({ ...settings, allowRearrange: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Public garden</p>
                <p className="text-xs text-muted-foreground">Anyone with the link can view</p>
              </div>
              <Switch
                checked={settings.isPublic}
                onCheckedChange={(checked) => setSettings({ ...settings, isPublic: checked })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()} className="flex-1">
            Create Garden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
