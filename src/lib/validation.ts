/**
 * Input validation utilities for MemoryGarden.
 *
 * All validation functions return a `ValidationResult` — a discriminated union
 * that carries either a success value or a structured list of field errors.
 * Callers should never receive raw exceptions from these helpers.
 */

import type {
  Memory,
  EmotionalTone,
  PlantStage,
  PlantVariety,
  AudioRecording,
  Reflection,
  SearchFilters,
  UserPreferences,
  CollaborativeGarden,
  GardenSettings,
  PaletteId,
  PatternId,
  AdornmentId,
  PlantTraits,
} from './types'

// ── Result type ──────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string
  message: string
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] }

function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value }
}

function fail<T>(errors: ValidationError[]): ValidationResult<T> {
  return { ok: false, errors }
}

function fieldError(field: string, message: string): ValidationError {
  return { field, message }
}

// ── Primitive validators ──────────────────────────────────────────────────────

/** Maximum photo size: 10 MB as a Base64 Data URL (≈ 13.7 MB base64) */
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024

/** Maximum length for free-text memory entries */
export const MAX_MEMORY_TEXT_LENGTH = 2000

/** Maximum length for reflection entries */
export const MAX_REFLECTION_TEXT_LENGTH = 1000

/** Maximum length for location strings */
export const MAX_LOCATION_LENGTH = 200

/** Maximum length for garden names */
export const MAX_GARDEN_NAME_LENGTH = 80

/** Maximum length for garden descriptions */
export const MAX_GARDEN_DESCRIPTION_LENGTH = 500

/** Maximum number of audio recordings per memory */
export const MAX_AUDIO_RECORDINGS = 5

/** Maximum audio duration in seconds */
export const MAX_AUDIO_DURATION_SECONDS = 300

const VALID_EMOTIONAL_TONES: ReadonlySet<EmotionalTone> = new Set([
  'happy', 'reflective', 'bittersweet', 'peaceful', 'nostalgic',
])

const VALID_PLANT_STAGES: ReadonlySet<PlantStage> = new Set([
  'seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder',
])

const VALID_PLANT_VARIETIES: ReadonlySet<PlantVariety> = new Set([
  'flower', 'tree', 'succulent', 'vine', 'herb', 'wildflower',
  'ancient_oak', 'eternal_rose', 'phoenix_vine', 'starlight_succulent',
])

const VALID_PALETTE_IDS: ReadonlySet<PaletteId> = new Set([
  'default', 'dawn', 'twilight', 'forest', 'coral', 'lavender',
  'earthy', 'warm', 'cool', 'ocean', 'sunset', 'frost', 'midnight',
])

const VALID_PATTERN_IDS: ReadonlySet<PatternId> = new Set([
  'solid', 'speckle', 'gradient', 'stripe',
])

const VALID_ADORNMENT_IDS: ReadonlySet<AdornmentId> = new Set([
  'none', 'dew', 'butterflies', 'fireflies', 'pollen',
  'dew-drops', 'sparkles', 'seasonal-bloom', 'golden-aura',
])

/**
 * Validate a non-empty, non-blank string within a maximum length.
 */
export function validateText(
  value: unknown,
  field: string,
  maxLength: number,
  required = true
): ValidationError[] {
  const errors: ValidationError[] = []
  if (value === undefined || value === null || value === '') {
    if (required) errors.push(fieldError(field, `${field} is required`))
    return errors
  }
  if (typeof value !== 'string') {
    errors.push(fieldError(field, `${field} must be a string`))
    return errors
  }
  if (value.trim().length === 0) {
    if (required) errors.push(fieldError(field, `${field} must not be blank`))
    return errors
  }
  if (value.length > maxLength) {
    errors.push(fieldError(field, `${field} must be at most ${maxLength} characters`))
  }
  return errors
}

/**
 * Validate an ISO-8601 date string (YYYY-MM-DD or full ISO datetime).
 */
