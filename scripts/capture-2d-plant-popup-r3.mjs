import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/2d-plant-popup-r3'
mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'closeup-demo',
  avatarUrl: '',
}

const JOURNAL_TEXT = [
  'Synthetic demo journal (not a real user diary).',
  'We walked the pond path at dusk and listened to frogs along the shore.',
  'This memory is planted here as a peaceful marker — several lines for the popup.',
].join(' ')

function isoDaysAgo(days) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function makeMemory({ id, plantStage, plantVariety, visitCount, plantedDaysAgo }) {
  return {
    id,
    photoUrl: '',
    text: `${plantStage} ${plantVariety} — ${JOURNAL_TEXT}`,
    date: '2025-06-15',
    plantedAt: isoDaysAgo(plantedDaysAgo),
    position: { x: 478, y: 441 },
    emotionalTone: 'peaceful',
    plantStage,
    plantVariety,
    visitCount,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: `demo-${id}`,
  }
}

const STABLE_UNLOCK = {
  unlockedPalettes: ['default', 'earthy', 'warm', 'cool', 'ocean', 'sunset', 'frost', 'midnight', 'dawn', 'twilight', 'forest', 'coral', 'lavender'],
  unlockedPatterns: ['solid', 'speckle', 'gradient', 'stripe'],
  unlockedAdornments: ['none', 'dew', 'dew-drops', 'butterflies', 'fireflies', 'pollen', 'sparkles', 'seasonal-bloom', 'golden-aura'],
  unlockedFrames: [],
  wallet: { dew: 0, sunlight: 0, pollen: 0, starlight: 0 },
  counters: {
    totalReflections: 0,
    totalVisits: 3,
    totalMemoriesPlanted: 1,
    memoriesReachedMature: 0,
    memoriesReachedElder: 0,
    nightVisitDays: 0,
    uniqueOldMemoriesRevisited: 0,
    clustersTended: 0,
    nightVisitDates: [],
    memoriesWatered3: [],
    seasonalPlantings: {},
  },
  achievements: [],
}

function basePrefs(artStyle) {
  return {
    hasCompletedOnboarding: true,
    gardenLandscapeView: 'pond',
    preferredSeason: 'summer',
    plantStylePreference: { artStyle },
    unlockState: STABLE_UNLOCK,
    soundEnabled: false,
    lastVisit: new Date().toISOString(),
  }
}

async function seedPage(page, { artStyle, memory }) {
  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.textContent = '[data-sonner-toaster], [data-sonner-toast] { visibility: hidden !important; pointer-events: none !important; }'
    document.documentElement.appendChild(style)
  })
  await page.addInitScript(
    ({ user, mems, p }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(mems))
      localStorage.setItem('memorygarden:preferences', JSON.stringify(p))
    },
    { user: demoUser, mems: [memory], p: basePrefs(artStyle) },
  )
  await page.route('**/api/llm**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'offline' }) })
  })
}

async function openGarden(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.getByTestId('garden-scene-wrap').waitFor({ state: 'visible', timeout: 30_000 })
  await page.waitForTimeout(600)
}

async function assertCloseupVisible(page, { expectStage }) {
  const dialog = page.getByRole('dialog')
  const dialogVisible = await dialog.isVisible()
  if (!dialogVisible) {
    throw new Error('Capture assert failed: role=dialog is not visible')
  }
  await page.getByTestId('memory-plant-closeup-dialog').waitFor({ state: 'visible', timeout: 5000 })
  const title = await page.getByRole('dialog').locator('h2').first().textContent()
  if (!title?.trim()) {
    throw new Error('Capture assert failed: dialog title missing')
  }
  const stageText = (await page.getByTestId('memory-plant-closeup-stage').textContent())?.trim().toLowerCase()
  if (!stageText) {
    throw new Error('Capture assert failed: stage label missing')
  }
  if (expectStage && stageText !== expectStage.toLowerCase()) {
    throw new Error(`Capture assert failed: expected stage ${expectStage}, got ${stageText}`)
  }
  const progress = page.getByTestId('memory-plant-closeup-progress')
  if (!(await progress.isVisible())) {
    throw new Error('Capture assert failed: progress bar not visible')
  }
  const memoryText = (await page.getByTestId('memory-plant-closeup-text').textContent()) ?? ''
  if (memoryText.length < 48 || !memoryText.includes('Synthetic demo journal')) {
    throw new Error('Capture assert failed: synthetic memory text not rendered')
  }
  const art = page.getByTestId('memory-plant-closeup-art-panel')
  if (!(await art.isVisible())) {
    throw new Error('Capture assert failed: art panel missing')
  }
  const svg = page.getByTestId('memory-plant-closeup-svg')
  if (!(await svg.isVisible())) {
    throw new Error('Capture assert failed: closeup plant svg missing')
  }
}

