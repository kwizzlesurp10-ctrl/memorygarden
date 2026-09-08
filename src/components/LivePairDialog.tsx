import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Leaf } from '@phosphor-icons/react'
import type { LivePairStatus } from '@/hooks/use-live-pair'

interface LivePairDialogProps {
  open: boolean
  onClose: () => void
  status: LivePairStatus
  onStart: () => Promise<void>
  onJoin: (code: string) => Promise<void>
  onLeave: () => void
}

export function LivePairDialog({ open, onClose, status, onStart, onJoin, onLeave }: LivePairDialogProps) {
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const liveCode = status.kind === 'live' ? status.code : null

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Leaf size={24} weight="duotone" className="text-primary" />
            Live pair garden
          </DialogTitle>
          <DialogDescription>
            Share one garden between two browsers. Photos stay on each device; text, plants, and reflections travel with the pair code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {liveCode ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 px-3 py-3">
              <p className="text-sm">This garden is live. Share this code:</p>
              <p className="font-mono text-2xl tracking-[0.3em] text-center">{liveCode}</p>
              {status.kind === 'live' && (
                <p className="text-xs text-muted-foreground text-center">
                  Revision {status.revision} · {new Date(status.lastSyncAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : (
            <>
              <Button
                className="w-full"
                disabled={busy}
                onClick={() => run(onStart)}
              >
                Start a live pair
              </Button>
              <div className="space-y-2">
                <Label htmlFor="pair-code">Or join with a code</Label>
                <div className="flex gap-2">
                  <Input
                    id="pair-code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={8}
                    autoCapitalize="characters"
                    className="font-mono tracking-widest"
                  />
                  <Button
                    variant="secondary"
                    disabled={busy || joinCode.trim().length < 6}
                    onClick={() => run(() => onJoin(joinCode))}
                  >
                    Join
                  </Button>
                </div>
              </div>
            </>
          )}

          {status.kind === 'unavailable' && (
            <p className="text-sm text-muted-foreground">
              Pairing is not configured on this host. Local Vite uses an in-memory room; Vercel needs KV credentials.
            </p>
          )}
          {status.kind === 'error' && (
            <p className="text-sm text-destructive">{status.message}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          {liveCode && (
            <Button variant="ghost" onClick={onLeave} disabled={busy}>
              Leave pair
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
