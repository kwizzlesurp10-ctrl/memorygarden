import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, devices } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const prefix = process.env.SCREENSHOT_PREFIX || 'after'
mkdirSync(outDir, { recursive: true })

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

async function prepareContext(browser, viewport, fakeHour) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  })
  const demoUser = {
    id: '11111111-1111-4111-8111-111111111111',
    login: 'demo-gardener',
    avatarUrl: '',
  }
  await context.addInitScript(
    ({ memories, hour, user }) => {
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
    { memories: seedMemories, hour: fakeHour, user: demoUser },
  )
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  return context
}

async function enterWalk(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
  }
  await page.getByRole('tab', { name: /Walk/i }).click({ timeout: 15_000 })
  await page.waitForTimeout(800)
  await page.waitForFunction(() => window.__cc0SceneryReady === true, { timeout: 45_000 }).catch(() => {})
  await page.waitForTimeout(2500)
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
      await page.screenshot({
        path: resolve(outDir, `${prefix}-cc0-garden-walk-${label}-${suffix}.png`),
        fullPage: false,
      })
      await ctx.close()
    }
  }

  const turntableCtx = await prepareContext(browser, { width: 1400, height: 520 }, 19.5)
  const turntablePage = await turntableCtx.newPage()
  await enterWalk(turntablePage)
  await turntablePage.evaluate(() => {
    const cvs = document.querySelector('canvas')
    if (cvs?.parentElement) {
      cvs.parentElement.scrollIntoView()
    }
  })
  await turntablePage.screenshot({ path: resolve(outDir, `${prefix}-cc0-tinted-models-closeup.png`) })
  await turntableCtx.close()
} finally {
  await browser.close()
}

writeFileSync(resolve(outDir, 'cc0-capture-readme.txt'), `Captured from ${baseUrl}\n`, 'utf8')
console.log('Artifacts in', outDir)
