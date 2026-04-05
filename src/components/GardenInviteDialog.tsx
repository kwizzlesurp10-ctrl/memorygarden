import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Copy, Check, Link as LinkIcon, UserPlus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { CollaborativeGarden } from '@/lib/types'

interface GardenInviteDialogProps {
  open: boolean
  onClose: () => void
  garden: CollaborativeGarden | null
  inviteUrl: string
}

export function GardenInviteDialog({ open, onClose, garden, inviteUrl }: GardenInviteDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success('Invite link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  if (!garden) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={24} weight="duotone" className="text-primary" />
            Invite to {garden.name}
          </DialogTitle>
          <DialogDescription>
            Share this link to invite others to your collaborative garden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={inviteUrl}
                readOnly
                className="pl-9 pr-3 text-sm font-mono"
              />
            </div>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Current Members ({garden.members.length})</p>
            <div className="space-y-2">
              {garden.members.map((member) => (
                <div key={member.userId} className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>{member.login[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.login}</span>
                  <Badge variant="secondary" className="text-xs capitalize ml-auto">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Anyone with this link can join as a collaborator. Max {garden.settings.maxMembers} members.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          Done
        </Button>
      </DialogContent>
    </Dialog>
  )
}