export function validateDateString(
  value: unknown,
  field: string,
  required = true
): ValidationError[] {
  const errors: ValidationError[] = []
  if (value === undefined || value === null || value === '') {
    if (required) errors.push(fieldError(field, `${field} is required`))
    return errors
  }
  if (typeof value !== 'string') {
    errors.push(fieldError(field, `${field} must be a string`))
    return errors
  }
  const parsed = new Date(value)
  if (isNaN(parsed.getTime())) {
    errors.push(fieldError(field, `${field} must be a valid date`))
  }
  return errors
}

/**
 * Validate a Base64 Data URL (used for photo/audio storage).
 * Does NOT decode the full payload — only checks the prefix structure.
 */
export function validateDataUrl(
  value: unknown,
  field: string,
  maxSizeBytes = MAX_PHOTO_SIZE_BYTES,
  required = true
): ValidationError[] {
  const errors: ValidationError[] = []
  if (value === undefined || value === null || value === '') {
    if (required) errors.push(fieldError(field, `${field} is required`))
    return errors
  }
  if (typeof value !== 'string') {
    errors.push(fieldError(field, `${field} must be a string`))
    return errors
  }
  if (!value.startsWith('data:')) {
    errors.push(fieldError(field, `${field} must be a valid data URL`))
    return errors
  }
  // Rough byte estimate: base64 encodes 3 bytes → 4 chars
  const estimatedBytes = Math.floor((value.length * 3) / 4)
  if (estimatedBytes > maxSizeBytes) {
    errors.push(fieldError(field, `${field} exceeds maximum size of ${Math.round(maxSizeBytes / 1024 / 1024)} MB`))
  }
  return errors
}

/**
 * Validate a 2-D canvas position.
 */
export function validatePosition(
  value: unknown,
  field = 'position'
): ValidationError[] {
  const errors: ValidationError[] = []
  if (!value || typeof value !== 'object') {
    errors.push(fieldError(field, `${field} must be an object with x and y`))
    return errors
  }
  const pos = value as Record<string, unknown>
  if (typeof pos.x !== 'number' || !isFinite(pos.x)) {
    errors.push(fieldError(`${field}.x`, `${field}.x must be a finite number`))
  }
  if (typeof pos.y !== 'number' || !isFinite(pos.y)) {
    errors.push(fieldError(`${field}.y`, `${field}.y must be a finite number`))
  }
  return errors
}

// ── Domain validators ─────────────────────────────────────────────────────────

/**
 * Validate an `AudioRecording` entry.
 */
export function validateAudioRecording(
  recording: unknown,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = []
  const prefix = `audioRecordings[${index}]`
  if (!recording || typeof recording !== 'object') {
    errors.push(fieldError(prefix, 'must be an object'))
    return errors
  }
  const r = recording as Partial<AudioRecording>
  if (!r.id || typeof r.id !== 'string') {
    errors.push(fieldError(`${prefix}.id`, 'id is required'))
  }
  errors.push(...validateDataUrl(r.dataUrl, `${prefix}.dataUrl`))
  if (typeof r.duration !== 'number' || r.duration < 0) {
    errors.push(fieldError(`${prefix}.duration`, 'duration must be a non-negative number'))
  }
  if (r.duration !== undefined && r.duration > MAX_AUDIO_DURATION_SECONDS) {
    errors.push(fieldError(`${prefix}.duration`, `duration must be at most ${MAX_AUDIO_DURATION_SECONDS}s`))
  }
  if (r.type !== 'voice-note' && r.type !== 'ambient-sound') {
    errors.push(fieldError(`${prefix}.type`, 'type must be voice-note or ambient-sound'))
  }
  return errors
}

/**
 * Validate a `Reflection` entry.
 */
