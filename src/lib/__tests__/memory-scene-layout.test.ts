import { describe, expect, it } from 'vitest'
import type { Memory } from '@/lib/types'
import { SCENE_W } from '@/lib/garden/scene-constants'
import { layoutMemoryPlantsForView, memoryPlantDrawScale } from '@/lib/garden/memory-scene-layout'
import { TREE_PROGRESSION_FACE_SCALE } from '@/components/plants/facing-art'
import { plantStageToIndex } from '@/lib/garden/stage'
import { projectWorldToScene } from '@/lib/garden/landscape-world'
import { WORLD_COTTAGE } from '@/lib/garden/landscape-world-layout'
import { GARDEN_LANDSCAPE_VIEWS } from '@/lib/garden/landscape-view'

function demoTreeRowMemories(): Memory[] {
  const stages = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'] as const
  return stages.map((plantStage, i) => ({
    id: `tree-stage-${plantStage}`,
    photoUrl: '',
    text: `Tree at ${plantStage}`,
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 140 + i * 128, y: 442 },
    emotionalTone: 'peaceful',
    plantStage,
    plantVariety: 'tree',
    visitCount: 1,
    reflections: [],
    audioRecordings: [],
  }))
}

describe('memory-scene-layout', () => {
  it('keeps demo elder trees inside the scene width on pond', () => {
    const layout = layoutMemoryPlantsForView(demoTreeRowMemories(), 'pond')
    const elder = layout.get('tree-stage-elder')
    const mature = layout.get('tree-stage-mature')
    expect(elder).toBeDefined()
    expect(mature).toBeDefined()
    const elderSc = elder!.plantScale
    const face = TREE_PROGRESSION_FACE_SCALE[plantStageToIndex('elder')] ?? 1
    const halfW = 58 * elderSc * face
    expect(elder!.x + halfW).toBeLessThanOrEqual(SCENE_W - 90)
    expect(mature!.x + 58 * mature!.plantScale * (TREE_PROGRESSION_FACE_SCALE[6] ?? 1)).toBeLessThanOrEqual(SCENE_W - 90)
  })

  it('separates mature and elder canopies', () => {
    const layout = layoutMemoryPlantsForView(demoTreeRowMemories(), 'pond')
    const mature = layout.get('tree-stage-mature')!
    const elder = layout.get('tree-stage-elder')!
    const gap = elder.x - mature.x
    const need =
      58 *
      (mature.plantScale * (TREE_PROGRESSION_FACE_SCALE[6] ?? 1) +
        elder.plantScale * (TREE_PROGRESSION_FACE_SCALE[7] ?? 1)) *
      1.0
    expect(gap).toBeGreaterThanOrEqual(need - 4)
  })

  it('stays clear of the cottage on pond', () => {
    const layout = layoutMemoryPlantsForView(demoTreeRowMemories(), 'pond')
    const shed = projectWorldToScene(WORLD_COTTAGE, 'pond', { objectYaw: WORLD_COTTAGE.yaw, layer: 'near' })
    const elder = layout.get('tree-stage-elder')!
    const face = TREE_PROGRESSION_FACE_SCALE[7] ?? 1
    const leftEdge = elder.x - 58 * elder.plantScale * face
    const shedHalf = 54 * shed.scale * 0.62
    expect(leftEdge).toBeLessThan(shed.x - shedHalf - 20)
  })

  it('layouts all landscapes without NaN', () => {
    const mems = demoTreeRowMemories()
    for (const view of GARDEN_LANDSCAPE_VIEWS) {
      const layout = layoutMemoryPlantsForView(mems, view)
      expect(layout.size).toBe(8)
      for (const p of layout.values()) {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.plantScale)).toBe(true)
        expect(p.plantScale).toBeGreaterThan(0.4)
      }
    }
  })

  it('memoryPlantDrawScale grows with stage', () => {
    const sprout = memoryPlantDrawScale('sprout', 1.1)
    const elder = memoryPlantDrawScale('elder', 1.1)
    expect(elder).toBeGreaterThan(sprout)
  })
})
