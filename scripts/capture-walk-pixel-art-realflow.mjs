/**
 * Pixel-art Walk screenshots via normal UI — no mg:walk-capture bridge.
 * No sessionStorage capture flags — only localStorage prefs and UI Walk entry.
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  login: 'pixel-walk-realflow',
  avatarUrl: '',
}

const memories = [
  {
    id: 'tree-mature-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Mature oak',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 430, y: 400 },
    emotionalTone: 'peaceful',
    plantStage: 'mature',
    plantVariety: 'tree',
    visitCount: 4,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-tree-mature',
  },
  {
    id: 'flower-bloom-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Bloom flower',
    date: '2025-06-02',
    plantedAt: '2025-06-02T12:00:00.000Z',
    position: { x: 470, y: 415 },
    emotionalTone: 'happy',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-flower',
  },
  {
    id: 'mushroom-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Mature mushroom',
    date: '2025-06-03',
    plantedAt: '2025-06-03T12:00:00.000Z',
    position: { x: 445, y: 425 },
    emotionalTone: 'peaceful',
    plantStage: 'mature',
    plantVariety: 'mushroom',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-mushroom',
  },
]

async function seedPage(page, viewport) {
  await page.setViewportSize(viewport)
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.evaluate(
    ({ user, seeded }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(
        `memorygarden:${user.id}:preferences`,
        JSON.stringify({
          hasCompletedOnboarding: true,
          plantStylePreference: { artStyle: 'pixel-art' },
        }),
      )
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
    },
    { user: demoUser, seeded: memories },
  )
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 })
}

async function enterWalk(page) {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(30)
  }
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  const canvas = page.locator('[data-testid="open-world-garden"] canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 90_000 })
  await page.waitForTimeout(2500)
  await canvas.click({ position: { x: 200, y: 300 } })
  await page.waitForTimeout(400)
}

async function walkToward(page, ms, keys) {
  for (const code of keys) await page.keyboard.down(code)
  await page.waitForTimeout(ms)
  for (const code of keys) await page.keyboard.up(code)
  await page.waitForTimeout(600)
}

async function shot(page, file) {
  const path = resolve(outDir, file)
  await page.locator('[data-testid="open-world-garden"]').first().screenshot({ path })
  console.log('Wrote', path)
}

const browser = await chromium.launch({ headless: true })
try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const desktopPage = await desktop.newPage()
  await seedPage(desktopPage, { width: 1280, height: 800 })
  await enterWalk(desktopPage)
  await walkToward(desktopPage, 5200, ['KeyW'])
  await shot(desktopPage, 'minecraft-walk-realflow-desktop-near-tree.png')
  await walkToward(desktopPage, 2200, ['KeyA', 'KeyW'])
  await shot(desktopPage, 'minecraft-walk-realflow-desktop-near-flowers.png')
  await desktop.close()

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobile.newPage()
  await seedPage(mobilePage, { width: 390, height: 844 })
  await enterWalk(mobilePage)
  await walkToward(mobilePage, 4800, ['KeyW'])
  await shot(mobilePage, 'minecraft-walk-realflow-mobile-walk-height.png')
  await mobile.close()
} finally {
  await browser.close()
}