export function validateReflection(
  reflection: unknown,
  index: number
): ValidationError[] {
  const errors: ValidationError[] = []
  const prefix = `reflections[${index}]`
  if (!reflection || typeof reflection !== 'object') {
    errors.push(fieldError(prefix, 'must be an object'))
    return errors
  }
  const r = reflection as Partial<Reflection>
  if (!r.id || typeof r.id !== 'string') {
    errors.push(fieldError(`${prefix}.id`, 'id is required'))
  }
  errors.push(...validateText(r.text, `${prefix}.text`, MAX_REFLECTION_TEXT_LENGTH))
  errors.push(...validateDateString(r.createdAt, `${prefix}.createdAt`))
  if (r.audioUrl !== undefined) {
    errors.push(...validateDataUrl(r.audioUrl, `${prefix}.audioUrl`, MAX_PHOTO_SIZE_BYTES, false))
  }
  if (r.tone !== undefined && !VALID_EMOTIONAL_TONES.has(r.tone as EmotionalTone)) {
    errors.push(fieldError(`${prefix}.tone`, 'invalid emotional tone'))
  }
  return errors
}

/**
 * Validate a `PlantTraits` object.
 */
export function validatePlantTraits(
  traits: unknown,
  field = 'traits'
): ValidationError[] {
  const errors: ValidationError[] = []
  if (!traits || typeof traits !== 'object') return errors // traits is optional
  const t = traits as Partial<PlantTraits>
  if (t.paletteId !== undefined && !VALID_PALETTE_IDS.has(t.paletteId)) {
    errors.push(fieldError(`${field}.paletteId`, `invalid palette id: ${t.paletteId}`))
  }
  if (t.pattern !== undefined && !VALID_PATTERN_IDS.has(t.pattern)) {
    errors.push(fieldError(`${field}.pattern`, `invalid pattern id: ${t.pattern}`))
  }
  if (t.adornment !== undefined && !VALID_ADORNMENT_IDS.has(t.adornment)) {
    errors.push(fieldError(`${field}.adornment`, `invalid adornment id: ${t.adornment}`))
  }
  return errors
}

/**
 * Validate a full `Memory` object.
 * Returns `ok` with the typed memory on success, or `fail` with a list of errors.
 */
export function validateMemory(input: unknown): ValidationResult<Memory> {
  if (!input || typeof input !== 'object') {
    return fail([fieldError('memory', 'must be an object')])
  }
  const m = input as Partial<Memory>
  const errors: ValidationError[] = []

  // Required string ID
  if (!m.id || typeof m.id !== 'string' || m.id.trim() === '') {
    errors.push(fieldError('id', 'id is required'))
  }

  // Photo (required, data URL)
  errors.push(...validateDataUrl(m.photoUrl, 'photoUrl'))

  // Memory text
  errors.push(...validateText(m.text, 'text', MAX_MEMORY_TEXT_LENGTH))

  // Date
  errors.push(...validateDateString(m.date, 'date'))

  // plantedAt
  errors.push(...validateDateString(m.plantedAt, 'plantedAt'))

  // Position
  errors.push(...validatePosition(m.position))

  // emotionalTone
  if (!m.emotionalTone || !VALID_EMOTIONAL_TONES.has(m.emotionalTone)) {
    errors.push(fieldError('emotionalTone', `emotionalTone must be one of: ${[...VALID_EMOTIONAL_TONES].join(', ')}`))
  }

  // plantStage
  if (!m.plantStage || !VALID_PLANT_STAGES.has(m.plantStage)) {
    errors.push(fieldError('plantStage', `plantStage must be one of: ${[...VALID_PLANT_STAGES].join(', ')}`))
  }

  // plantVariety
  if (!m.plantVariety || !VALID_PLANT_VARIETIES.has(m.plantVariety)) {
    errors.push(fieldError('plantVariety', `plantVariety must be one of: ${[...VALID_PLANT_VARIETIES].join(', ')}`))
  }

  // visitCount
  if (typeof m.visitCount !== 'number' || !isFinite(m.visitCount) || m.visitCount < 0) {
    errors.push(fieldError('visitCount', 'visitCount must be a non-negative number'))
  }

  // optional location
  if (m.location !== undefined) {
    errors.push(...validateText(m.location, 'location', MAX_LOCATION_LENGTH, false))
  }

  // reflections array
  if (!Array.isArray(m.reflections)) {
    errors.push(fieldError('reflections', 'reflections must be an array'))
  } else {
    for (let i = 0; i < m.reflections.length; i++) {
      errors.push(...validateReflection(m.reflections[i], i))
    }
  }

  // audioRecordings array
  if (!Array.isArray(m.audioRecordings)) {
    errors.push(fieldError('audioRecordings', 'audioRecordings must be an array'))
  } else {
    if (m.audioRecordings.length > MAX_AUDIO_RECORDINGS) {
      errors.push(fieldError('audioRecordings', `at most ${MAX_AUDIO_RECORDINGS} audio recordings are allowed`))
    }
    for (let i = 0; i < m.audioRecordings.length; i++) {
      errors.push(...validateAudioRecording(m.audioRecordings[i], i))
    }
  }

  // optional traits
  if (m.traits !== undefined) {
    errors.push(...validatePlantTraits(m.traits))
  }

  if (errors.length > 0) return fail(errors)
  return ok(m as Memory)
}

