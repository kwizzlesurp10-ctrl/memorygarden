import { describe, it, expect } from 'vitest'
import {
  validateText,
  validateDateString,
  validateDataUrl,
  validatePosition,
  validateAudioRecording,
  validateReflection,
  validatePlantTraits,
  validateMemory,
  validateSearchFilters,
  validateGardenSettings,
  validateCreateGardenPayload,
  validateCreateReflectionPayload,
  validateUserPreferences,
  sanitizeText,
  sanitizeLocation,
  collectLocations,
  MAX_MEMORY_TEXT_LENGTH,
  MAX_REFLECTION_TEXT_LENGTH,
  MAX_LOCATION_LENGTH,
  MAX_GARDEN_NAME_LENGTH,
  MAX_GARDEN_DESCRIPTION_LENGTH,
  MAX_PHOTO_SIZE_BYTES,
  MAX_AUDIO_RECORDINGS,
} from '../validation'
import type { Memory, AudioRecording, Reflection } from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

const SMALL_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

function makeMinimalMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'mem-1',
    photoUrl: SMALL_DATA_URL,
    text: 'A test memory',
    date: '2024-06-15',
    plantedAt: '2024-06-15T10:00:00.000Z',
    position: { x: 100, y: 200 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    ...overrides,
  }
}

function makeAudioRecording(overrides: Partial<AudioRecording> = {}): AudioRecording {
  return {
    id: 'rec-1',
    dataUrl: 'data:audio/webm;base64,abc123',
    duration: 30,
    createdAt: '2024-06-15T11:00:00.000Z',
    type: 'voice-note',
    ...overrides,
  }
}

function makeReflection(overrides: Partial<Reflection> = {}): Reflection {
  return {
    id: 'ref-1',
    text: 'A thoughtful reflection',
    createdAt: '2024-06-15T12:00:00.000Z',
    ...overrides,
  }
}

// ── validateText ─────────────────────────────────────────────────────────────

describe('validateText', () => {
  it('passes for a valid non-empty string', () => {
    expect(validateText('Hello world', 'field', 100)).toEqual([])
  })

  it('fails when value is undefined and required', () => {
    const errors = validateText(undefined, 'field', 100)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('field')
  })

  it('fails when value is empty string and required', () => {
    const errors = validateText('', 'field', 100)
    expect(errors).toHaveLength(1)
  })

  it('passes when value is empty string and not required', () => {
    expect(validateText('', 'field', 100, false)).toEqual([])
  })

  it('fails when value exceeds maxLength', () => {
    const errors = validateText('a'.repeat(101), 'field', 100)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/100/)
  })

  it('fails when value is not a string', () => {
    const errors = validateText(42 as unknown as string, 'field', 100)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/string/)
  })

  it('fails for blank (whitespace-only) string when required', () => {
    const errors = validateText('   ', 'field', 100)
    expect(errors).toHaveLength(1)
  })
})

// ── validateDateString ────────────────────────────────────────────────────────

describe('validateDateString', () => {
  it('passes for a valid ISO date string', () => {
    expect(validateDateString('2024-06-15', 'date')).toEqual([])
  })

  it('passes for a full ISO datetime string', () => {
    expect(validateDateString('2024-06-15T10:30:00.000Z', 'date')).toEqual([])
  })

  it('fails for an invalid date string', () => {
    const errors = validateDateString('not-a-date', 'date')
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('date')
  })

  it('fails when value is missing and required', () => {
    const errors = validateDateString(undefined, 'date')
    expect(errors).toHaveLength(1)
  })

  it('passes when empty and not required', () => {
    expect(validateDateString(undefined, 'date', false)).toEqual([])
  })
})

// ── validateDataUrl ──────────────────────────────────────────────────────────

