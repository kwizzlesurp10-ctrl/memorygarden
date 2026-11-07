import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CloudArrowDown, CloudArrowUp } from '@phosphor-icons/react'
import type { Memory, UserPreferences } from '@/lib/types'
import {
  buildGardenBackupDocument,
  collectBlobRefsFromMemories,
  mergeGardenBackupImport,
  parseGardenBackup,
} from '@/lib/garden-backup'
import { getBlob, isBlobRef } from '@/lib/blob-store'

interface GardenBackupDialogProps {
  open: boolean
  onClose: () => void
  localUserId: string
  memories: Memory[]
  preferences: UserPreferences
  onImport: (memories: Memory[], preferences: UserPreferences) => void
}

async function resolveMediaForExport(memories: Memory[]): Promise<Record<string, string>> {
  const refs = collectBlobRefsFromMemories(memories)
  const media: Record<string, string> = {}
  await Promise.all(
    refs.map(async (ref) => {
      const data = await getBlob(ref)
      if (data) media[ref] = data
    }),
  )
  return media
}

export function GardenBackupDialog({
  open,
  onClose,
  localUserId,
  memories,
  preferences,
  onImport,
}: GardenBackupDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handleExport = async (): Promise<void> => {
    setBusy(true)
    try {
      const media = await resolveMediaForExport(memories)
      const doc = buildGardenBackupDocument({
        localUserId,
        memories,
        preferences,
        media,
      })
      const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `memorygarden-backup-v${doc.version}-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      const missing = collectBlobRefsFromMemories(memories).filter((r) => !media[r])
      if (missing.length > 0) {
        toast.warning(`Export saved, but ${missing.length} media blob(s) could not be read from this device.`)
      } else {
        toast.success('Garden backup downloaded.')
      }
    } catch {
      toast.error('Could not create backup.')
    } finally {
      setBusy(false)
    }
  }

  const handleImportFile = async (file: File): Promise<void> => {
    setBusy(true)
    try {
      const text = await file.text()
      const doc = parseGardenBackup(JSON.parse(text) as unknown)
      const result = mergeGardenBackupImport(memories, preferences, doc, { preserveExisting: true })
      onImport(result.memories, result.preferences)
      result.warnings.forEach((w) => toast.warning(w))
      toast.success(`Imported ${result.importedCount} new memories (${result.skippedCount} skipped).`)
      onClose()
    } catch {
      toast.error('Invalid or unsupported backup file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Backup &amp; restore</DialogTitle>
          <DialogDescription>
            Download a versioned JSON backup of your garden. Import merges new memories only — existing
            entries are never overwritten. Includes photos and audio when they can be read from this browser.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Button type="button" disabled={busy} onClick={() => void handleExport()}>
            <CloudArrowDown className="mr-2" size={20} />
            Download backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImportFile(file)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <CloudArrowUp className="mr-2" size={20} />
            Import backup (merge)
          </Button>
          <p className="text-xs text-muted-foreground">
            Cloud sync still omits large media. Use this file to move a full garden between browsers on the
            same origin ({typeof window !== 'undefined' ? window.location.host : 'memorygarden.vercel.app'}).
          </p>
          {memories.some((m) => isBlobRef(m.photoUrl)) && (
            <p className="text-xs text-muted-foreground">
              Some memories use IndexedDB blob refs; export attempts to inline them when available.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
