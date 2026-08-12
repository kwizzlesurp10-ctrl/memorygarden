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

function gardenFalseBranch(source: string): string {
  const match = source.match(
    /\{safeMemories\.length === 0 \? \(\s*<EmptyGarden[\s\S]*?\) : \(([\s\S]*?)\)\s*\}/,
  )
  if (!match) {
    throw new Error('Could not locate garden empty/canvas ternary in App.tsx')
  }
  return match[1]
}

async function assertTransforms(filePath: string): Promise<string> {
  const source = readFileSync(filePath, 'utf8')
  const result = await transformWithOxc(source, filePath)
  if (result.errors?.length) {
    throw new Error(
      `transformWithOxc errors in ${filePath}: ${result.errors.map((e) => (typeof e === 'string' ? e : (e as { message?: string }).message ?? JSON.stringify(e))).join('; ')}`,
    )
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
    const falseBranch = gardenFalseBranch(source)

    expect(falseBranch.trimStart().startsWith('<SectionErrorBoundary')).toBe(true)
    expect(falseBranch).toContain('label="garden view"')
    expect(falseBranch).toContain('<GardenCanvas')
    expect(falseBranch).toContain('onPlantHybrid={handlePlantHybrid}')
    expect(falseBranch).toContain('</SectionErrorBoundary>')
    expect(falseBranch).not.toMatch(
      /<GardenCanvas[\s\S]*?\/>\s*<SectionErrorBoundary/,
    )

    // No duplicate garden-helpers import block
    const helperImports = source.match(
      /from ['"]@\/lib\/garden-helpers['"]/g,
    )
    expect(helperImports?.length).toBe(1)
  })
})