describe('validateDataUrl', () => {
  it('passes for a valid small data URL', () => {
    expect(validateDataUrl(SMALL_DATA_URL, 'photoUrl')).toEqual([])
  })

  it('fails when value does not start with data:', () => {
    const errors = validateDataUrl('https://example.com/image.png', 'photoUrl')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/data URL/)
  })

  it('fails when value exceeds max size', () => {
    const bigPayload = 'data:image/jpeg;base64,' + 'A'.repeat(MAX_PHOTO_SIZE_BYTES * 2)
    const errors = validateDataUrl(bigPayload, 'photoUrl')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/MB/)
  })

  it('fails when missing and required', () => {
    const errors = validateDataUrl(undefined, 'photoUrl')
    expect(errors).toHaveLength(1)
  })

  it('passes when missing and not required', () => {
    expect(validateDataUrl(undefined, 'photoUrl', MAX_PHOTO_SIZE_BYTES, false)).toEqual([])
  })
})

// ── validatePosition ──────────────────────────────────────────────────────────

describe('validatePosition', () => {
  it('passes for valid x/y coordinates', () => {
    expect(validatePosition({ x: 100, y: 200 })).toEqual([])
  })

  it('fails when x is not a number', () => {
    const errors = validatePosition({ x: 'bad', y: 100 })
    expect(errors.some(e => e.field.includes('x'))).toBe(true)
  })

  it('fails when y is not finite', () => {
    const errors = validatePosition({ x: 100, y: Infinity })
    expect(errors.some(e => e.field.includes('y'))).toBe(true)
  })

  it('fails for null', () => {
    const errors = validatePosition(null)
    expect(errors).toHaveLength(1)
  })

  it('passes for negative coordinates (canvas can have negative positions)', () => {
    expect(validatePosition({ x: -500, y: -300 })).toEqual([])
  })
})

// ── validateAudioRecording ────────────────────────────────────────────────────

describe('validateAudioRecording', () => {
  it('passes for a valid recording', () => {
    expect(validateAudioRecording(makeAudioRecording(), 0)).toEqual([])
  })

  it('fails when type is invalid', () => {
    const errors = validateAudioRecording(makeAudioRecording({ type: 'music' as 'voice-note' }), 0)
    expect(errors.some(e => e.field.includes('type'))).toBe(true)
  })

  it('fails when duration is negative', () => {
    const errors = validateAudioRecording(makeAudioRecording({ duration: -5 }), 0)
    expect(errors.some(e => e.field.includes('duration'))).toBe(true)
  })

  it('fails when duration exceeds maximum', () => {
    const errors = validateAudioRecording(makeAudioRecording({ duration: 999 }), 0)
    expect(errors.some(e => e.field.includes('duration'))).toBe(true)
  })

  it('fails when id is missing', () => {
    const errors = validateAudioRecording({ ...makeAudioRecording(), id: '' }, 0)
    expect(errors.some(e => e.field.includes('id'))).toBe(true)
  })
})

// ── validateReflection ────────────────────────────────────────────────────────

describe('validateReflection', () => {
  it('passes for a valid reflection', () => {
    expect(validateReflection(makeReflection(), 0)).toEqual([])
  })

  it('fails when text is too long', () => {
    const errors = validateReflection(
      makeReflection({ text: 'x'.repeat(MAX_REFLECTION_TEXT_LENGTH + 1) }),
      0
    )
    expect(errors).toHaveLength(1)
  })

  it('fails when text is blank', () => {
    const errors = validateReflection(makeReflection({ text: '   ' }), 0)
    expect(errors).toHaveLength(1)
  })

  it('fails when id is missing', () => {
    const errors = validateReflection({ ...makeReflection(), id: '' }, 0)
    expect(errors.some(e => e.field.includes('id'))).toBe(true)
  })

  it('fails when createdAt is invalid', () => {
    const errors = validateReflection(makeReflection({ createdAt: 'not-a-date' }), 0)
    expect(errors).toHaveLength(1)
  })

  it('fails when tone is invalid', () => {
    const errors = validateReflection(makeReflection({ tone: 'melancholic' as 'peaceful' }), 0)
    expect(errors.some(e => e.field.includes('tone'))).toBe(true)
  })
})

