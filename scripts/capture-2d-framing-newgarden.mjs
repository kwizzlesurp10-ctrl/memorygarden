import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir =
  process.env.ARTIFACT_DIR ||
  resolve('/cursor/stores/self', '2d-framing-newgarden', process.env.PHASE || 'after')
const prefix = process.env.SCREENSHOT_PREFIX || process.env.PHASE || 'after'

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: '11111111-1111-4111-8111-111111111111',
  login: 'framing-demo',
  avatarUrl: '',
}

const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const memories = [
  {
    id: 'west-tree',
    photoUrl: photo,
    text: 'West grove',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 148, y: 444 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'tree',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
  },
  {
    id: 'center-flwr',
    photoUrl: photo,
    text: 'Center',
    date: '2025-06-02',
    plantedAt: '2025-06-02T12:00:00.000Z',
    position: { x: 600, y: 450 },
    emotionalTone: 'happy',
    plantStage: 'mature',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
  },
  {
    id: 'east-tree',
    photoUrl: photo,
    text: 'East grove',
    date: '2025-06-03',
    plantedAt: '2025-06-03T12:00:00.000Z',
    position: { x: 1040, y: 442 },
    emotionalTone: 'nostalgic',
    plantStage: 'elder',
    plantVariety: 'tree',
    visitCount: 4,
    reflections: [],
    audioRecordings: [],
  },
]

const viewports = [
  { label: '1440x900', width: 1440, height: 900 },
  { label: '1280x800', width: 1280, height: 800 },
  { label: '1920x1080', width: 1920, height: 1080 },
  { label: '1024x768', width: 1024, height: 768 },
  { label: '390x844', width: 390, height: 844 },
  { label: '360x780', width: 360, height: 780 },
  { label: '1366x650', width: 1366, height: 650 },
]

const landscapes = ['pond', 'lakeside', 'meadow', 'garden_path']

async function prepareContext(browser, vp) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  })
  await context.addInitScript(
    ({ user, mems }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(`memorygarden:${user.id}:garden:default:memories`, JSON.stringify(mems))
      localStorage.setItem(
        `memorygarden:${user.id}:personal-gardens`,
        JSON.stringify({
          v: 1,
          activeGardenId: 'default',
          gardens: [{ id: 'default', name: 'My Garden', createdAt: new Date().toISOString() }],
        }),
      )
      localStorage.setItem(
        `memorygarden:${user.id}:preferences`,
        JSON.stringify({
          hasCompletedOnboarding: true,
          soundEnabled: false,
          lastVisit: new Date().toISOString(),
          gardenLandscapeView: 'pond',
        }),
      )
    },
    { user: demoUser, mems: memories },
  )
  await context.route('**/api/llm**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'offline' }) })
  })
  await context.route('**/api/gardens**', async (route) => {
    const req = route.request()
    if (req.method() === 'GET' && !req.url().includes('id=')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ gardens: [] }) })
      return
    }
    await route.continue()
  })
  return context
}

async function dismissChrome(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  }
  await page.locator('[data-slot="dialog-overlay"]').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
}

const browser = await chromium.launch({ headless: true })
try {
  for (const vp of viewports) {
    const context = await prepareContext(browser, vp)
    const page = await context.newPage()
    await dismissChrome(page)
    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Garden View"]')
      if (btn instanceof HTMLElement) btn.click()
    })
    await page.waitForTimeout(600)

    for (const view of landscapes) {
      await page.evaluate(
        ({ user, v }) => {
          const raw = localStorage.getItem(`memorygarden:${user.id}:preferences`)
          const prefs = raw ? JSON.parse(raw) : {}
          prefs.gardenLandscapeView = v
          localStorage.setItem(`memorygarden:${user.id}:preferences`, JSON.stringify(prefs))
        },
        { user: demoUser, v: view },
      )
      await page.reload({ waitUntil: 'networkidle' })
      await dismissChrome(page)
      await page.getByTestId('garden-scene-wrap').waitFor({ state: 'visible', timeout: 30_000 })
      await page.waitForTimeout(500)
      await page.screenshot({
        path: resolve(outDir, `${prefix}-${view}-${vp.label}.png`),
        fullPage: false,
      })
    }
    await context.close()
  }

  if (process.env.CAPTURE_NEW_GARDEN_UI === '1') {
    const context = await prepareContext(browser, { width: 1440, height: 900 })
    const page = await context.newPage()
    await dismissChrome(page)
    await page.getByTestId('garden-scene-wrap').waitFor({ state: 'visible', timeout: 30_000 })
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: resolve(outDir, `${prefix}-profile-menu-new-garden.png`) })
    const startItem = page.getByRole('menuitem', { name: /start new garden/i })
    if (await startItem.isVisible()) {
      await startItem.click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: resolve(outDir, `${prefix}-start-new-garden-confirm.png`) })
      await page.getByRole('button', { name: /start fresh garden/i }).click()
      await page.waitForTimeout(800)
      await page.screenshot({ path: resolve(outDir, `${prefix}-empty-new-garden.png`) })
      const switcher = page.getByTestId('personal-garden-switcher')
      if (await switcher.isVisible()) {
        await switcher.click()
        await page.waitForTimeout(200)
        await page.screenshot({ path: resolve(outDir, `${prefix}-garden-switcher.png`) })
        const original = page.getByRole('menuitem', { name: /My Garden|Original|default/i }).first()
        if (await original.isVisible()) await original.click()
        await page.waitForTimeout(800)
        await page.screenshot({ path: resolve(outDir, `${prefix}-switched-back-original.png`) })
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
}

console.log('Saved screenshots to', outDir)