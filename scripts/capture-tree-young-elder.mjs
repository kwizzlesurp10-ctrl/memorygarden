import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const prefix = process.env.SCREENSHOT_PREFIX || 'parity'
mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: '11111111-1111-4111-8111-111111111111',
  login: 'tree-scale-demo',
  avatarUrl: '',
}

const memories = [
  {
    id: 'tree-young-pair',
    photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Young maple in the grove.',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 320, y: 450 },
    emotionalTone: 'peaceful',
    plantStage: 'young',
    plantVariety: 'tree',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'young-scale-pair',
  },
  {
    id: 'tree-elder-pair',
    photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Elder oak by the path.',
    date: '2020-06-01',
    plantedAt: '2020-06-01T12:00:00.000Z',
    position: { x: 680, y: 450 },
    emotionalTone: 'nostalgic',
    plantStage: 'elder',
    plantVariety: 'tree',
    visitCount: 42,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'elder-scale-pair',
  },
]

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'dark',
  })
  await context.addInitScript(({ user, seeded }) => {
    sessionStorage.setItem('mg:tree-young-elder-capture', '1')
    sessionStorage.setItem('mg:walk-capture', '1')
    localStorage.setItem('memorygarden:user', JSON.stringify(user))
    localStorage.setItem(`memorygarden:${user.id}:preferences`, JSON.stringify({ hasCompletedOnboarding: true }))
    localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
    const OriginalDate = Date
    // eslint-disable-next-line no-global-assign
    Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(2026, 5, 15, 19.5, 30, 0)
        else super(...args)
      }
      static now() {
        return new OriginalDate(2026, 5, 15, 19.5, 30, 0).getTime()
      }
    }
  }, { user: demoUser, seeded: memories })
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  }
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.waitForTimeout(1600)
  await page.locator('[data-testid="open-world-garden"] canvas').first().waitFor({ state: 'visible', timeout: 45_000 })
  await page.waitForTimeout(2800)
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({
    path: resolve(outDir, `${prefix}-tree-young-elder-side-by-side-dusk.png`),
  })
  await context.close()
} finally {
  await browser.close()
}

console.log('Young vs elder tree artifact in', outDir)
