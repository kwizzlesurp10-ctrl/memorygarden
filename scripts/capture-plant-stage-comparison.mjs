import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
mkdirSync(outDir, { recursive: true })

const STAGES = [
  'seed',
  'sprout',
  'seedling',
  'young',
  'bud',
  'bloom',
  'mature',
  'elder',
]

async function captureVariety(browser, variety) {
  const viewport =
    variety === 'tree'
      ? { width: 1320, height: 920 }
      : { width: 1320, height: 900 }
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  await context.addInitScript((v) => {
    sessionStorage.setItem('mg:plant-stage-grid', '1')
    sessionStorage.setItem('mg:plant-stage-grid-variety', v)
  }, variety)
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.locator('[data-testid="plant-stage-grid"]').waitFor({ state: 'visible', timeout: 60_000 })
  for (const stage of STAGES) {
    await page
      .locator(`[data-testid="stage-2d-${variety}-${stage}"]`)
      .waitFor({ state: 'visible', timeout: 30_000 })
    await page
      .locator(`[data-testid="stage-3d-${variety}-${stage}"]`)
      .waitFor({ state: 'visible', timeout: 30_000 })
  }
  await page.waitForTimeout(600)
  const outName =
    variety === 'tree'
      ? 'after-tree-stages-2d-3d-stacked.png'
      : 'after-flower-stages-2d-3d-stacked.png'
  await page.locator('[data-testid="plant-stage-grid"]').screenshot({
    path: resolve(outDir, outName),
  })
  const legacyName =
    variety === 'tree'
      ? 'after-tree-stages-2d-3d-side-by-side.png'
      : 'after-flower-stages-2d-3d-side-by-side.png'
  await page.locator('[data-testid="plant-stage-grid"]').screenshot({
    path: resolve(outDir, legacyName),
  })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await captureVariety(browser, 'tree')
  await captureVariety(browser, 'flower')
} finally {
  await browser.close()
}

console.log('Stage grid artifacts in', outDir)
