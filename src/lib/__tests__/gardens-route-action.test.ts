import { describe, expect, it } from 'vitest'
import {
  normalizeGardenAction,
  resolveGardensPathAction,
  resolveGardensPostAction,
} from '../../../api/gardens/lib/route-action'

describe('gardens route action parsing', () => {
  it('reads action from path segment', () => {
    expect(resolveGardensPathAction('/api/gardens/join')).toBe('join')
    expect(resolveGardensPathAction('/api/gardens/plant')).toBe('plant')
    expect(resolveGardensPathAction('/api/gardens')).toBeUndefined()
    expect(resolveGardensPathAction('/api/sync')).toBeUndefined()
  })

  it('normalizes query and body actions', () => {
    expect(normalizeGardenAction('WATER')).toBe('water')
    expect(normalizeGardenAction('nope')).toBeUndefined()
  })

  it('prefers path over query and body', () => {
    const params = new URLSearchParams('action=leave')
    expect(resolveGardensPostAction('/api/gardens/water', params, 'plant')).toBe('water')
  })

  it('falls back to query then body', () => {
    const params = new URLSearchParams('action=reflect')
    expect(resolveGardensPostAction('/api/gardens', params, 'plant')).toBe('reflect')
    expect(resolveGardensPostAction('/api/gardens', new URLSearchParams(), 'join')).toBe('join')
  })
})
