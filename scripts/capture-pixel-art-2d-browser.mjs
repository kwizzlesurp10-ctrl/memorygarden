/**
 * Browser crop screenshot for pixel-art (matches canvas raster path).
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'art-style-3d',
  avatarUrl: '',
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript(() => {
    localStorage.setItem(
      'memorygarden:user',
      JSON.stringify({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        login: 'art-style-3d',
        avatarUrl: '',
      }),
    )
    localStorage.setItem(
      'memorygarden:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:preferences',
      JSON.stringify({
        hasCompletedOnboarding: true,
        plantStylePreference: { artStyle: 'pixel-art' },
      }),
    )
  })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.waitForTimeout(2000)
  const svg = page.locator('[data-testid="garden-scene-svg"]').first()
  if (await svg.count()) {
    await svg.screenshot({ path: resolve(outDir, 'garden-art-style-pixel-art-browser-garden.png') })
  }
  const canvas = page.locator('svg').first()
  await canvas.screenshot({ path: resolve(outDir, 'garden-art-style-pixel-art-browser-root.png') })
} finally {
  await browser.close()
}
