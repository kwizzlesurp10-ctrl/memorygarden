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

const mockGardensPayload = {
  gardens: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Meadow Song Circle',
      description: 'Shared reflections from summer walks and morning tea.',
      owner_name: 'Rowan',
      member_count: 12,
      memory_count: 48,
      created_at: '2025-08-12T10:00:00.000Z',
      viewer_is_member: false,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Lakeside Remembrance',
      description: 'Quiet waters, candlelit evenings, and fern borders.',
      owner_name: 'Mira',
      member_count: 8,
      memory_count: 31,
      created_at: '2025-09-03T14:30:00.000Z',
      viewer_is_member: true,
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Storybook Cottage Vine',
      description: 'Fairy-tale motifs, braided vines, and handwritten notes.',
      owner_name: 'Elliot',
      member_count: 21,
      memory_count: 76,
      created_at: '2025-10-18T09:15:00.000Z',
      viewer_is_member: false,
    },
  ],
}

const browser = await chromium.launch({ headless: true })

async function newPreparedPage(context) {
  const page = await context.newPage()
  await page.addInitScript((p) => {
    localStorage.setItem('memorygarden:preferences', JSON.stringify(p))
  }, prefs)

  await page.route('**/api/gardens**', async (route) => {
    const req = route.request()
    if (req.method() !== 'GET' || req.url().includes('id=')) {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockGardensPayload),
    })
  })

  return page
}

const contextOptions = {
  reducedMotion: 'reduce',
  colorScheme: 'dark',
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...contextOptions })
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, ...contextOptions })

  for (const { label, context } of [
    { label: 'desktop', context: desktop },
    { label: 'mobile', context: mobile },
  ]) {
    const page = await newPreparedPage(context)
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 90_000 })
    await page.waitForTimeout(1200)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }
    await page.locator('[data-slot="dialog-overlay"]').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(600)
    await page.screenshot({ path: resolve(outDir, `${prefix}-garden-home-${label}.png`) })

    await page.getByTitle('Explore Gardens', { exact: true }).click({ force: true })
    await page.getByText('Meadow Song Circle').waitFor({ state: 'visible', timeout: 15_000 })
    await page.waitForTimeout(800)
    await page.screenshot({ path: resolve(outDir, `${prefix}-explore-${label}.png`), fullPage: false })

    await page.getByTitle('Garden View', { exact: true }).click({ force: true })
    await page.waitForTimeout(1000)

    const dreamToggle = page.getByTestId('garden-tool-dream-toggle')
    await dreamToggle.click({ force: true })
    const panel = page.getByTestId('garden-tool-dream-panel')
    await panel.waitFor({ state: 'visible', timeout: 10_000 })
    await page.getByRole('heading', { name: 'Dream a plant' }).waitFor({ state: 'visible' })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: resolve(outDir, `${prefix}-dream-plant-panel-${label}.png`) })

    const weekly = panel.getByText('Plant of the week', { exact: true })
    await weekly.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const box = await panel.boundingBox()
    if (box) {
      await page.screenshot({
        path: resolve(outDir, `${prefix}-plant-of-the-week-${label}.png`),
        clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 320) },
      })
    }

    await page.close()
    await context.close()
  }
} finally {
  await browser.close()
}

console.log('Screenshots written to', outDir)
