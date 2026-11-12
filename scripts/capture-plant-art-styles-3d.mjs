/**
 * Walk-mode screenshots for pixel-art (voxel) vs watercolor 3D comparison.
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'art-style-3d',
  avatarUrl: '',
}

const memories = [
  {
    id: 'tree-elder-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Elder tree memory',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 220, y: 380 },
    emotionalTone: 'peaceful',
    plantStage: 'elder',
    plantVariety: 'tree',
    visitCount: 5,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-tree',
  },
  {
    id: 'flower-bloom-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Bloom flower',
    date: '2025-06-02',
    plantedAt: '2025-06-02T12:00:00.000Z',
    position: { x: 380, y: 420 },
    emotionalTone: 'joyful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 3,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-flower',
  },
]

function poseNearPlant(plant, distance = 2.2) {
  const yaw = Math.atan2(plant.x - (plant.x + distance * 0.35), plant.z - (plant.z + distance))
  return {
    x: plant.x + distance * 0.35,
    z: plant.z + distance,
    yaw,
    pitch: -0.14,
  }
}

async function enterWalk(page) {
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(80)
  }
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.waitForTimeout(1500)
  await page
    .locator('[data-testid="open-world-garden"] canvas')
    .first()
    .waitFor({ state: 'visible', timeout: 45_000 })
  await page.waitForTimeout(1000)
}

async function captureWalk(page, artStyle, shots) {
  await page.evaluate(
    ({ user, art, seeded }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(
        `memorygarden:${user.id}:preferences`,
        JSON.stringify({
          hasCompletedOnboarding: true,
          plantStylePreference: { artStyle: art },
        }),
      )
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
      sessionStorage.setItem('mg:walk-capture', '1')
    },
    { user: demoUser, art: artStyle, seeded: memories },
  )
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  await page.evaluate((art) => {
    window.__mgWalkCapture?.setPlantArtStyle?.(art)
  }, artStyle)
  await page.waitForTimeout(800)

  const plants =
    (await page.evaluate(() => window.__mgWalkCapture?.worldPlants?.() ?? [])) ?? []
  const tree = plants.find((p) => p.variety === 'tree')
  const flower = plants.find((p) => p.variety === 'flower')

  for (const shot of shots) {
    let pose = shot.pose
    if (shot.kind === 'overview' && plants.length > 0) {
      const cx = plants.reduce((s, p) => s + p.x, 0) / plants.length
      const cz = plants.reduce((s, p) => s + p.z, 0) / plants.length
      pose = { x: cx + 3, z: cz + 6, yaw: Math.PI + 0.35, pitch: -0.2 }
    }
    if (shot.kind === 'tree' && tree) pose = poseNearPlant(tree, 2.4)
    if (shot.kind === 'flower' && flower) pose = poseNearPlant(flower, 1.6)

    await page.evaluate(async (p) => {
      await window.__mgWalkCapture?.showcaseModel?.(null)
      window.__mgWalkCapture?.setPose?.(p)
    }, pose)
    await page.waitForTimeout(2600)
    const file = resolve(outDir, shot.file)
    await page
      .locator('[data-testid="open-world-garden"] canvas')
      .first()
      .screenshot({ path: file })
    console.log('Wrote', file, 'plants=', JSON.stringify(plants))
  }
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript(({ user, memories: seeded }) => {
    localStorage.setItem('memorygarden:user', JSON.stringify(user))
    localStorage.setItem(
      `memorygarden:${user.id}:preferences`,
      JSON.stringify({
        hasCompletedOnboarding: true,
        plantStylePreference: { artStyle: 'pixel-art' },
      }),
    )
    localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
    const OriginalDate = Date
    // eslint-disable-next-line no-global-assign
    Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(2026, 5, 15, 14, 30, 0)
        else super(...args)
      }
      static now() {
        return new OriginalDate(2026, 5, 15, 14, 30, 0).getTime()
      }
    }
  }, { user: demoUser, memories })

  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )

  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })

  await captureWalk(page, 'pixel-art', [
    { kind: 'overview', file: 'garden-art-style-walk-pixel-overview.png' },
    { kind: 'tree', file: 'garden-art-style-walk-pixel-tree-closeup.png' },
    { kind: 'flower', file: 'garden-art-style-walk-pixel-flower-closeup.png' },
  ])
  await captureWalk(page, 'watercolor', [
    { kind: 'overview', file: 'garden-art-style-walk-watercolor-3d-compare.png' },
  ])
} finally {
  await browser.close()
}
