import { describe, expect, it } from 'vitest'
import type { Memory, PlantStage } from '@/lib/types'
import { SCENE_W } from '@/lib/garden/scene-constants'
import {
  layoutMemoryPlantsForView,
  memoryPlantDrawScale,
  treeFootprintHalfW,
} from '@/lib/garden/memory-scene-layout'
import { TREE_PROGRESSION_FACE_SCALE } from '@/components/plants/facing-art'
import { plantStageToIndex } from '@/lib/garden/stage'
import { projectMemoryToSceneWorld, projectWorldToScene } from '@/lib/garden/landscape-world'
import { WORLD_COTTAGE } from '@/lib/garden/landscape-world-layout'
import { GARDEN_LANDSCAPE_VIEWS } from '@/lib/garden/landscape-view'

function treeMemory(id: string, plantStage: PlantStage, x: number, y = 442): Memory {
  return {
    id,
    photoUrl: '',
    text: id,
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x, y },
    emotionalTone: 'peaceful',
    plantStage,
    plantVariety: 'tree',
    visitCount: 1,
    reflections: [],
    audioRecordings: [],
  }
}

function demoTreeRowMemories(): Memory[] {
  const stages = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'] as const
  return stages.map((plantStage, i) => treeMemory(`tree-stage-${plantStage}`, plantStage, 140 + i * 128))
}

function projectedAnchor(memory: Memory, view: 'pond' | 'lakeside' | 'meadow' | 'garden_path' = 'pond') {
  return projectMemoryToSceneWorld(memory.position, view).x
}

describe('memory-scene-layout', () => {
  it('preserves projected x when trees do not overlap', () => {
    const mems = [
      treeMemory('far-a', 'young', 220),
      treeMemory('far-b', 'bud', 880),
    ]
    const layout = layoutMemoryPlantsForView(mems, 'pond')
    for (const m of mems) {
      const anchor = projectedAnchor(m, 'pond')
      const placed = layout.get(m.id)!
      expect(Math.abs(placed.x - anchor)).toBeLessThan(0.01)
    }
  })

  it('uses minimal displacement when canopies overlap', () => {
    const mems = [
      treeMemory('m1', 'mature', 600),
      treeMemory('m2', 'elder', 680),
    ]
    const a1 = projectedAnchor(mems[0], 'pond')
    const a2 = projectedAnchor(mems[1], 'pond')
    const layout = layoutMemoryPlantsForView(mems, 'pond')
    const p1 = layout.get('m1')!
    const p2 = layout.get('m2')!
    expect(Math.abs(p1.x - a1)).toBeLessThan(120)
    expect(Math.abs(p2.x - a2)).toBeLessThan(120)
    expect(p2.x).toBeGreaterThan(p1.x)
    const gap = p2.x - p1.x
    const need =
      (treeFootprintHalfW(p1.plantScale, 6) + treeFootprintHalfW(p2.plantScale, 7)) * 1.0
    const overlapRemain = need * 1.02 - gap
    expect(overlapRemain).toBeLessThan(2)
    expect(Math.abs(p1.x - a1)).toBeLessThan(120)
    expect(Math.abs(p2.x - a2)).toBeLessThan(120)
  })

  it('keeps clustered gardens in rough relative order', () => {
    const xs = [340, 368, 410, 455]
    const mems = xs.map((x, i) => treeMemory(`c${i}`, 'bloom', x))
    const anchors = xs.map((x) => projectMemoryToSceneWorld({ x, y: 442 }, 'pond').x)
    const layout = layoutMemoryPlantsForView(mems, 'pond')
    for (let i = 0; i < xs.length; i++) {
      const placed = layout.get(`c${i}`)!.x
      expect(Math.abs(placed - anchors[i])).toBeLessThan(48)
    }
  })

  it('respects scene edges and cottage keep-out on pond row', () => {
    const layout = layoutMemoryPlantsForView(demoTreeRowMemories(), 'pond')
    const shed = projectWorldToScene(WORLD_COTTAGE, 'pond', { objectYaw: WORLD_COTTAGE.yaw, layer: 'near' })
    const shedHalf = 54 * shed.scale * 0.62
  for (const [id, p] of layout) {
      if (!id.startsWith('tree-stage-')) continue
      const stageIndex = plantStageToIndex(id.replace('tree-stage-', '') as PlantStage)
      const half = treeFootprintHalfW(p.plantScale, stageIndex)
      expect(p.x - half).toBeGreaterThanOrEqual(90)
      expect(p.x + half).toBeLessThanOrEqual(SCENE_W - 85)
      expect(p.x + half).toBeLessThan(shed.x - shedHalf - 8)
    }
  })

  it('is deterministic across repeated layout calls', () => {
    const mems = demoTreeRowMemories()
    const first = layoutMemoryPlantsForView(mems, 'pond')
    const second = layoutMemoryPlantsForView(mems, 'pond')
    for (const m of mems) {
      const a = first.get(m.id)!
      const b = second.get(m.id)!
      expect(a.x).toBe(b.x)
      expect(a.plantScale).toBe(b.plantScale)
      expect(a.y).toBe(b.y)
    }
  })

  it('keeps demo elder inside frame on pond', () => {
    const layout = layoutMemoryPlantsForView(demoTreeRowMemories(), 'pond')
    const elder = layout.get('tree-stage-elder')!
    const face = TREE_PROGRESSION_FACE_SCALE[plantStageToIndex('elder')] ?? 1
    expect(elder.x + 58 * elder.plantScale * face).toBeLessThanOrEqual(SCENE_W - 85)
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
