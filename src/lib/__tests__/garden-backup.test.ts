import { describe, expect, it } from 'vitest'
import type { Memory, UserPreferences } from '@/lib/types'
import {
  buildGardenBackupDocument,
  mergeGardenBackupImport,
  parseGardenBackup,
} from '../garden-backup'

const prefs: UserPreferences = {
  hasCompletedOnboarding: true,
  soundEnabled: true,
  lastVisit: new Date().toISOString(),
  cloudSyncEnabled: false,
}

function sampleMemory(id: string): Memory {
  return {
    id,
    photoUrl: 'idb://photo-1',
    text: `Memory ${id}`,
    date: '2025-06-01',
    plantedAt: '2025-06-01T10:00:00Z',
    emotionalTone: 'peaceful',
    plantStage: 'sprout',
    plantVariety: 'flower',
    position: { x: 100, y: 200 },
    visitCount: 1,
    reflections: [],
    audioRecordings: [],
  }
}

describe('garden backup round-trip', () => {
  it('parses a valid v1 document', () => {
    const doc = buildGardenBackupDocument({
      localUserId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      memories: [sampleMemory('m1')],
      preferences: prefs,
      media: { 'idb://photo-1': 'data:image/png;base64,AA==' },
    })
    const parsed = parseGardenBackup(doc)
    expect(parsed.version).toBe(1)
    expect(parsed.memories).toHaveLength(1)
  })

  it('never overwrites existing memories by default', () => {
    const existing = [sampleMemory('m1')]
    const doc = buildGardenBackupDocument({
      localUserId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      memories: [sampleMemory('m1'), sampleMemory('m2')],
      preferences: prefs,
    })
    const result = mergeGardenBackupImport(existing, prefs, doc, { preserveExisting: true })
    expect(result.memories).toHaveLength(2)
    expect(result.importedCount).toBe(1)
    expect(result.skippedCount).toBe(1)
  })

  it('round-trips linkUrl on v1 backups', () => {
    const withLink = { ...sampleMemory('m-link'), linkUrl: 'https://example.com/memory' }
    const doc = buildGardenBackupDocument({
      localUserId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      memories: [withLink],
      preferences: prefs,
    })
    const parsed = parseGardenBackup(doc)
    expect(parsed.memories[0].linkUrl).toBe('https://example.com/memory')
    const legacy = buildGardenBackupDocument({
      localUserId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      memories: [sampleMemory('legacy')],
      preferences: prefs,
    })
    expect(parseGardenBackup(legacy).memories[0].linkUrl).toBeUndefined()
  })

  it('hydrates idb photo refs when media map is present', () => {
    const doc = buildGardenBackupDocument({
      localUserId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      memories: [sampleMemory('m9')],
      preferences: prefs,
      media: { 'idb://photo-1': 'data:image/png;base64,hydrated' },
    })
    const result = mergeGardenBackupImport([], prefs, doc, { preserveExisting: true })
    expect(result.memories[0].photoUrl).toBe('data:image/png;base64,hydrated')
  })
})
