import { describe, expect, it } from 'vitest'
import type { Memory } from '@/lib/types'
import { applyManualPlantStage, plantStageAfterGrowth } from '@/lib/garden-helpers'

const memory: Memory = {
  id: 'm-edit',
  photoUrl: 'data:image/png;base64,abc',
  text: 'Memory text',
  date: '2024-06-01',
  plantedAt: '2024-01-01T00:00:00.000Z',
  position: { x: 400, y: 450 },
  emotionalTone: 'peaceful',
  plantStage: 'sprout',
  plantVariety: 'flower',
  visitCount: 4,
  reflections: [{ id: 'r1', text: 'note', createdAt: '2024-02-01T00:00:00.000Z' }],
  audioRecordings: [],
}

describe('applyManualPlantStage', () => {
  it('updates variety and stage while preserving visits and reflections', () => {
    const edited = applyManualPlantStage(
      { ...memory, plantVariety: 'tree' },
      'bloom',
      [],
    )
    expect(edited.plantVariety).toBe('tree')
    expect(edited.plantStage).toBe('bloom')
    expect(edited.visitCount).toBe(4)
    expect(edited.reflections).toHaveLength(1)
    expect(edited.growthMetrics?.vitality).toBeGreaterThanOrEqual(64)
  })
})

describe('plantStageAfterGrowth', () => {
  it('does not regress below manually set stage', () => {
    const manual = { ...memory, plantStage: 'bloom' as const }
    const metrics = {
      vitality: 40,
      height: 50,
      width: 40,
      bloomCount: 1,
      foliageDensity: 40,
      rarityScore: 10,
      lastInteractionAt: Date.now(),
    }
    const stage = plantStageAfterGrowth(manual, metrics)
    expect(stage).toBe('bloom')
  })
})
