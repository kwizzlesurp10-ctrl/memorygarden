import { mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const phase = process.env.PHASE || 'after'
const prefix = phase === 'before' ? 'before' : 'after'
const storeRoot = resolve('/cursor/stores/self', '2d-framing-newgarden-r5')
const outDir = process.env.ARTIFACT_DIR || resolve(storeRoot, phase)

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: '11111111-1111-4111-8111-111111111111',
  login: 'framing-edge-demo',
  avatarUrl: '',
}

const photo =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const preferences = {
  hasCompletedOnboarding: true,
  soundEnabled: false,
  lastVisit: new Date().toISOString(),
}

const TAB_RADIO_LABEL = {
  pond: 'Pond view',
  lakeside: 'Lakeside',
  meadow: 'Meadow',
  garden_path: 'Garden path',
}

/** Plants on both horizontal extremes + tall elders near edges. */
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

const headerViewports = [
  { label: '1024x900', width: 1024, height: 900 },
  { label: '1280x900', width: 1280, height: 900 },
  { label: '1366x900', width: 1366, height: 900 },
]

const landscapes = ['pond', 'lakeside', 'meadow', 'garden_path']
const legacyMain = process.env.CAPTURE_LEGACY === '1'

async function prepareContext(browser, vp) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  })
  await context.addInitScript(
    ({ user, mems, prefs, legacy }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      if (legacy) {
        localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(mems))
      } else {
        localStorage.setItem(`memorygarden:${user.id}:garden:default:memories`, JSON.stringify(mems))
        localStorage.setItem(
          `memorygarden:${user.id}:personal-gardens`,
          JSON.stringify({
            v: 1,
            activeGardenId: 'default',
            gardens: [{ id: 'default', name: 'My Garden', createdAt: new Date().toISOString() }],
          }),
        )
      }
      localStorage.setItem(`memorygarden:${user.id}:preferences`, JSON.stringify(prefs))
    },
    { user: demoUser, mems: memories, prefs: preferences, legacy: legacyMain },
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

async function assertSkyCoversViewBox(page) {
  const err = await page.evaluate(() => {
    const svg = document.querySelector('.garden-scene-svg')
    if (!svg) return 'garden svg missing'
    const vb = svg.viewBox.baseVal
    const skyRect = svg.querySelector('[data-layer="sky"] rect')
    if (!skyRect) return 'sky backdrop rect missing'
    const sx = skyRect.x.baseVal.value
    const sw = skyRect.width.baseVal.value
    const margin = 0.5
    if (sx > vb.x + margin) return `sky starts late (${sx} > ${vb.x})`
    if (sx + sw < vb.x + vb.width - margin) {
      return `sky ends early (${sx + sw} < ${vb.x + vb.width})`
    }
    return null
  })
  if (err) {
    throw new Error(`Capture assert failed: sky slab risk — ${err}`)
  }
}

async function assertCaptureReady(page) {
  const prefsRaw = await page.evaluate((userId) => {
    return localStorage.getItem(`memorygarden:${userId}:preferences`)
  }, demoUser.id)
  if (!prefsRaw) {
    throw new Error('Capture assert failed: profile preferences key missing')
  }
  const prefs = JSON.parse(prefsRaw)
  if (prefs.hasCompletedOnboarding !== true) {
    throw new Error('Capture assert failed: hasCompletedOnboarding is not true')
  }
  const onboarding = page.getByTestId('onboarding-dialog')
  if (await onboarding.isVisible().catch(() => false)) {
    throw new Error('Capture assert failed: onboarding dialog is open')
  }
  const welcome = page.getByText('Welcome to MemoryGarden')
  if (await welcome.isVisible().catch(() => false)) {
    throw new Error('Capture assert failed: onboarding welcome copy visible')
  }
  const overlay = page.locator('[data-slot="dialog-overlay"]')
  if (await overlay.isVisible().catch(() => false)) {
    throw new Error('Capture assert failed: dialog overlay is visible')
  }
}

