import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformWithOxc } from 'vite'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

describe('open-world walk wiring', () => {
  it('exposes walk view in App and header', () => {
    const app = readFileSync(path.join(root, 'App.tsx'), 'utf8')
    const header = readFileSync(path.join(root, 'components/AppHeader.tsx'), 'utf8')
    expect(app).toContain("viewMode === 'walk'")
    expect(app).toContain('OpenWorldGarden')
    expect(app).toContain('onEnterWalk')
    expect(header).toContain("value: 'walk'")
    expect(header).toContain('Walk the garden')
  })

  it('transforms OpenWorldGarden through Vite Oxc', async () => {
    const filePath = path.join(root, 'components/open-world/OpenWorldGarden.tsx')
    const source = readFileSync(filePath, 'utf8')
    const result = await transformWithOxc(source, filePath)
    if (!result.code || result.code.length < 500) {
      throw new Error('transformWithOxc failed for OpenWorldGarden')
    }
    expect(result.code.length).toBeGreaterThan(500)
    expect(source).toContain('data-testid="open-world-garden"')
  })
})
