import { describe, expect, it } from 'vitest'
import { buildGardenBackupDocument } from '@/lib/garden-backup'
import type { UserPreferences } from '@/lib/types'

describe('garden landscape preference in backup', () => {
  it('round-trips gardenLandscapeView inside preferences', () => {
    const preferences: UserPreferences = {
      hasCompletedOnboarding: true,
      soundEnabled: false,
      lastVisit: new Date().toISOString(),
      gardenLandscapeView: 'lakeside',
    }
    const doc = buildGardenBackupDocument({
      localUserId: 'user-12345678',
      memories: [],
      preferences,
    })
    expect(doc.preferences.gardenLandscapeView).toBe('lakeside')
  })

  it('omitted preference implies pond default at runtime', () => {
    const preferences: UserPreferences = {
      hasCompletedOnboarding: true,
      soundEnabled: true,
      lastVisit: '',
    }
    const doc = buildGardenBackupDocument({
      localUserId: 'user-12345678',
      memories: [],
      preferences,
    })
    expect(doc.preferences.gardenLandscapeView).toBeUndefined()
  })
})
