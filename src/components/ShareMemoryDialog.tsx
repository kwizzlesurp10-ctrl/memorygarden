import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShareNetwork, Copy, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateShareId, getShareUrl } from '@/lib/garden-helpers'

interface ShareMemoryDialogProps {
  open: boolean
  onClose: () => void
  onShare: (shareId: string) => Promise<void>
  existingShareId?: string
}

export function ShareMemoryDialog({ open, onClose, onShare, existingShareId }: ShareMemoryDialogProps) {
  const [shareId, setShareId] = useState<string | null>(existingShareId || null)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateLink = async () => {
    setIsGenerating(true)
    try {
      const newShareId = generateShareId()
      await onShare(newShareId)
      setShareId(newShareId)
      toast.success('Shareable link created!')
    } catch (error) {
      toast.error('Failed to create share link')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareId) return
    
    const url = getShareUrl(shareId)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const shareUrl = shareId ? getShareUrl(shareId) : ''

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareNetwork size={24} weight="duotone" className="text-primary" />
            Share Memory
          </DialogTitle>
          <DialogDescription>
            Create a shareable link to this memory that friends can view (without your private reflections)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {!shareId ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <ShareNetwork size={40} weight="duotone" className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Generate a unique link that you can share with friends. They'll be able to view the photo, text, date, and location.
              </p>
              <Button onClick={handleGenerateLink} disabled={isGenerating} className="w-full">
                {isGenerating ? 'Generating...' : 'Generate Share Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-link">Shareable Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <h4 className="text-sm font-medium">What's shared:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Photo</li>
                  <li>✓ Memory text</li>
                  <li>✓ Date and location</li>
                  <li>✓ Emotional tone</li>
                  <li>✓ Audio recordings (if any)</li>
                </ul>
              </div>

              <div className="rounded-lg bg-accent/50 p-4 space-y-2">
                <h4 className="text-sm font-medium">What's private:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✗ Your reflections</li>
                  <li>✗ AI insights</li>
                  <li>✗ Visit count</li>
                  <li>✗ Other memories in your garden</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
