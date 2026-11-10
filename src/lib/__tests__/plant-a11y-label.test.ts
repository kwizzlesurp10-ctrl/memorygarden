import { describe, expect, it } from 'vitest'
import { memoryPlantA11yLabel } from '@/lib/garden-helpers'
import type { Memory } from '@/lib/types'

const base: Memory = {
  id: 'm1',
  text: '',
  photoUrl: '',
  date: new Date().toISOString(),
  plantedAt: new Date().toISOString(),
  emotionalTone: 'peaceful',
  plantStage: 'sprout',
  position: { x: 0, y: 0 },
  visitCount: 0,
  reflections: [],
  audioRecordings: [],
  plantVariety: 'tree',
  geneticsSeed: 'seed',
}

describe('memoryPlantA11yLabel', () => {
  it('uses trimmed text when present', () => {
    expect(memoryPlantA11yLabel({ ...base, text: '  Sunday walk  ' })).toBe('Sunday walk')
  })

  it('falls back to tone and stage', () => {
    expect(memoryPlantA11yLabel(base)).toBe('peaceful sprout memory')
  })

})
