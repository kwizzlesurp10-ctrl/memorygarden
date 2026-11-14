/**
 * Pond close-up: watercolor vs pixel-art, before/after URLs, optional night clock.
 * Env: AFTER_URL, BEFORE_URL, ARTIFACT_DIR, PHASE=both|before|after, NIGHT=1
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const phaseMode = process.env.PHASE || 'both'
const night = process.env.NIGHT === '1'

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'walk-pond-closeup',
  avatarUrl: '',
}

const memories = [
  {
    id: 'tree-elder-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Elder oak',
    date: '2025-06-01',
    plantedAt: '2025-06-02T12:00:00.000Z',
    position: { x: 455, y: 400 },
    emotionalTone: 'peaceful',
    plantStage: 'elder',
    plantVariety: 'tree',
    visitCount: 6,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-tree-elder',
  },
]

const seedPayload = { user: demoUser, memories }

async function waitWalk(page) {
  await page.waitForFunction(
    () =>
      typeof window.__mgWalkSceneReady === 'function' && window.__mgWalkSceneReady() === true,
    undefined,
    { timeout: 120_000 },
  )
  await page.waitForTimeout(600)
}

async function resolvePondPose(page) {
  return page.evaluate(() => {
    if (typeof window.__mgWalkCapture?.pondCloseupPose === 'function') {
      return window.__mgWalkCapture.pondCloseupPose()
    }
    const camX = 1.4
    const camZ = 8.25
    const foot = window.__mgWalkFootAt?.(camX, camZ) ?? 0
    const eyeY = foot + 1.52
    const yaw = Math.atan2(0 - camX, -5.5 - camZ)
    return { x: camX, z: camZ, yaw, pitch: -0.24, eyeY }
  })
}

async function enterWalk(page) {
  const enterBtn = page.getByTestId('enter-walk-button')
  if (await enterBtn.isVisible().catch(() => false)) {
    await enterBtn.click({ timeout: 30_000 })
  } else {
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="enter-walk-button"]')
      if (btn instanceof HTMLElement) btn.click()
    })
  }
  await waitWalk(page)
}

async function captureRun(browser, url, phase, artStyle) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addInitScript((payload) => {
    const { user, memories: mems, artStyle: style, night: isNight } = payload
    localStorage.setItem('memorygarden:user', JSON.stringify(user))
    localStorage.setItem(
      `memorygarden:${user.id}:preferences`,
      JSON.stringify({
        hasCompletedOnboarding: true,
        plantStylePreference: { artStyle: style },
      }),
    )
    localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(mems))
    sessionStorage.setItem('mg:walk-plant-focus', '1')
    sessionStorage.setItem('mg:walk-capture', '1')
    const OriginalDate = Date
    const y = 2026
    const m = 5
    const d = 15
    const h = isNight ? 22 : 14
    const min = isNight ? 30 : 30
    // eslint-disable-next-line no-global-assign
    Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(y, m, d, h, min, 0)
        else super(...args)
      }
      static now() {
        return new OriginalDate(y, m, d, h, min, 0).getTime()
      }
    }
  }, { ...seedPayload, artStyle, night })
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  const pose = await resolvePondPose(page)
  if (!pose) throw new Error(`No pond pose at ${url}`)
  await page.evaluate((p) => {
    if (window.__mgWalkCapture?.setPose) window.__mgWalkCapture.setPose(p)
    else window.__mgWalkNudgePose?.(p)
  }, pose)
  await page.waitForTimeout(700)
  const tag = night ? 'night' : 'dusk'
  const file = resolve(
    outDir,
    `walk-pond-${phase}-${artStyle === 'pixel-art' ? 'pixel-art' : 'watercolor'}-${tag}-desktop.png`,
  )
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
  console.log('Wrote', file)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  const phases =
    phaseMode === 'both'
      ? [
          { phase: 'before', url: beforeUrl },
          { phase: 'after', url: afterUrl },
        ]
      : phaseMode === 'before'
        ? [{ phase: 'before', url: beforeUrl }]
        : [{ phase: 'after', url: afterUrl }]

  for (const { phase, url } of phases) {
    for (const artStyle of ['watercolor', 'pixel-art']) {
      await captureRun(browser, url, phase, artStyle)
    }
  }
} finally {
  await browser.close()
}