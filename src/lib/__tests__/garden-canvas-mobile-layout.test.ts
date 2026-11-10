import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const canvas = readFileSync(join(root, 'components/GardenCanvas.tsx'), 'utf8')
const sceneSvg = readFileSync(join(root, 'components/garden/GardenSceneSvg.tsx'), 'utf8')
const viewPicker = readFileSync(join(root, 'components/garden/GardenViewPicker.tsx'), 'utf8')

describe('mobile garden scene layout', () => {
  it('fills the main column height and hides duplicate walk control on small screens', () => {
    expect(canvas).toContain('min-h-0')
    expect(canvas).toContain('data-testid="enter-walk-button"')
    expect(canvas).toContain('hidden')
    expect(canvas).toContain('sm:flex')
    expect(canvas).toContain('max-w-[min(100%,calc(100%-5.5rem))]')
  })

  it('uses compact mobile tab labels with full aria labels', () => {
    expect(viewPicker).toContain('GARDEN_LANDSCAPE_VIEW_COMPACT_LABEL')
    expect(viewPicker).toContain('max-sm:grid-cols-4')
    expect(viewPicker).toContain('aria-label={meta.label}')
  })

  it('renders the SVG to cover the scene wrap', () => {
    expect(sceneSvg).toContain('garden-scene-svg')
    expect(sceneSvg).toContain('preserveAspectRatio="xMidYMid slice"')
    expect(sceneSvg).toContain('h-full w-full')
  })
})
