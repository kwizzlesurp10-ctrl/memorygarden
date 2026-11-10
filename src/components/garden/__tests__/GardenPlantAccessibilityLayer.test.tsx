import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GardenPlantAccessibilityLayer } from '@/components/garden/GardenPlantAccessibilityLayer'
import type { Memory } from '@/lib/types'

const memory: Memory = {
  id: 'm1',
  text: 'Lake afternoon',
  photoUrl: '',
  date: new Date().toISOString(),
  plantedAt: new Date().toISOString(),
  emotionalTone: 'peaceful',
  plantStage: 'bloom',
  position: { x: 400, y: 450 },
  visitCount: 2,
  reflections: [],
  audioRecordings: [],
  plantVariety: 'tree',
  geneticsSeed: 'abc',
}

describe('GardenPlantAccessibilityLayer', () => {
  it('lists plant labels for screen readers without duplicate action buttons', () => {
    const html = renderToStaticMarkup(
      h(GardenPlantAccessibilityLayer, {
        memories: [memory],
        highlightedMemoryIds: null,
        onMemoryClick: () => undefined,
      }),
    )

    expect(html).toContain('Lake afternoon')
    expect(html).not.toContain('<button')
  })
})