async function gotoGarden(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(80)
  }
  await page.getByTestId('garden-scene-wrap').waitFor({ state: 'visible', timeout: 30_000 })
  await assertCaptureReady(page)
}

async function selectLandscapeTab(page, view) {
  const label = TAB_RADIO_LABEL[view]
  const tab = page.getByRole('radio', { name: label, exact: true })
  await tab.waitFor({ state: 'visible', timeout: 15_000 })
  await tab.click()
  if (legacyMain) {
    await page.waitForTimeout(500)
  } else {
    await page.waitForFunction(
      (v) => document.querySelector('[data-landscape-view]')?.getAttribute('data-landscape-view') === v,
      view,
      { timeout: 15_000 },
    )
  }
  const checked = await tab.getAttribute('aria-checked')
  if (checked !== 'true') {
    throw new Error(`Capture assert failed: tab "${label}" aria-checked is ${checked}`)
  }
  await page.waitForTimeout(450)
}

async function composeLandscapeRow(browser, vp, dir, rowPrefix, title) {
  const b64s = landscapes.map((view) => {
    const file = resolve(dir, `${rowPrefix}-${view}-${vp.label}.png`)
    return readFileSync(file).toString('base64')
  })
  const page = await browser.newPage({
    viewport: { width: vp.width * landscapes.length, height: vp.height + 56 },
  })
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#111">
    <p style="margin:8px 12px;color:#f0e7da;font:12px system-ui">${title} · ${landscapes.join(' · ')} @ ${vp.label}</p>
    <div style="display:flex;flex-direction:row">${b64s
      .map(
        (b, i) =>
          `<figure style="margin:0"><figcaption style="color:#ccc;font:11px system-ui;padding:4px 8px">${landscapes[i]}</figcaption><img src="data:image/png;base64,${b}" width="${vp.width}" height="${vp.height}" style="display:block" /></figure>`,
      )
      .join('')}</div></body></html>`)
  await page.screenshot({
    path: resolve(dir, `${rowPrefix}-compare-all-landscapes-${vp.label}.png`),
    fullPage: true,
  })
  await page.close()
}

async function composeBeforeAfterCompare(browser, vp, beforeDir, afterDir) {
  const rows = [
    { prefix: 'before', dir: beforeDir, title: 'before (main)' },
    { prefix: 'after', dir: afterDir, title: 'after (branch)' },
  ]
  const imgs = rows.flatMap(({ prefix, dir }) =>
    landscapes.map((view) => ({
      prefix,
      view,
      b64: readFileSync(resolve(dir, `${prefix}-${view}-${vp.label}.png`)).toString('base64'),
    })),
  )
  const page = await browser.newPage({
    viewport: { width: vp.width * landscapes.length, height: (vp.height + 40) * 2 + 24 },
  })
  const rowHtml = rows
    .map(({ prefix, title }) => {
      const cells = landscapes
        .map((view) => {
          const shot = imgs.find((i) => i.prefix === prefix && i.view === view)
          return `<img src="data:image/png;base64,${shot.b64}" width="${vp.width}" height="${vp.height}" style="display:block" />`
        })
        .join('')
      return `<div><p style="margin:6px 10px;color:#f0e7da;font:12px system-ui">${title}</p><div style="display:flex">${cells}</div></div>`
    })
    .join('')
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#111">${rowHtml}</body></html>`)
  await page.screenshot({
    path: resolve(afterDir, `compare-before-after-landscapes-${vp.label}.png`),
    fullPage: true,
  })
  await page.close()
}

