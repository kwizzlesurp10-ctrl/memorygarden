import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
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

const demoUser = {
  id: '11111111-1111-4111-8111-111111111111',
  login: 'stage-demo',
  avatarUrl: '',
}

const memories = STAGES.map((stage, i) => ({
  id: `stage-tree-${stage}`,
  photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  text: `Tree at ${stage}`,
  date: '2025-06-01',
  plantedAt: '2025-06-01T12:00:00.000Z',
  position: { x: 180 + i * 110, y: 450 },
  emotionalTone: 'peaceful',
  plantStage: stage,
  plantVariety: 'tree',
  visitCount: 5,
  reflections: [],
  audioRecordings: [],
  geneticsSeed: `stage-${stage}`,
}))

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript(({ user, memories: seeded }) => {
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
  }, { user: demoUser, memories })
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  }
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.waitForTimeout(1200)
  await page.locator('[data-testid="open-world-garden"] canvas').first().waitFor({ state: 'visible', timeout: 30_000 })
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.showcaseModel?.(null)
    window.__mgWalkCapture?.setPose?.({ x: 2, z: 18, yaw: 3.14, pitch: -0.22 })
  })
  await page.waitForTimeout(2200)
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({
    path: resolve(outDir, 'after-3d-tree-stages-row-dusk.png'),
  })
  await context.close()
} finally {
  await browser.close()
}

console.log('Stage row artifact in', outDir)
