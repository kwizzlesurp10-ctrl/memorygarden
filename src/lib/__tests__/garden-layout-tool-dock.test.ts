import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const canvasPath = path.join(root, 'components/GardenCanvas.tsx')
const dockPath = path.join(root, 'components/garden/GardenLayoutToolDock.tsx')

describe('garden layout tool dock (3a / 6a pop-outs)', () => {
  it('mounts collapsible dock instead of always-expanded panels on GardenCanvas', () => {
    const canvas = readFileSync(canvasPath, 'utf8')
    expect(canvas).toContain('GardenLayoutToolDock')
    expect(canvas).not.toContain('<DreamPlantPanel')
    expect(canvas).not.toContain('<RemembranceCandlesPanel')
  })

  it('defaults tools closed with icon toggles and mutual exclusion', () => {
    const dock = readFileSync(dockPath, 'utf8')
    expect(dock).toContain("useState<LayoutTool | null>(null)")
    expect(dock).toContain('data-testid="garden-tool-dream-toggle"')
    expect(dock).toContain('data-testid="garden-tool-candles-toggle"')
    expect(dock).toContain('garden-layout-tool-backdrop')
    expect(dock).toMatch(/prev === tool \? null : tool/)
    expect(dock).toContain("event.key === 'Escape'")
  })
})