const browser = await chromium.launch({ headless: true })
try {
  for (const vp of proofViewports) {
    const context = await prepareContext(browser, vp)
    const page = await context.newPage()
    await gotoGarden(page)

    for (const view of landscapes) {
      await selectLandscapeTab(page, view)
      await assertCaptureReady(page)
      if (!legacyMain) {
        await assertSkyCoversViewBox(page)
      }
      await page.screenshot({
        path: resolve(outDir, `${prefix}-${view}-${vp.label}.png`),
      })
    }

    if (vp.label === '1440x900' || vp.label === '390x844') {
      await composeLandscapeRow(browser, vp, outDir, prefix, prefix)
    }
    await context.close()
  }

  if (!legacyMain) {
    for (const vp of headerViewports) {
      const context = await prepareContext(browser, vp)
      const page = await context.newPage()
      await gotoGarden(page)
      const switcherCount = await page.getByTestId('personal-garden-switcher').count()
      if (switcherCount !== 1) {
        throw new Error(`Capture assert failed: expected 1 personal garden switcher at ${vp.label}, got ${switcherCount}`)
      }
      await page.screenshot({
        path: resolve(outDir, `${prefix}-header-${vp.label}.png`),
        fullPage: false,
      })
      await context.close()
    }
  }

  const uiContext = await prepareContext(browser, { width: 1440, height: 900 })
  const uiPage = await uiContext.newPage()
  await gotoGarden(uiPage)

  if (!legacyMain) {
    await uiPage.getByRole('button', { name: 'Open menu' }).click()
    await uiPage.waitForTimeout(200)
    await assertCaptureReady(uiPage)
    await uiPage.screenshot({ path: resolve(outDir, `${prefix}-profile-menu-new-garden.png`) })

    await uiPage.getByRole('menuitem', { name: /start new garden/i }).click()
    await uiPage.waitForTimeout(250)
    await assertCaptureReady(uiPage)
    await uiPage.screenshot({ path: resolve(outDir, `${prefix}-start-new-garden-confirm.png`) })

    await uiPage.getByTestId('start-new-garden-confirm').click()
    await uiPage.locator('[data-slot="dialog-overlay"]').waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {})
    await uiPage.waitForTimeout(500)
    await uiPage.screenshot({ path: resolve(outDir, `${prefix}-empty-new-garden.png`) })

    for (let i = 0; i < 8; i++) {
      await uiPage.keyboard.press('Escape')
      await uiPage.waitForTimeout(120)
    }
    await uiPage.locator('[data-slot="dialog-overlay"]').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    await assertCaptureReady(uiPage)
    await uiPage.getByTestId('personal-garden-switcher').click({ timeout: 15_000 })
    await uiPage.waitForTimeout(300)
    await assertCaptureReady(uiPage)
    await uiPage.screenshot({ path: resolve(outDir, `${prefix}-garden-switcher-open.png`) })

    await uiPage.evaluate(
      ({ userId }) => {
        const raw = localStorage.getItem(`memorygarden:${userId}:personal-gardens`)
        const reg = raw ? JSON.parse(raw) : { v: 1, activeGardenId: 'default', gardens: [] }
        reg.activeGardenId = 'default'
        localStorage.setItem(`memorygarden:${userId}:personal-gardens`, JSON.stringify(reg))
      },
      { userId: demoUser.id },
    )
    await uiPage.reload({ waitUntil: 'networkidle' })
    await gotoGarden(uiPage)
    await uiPage.getByText('Far west elder').waitFor({ state: 'visible', timeout: 20_000 })
    await assertCaptureReady(uiPage)
    await uiPage.screenshot({ path: resolve(outDir, `${prefix}-restored-original-garden.png`) })
  }
  await uiContext.close()

  if (phase === 'after') {
    const beforeDir = resolve(storeRoot, 'before')
    for (const vp of [
      { label: '1440x900', width: 1440, height: 900 },
      { label: '390x844', width: 390, height: 844 },
    ]) {
      try {
        await composeBeforeAfterCompare(browser, vp, beforeDir, outDir)
      } catch (err) {
        console.warn('Skipping before/after compare (missing before shots?):', err.message)
      }
    }
  }
} finally {
  await browser.close()
}

console.log('Saved screenshots to', outDir)