/**
 * Validate `SearchFilters`.
 */
export function validateSearchFilters(input: unknown): ValidationResult<SearchFilters> {
  if (!input || typeof input !== 'object') {
    return fail([fieldError('filters', 'must be an object')])
  }
  const f = input as Partial<SearchFilters>
  const errors: ValidationError[] = []

  if (!Array.isArray(f.emotionalTones)) {
    errors.push(fieldError('emotionalTones', 'must be an array'))
  } else {
    for (const tone of f.emotionalTones) {
      if (!VALID_EMOTIONAL_TONES.has(tone)) {
        errors.push(fieldError('emotionalTones', `invalid tone: ${tone}`))
      }
    }
  }

  if (!Array.isArray(f.plantStages)) {
    errors.push(fieldError('plantStages', 'must be an array'))
  } else {
    for (const stage of f.plantStages) {
      if (!VALID_PLANT_STAGES.has(stage)) {
        errors.push(fieldError('plantStages', `invalid stage: ${stage}`))
      }
    }
  }

  if (!Array.isArray(f.locations)) {
    errors.push(fieldError('locations', 'must be an array'))
  }

  if (f.dateRange !== undefined && typeof f.dateRange === 'object') {
    const dr = f.dateRange as Record<string, unknown>
    if (dr.start !== undefined) {
      errors.push(...validateDateString(dr.start, 'dateRange.start'))
    }
    if (dr.end !== undefined) {
      errors.push(...validateDateString(dr.end, 'dateRange.end'))
    }
    if (dr.start && dr.end && new Date(dr.start as string) > new Date(dr.end as string)) {
      errors.push(fieldError('dateRange', 'start must not be after end'))
    }
  }

  if (errors.length > 0) return fail(errors)
  return ok(f as SearchFilters)
}

/**
 * Validate `GardenSettings`.
 */
export function validateGardenSettings(input: unknown): ValidationResult<GardenSettings> {
  if (!input || typeof input !== 'object') {
    return fail([fieldError('gardenSettings', 'must be an object')])
  }
  const s = input as Partial<GardenSettings>
  const errors: ValidationError[] = []

  if (typeof s.allowReflections !== 'boolean') {
    errors.push(fieldError('allowReflections', 'must be a boolean'))
  }
  if (typeof s.allowRearrange !== 'boolean') {
    errors.push(fieldError('allowRearrange', 'must be a boolean'))
  }
  if (typeof s.isPublic !== 'boolean') {
    errors.push(fieldError('isPublic', 'must be a boolean'))
  }
  if (typeof s.maxMembers !== 'number' || !Number.isInteger(s.maxMembers) || s.maxMembers < 1 || s.maxMembers > 50) {
    errors.push(fieldError('maxMembers', 'must be an integer between 1 and 50'))
  }

  if (errors.length > 0) return fail(errors)
  return ok(s as GardenSettings)
}

/**
 * Validate the creation payload for a collaborative garden.
 */
export interface CreateGardenPayload {
  name: string
  description: string
  settings: GardenSettings
}

