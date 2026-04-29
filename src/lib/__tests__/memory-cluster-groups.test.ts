import { describe, expect, it } from 'vitest'
import { computeEmotionalClusterGroups } from '../memory-cluster-groups'
import type { Memory } from '../types'

function stub(id: string, tone: Memory['emotionalTone']): Memory {
  return {
    id,
    photoUrl: '',
    text: '',
    date: '2020-01-01',
    plantedAt: '2020-01-01',
    position: { x: 0, y: 0 },
    emotionalTone: tone,
    plantStage: 'seed',
    plantVariety: 'flower',
    visitCount: 0,
    reflections: [],
    audioRecordings: [],
  }
}

describe('computeEmotionalClusterGroups', () => {
  it('returns empty for no memories', () => {
    expect(computeEmotionalClusterGroups([])).toEqual([])
  })

  it('uses a single meta-group when there are fewer than three memories', () => {
    const g = computeEmotionalClusterGroups([stub('a', 'happy'), stub('b', 'nostalgic')])
    expect(g).toHaveLength(1)
    expect(g[0].id).toBe('all')
    expect(g[0].memoryIds).toEqual(['a', 'b'])
  })

  it('splits by emotional tone when there are enough memories', () => {
    const batch: Memory[] = [
      stub('a', 'happy'),
      stub('b', 'happy'),
      stub('c', 'happy'),
      stub('d', 'peaceful'),
    ]
    const g = computeEmotionalClusterGroups(batch)
    const happy = g.find((x) => x.theme === 'happy')
    const peaceful = g.find((x) => x.theme === 'peaceful')
    expect(happy?.memoryIds.sort()).toEqual(['a', 'b', 'c'])
    expect(peaceful?.memoryIds).toEqual(['d'])
  })
})
