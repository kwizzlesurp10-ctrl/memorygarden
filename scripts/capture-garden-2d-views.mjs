import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const prefix = process.env.SCREENSHOT_PREFIX || 'after'

mkdirSync(outDir, { recursive: true })

const prefs = {
  hasCompletedOnboarding: true,
  gardenLandscapeView: 'pond',
  preferredSeason: 'summer',
}

const viewports = [
  { label: 'desktop-1280', width: 1280, height: 800 },
  { label: 'desktop-1440', width: 1440, height: 900 },
  { label: 'mobile-390', width: 390, height: 844 },
]

const landscapes = ['pond', 'lakeside', 'meadow', 'garden_path']

async function preparePage(context) {
  const page = await context.newPage()
  await page.addInitScript((p) => {
    localStorage.setItem('memorygarden:preferences', JSON.stringify(p))
  }, prefs)

  await page.route('**/api/llm**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'offline' }) })
  })

  await page.route('**/api/gardens**', async (route) => {
    const req = route.request()
    if (req.method() !== 'GET' || req.url().includes('id=')) {
      await route.continue()
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ gardens: [] }) })
  })

  return page
}

async function dismissChrome(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(120)
  }
  await page.locator('[data-slot="dialog-overlay"]').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {})
}

const browser = await chromium.launch({ headless: true })
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce',
      colorScheme: 'dark',
    })
    const page = await preparePage(context)
    await dismissChrome(page)

    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Garden View"]')
      if (btn instanceof HTMLElement) btn.click()
    })
    await page.waitForTimeout(800)

  for (const view of landscapes) {
      await page.evaluate((v) => {
        const raw = localStorage.getItem('memorygarden:preferences')
        const prefs = raw ? JSON.parse(raw) : {}
        prefs.gardenLandscapeView = v
        localStorage.setItem('memorygarden:preferences', JSON.stringify(prefs))
      }, view)
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForTimeout(900)
      for (let i = 0; i < 3; i++) await page.keyboard.press('Escape')
      await page.getByTestId('garden-scene-wrap').waitFor({ state: 'visible', timeout: 20_000 })
      await page.screenshot({
        path: resolve(outDir, `${prefix}-garden-2d-${view}-${vp.label}.png`),
      })
    }

    await context.close()
  }
} finally {
  await browser.close()
}

console.log('2D garden view screenshots written to', outDir)