// ── validatePlantTraits ───────────────────────────────────────────────────────

describe('validatePlantTraits', () => {
  it('passes for undefined traits (optional)', () => {
    expect(validatePlantTraits(undefined)).toEqual([])
  })

  it('passes for valid trait values', () => {
    expect(validatePlantTraits({ paletteId: 'dawn', pattern: 'speckle', adornment: 'dew' })).toEqual([])
  })

  it('fails for unknown palette id', () => {
    const errors = validatePlantTraits({ paletteId: 'neon' as 'dawn' })
    expect(errors.some(e => e.field.includes('paletteId'))).toBe(true)
  })

  it('fails for unknown pattern id', () => {
    const errors = validatePlantTraits({ pattern: 'polka' as 'solid' })
    expect(errors.some(e => e.field.includes('pattern'))).toBe(true)
  })

  it('fails for unknown adornment id', () => {
    const errors = validatePlantTraits({ adornment: 'wings' as 'none' })
    expect(errors.some(e => e.field.includes('adornment'))).toBe(true)
  })
})

// ── validateMemory ────────────────────────────────────────────────────────────

describe('validateMemory', () => {
  it('passes for a minimal valid memory', () => {
    const result = validateMemory(makeMinimalMemory())
    expect(result.ok).toBe(true)
  })

  it('passes for a memory with reflections and audio', () => {
    const memory = makeMinimalMemory({
      reflections: [makeReflection()],
      audioRecordings: [makeAudioRecording()],
    })
    const result = validateMemory(memory)
    expect(result.ok).toBe(true)
  })

  it('fails for null input', () => {
    const result = validateMemory(null)
    expect(result.ok).toBe(false)
  })

  it('fails when id is missing', () => {
    const result = validateMemory({ ...makeMinimalMemory(), id: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'id')).toBe(true)
    }
  })

  it('fails when text exceeds max length', () => {
    const result = validateMemory(makeMinimalMemory({ text: 'x'.repeat(MAX_MEMORY_TEXT_LENGTH + 1) }))
    expect(result.ok).toBe(false)
  })

  it('fails for invalid emotional tone', () => {
    const result = validateMemory(makeMinimalMemory({ emotionalTone: 'angry' as 'peaceful' }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'emotionalTone')).toBe(true)
    }
  })

  it('fails for invalid plant stage', () => {
    const result = validateMemory(makeMinimalMemory({ plantStage: 'mega-bloom' as 'bloom' }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'plantStage')).toBe(true)
    }
  })

  it('fails for invalid plant variety', () => {
    const result = validateMemory(makeMinimalMemory({ plantVariety: 'cactus' as 'succulent' }))
    expect(result.ok).toBe(false)
  })

  it('fails when visitCount is negative', () => {
    const result = validateMemory(makeMinimalMemory({ visitCount: -1 }))
    expect(result.ok).toBe(false)
  })

  it('fails when audio recordings exceed maximum', () => {
    const result = validateMemory(
      makeMinimalMemory({
        audioRecordings: Array.from({ length: MAX_AUDIO_RECORDINGS + 1 }, (_, i) =>
          makeAudioRecording({ id: `rec-${i}` })
        ),
      })
    )
    expect(result.ok).toBe(false)
  })

  it('fails when date is invalid', () => {
    const result = validateMemory(makeMinimalMemory({ date: 'not-a-date' }))
    expect(result.ok).toBe(false)
  })

  it('returns multiple errors when multiple fields are invalid', () => {
    const result = validateMemory({
      ...makeMinimalMemory(),
      id: '',
      text: '',
      emotionalTone: 'evil' as 'peaceful',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(1)
    }
  })
})

// ── validateSearchFilters ─────────────────────────────────────────────────────

