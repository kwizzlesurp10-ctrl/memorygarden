import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/2d-plant-popup-r5'
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
  await page.waitForTimeout(500)
  const stageText = (await page.getByTestId('memory-plant-closeup-stage').textContent())?.trim().toLowerCase()
  if (stageText !== expectStage.toLowerCase()) {
    throw new Error(`Expected stage ${expectStage}, got ${stageText}`)
  }
  await page.getByTestId('memory-plant-closeup-svg').waitFor({ state: 'visible' })
}

async function readPlantFill(page) {
  return page.evaluate(() => {
    const svg = document.querySelector('[data-testid="memory-plant-closeup-svg"]')
    const plant = document.querySelector('[data-testid="memory-plant-closeup-plant"]')
    const panel = document.querySelector('[data-testid="memory-plant-closeup-art-panel"]')
    if (!svg || !plant || !panel || typeof plant.getBBox !== 'function') return { fill: 0, dataset: null }
    const vb = svg.viewBox.baseVal
    const bbox = plant.getBBox()
    const svgRect = svg.getBoundingClientRect()
    const panelH = panel.getBoundingClientRect().height
    const scale = Math.min(svgRect.width / vb.width, svgRect.height / vb.height)
    const fill = (bbox.height * scale) / Math.max(1, panelH)
    return {
      fill,
      dataset: svg.dataset.plantFillRatio ?? null,
    }
  })
}

function assertFill(fill, stage, label) {
  const bloomStages = new Set(['bloom', 'mature', 'evergreen', 'elder'])
  const treeCheck = label.includes('tree')
  if (!bloomStages.has(stage) && !treeCheck) return
  const min = bloomStages.has(stage) ? 0.45 : 0.38
  if (fill < min) throw new Error(`${label}: plant fill ${fill.toFixed(3)} < ${min}`)
  if (fill > 0.95) throw new Error(`${label}: plant fill ${fill.toFixed(3)} > 0.95`)
}

const bloomLotus = makeMemory({
  id: 'closeup-bloom-lotus',
  plantStage: 'bloom',
  plantVariety: 'lotus',
  visitCount: 15,
  plantedDaysAgo: 20,
})

const scenarios = [
  {
    file: 'popup-open-watercolor-desktop.png',
    viewport: { width: 1280, height: 800 },
    artStyle: 'watercolor',
    memory: bloomLotus,
    expectStage: 'bloom',
    label: 'bloom-lotus-watercolor-desktop',
  },
  {
    file: 'popup-open-pixel-desktop.png',
    viewport: { width: 1280, height: 800 },
    artStyle: 'pixel-art',
    memory: bloomLotus,
    expectStage: 'bloom',
    label: 'bloom-lotus-pixel-desktop',
  },
  {
    file: 'popup-tree-pixel-desktop.png',
    viewport: { width: 1280, height: 800 },
    artStyle: 'pixel-art',
    memory: makeMemory({
      id: 'closeup-young-tree',
      plantStage: 'young',
      plantVariety: 'tree',
      visitCount: 4,
      plantedDaysAgo: 8,
    }),
    expectStage: 'young',
    label: 'young-tree-pixel-desktop',
  },
  {
    file: 'popup-elder-tree-watercolor-desktop.png',
    viewport: { width: 1280, height: 800 },
    artStyle: 'watercolor',
    memory: makeMemory({
      id: 'closeup-elder-tree',
      plantStage: 'elder',
      plantVariety: 'tree',
      visitCount: 40,
      plantedDaysAgo: 400,
    }),
    expectStage: 'elder',
    label: 'elder-tree-watercolor-desktop',
  },
  {
    file: 'popup-open-pixel-mobile.png',
    viewport: { width: 390, height: 844 },
    artStyle: 'pixel-art',
    memory: bloomLotus,
    expectStage: 'bloom',
    label: 'bloom-lotus-pixel-mobile',
  },
]

const fillReport = []
const browser = await chromium.launch({ headless: true })

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport: scenario.viewport, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await seedPage(page, { artStyle: scenario.artStyle, memory: scenario.memory })
    await openGarden(page)
    await openPlantCloseup(page, scenario.memory.id, scenario.expectStage)
    await page.waitForTimeout(200)
    const { fill, dataset } = await readPlantFill(page)
    assertFill(fill, scenario.expectStage, scenario.label)
    const path = resolve(outDir, scenario.file)
    await page.screenshot({ path })
    fillReport.push({ label: scenario.label, file: path, fill: fill.toFixed(3), datasetFill: dataset })
    await context.close()
  }

  console.log('Screenshots written:')
  for (const row of fillReport) {
    console.log(`${row.file}  fill=${row.fill}  dataset=${row.datasetFill ?? 'n/a'}`)
  }
} finally {
  await browser.close()
}