import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/2d-plant-popup'
mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'closeup-demo',
  avatarUrl: '',
}

const tinyPhoto =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

function makeMemory(plantStage) {
  return {
    id: `closeup-${plantStage}`,
    photoUrl: tinyPhoto,
    text: `Synthetic journal — ${plantStage} lotus by the pond`,
    date: '2025-06-15',
    plantedAt: '2025-05-01T12:00:00.000Z',
    position: { x: 478, y: 441 },
    emotionalTone: 'peaceful',
    plantStage,
    plantVariety: 'lotus',
    visitCount: 5,
    lastVisited: '2025-06-14T12:00:00.000Z',
    reflections: [],
    audioRecordings: [],
    growthMetrics: {
      vitality: plantStage === 'elder' ? 94 : plantStage === 'seed' ? 8 : 55,
      height: 80,
      width: 60,
      bloomCount: 3,
      foliageDensity: 55,
      rarityScore: 8,
      lastInteractionAt: Date.now(),
    },
  }
}

async function seedPage(page, { artStyle, plantStage, prefs }) {
  const memories = [makeMemory(plantStage)]
  await page.addInitScript(
    ({ user, mems, p }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(mems))
      localStorage.setItem('memorygarden:preferences', JSON.stringify(p))
    },
    {
      user: demoUser,
      mems: memories,
      p: {
        hasCompletedOnboarding: true,
        gardenLandscapeView: 'pond',
        preferredSeason: 'summer',
        plantStylePreference: { artStyle },
        soundEnabled: false,
        lastVisit: new Date().toISOString(),
        ...prefs,
      },
    },
  )
  await page.route('**/api/llm**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'offline' }) })
  })
}

async function openGarden(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(80)
  }
  const scene = page.getByTestId('garden-scene-wrap')
  if (!(await scene.isVisible().catch(() => false))) {
    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Garden View"]')
      if (btn instanceof HTMLElement) btn.click()
    })
  }
  await scene.waitFor({ state: 'visible', timeout: 30_000 })
  await page.waitForTimeout(600)
}

async function clickCentralPlant(page) {
  const plant = page.locator('[data-memory-id^="closeup-"]').first()
  await plant.waitFor({ state: 'attached', timeout: 15_000 })
  await plant.focus()
  await page.keyboard.press('Enter')
  await page.getByTestId('memory-plant-closeup-dialog').waitFor({ state: 'visible', timeout: 15_000 })
}

const shots = []

const browser = await chromium.launch({ headless: true })
try {
  for (const artStyle of ['watercolor', 'pixel']) {
    for (const vp of [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'mobile', width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      await seedPage(page, { artStyle, plantStage: 'bloom', prefs: {} })
      await openGarden(page)
      const beforePath = resolve(outDir, `before-garden-${artStyle}-${vp.name}.png`)
      await page.screenshot({ path: beforePath })
      shots.push(beforePath)
      await clickCentralPlant(page)
      const openPath = resolve(outDir, `popup-open-${artStyle}-${vp.name}.png`)
      await page.screenshot({ path: openPath })
      shots.push(openPath)
      await context.close()
    }
  }

  for (const stage of ['seed', 'elder']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: 'watercolor', plantStage: stage, prefs: {} })
    await openGarden(page)
    await clickCentralPlant(page)
    const stagePath = resolve(outDir, `popup-stage-${stage}-watercolor-desktop.png`)
    await page.screenshot({ path: stagePath })
    shots.push(stagePath)
    await context.close()
  }

  console.log('Screenshots written:')
  for (const s of shots) console.log(s)
} finally {
  await browser.close()
}