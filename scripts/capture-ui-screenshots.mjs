import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/after/screenshots'
const prefix = process.env.SCREENSHOT_PREFIX || 'after'

mkdirSync(outDir, { recursive: true })

const prefs = {
  hasCompletedOnboarding: true,
  gardenLandscapeView: 'pond',
  preferredSeason: 'summer',
}

const browser = await chromium.launch({ headless: true })

async function snap(context, name) {
  const page = await context.newPage()
  await page.addInitScript((p) => {
    localStorage.setItem('memorygarden:preferences', JSON.stringify(p))
  }, prefs)
  return page
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } })

  for (const { label, context } of [
    { label: 'desktop', context: desktop },
    { label: 'mobile', context: mobile },
  ]) {
    let page = await snap(context, label)
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90_000 })
    await page.waitForTimeout(1200)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(250)
    }
    await page.locator('[data-slot="dialog-overlay"]').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(500)
    await page.screenshot({ path: resolve(outDir, `${prefix}-garden-home-${label}.png`) })

    await page.getByTitle('Explore Gardens', { exact: true }).click({ force: true })
    await page.waitForTimeout(1600)
    await page.screenshot({ path: resolve(outDir, `${prefix}-explore-${label}.png`), fullPage: false })

    await page.getByTitle('Garden View', { exact: true }).click({ force: true })
    await page.waitForTimeout(1200)

    const dreamToggle = page.getByTestId('garden-tool-dream-toggle')
    if (await dreamToggle.count()) {
      await dreamToggle.click({ force: true })
      await page.waitForTimeout(600)
      const panel = page.getByTestId('garden-tool-dream-panel')
      await panel.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
      await page.screenshot({ path: resolve(outDir, `${prefix}-dream-plant-panel-${label}.png`) })
      const box = await panel.boundingBox()
      if (box) {
        await page.screenshot({
          path: resolve(outDir, `${prefix}-plant-of-the-week-${label}.png`),
          clip: { ...box, height: Math.min(box.height, 280) },
        })
      }
    }

    await page.close()
    await context.close()
  }
} finally {
  await browser.close()
}

console.log('Screenshots written to', outDir)
