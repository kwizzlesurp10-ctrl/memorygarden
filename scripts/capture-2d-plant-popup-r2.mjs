import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/2d-plant-popup-r2'
mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'closeup-demo',
  avatarUrl: '',
}

const JOURNAL_TEXT = [
  'Synthetic demo journal (not a real user diary).',
  'We walked the pond path at dusk and listened to frogs.',
  'This memory is planted here as a peaceful lotus marker.',
].join(' ')

function isoDaysAgo(days) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function makeMemory({ id, plantStage, plantVariety, visitCount, plantedDaysAgo }) {
  const plantedAt = isoDaysAgo(plantedDaysAgo)
  return {
    id,
    photoUrl: '',
    text: `${plantStage} ${plantVariety} — ${JOURNAL_TEXT}`,
    date: '2025-06-15',
    plantedAt,
    position: { x: 478, y: 441 },
    emotionalTone: 'peaceful',
    plantStage,
    plantVariety,
    visitCount,
    lastVisited: undefined,
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
    totalVisits: 0,
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

async function seedPage(page, { artStyle, memory, extraPrefs = {} }) {
  await page.addInitScript(
    ({ user, mems, p }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(mems))
      localStorage.setItem('memorygarden:preferences', JSON.stringify(p))
    },
    {
      user: demoUser,
      mems: [memory],
      p: {
        hasCompletedOnboarding: true,
        gardenLandscapeView: 'pond',
        preferredSeason: 'summer',
        plantStylePreference: { artStyle },
        unlockState: STABLE_UNLOCK,
        soundEnabled: false,
        lastVisit: new Date().toISOString(),
        ...extraPrefs,
      },
    },
  )
  await page.route('**/api/llm**', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'offline' }) })
  })
}

async function dismissToasts(page) {
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(100)
  }
  await page.locator('[data-sonner-toast]').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
}

async function openGarden(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await dismissToasts(page)
  const scene = page.getByTestId('garden-scene-wrap')
  await scene.waitFor({ state: 'visible', timeout: 30_000 })
  await page.waitForTimeout(500)
}

async function openPlantCloseup(page, memoryId) {
  const plant = page.locator(`[data-memory-id="${memoryId}"]`)
  await plant.waitFor({ state: 'attached', timeout: 15_000 })
  await plant.focus()
  await page.keyboard.press('Enter')
  await page.getByTestId('memory-plant-closeup-dialog').waitFor({ state: 'visible', timeout: 15_000 })
  await dismissToasts(page)
  await page.waitForTimeout(400)
}

const shots = []

const browser = await chromium.launch({ headless: true })
try {
  const bloomLotus = makeMemory({
    id: 'closeup-bloom-lotus',
    plantStage: 'bloom',
    plantVariety: 'lotus',
    visitCount: 3,
    plantedDaysAgo: 45,
  })

  for (const artStyle of ['watercolor', 'pixel-art']) {
    for (const vp of [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'mobile', width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      await seedPage(page, { artStyle, memory: bloomLotus })
      await openGarden(page)
      const beforePath = resolve(outDir, `before-garden-${artStyle === 'pixel-art' ? 'pixel' : artStyle}-${vp.name}.png`)
      await page.screenshot({ path: beforePath })
      shots.push(beforePath)
      await openPlantCloseup(page, bloomLotus.id)
      const openPath = resolve(outDir, `popup-open-${artStyle === 'pixel-art' ? 'pixel' : artStyle}-${vp.name}.png`)
      await page.screenshot({ path: openPath })
      shots.push(openPath)
      await context.close()
    }
  }

  const seedMem = makeMemory({
    id: 'closeup-seed-lotus',
    plantStage: 'seed',
    plantVariety: 'lotus',
    visitCount: 0,
    plantedDaysAgo: 0,
  })
  const elderMem = makeMemory({
    id: 'closeup-elder-lotus',
    plantStage: 'elder',
    plantVariety: 'lotus',
    visitCount: 28,
    plantedDaysAgo: 200,
  })

  for (const { memory, label } of [
    { memory: seedMem, label: 'seed' },
    { memory: elderMem, label: 'elder' },
  ]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: 'watercolor', memory })
    await openGarden(page)
    await openPlantCloseup(page, memory.id)
    const stagePath = resolve(outDir, `popup-stage-${label}-watercolor-desktop.png`)
    await page.screenshot({ path: stagePath })
    shots.push(stagePath)
    await context.close()
  }

  for (const { memory, label, artStyle } of [
    {
      memory: makeMemory({
        id: 'closeup-bloom-tree',
        plantStage: 'bloom',
        plantVariety: 'tree',
        visitCount: 12,
        plantedDaysAgo: 90,
      }),
      label: 'tree',
      artStyle: 'pixel-art',
    },
    {
      memory: makeMemory({
        id: 'closeup-bloom-flower',
        plantStage: 'bloom',
        plantVariety: 'flower',
        visitCount: 8,
        plantedDaysAgo: 60,
      }),
      label: 'flower',
      artStyle: 'watercolor',
    },
  ]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle, memory })
    await openGarden(page)
    await openPlantCloseup(page, memory.id)
    const path = resolve(outDir, `popup-${label}-${artStyle === 'pixel-art' ? 'pixel' : artStyle}-desktop.png`)
    await page.screenshot({ path })
    shots.push(path)
    await context.close()
  }

  const treePixelMobile = makeMemory({
    id: 'closeup-young-tree',
    plantStage: 'young',
    plantVariety: 'tree',
    visitCount: 6,
    plantedDaysAgo: 30,
  })
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: 'pixel-art', memory: treePixelMobile })
    await openGarden(page)
    await openPlantCloseup(page, treePixelMobile.id)
    const path = resolve(outDir, 'popup-open-pixel-tree-mobile.png')
    await page.screenshot({ path })
    shots.push(path)
    await context.close()
  }

  console.log('Screenshots written:')
  for (const s of shots) console.log(s)
} finally {
  await browser.close()
}