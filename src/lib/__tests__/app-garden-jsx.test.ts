/**
 * Regression for the production Vercel/vite parse break on `main`:
 * - src/App.tsx garden ternary had adjacent JSX roots (bare GardenCanvas +
 *   SectionErrorBoundary) → "Expected `,` or `)` but found `Identifier`"
 * - Duplicate garden-helpers / types imports after #104 merge
 * - src/components/GardenCanvas.tsx half-merged with main left orphaned
 *   useEffect fragments → "Unexpected token"
 *
 * Drives the real shipped sources through Vite's production transform path
 * (transformWithOxc — same Oxc/Rolldown stack as vite 8 build), not a
 * re-implemented snippet.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformWithOxc } from 'vite'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const appPath = path.join(root, 'App.tsx')
const canvasPath = path.join(root, 'components/GardenCanvas.tsx')

function gardenViewBranch(source: string): string {
  const match = source.match(
    /<SectionErrorBoundary label="garden view">([\s\S]*?)<\/SectionErrorBoundary>/,
  )
  if (!match) {
    throw new Error('Could not locate garden view SectionErrorBoundary in App.tsx')
  }
  return match[1]
}

async function assertTransforms(filePath: string): Promise<string> {
  const source = readFileSync(filePath, 'utf8')
  const result = await transformWithOxc(source, filePath)
  if (!result.code || result.code.length < 500) {
    throw new Error(`transformWithOxc produced empty or truncated output for ${filePath}`)
  }
  expect(result.code.length).toBeGreaterThan(500)
  return source
}

describe('production parse path for garden view (App + GardenCanvas)', () => {
  it('transforms shipped App.tsx through Vite Oxc without parse errors', async () => {
    const source = await assertTransforms(appPath)
    expect(source).toContain('label="garden view"')
  })

  it('transforms shipped GardenCanvas.tsx through Vite Oxc without parse errors', async () => {
    const source = await assertTransforms(canvasPath)
    // Redesign scene path present; half-merged pinch-zoom main remnants absent
    expect(source).toContain('GardenSceneSvg')
    expect(source).not.toMatch(/getSeasonalSky|ParallaxBackground|setScale\(/)
    // Lens must magnify via loupe helper only — never scale the whole scene wrap
    expect(source).toContain('computeLoupeLayout')
    expect(source).not.toMatch(/transform:\s*lensOn\s*\?\s*`scale\(/)
  })

  it('uses a single SectionErrorBoundary root with onPlantHybrid on GardenCanvas', async () => {
    const source = await assertTransforms(appPath)
    const gardenBranch = gardenViewBranch(source)

    expect(gardenBranch).toContain('<GardenCanvas')
    expect(gardenBranch).toContain('onPlantHybrid={handlePlantHybrid}')
    expect(gardenBranch).toContain('starterDecor={safePreferences.gardenStarterDecor}')

    // No duplicate garden-helpers import block
    const helperImports = source.match(
      /from ['"]@\/lib\/garden-helpers['"]/g,
    )
    expect(helperImports?.length).toBe(1)
  })
})