describe('validateSearchFilters', () => {
  const validFilters = {
    emotionalTones: ['peaceful', 'happy'],
    plantStages: ['bloom', 'mature'],
    dateRange: { start: '2024-01-01', end: '2024-12-31' },
    locations: ['Paris'],
  }

  it('passes for valid filters', () => {
    const result = validateSearchFilters(validFilters)
    expect(result.ok).toBe(true)
  })

  it('fails when emotionalTones contains invalid value', () => {
    const result = validateSearchFilters({ ...validFilters, emotionalTones: ['angry'] })
    expect(result.ok).toBe(false)
  })

  it('fails when plantStages contains invalid value', () => {
    const result = validateSearchFilters({ ...validFilters, plantStages: ['mega'] })
    expect(result.ok).toBe(false)
  })

  it('fails when dateRange.start is after end', () => {
    const result = validateSearchFilters({
      ...validFilters,
      dateRange: { start: '2025-01-01', end: '2024-01-01' },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some(e => e.field === 'dateRange')).toBe(true)
    }
  })

  it('fails for non-object input', () => {
    const result = validateSearchFilters('not an object')
    expect(result.ok).toBe(false)
  })
})

// ── validateGardenSettings ────────────────────────────────────────────────────

describe('validateGardenSettings', () => {
  const validSettings = {
    allowReflections: true,
    allowRearrange: false,
    isPublic: true,
    maxMembers: 10,
  }

  it('passes for valid settings', () => {
    expect(validateGardenSettings(validSettings).ok).toBe(true)
  })

  it('fails when maxMembers is 0', () => {
    const result = validateGardenSettings({ ...validSettings, maxMembers: 0 })
    expect(result.ok).toBe(false)
  })

  it('fails when maxMembers exceeds 50', () => {
    const result = validateGardenSettings({ ...validSettings, maxMembers: 51 })
    expect(result.ok).toBe(false)
  })

  it('fails when isPublic is not boolean', () => {
    const result = validateGardenSettings({ ...validSettings, isPublic: 'yes' })
    expect(result.ok).toBe(false)
  })
})

// ── validateCreateGardenPayload ───────────────────────────────────────────────

describe('validateCreateGardenPayload', () => {
  const validPayload = {
    name: 'My Garden',
    description: 'A peaceful garden',
    settings: { allowReflections: true, allowRearrange: true, isPublic: false, maxMembers: 5 },
  }

  it('passes for a valid payload', () => {
    expect(validateCreateGardenPayload(validPayload).ok).toBe(true)
  })

  it('fails when name is too long', () => {
    const result = validateCreateGardenPayload({ ...validPayload, name: 'x'.repeat(MAX_GARDEN_NAME_LENGTH + 1) })
    expect(result.ok).toBe(false)
  })

  it('fails when description is too long', () => {
    const result = validateCreateGardenPayload({ ...validPayload, description: 'x'.repeat(MAX_GARDEN_DESCRIPTION_LENGTH + 1) })
    expect(result.ok).toBe(false)
  })

  it('fails when name is missing', () => {
    const result = validateCreateGardenPayload({ ...validPayload, name: '' })
    expect(result.ok).toBe(false)
  })

  it('passes when description is empty (optional)', () => {
    const result = validateCreateGardenPayload({ ...validPayload, description: '' })
    expect(result.ok).toBe(true)
  })
})

// ── validateCreateReflectionPayload ──────────────────────────────────────────

describe('validateCreateReflectionPayload', () => {
  it('passes for valid text', () => {
    expect(validateCreateReflectionPayload({ text: 'Some reflection' }).ok).toBe(true)
  })

  it('fails for empty text', () => {
    const result = validateCreateReflectionPayload({ text: '' })
    expect(result.ok).toBe(false)
  })

  it('fails for text exceeding max length', () => {
    const result = validateCreateReflectionPayload({ text: 'x'.repeat(MAX_REFLECTION_TEXT_LENGTH + 1) })
    expect(result.ok).toBe(false)
  })
})

// ── validateUserPreferences ───────────────────────────────────────────────────

