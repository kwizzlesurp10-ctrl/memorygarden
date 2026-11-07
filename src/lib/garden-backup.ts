import { z } from 'zod'
import type { Memory, UserPreferences } from '@/lib/types'
import { isBlobRef } from '@/lib/blob-store'

export const GARDEN_BACKUP_VERSION = 1 as const

const memorySchema = z.custom<Memory>((v) => typeof v === 'object' && v !== null && 'id' in v)

export const gardenBackupSchema = z.object({
  version: z.literal(GARDEN_BACKUP_VERSION),
  exportedAt: z.string().datetime(),
  localUserId: z.string().min(8).max(64),
  memories: z.array(memorySchema),
  preferences: z.custom<UserPreferences>((v) => typeof v === 'object' && v !== null),
  media: z.record(z.string(), z.string()).optional(),
  cloudSyncExcludesMedia: z.literal(true).optional(),
})

export type GardenBackupDocument = z.infer<typeof gardenBackupSchema>

export interface ImportGardenBackupOptions {
  /** When true, memories with existing ids are skipped instead of merged. */
  preserveExisting: boolean
}

export interface ImportGardenBackupResult {
  memories: Memory[]
  preferences: UserPreferences
  warnings: string[]
  importedCount: number
  skippedCount: number
}

export function buildGardenBackupDocument(params: {
  localUserId: string
  memories: Memory[]
  preferences: UserPreferences
  media?: Record<string, string>
}): GardenBackupDocument {
  return {
    version: GARDEN_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    localUserId: params.localUserId,
    memories: params.memories,
    preferences: params.preferences,
    media: params.media,
    cloudSyncExcludesMedia: true,
  }
}

export function parseGardenBackup(raw: unknown): GardenBackupDocument {
  return gardenBackupSchema.parse(raw)
}

export function collectBlobRefsFromMemories(memories: Memory[]): string[] {
  const refs: string[] = []
  for (const m of memories) {
    if (isBlobRef(m.photoUrl)) refs.push(m.photoUrl)
    for (const ar of m.audioRecordings ?? []) {
      if (isBlobRef(ar.dataUrl)) refs.push(ar.dataUrl)
    }
  }
  return [...new Set(refs)]
}

export function hydrateMemoriesFromBackup(
  memories: Memory[],
  media: Record<string, string> | undefined,
): Memory[] {
  if (!media) return memories
  return memories.map((m) => {
    let photoUrl = m.photoUrl
    if (isBlobRef(photoUrl) && media[photoUrl]) {
      photoUrl = media[photoUrl]
    }
    const audioRecordings = (m.audioRecordings ?? []).map((ar) => {
      if (isBlobRef(ar.dataUrl) && media[ar.dataUrl]) {
        return { ...ar, dataUrl: media[ar.dataUrl] }
      }
      return ar
    })
    return { ...m, photoUrl, audioRecordings }
  })
}

export function mergeGardenBackupImport(
  existingMemories: Memory[],
  existingPreferences: UserPreferences,
  doc: GardenBackupDocument,
  options: ImportGardenBackupOptions,
): ImportGardenBackupResult {
  const warnings: string[] = []
  const hydrated = hydrateMemoriesFromBackup(doc.memories, doc.media)

  if (doc.cloudSyncExcludesMedia && !doc.media?.length) {
    const refs = collectBlobRefsFromMemories(doc.memories)
    if (refs.length > 0) {
      warnings.push(
        `Backup references ${refs.length} IndexedDB media blob(s) but includes no inline media payload.`,
      )
    }
  }

  const existingIds = new Set(existingMemories.map((m) => m.id))
  let importedCount = 0
  let skippedCount = 0
  const merged: Memory[] = [...existingMemories]

  for (const mem of hydrated) {
    if (existingIds.has(mem.id)) {
      if (options.preserveExisting) {
        skippedCount++
        continue
      }
      warnings.push(`Skipped memory ${mem.id}: already exists (import does not overwrite).`)
      skippedCount++
      continue
    }
    merged.push(mem)
    existingIds.add(mem.id)
    importedCount++
  }

  const preferences: UserPreferences = {
    ...existingPreferences,
    ...doc.preferences,
  }

  return {
    memories: merged,
    preferences,
    warnings,
    importedCount,
    skippedCount,
  }
}
