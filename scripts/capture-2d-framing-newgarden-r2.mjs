import { mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const phase = process.env.PHASE || 'after'
const outDir =
  process.env.ARTIFACT_DIR ||
  resolve('/cursor/stores/self', `2d-framing-newgarden-r2/${phase}`)
const prefix = process.env.SCREENSHOT_PREFIX || phase

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: '11111111-1111-4111-8111-111111111111',
  login: 'framing-edge-demo',
  avatarUrl: '',
}

const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** Spread trees on both horizontal extremes + tall elder on east edge for visible crop/fit proof. */
const memories = [
  {
    id: 'far-west',
    photoUrl: photo,
    text: 'Far west elder',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 108, y: 444 },
    emotionalTone: 'peaceful',
    plantStage: 'elder',
    plantVariety: 'tree',
    visitCount: 4,
    reflections: [],
    audioRecordings: [],
  },
  {
    id: 'west-bloom',
    photoUrl: photo,
    text: 'West bloom',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 168, y: 446 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'tree',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
  },
  {
    id: 'center',
    photoUrl: photo,
    text: 'Center memory',
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
    id: 'east-bloom',
    photoUrl: photo,
    text: 'East bloom',
    date: '2025-06-03',
    plantedAt: '2025-06-03T12:00:00.000Z',
    position: { x: 1020, y: 442 },
    emotionalTone: 'nostalgic',
    plantStage: 'bloom',
    plantVariety: 'tree',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
  },
  {
    id: 'far-east-elder',
    photoUrl: photo,
    text: 'Far east elder',
    date: '2025-06-04',
    plantedAt: '2025-06-04T12:00:00.000Z',
    position: { x: 1090, y: 444 },
    emotionalTone: 'nostalgic',
    plantStage: 'elder',
    plantVariety: 'tree',
    visitCount: 5,
    reflections: [],
    audioRecordings: [],
  },
]

const proofViewports = [
  { label: '1920x1080', width: 1920, height: 1080 },
  { label: '1366x650', width: 1366, height: 650 },
  { label: '1440x900', width: 1440, height: 900 },
  { label: '390x844', width: 390, height: 844 },
  { label: '360x780', width: 360, height: 780 },
]

const landscapes = ['pond', 'lakeside', 'meadow', 'garden_path']

function seedStorage(user, mems) {
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
}

async function prepareContext(browser, vp) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  })
  await context.addInitScript(
    ({ user, mems, seed }) => {
      seed(user, mems)
    },
    { user: demoUser, mems: memories, seed: seedStorage },
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

async function composeLandscapeCompare(browser, vp, dir, shotPrefix) {
  const b64s = landscapes.map((view) => {
    const file = resolve(dir, `${shotPrefix}-${view}-${vp.label}.png`)
    return readFileSync(file).toString('base64')
  })
  const page = await browser.newPage({
    viewport: { width: vp.width * landscapes.length, height: vp.height + 48 },
  })
  const labels = landscapes.join(' · ')
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#111">
    <p style="margin:8px 12px;color:#f0e7da;font:12px system-ui">${labels} @ ${vp.label}</p>
    <div style="display:flex;flex-direction:row">${b64s
      .map(
        (b, i) =>
          `<figure style="margin:0"><figcaption style="color:#ccc;font:11px system-ui;padding:4px 8px">${landscapes[i]}</figcaption><img src="data:image/png;base64,${b}" width="${vp.width}" height="${vp.height}" style="display:block" /></figure>`,
      )
      .join('')}</div></body></html>`)
  await page.screenshot({
    path: resolve(dir, `${shotPrefix}-compare-all-landscapes-${vp.label}.png`),
    fullPage: true,
  })
  await page.close()
}

async function dismissChrome(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  }
  await page.locator('[data-slot="dialog-overlay"]').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  await page.getByRole('button', { name: 'Garden View', exact: true }).click({ timeout: 15_000 }).catch(() => {})
}

const browser = await chromium.launch({ headless: true })
try {
  for (const vp of proofViewports) {
    const context = await prepareContext(browser, vp)
    const page = await context.newPage()
    await dismissChrome(page)

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
      await page.waitForTimeout(600)
      await page.screenshot({
        path: resolve(outDir, `${prefix}-${view}-${vp.label}.png`),
      })
    }
    if (vp.label === '1440x900' || vp.label === '390x844') {
      await composeLandscapeCompare(browser, vp, outDir, prefix)
    }
    await context.close()
  }

  if (process.env.CAPTURE_NEW_GARDEN_UI === '1') {
    const context = await prepareContext(browser, { width: 1440, height: 900 })
    const page = await context.newPage()
    await dismissChrome(page)
    await page.getByTestId('garden-scene-wrap').waitFor({ state: 'visible', timeout: 30_000 })

    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.waitForTimeout(250)
    await page.screenshot({ path: resolve(outDir, `${prefix}-profile-menu-new-garden.png`) })
    await page.getByRole('menuitem', { name: /start new garden/i }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: resolve(outDir, `${prefix}-start-new-garden-confirm.png`) })
    await page.getByTestId('start-new-garden-confirm').click()
    await page.locator('[data-slot="dialog-overlay"]').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)
    await page.screenshot({ path: resolve(outDir, `${prefix}-empty-new-garden.png`) })

    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    await page.getByTestId('personal-garden-switcher').click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: resolve(outDir, `${prefix}-garden-switcher-open.png`) })

    const myGardenItem = page.getByRole('menuitem').filter({ hasText: 'My Garden' }).first()
    await myGardenItem.click({ timeout: 15_000 })
    await page.waitForTimeout(1200)
    await page.getByTestId('garden-scene-wrap').waitFor({ state: 'visible', timeout: 15_000 })
    await page.getByText('Far west elder').waitFor({ state: 'visible', timeout: 15_000 })
    await page.screenshot({ path: resolve(outDir, `${prefix}-restored-original-garden.png`) })
    await context.close()
  }
} finally {
  await browser.close()
}

console.log('Saved screenshots to', outDir)