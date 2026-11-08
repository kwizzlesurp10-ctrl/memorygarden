import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { NeonAuthUIProvider, AuthView } from '@neondatabase/auth-ui'
import '@neondatabase/auth-ui/css'
import { getAuthClient } from '@/lib/auth/neon-auth-client'
import { isNeonAuthConfigured } from '@/lib/auth/config'

interface NeonAuthPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignedIn?: () => void
}

export function NeonAuthPanel({ open, onOpenChange, onSignedIn }: NeonAuthPanelProps) {
  const authClient = getAuthClient()
  const ready = isNeonAuthConfigured() && authClient != null

  if (!ready || !authClient) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Sign in (optional)</DialogTitle>
          <DialogDescription>
            Link this browser&apos;s garden to an account for cloud backup and purchase restore.
            Signing out or skipping leaves your local garden unchanged.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-6">
          <NeonAuthUIProvider authClient={authClient}>
            <AuthView path="sign-in" />
            <Button
              type="button"
              className="w-full mt-4"
              onClick={() => {
                onSignedIn?.()
                onOpenChange(false)
              }}
            >
              Link this browser &amp; restore purchases
            </Button>
          </NeonAuthUIProvider>
        </div>
      </DialogContent>
    </Dialog>
  )
}
