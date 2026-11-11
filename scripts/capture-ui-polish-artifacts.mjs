import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const prefix = process.env.SCREENSHOT_PREFIX || 'after'

mkdirSync(outDir, { recursive: true })

const prefs = { hasCompletedOnboarding: true, gardenLandscapeView: 'pond' }
const demoUser = {
  id: '11111111-1111-4111-8111-111111111111',
  login: 'tree-stage-demo',
  avatarUrl: '',
}
const stages = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder']
const memories = stages.map((plantStage, i) => ({
  id: `tree-stage-${plantStage}`,
  photoUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  text: `Tree at ${plantStage}`,
  date: '2025-06-01',
  plantedAt: '2025-06-01T12:00:00.000Z',
  position: { x: 140 + i * 128, y: 442 },
  emotionalTone: 'peaceful',
  plantStage,
  plantVariety: 'tree',
  visitCount: 4,
  reflections: [],
  audioRecordings: [],
}))

const viewports = [
  { label: 'desktop-1440', width: 1440, height: 900 },
  { label: 'mobile-390', width: 390, height: 844 },
  { label: 'mobile-360', width: 360, height: 780 },
]

const browser = await chromium.launch({ headless: true })
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce',
      colorScheme: 'dark',
    })
    const page = await context.newPage()
    await page.route('**/api/**', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    })
    await page.addInitScript(
      ({ user, mems, p }) => {
        localStorage.setItem('memorygarden:user', JSON.stringify(user))
        localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(mems))
        localStorage.setItem('memorygarden:preferences', JSON.stringify(p))
      },
      { user: demoUser, mems: memories, p: prefs },
    )
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(80)
    }
    await page.getByTestId('garden-scene-wrap').waitFor({ state: 'visible', timeout: 30_000 })

    await page.screenshot({
      path: resolve(outDir, `${prefix}-fix-plant-shadows-stages-pond-${vp.label}.png`),
    })

    const picker = page.locator('[aria-label="Garden landscape view"]')
  await picker.screenshot({
    path: resolve(outDir, `${prefix}-fix-view-picker-contrast-${vp.label}.png`),
  })

    const firstPlant = page.locator('[data-memory-id="tree-stage-bloom"]')
    await firstPlant.focus()
    await page.waitForTimeout(200)
    await page.screenshot({
      path: resolve(outDir, `${prefix}-fix-plant-focus-ring-${vp.label}.png`),
    })

    await context.close()
  }
} finally {
  await browser.close()
}

console.log('UI polish artifacts written to', outDir)
