import { describe, expect, it } from 'vitest'
import { plantVarietyDisplayLabel } from '@/lib/garden/plant-variety-labels'

describe('plantVarietyDisplayLabel', () => {
  it('formats known varieties', () => {
    expect(plantVarietyDisplayLabel('ancient_oak')).toBe('Ancient Oak')
  })

  it('falls back for unknown slugs', () => {
    expect(plantVarietyDisplayLabel('starlight_succulent')).toBe('Starlight Succulent')
  })
})