async function openPlantCloseup(page, memoryId, assertOpts = {}) {
  const plant = page.locator(`[data-memory-id="${memoryId}"]`)
  await plant.waitFor({ state: 'attached', timeout: 15_000 })
  await plant.evaluate((el) => {
    if (el instanceof SVGGElement) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    }
  })
  await page.getByTestId('memory-plant-closeup-dialog').waitFor({ state: 'visible', timeout: 15_000 })
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForTimeout(350)
  await assertCloseupVisible(page, assertOpts)
}

async function shotPopup(page, filePath, assertOpts) {
  if (!(await page.getByRole('dialog').isVisible())) {
    await openPlantCloseup(page, assertOpts.memoryId, assertOpts)
  }
  await assertCloseupVisible(page, assertOpts)
  await page.screenshot({ path: filePath })
}

const shots = []
const browser = await chromium.launch({ headless: true })

try {
  const bloomLotus = makeMemory({
    id: 'closeup-bloom-lotus',
    plantStage: 'bloom',
    plantVariety: 'lotus',
    visitCount: 15,
    plantedDaysAgo: 20,
  })

  // 1–2 watercolor desktop before / popup
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: 'watercolor', memory: bloomLotus })
    await openGarden(page)
    const before = resolve(outDir, 'before-garden-watercolor-desktop.png')
    await page.screenshot({ path: before })
    shots.push(before)
    await openPlantCloseup(page, bloomLotus.id, { expectStage: 'bloom' })
    const popup = resolve(outDir, 'popup-open-watercolor-desktop.png')
    await assertCloseupVisible(page, { expectStage: 'bloom' })
    await page.screenshot({ path: popup })
    shots.push(popup)
    await context.close()
  }

  // 3 pixel desktop popup
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: 'pixel-art', memory: bloomLotus })
    await openGarden(page)
    await openPlantCloseup(page, bloomLotus.id, { expectStage: 'bloom' })
    const path = resolve(outDir, 'popup-open-pixel-desktop.png')
    const artStyle = await page.getByTestId('memory-plant-closeup-svg').getAttribute('data-art-style')
    if (artStyle !== 'pixel-art') throw new Error(`Expected pixel-art closeup, got ${artStyle}`)
    await page.screenshot({ path })
    shots.push(path)
    await context.close()
  }

  // 4 seed, 5 elder
  for (const { memory, stage } of [
    { memory: makeMemory({ id: 'closeup-seed-lotus', plantStage: 'seed', plantVariety: 'lotus', visitCount: 0, plantedDaysAgo: 0 }), stage: 'seed' },
    {
      memory: makeMemory({
        id: 'closeup-elder-lotus',
        plantStage: 'elder',
        plantVariety: 'lotus',
        visitCount: 30,
        plantedDaysAgo: 180,
      }),
      stage: 'elder',
    },
  ]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: 'watercolor', memory })
    await openGarden(page)
    await openPlantCloseup(page, memory.id, { expectStage: stage })
    const path = resolve(outDir, `popup-stage-${stage}-watercolor-desktop.png`)
    await page.screenshot({ path })
    shots.push(path)
    await context.close()
  }

  // 6 pixel tree desktop
  {
    const tree = makeMemory({
      id: 'closeup-young-tree',
      plantStage: 'young',
      plantVariety: 'tree',
      visitCount: 4,
      plantedDaysAgo: 8,
    })
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: 'pixel-art', memory: tree })
    await openGarden(page)
    await openPlantCloseup(page, tree.id, { expectStage: 'young' })
    const path = resolve(outDir, 'popup-tree-pixel-desktop.png')
    await page.screenshot({ path })
    shots.push(path)
    await context.close()
  }

  // 7–8 watercolor mobile before / popup
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: 'watercolor', memory: bloomLotus })
    await openGarden(page)
    const before = resolve(outDir, 'before-garden-watercolor-mobile.png')
    await page.screenshot({ path: before })
    shots.push(before)
    await openPlantCloseup(page, bloomLotus.id, { expectStage: 'bloom' })
    const popup = resolve(outDir, 'popup-open-watercolor-mobile.png')
    await page.screenshot({ path: popup })
    shots.push(popup)
    await context.close()
  }

  // 9–10 pixel mobile before / popup
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: 'pixel-art', memory: bloomLotus })
    await openGarden(page)
    const before = resolve(outDir, 'before-garden-pixel-mobile.png')
    await page.screenshot({ path: before })
    shots.push(before)
    await openPlantCloseup(page, bloomLotus.id, { expectStage: 'bloom' })
    const popup = resolve(outDir, 'popup-open-pixel-mobile.png')
    await page.screenshot({ path: popup })
    shots.push(popup)
    await context.close()
  }

  if (shots.length > 10) throw new Error(`Too many screenshots: ${shots.length}`)
  console.log('Screenshots written:')
  for (const s of shots) console.log(s)
} finally {
  await browser.close()
}