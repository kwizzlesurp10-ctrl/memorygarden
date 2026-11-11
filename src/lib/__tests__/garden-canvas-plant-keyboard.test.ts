import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const components = join(import.meta.dirname, '../../components')

describe('GardenCanvas plant keyboard', () => {
  const source = readFileSync(join(components, 'garden/GardenSceneMemoryPlant.tsx'), 'utf8')

  it('wires spatial arrow navigation and control-arrow nudge', () => {
    expect(source).toContain('findSpatialGardenPlantNeighbor')
    expect(source).toContain('WORLD_POSITION_NUDGE')
    expect(source).toContain('onMemoryMove(memory.id')
  })
})
