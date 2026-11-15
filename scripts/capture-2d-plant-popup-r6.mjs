import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/2d-plant-popup-r6'
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

async function openPlantCloseup(page, memoryId, expectStage) {
  const plant = page.locator(`[data-memory-id="${memoryId}"]`)
  await plant.waitFor({ state: 'attached', timeout: 15_000 })
  await plant.evaluate((el) => {
    if (el instanceof SVGGElement) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    }
  })
  await page.getByTestId('memory-plant-closeup-dialog').waitFor({ state: 'visible', timeout: 15_000 })
  await page.waitForTimeout(400)
  const stageText = (await page.getByTestId('memory-plant-closeup-stage').textContent())?.trim().toLowerCase()
  if (stageText !== expectStage.toLowerCase()) {
    throw new Error(`Expected stage ${expectStage}, got ${stageText}`)
  }
  await page.getByTestId('memory-plant-closeup-svg').waitFor({ state: 'visible' })
}

const bloomLotus = makeMemory({
  id: 'closeup-bloom-lotus',
  plantStage: 'bloom',
  plantVariety: 'lotus',
  visitCount: 15,
  plantedDaysAgo: 20,
})

const scenarios = [
  { file: 'popup-open-watercolor-desktop.png', viewport: { width: 1280, height: 800 }, artStyle: 'watercolor', memory: bloomLotus, expectStage: 'bloom' },
  { file: 'popup-open-pixel-desktop.png', viewport: { width: 1280, height: 800 }, artStyle: 'pixel-art', memory: bloomLotus, expectStage: 'bloom' },
  {
    file: 'popup-tree-pixel-desktop.png',
    viewport: { width: 1280, height: 800 },
    artStyle: 'pixel-art',
    memory: makeMemory({ id: 'closeup-young-tree', plantStage: 'young', plantVariety: 'tree', visitCount: 4, plantedDaysAgo: 8 }),
    expectStage: 'young',
  },
  {
    file: 'popup-elder-tree-watercolor-desktop.png',
    viewport: { width: 1280, height: 800 },
    artStyle: 'watercolor',
    memory: makeMemory({ id: 'closeup-elder-tree', plantStage: 'elder', plantVariety: 'tree', visitCount: 40, plantedDaysAgo: 400 }),
    expectStage: 'elder',
  },
  { file: 'popup-open-watercolor-mobile.png', viewport: { width: 390, height: 844 }, artStyle: 'watercolor', memory: bloomLotus, expectStage: 'bloom' },
  { file: 'popup-open-pixel-mobile.png', viewport: { width: 390, height: 844 }, artStyle: 'pixel-art', memory: bloomLotus, expectStage: 'bloom' },
]

const shots = []
const browser = await chromium.launch({ headless: true })

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport: scenario.viewport, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: scenario.artStyle, memory: scenario.memory })
    await openGarden(page)
    await openPlantCloseup(page, scenario.memory.id, scenario.expectStage)
    const path = resolve(outDir, scenario.file)
    if (scenario.file.includes('elder-tree')) {
      await page.getByTestId('memory-plant-closeup-art-panel').screenshot({ path })
    } else {
      await page.screenshot({ path })
    }
    shots.push(path)
    await context.close()
  }
  console.log('Screenshots written:')
  for (const s of shots) console.log(s)
} finally {
  await browser.close()
}