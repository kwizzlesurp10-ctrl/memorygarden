import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const prefix = process.env.SCREENSHOT_PREFIX || 'parity'
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: { width: 1320, height: 900 },
    deviceScaleFactor: 2,
  })
  await context.addInitScript(() => {
    sessionStorage.setItem('mg:plant-stage-grid', '1')
    sessionStorage.setItem('mg:plant-stage-grid-variety', 'flower')
  })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.locator('[data-testid="plant-stage-grid"]').waitFor({ timeout: 60_000 })
  await page
    .locator('[data-testid="stage-3d-flower-bloom"][data-stage-preview-ready="1"]')
    .waitFor({ state: 'attached', timeout: 45_000 })
  await page.waitForTimeout(900)
  const cell = page.locator('[data-testid="stage-3d-flower-bloom"]')
  await cell.screenshot({
    path: resolve(outDir, `${prefix}-flower-bloom-glow-closeup.png`),
  })
  await context.close()
} finally {
  await browser.close()
}

console.log('Bloom closeup in', outDir)
