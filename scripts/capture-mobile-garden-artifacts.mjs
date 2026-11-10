import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const prefix = process.env.SCREENSHOT_PREFIX || 'after'

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'mobile-capture',
  avatarUrl: '',
}

const placeholderPhoto =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

function buildEdgeScatterMemories() {
  return [
    {
      id: 'edge-west',
      photoUrl: placeholderPhoto,
      text: 'West edge plant',
      date: '2025-06-01',
      plantedAt: '2025-06-01T12:00:00.000Z',
      position: { x: 148, y: 444 },
      emotionalTone: 'peaceful',
      plantStage: 'bloom',
      plantVariety: 'tree',
      visitCount: 3,
      reflections: [],
      audioRecordings: [],
    },
    {
      id: 'edge-east',
      photoUrl: placeholderPhoto,
      text: 'East edge plant',
      date: '2025-06-01',
      plantedAt: '2025-06-01T12:00:00.000Z',
      position: { x: 1040, y: 442 },
      emotionalTone: 'peaceful',
      plantStage: 'mature',
      plantVariety: 'tree',
      visitCount: 3,
      reflections: [],
      audioRecordings: [],
    },
  ]
}

async function preparePage(context, prefs) {
  const page = await context.newPage()
  await page.addInitScript(
    ({ user, memories, p }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(memories))
      localStorage.setItem(`memorygarden:${user.id}:preferences`, JSON.stringify(p))
    },
    { user: demoUser, memories: buildEdgeScatterMemories(), p: prefs },
  )

  await page.route('**/api/llm**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'offline' }),
    })
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

async function dismissOverlays(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.waitForTimeout(600)
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(120)
  }
  await page.locator('[data-slot="dialog-overlay"]').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {})
  const plantHeading = page.getByRole('heading', { name: 'Plant a Memory' })
  if (await plantHeading.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Cancel' }).click({ timeout: 5000 }).catch(() => {})
    await plantHeading.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {})
  }
}

async function ensureGardenView(page) {
  const gardenNav = page.getByRole('button', { name: 'Garden', exact: true })
  if (await gardenNav.isVisible().catch(() => false)) {
    await gardenNav.click()
    await page.waitForTimeout(400)
  }
  await page.getByTestId('garden-scene-wrap').waitFor({ state: 'visible', timeout: 25_000 })
}

const LANDSCAPE_LABELS = {
  pond: 'Pond view',
  lakeside: 'Lakeside',
  meadow: 'Meadow',
  garden_path: 'Garden path',
}

async function setLandscape(page, view) {
  await page.evaluate(
    ({ v, userId }) => {
      const key = `memorygarden:${userId}:preferences`
      const raw = localStorage.getItem(key)
      const prefs = raw ? JSON.parse(raw) : {}
      prefs.gardenLandscapeView = v
      prefs.hasCompletedOnboarding = true
      localStorage.setItem(key, JSON.stringify(prefs))
    },
    { v: view, userId: demoUser.id },
  )
  await page.reload({ waitUntil: 'networkidle' })
  await dismissOverlays(page)
  await ensureGardenView(page)
  await page
    .getByRole('radio', { name: LANDSCAPE_LABELS[view] })
    .waitFor({ state: 'visible', timeout: 15_000 })
  await page.waitForTimeout(500)
}

const browser = await chromium.launch({ headless: true })

try {
  for (const { label, width } of [
    { label: '390', width: 390 },
    { label: '360', width: 360 },
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      reducedMotion: 'reduce',
      colorScheme: 'dark',
    })
    const page = await preparePage(context, {
      hasCompletedOnboarding: true,
      gardenLandscapeView: 'pond',
      preferredSeason: 'summer',
    })
    await dismissOverlays(page)
    await ensureGardenView(page)

    const plantOpen = await page.getByRole('heading', { name: 'Plant a Memory' }).isVisible().catch(() => false)
    if (plantOpen) {
      throw new Error(`Plant a Memory opened on load at ${width}px — expected closed with seeded memories`)
    }

    await page.screenshot({
      path: resolve(outDir, `${prefix}-mobile-garden-default-${label}x844.png`),
    })

    await setLandscape(page, 'garden_path')
    await page.waitForTimeout(600)
    const pathTab = page.getByRole('radio', { name: 'Garden path' })
    await pathTab.waitFor({ state: 'visible', timeout: 10_000 })
    if ((await pathTab.getAttribute('aria-checked')) !== 'true') {
      await pathTab.evaluate((el) => el.click())
    }
    await page.screenshot({
      path: resolve(outDir, `${prefix}-mobile-garden-path-tab-${label}x844.png`),
    })

    const picker = page.getByRole('radiogroup', { name: 'Garden landscape view' })
    const box = await picker.boundingBox()
    if (box) {
      await page.screenshot({
        path: resolve(outDir, `${prefix}-mobile-garden-tabstrip-crop-${label}x844.png`),
        clip: { x: box.x, y: box.y, width: box.width, height: box.height },
      })
    }

    await setLandscape(page, 'pond')
    await page.waitForTimeout(800)
    await page.screenshot({
      path: resolve(outDir, `${prefix}-mobile-garden-edge-plants-pond-${label}x844.png`),
    })

    await page.getByRole('button', { name: 'Walk', exact: true }).click()
    await page.waitForTimeout(1200)
    await page.getByTestId('open-world-garden').waitFor({ state: 'visible', timeout: 25_000 })
    await page.screenshot({
      path: resolve(outDir, `${prefix}-mobile-walk-bottom-nav-${label}x844.png`),
    })

    await page.close()
    await context.close()
  }
} finally {
  await browser.close()
}

console.log('Mobile garden artifacts written to', outDir)