describe('validateUserPreferences', () => {
  it('passes for empty object (all optional)', () => {
    expect(validateUserPreferences({}).ok).toBe(true)
  })

  it('passes for valid partial preferences', () => {
    expect(validateUserPreferences({ soundEnabled: true }).ok).toBe(true)
  })

  it('fails when soundEnabled is not boolean', () => {
    const result = validateUserPreferences({ soundEnabled: 'yes' })
    expect(result.ok).toBe(false)
  })

  it('fails when lastVisit is invalid date', () => {
    const result = validateUserPreferences({ lastVisit: 'yesterday' })
    expect(result.ok).toBe(false)
  })
})

// ── sanitizeText ──────────────────────────────────────────────────────────────

describe('sanitizeText', () => {
  it('trims leading/trailing whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello')
  })

  it('collapses excessive newlines to double newline', () => {
    expect(sanitizeText('a\n\n\n\n\nb')).toBe('a\n\nb')
  })

  it('strips control characters', () => {
    const withControl = 'hello\x00world\x07end'
    expect(sanitizeText(withControl)).toBe('helloworldend')
  })

  it('preserves normal text', () => {
    const text = 'A peaceful afternoon in the garden.\nThe birds were singing.'
    expect(sanitizeText(text)).toBe(text)
  })
})

// ── sanitizeLocation ──────────────────────────────────────────────────────────

describe('sanitizeLocation', () => {
  it('strips HTML markup (allowlist approach removes < > brackets)', () => {
    // With allowlist approach, < > are stripped. The key security property is
    // that no HTML markup can survive — angle brackets are not allowed.
    const result = sanitizeLocation('<script>alert(1)</script>Paris')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).toContain('Paris')
  })

  it('strips SQL injection characters (semicolons stripped)', () => {
    // Semicolons are not in the allowlist
    const result = sanitizeLocation("Paris; DROP TABLE memories")
    expect(result).not.toContain(';')
    expect(result).toContain('Paris')
  })

  it('preserves valid location characters (letters, digits, hyphens, commas)', () => {
    expect(sanitizeLocation('New York, NY')).toBe('New York, NY')
    expect(sanitizeLocation('São Paulo')).toContain('Paulo')
    expect(sanitizeLocation('Paris 75001')).toBe('Paris 75001')
    expect(sanitizeLocation("King's Cross")).toBe("King's Cross")
  })

  it('truncates to max length', () => {
    const long = 'x'.repeat(MAX_LOCATION_LENGTH + 50)
    expect(sanitizeLocation(long).length).toBe(MAX_LOCATION_LENGTH)
  })

  it('trims whitespace', () => {
    expect(sanitizeLocation('  Paris  ')).toBe('Paris')
  })

  it('collapses multiple spaces', () => {
    expect(sanitizeLocation('New   York')).toBe('New York')
  })
})

// ── collectLocations ──────────────────────────────────────────────────────────

describe('collectLocations', () => {
  const memories: Memory[] = [
    makeMinimalMemory({ id: 'a', location: 'Paris' }),
    makeMinimalMemory({ id: 'b', location: 'Paris' }),
    makeMinimalMemory({ id: 'c', location: 'Tokyo' }),
    makeMinimalMemory({ id: 'd', location: undefined }),
    makeMinimalMemory({ id: 'e', location: '  ' }),
  ]

  it('returns unique locations sorted alphabetically', () => {
    expect(collectLocations(memories)).toEqual(['Paris', 'Tokyo'])
  })

  it('ignores undefined and blank locations', () => {
    const result = collectLocations(memories)
    expect(result).not.toContain(undefined)
    expect(result).not.toContain('')
    expect(result).not.toContain('  ')
  })

  it('returns empty array for no memories', () => {
    expect(collectLocations([])).toEqual([])
  })

  it('returns empty array when no memories have locations', () => {
    expect(collectLocations([makeMinimalMemory()])).toEqual([])
  })
})