export function validateCreateGardenPayload(input: unknown): ValidationResult<CreateGardenPayload> {
  if (!input || typeof input !== 'object') {
    return fail([fieldError('payload', 'must be an object')])
  }
  const p = input as Partial<CreateGardenPayload>
  const errors: ValidationError[] = []

  errors.push(...validateText(p.name, 'name', MAX_GARDEN_NAME_LENGTH))
  errors.push(...validateText(p.description, 'description', MAX_GARDEN_DESCRIPTION_LENGTH, false))

  const settingsResult = validateGardenSettings(p.settings)
  if (!settingsResult.ok) errors.push(...settingsResult.errors)

  if (errors.length > 0) return fail(errors)
  return ok(p as CreateGardenPayload)
}

/**
 * Validate the payload for creating a new reflection on a memory.
 */
export interface CreateReflectionPayload {
  text: string
  audioUrl?: string
}

export function validateCreateReflectionPayload(
  input: unknown
): ValidationResult<CreateReflectionPayload> {
  if (!input || typeof input !== 'object') {
    return fail([fieldError('payload', 'must be an object')])
  }
  const p = input as Partial<CreateReflectionPayload>
  const errors: ValidationError[] = []

  errors.push(...validateText(p.text, 'text', MAX_REFLECTION_TEXT_LENGTH))
  if (p.audioUrl !== undefined) {
    errors.push(...validateDataUrl(p.audioUrl, 'audioUrl', MAX_PHOTO_SIZE_BYTES, false))
  }

  if (errors.length > 0) return fail(errors)
  return ok(p as CreateReflectionPayload)
}

/**
 * Validate `UserPreferences` (partial — only present fields are validated).
 */
export function validateUserPreferences(input: unknown): ValidationResult<Partial<UserPreferences>> {
  if (!input || typeof input !== 'object') {
    return fail([fieldError('preferences', 'must be an object')])
  }
  const p = input as Partial<UserPreferences>
  const errors: ValidationError[] = []

  if (p.soundEnabled !== undefined && typeof p.soundEnabled !== 'boolean') {
    errors.push(fieldError('soundEnabled', 'must be a boolean'))
  }
  if (p.hasCompletedOnboarding !== undefined && typeof p.hasCompletedOnboarding !== 'boolean') {
    errors.push(fieldError('hasCompletedOnboarding', 'must be a boolean'))
  }
  if (p.lastVisit !== undefined) {
    errors.push(...validateDateString(p.lastVisit, 'lastVisit'))
  }

  if (errors.length > 0) return fail(errors)
  return ok(p)
}

/**
 * Sanitize a free-text string for safe display.
 * Trims whitespace, collapses runs of newlines to at most two, and strips
 * control characters (except tabs and newlines).
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .replace(/\n{3,}/g, '\n\n')                          // collapse excessive newlines
    .trim()
}

/**
 * Sanitize a location string: trim and allow only safe Unicode characters.
 *
 * Uses an allowlist of characters valid in location names (letters, digits,
 * spaces, common punctuation) instead of attempting to strip dangerous
 * patterns — allowlists are more robust than denylist regexes for HTML/XSS
 * sanitization.
 *
 * This is defence-in-depth — the data never hits a query engine, but
 * it protects against persistent XSS if values are ever rendered as raw HTML.
 */
export function sanitizeLocation(location: string): string {
  // Allow: Unicode letters/numbers (via \p{L}\p{N}), spaces, hyphens,
  // commas, periods, parentheses, apostrophes, and forward slashes.
  // Everything else (HTML, scripts, SQL metacharacters) is stripped.
  return location
    .replace(/[^\p{L}\p{N}\s\-,.()'/@#&+]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, MAX_LOCATION_LENGTH)
}

/**
 * Collect all unique, trimmed, non-empty locations from a list of memories.
 * Useful for populating the location filter dropdown.
 */
export function collectLocations(memories: Memory[]): string[] {
  const seen = new Set<string>()
  for (const m of memories) {
    if (m.location && m.location.trim()) {
      seen.add(m.location.trim())
    }
  }
  return [...seen].sort()
}
