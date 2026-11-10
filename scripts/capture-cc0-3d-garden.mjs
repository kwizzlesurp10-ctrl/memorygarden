import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, devices } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const prefix = process.env.SCREENSHOT_PREFIX || 'after'
const baseline = process.env.WALK_CAPTURE_BASELINE === '1'
mkdirSync(outDir, { recursive: true })

const WALK_CAPTURE_POSE = { x: 1.2, z: 34.5, yaw: 0, pitch: -0.12 }

const seedMemories = [
  {
    id: 'cc0-demo-1',
    photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Rosemary by the gate in the cool evening air.',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 420, y: 440 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
  },
  {
    id: 'cc0-demo-2',
    photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Grandmother’s elder tree at lakeside dusk.',
    date: '2024-11-02',
    plantedAt: '2024-11-02T18:30:00.000Z',
    position: { x: 680, y: 460 },
    emotionalTone: 'nostalgic',
    plantStage: 'mature',
    plantVariety: 'tree',
    visitCount: 12,
    reflections: [],
    audioRecordings: [],
  },
]

const demoUser = {
  id: '11111111-1111-4111-8111-111111111111',
  login: 'demo-gardener',
  avatarUrl: '',
}

async function prepareContext(browser, viewport, fakeHour) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  })
  await context.addInitScript(
    ({ memories, hour, user, baselineCapture }) => {
      sessionStorage.setItem('mg:walk-capture', '1')
      if (baselineCapture) sessionStorage.setItem('mg:walk-capture-baseline', '1')
      localStorage.setItem('memorygarden:preferences', JSON.stringify({ hasCompletedOnboarding: true }))
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(memories))
      const OriginalDate = Date
      // eslint-disable-next-line no-global-assign
      Date = class extends OriginalDate {
        constructor(...args) {
          if (args.length === 0) {
            super(2026, 5, 15, hour, 30, 0)
          } else {
            super(...args)
          }
        }
        static now() {
          return new OriginalDate(2026, 5, 15, hour, 30, 0).getTime()
        }
      }
    },
    { memories: seedMemories, hour: fakeHour, user: demoUser, baselineCapture: baseline },
  )
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  return context
}

async function applyCaptureFraming(page) {
  await page.waitForFunction(() => window.__mgWalkCapture?.ready?.(), { timeout: 60_000 }).catch(() => {})
  if (prefix === 'after' && !baseline) {
    await page.waitForFunction(() => window.__cc0SceneryReady === true, { timeout: 60_000 }).catch(() => {})
    await page.evaluate(async () => {
      await window.__mgWalkCapture?.showcaseModel(null)
    })
  }
  await page.evaluate(
    ({ pose }) => {
      window.__mgWalkCapture?.setPose(pose)
    },
    { pose: WALK_CAPTURE_POSE },
  )
  await page.waitForTimeout(2200)
}

async function enterWalk(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(120)
  }
  await page.getByRole('tab', { name: /Walk/i }).click({ timeout: 15_000 })
  await page.waitForTimeout(600)
}

const browser = await chromium.launch({ headless: true })
try {
  for (const { label, viewport } of [
    { label: 'desktop', viewport: { width: 1280, height: 800 } },
    { label: 'mobile', viewport: devices['iPhone 13'].viewport },
  ]) {
    for (const { tod, suffix } of [
      { tod: 14, suffix: 'day' },
      { tod: 19.5, suffix: 'dusk' },
    ]) {
      const ctx = await prepareContext(browser, viewport, tod)
      const page = await ctx.newPage()
      await enterWalk(page)
      await applyCaptureFraming(page)
      const canvas = page.locator('[data-testid="open-world-garden"] > canvas')
      await canvas.screenshot({
        path: resolve(outDir, `${prefix}-cc0-garden-walk-${label}-${suffix}.png`),
      })
      await ctx.close()
    }
  }
} finally {
  await browser.close()
}

writeFileSync(
  resolve(outDir, 'cc0-capture-readme.txt'),
  `Captured from ${baseUrl}\nPose: ${JSON.stringify(WALK_CAPTURE_POSE)}\nPrefix: ${prefix}\n`,
  'utf8',
)
console.log('Walk artifacts in', outDir)
