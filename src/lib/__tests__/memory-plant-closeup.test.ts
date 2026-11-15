import { describe, expect, it } from 'vitest'
import type { Memory } from '@/lib/types'
import { memoryPlantStageProgress, memoryLastTendedLabel } from '@/lib/garden/memory-plant-closeup'

function baseMemory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'm1',
    photoUrl: '',
    text: 'Demo journal entry',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 400, y: 440 },
    emotionalTone: 'peaceful',
    plantStage: 'young',
    plantVariety: 'flower',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    ...overrides,
  }
}

describe('memoryPlantStageProgress', () => {
  it('reports progress toward the next stage from vitality', () => {
    const { stage, nextStage, progress01 } = memoryPlantStageProgress(
      baseMemory({
        plantStage: 'young',
        growthMetrics: {
          vitality: 43,
          height: 80,
          width: 65,
          bloomCount: 2,
          foliageDensity: 43,
          rarityScore: 10,
          lastInteractionAt: Date.now(),
        },
      }),
    )
    expect(stage).toBe('young')
    expect(nextStage).toBe('bud')
    expect(progress01).toBeGreaterThan(0)
    expect(progress01).toBeLessThan(1)
  })

  it('returns full progress at elder', () => {
    const result = memoryPlantStageProgress(
      baseMemory({
        plantStage: 'elder',
        growthMetrics: {
          vitality: 95,
          height: 120,
          width: 90,
          bloomCount: 8,
          foliageDensity: 95,
          rarityScore: 20,
          lastInteractionAt: Date.now(),
        },
      }),
    )
    expect(result.nextStage).toBeNull()
    expect(result.progress01).toBe(1)
  })
})

describe('memoryLastTendedLabel', () => {
  it('prefers lastVisited over tend reflections', () => {
    const label = memoryLastTendedLabel(
      baseMemory({
        lastVisited: '2025-07-04T10:00:00.000Z',
        reflections: [
          { id: 'r1', text: 'tend', createdAt: '2025-07-01T10:00:00.000Z', isTend: true },
        ],
      }),
    )
    expect(label).toMatch(/2025|Jul|7/)
  })
})