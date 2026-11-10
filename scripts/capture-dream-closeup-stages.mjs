import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const prefix = process.env.SCREENSHOT_PREFIX || 'dream-closeup-stages'

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

const PLANTS = [
  { idea: 'crimson rose climbing the vineyard arch', slug: 'flower-vine' },
  { idea: 'ancient oak remembering thunderstorms', slug: 'tree' },
  { idea: 'wild rosemary on the fern hillside', slug: 'herb-fern' },
]

const prefs = {
  hasCompletedOnboarding: true,
  gardenLandscapeView: 'pond',
  preferredSeason: 'summer',
}

const viewports = [
  { label: 'desktop', width: 1280, height: 800 },
  { label: 'desktop-short', width: 1280, height: 600 },
  { label: 'mobile', width: 390, height: 844 },
  { label: 'mobile-short', width: 390, height: 640 },
]

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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ gardens: [] }),
    })
  })

  return page
}

async function openDreamCloseup(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90_000 })
  await page.waitForTimeout(1000)
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
  }
  await page.evaluate(() => {
    const btn = document.querySelector('button[title="Garden View"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.waitForTimeout(800)
  await page.getByTestId('garden-tool-dream-toggle').click({ force: true })
  await page.getByTestId('garden-tool-dream-panel').waitFor({ state: 'visible', timeout: 15_000 })
}

async function dreamIdea(page, idea) {
  const panel = page.getByTestId('garden-tool-dream-panel')
  const input = panel.locator('input[type="text"]')
  await input.fill(idea)
  await panel.getByRole('button', { name: 'Dream it' }).click()
  await page.getByTestId('dream-plant-closeup-trigger').waitFor({ state: 'visible', timeout: 30_000 })
  const trigger = page.getByTestId('dream-plant-closeup-trigger')
  await trigger.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await trigger.click()
  await page.getByTestId('dream-plant-closeup-dialog').waitFor({ state: 'visible', timeout: 15_000 })
  await page.waitForTimeout(500)
}

async function captureStageShots(page, viewportLabel, plantSlug, debug) {
  const shots = []
  for (const stage of STAGES) {
    await page.getByTestId(`dream-plant-closeup-stage-${stage}`).click()
    await page.waitForTimeout(debug ? 350 : 200)
    const file = resolve(
      outDir,
      `${prefix}-${viewportLabel}-${plantSlug}-${stage}${debug ? '-debug' : ''}.png`,
    )
    await page.getByTestId('dream-plant-closeup-dialog').screenshot({ path: file })
    shots.push({ stage, file, fileName: file.split('/').pop() })
  }
  return shots
}

async function composeContactSheet(page, shots, outPath, title) {
  const cells = shots
    .map(
      (s, i) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px;background:#120e18;border:1px solid #f0e7da22;border-radius:12px;">
      <img src="file://${s.file}" style="width:100%;height:auto;display:block;border-radius:8px;" alt="${s.stage}" />
      <div style="font:600 11px system-ui;color:#ffddb0;text-transform:capitalize;">${s.stage}</div>
    </div>`,
    )
    .join('')

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#0d0913;padding:20px;">
    <div style="font:600 14px system-ui;color:#faf4ec;margin-bottom:12px;">${title}</div>
    <div style="display:grid;grid-template-columns:repeat(4, minmax(0,1fr));gap:10px;max-width:1240px;">${cells}</div>
  </body></html>`

  const tmp = resolve(outDir, `${prefix}-compose-tmp.html`)
  writeFileSync(tmp, html, 'utf8')
  await page.goto(`file://${tmp}`, { waitUntil: 'load' })
  await page.waitForTimeout(200)
  await page.screenshot({ path: outPath, fullPage: true })
}

const browser = await chromium.launch({ headless: true })

try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce',
      colorScheme: 'dark',
    })

    for (const plant of PLANTS) {
      const page = await preparePage(context)

      await openDreamCloseup(page)
      await dreamIdea(page, plant.idea)

      const shots = await captureStageShots(page, vp.label, plant.slug, false)
      await page.getByTestId('dream-plant-closeup-back').click()
      await page.getByTestId('dream-plant-closeup-dialog').waitFor({ state: 'hidden', timeout: 10_000 })
      await page.waitForTimeout(300)

      const composePage = await context.newPage()
      const sheetPath = resolve(outDir, `${prefix}-contact-${vp.label}-${plant.slug}.png`)
      await composeContactSheet(
        composePage,
        shots,
        sheetPath,
        `${plant.slug} · ${vp.label} · growth stages`,
      )
      await composePage.close()

      await page.evaluate(() => localStorage.setItem('memorygarden:debug-closeup-frame', '1'))
      await page.getByTestId('dream-plant-closeup-trigger').click()
      await page.getByTestId('dream-plant-closeup-dialog').waitFor({ state: 'visible' })
      await captureStageShots(page, vp.label, `${plant.slug}-debug`, true)
      await page.evaluate(() => localStorage.removeItem('memorygarden:debug-closeup-frame'))

      await page.getByTestId('dream-plant-closeup-back').click()
      await page.close()
    }

    const heroPage = await preparePage(context)
    await openDreamCloseup(heroPage)
    await dreamIdea(heroPage, PLANTS[0].idea)
    await heroPage.getByTestId('dream-plant-closeup-stage-elder').click()
    await heroPage.waitForTimeout(400)
    await heroPage.screenshot({
      path: resolve(outDir, `${prefix}-hero-${vp.label}-elder-flower.png`),
    })
    await heroPage.close()
    await context.close()
  }
} finally {
  await browser.close()
}

console.log('Close-up stage artifacts written to', outDir)
