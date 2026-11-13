/**
 * Walk-mode screenshots — voxel plants only (CC0 disabled in capture).
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
    position: { x: 400, y: 380 },
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
    position: { x: 520, y: 400 },
    emotionalTone: 'joyful',
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
    position: { x: 460, y: 420 },
    emotionalTone: 'peaceful',
    plantStage: 'mature',
    plantVariety: 'mushroom',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-mushroom',
  },
]

const EYE_HEIGHT = 1.55

function lookTargetY(plant) {
  if (plant.variety === 'tree') return 3.4
  if (plant.variety === 'mushroom') return 1.05
  if (plant.variety === 'flower') return 1.35
  return Math.max(0.9, (plant.height ?? 1.2) * 0.65)
}

function framePlant(plant, distance = 3.2) {
  const lookY = lookTargetY(plant)
  const camX = plant.x - distance * 0.72
  const camZ = plant.z - distance * 0.68
  const yaw = Math.atan2(plant.x - camX, plant.z - camZ)
  const horiz = Math.hypot(plant.x - camX, plant.z - camZ)
  const pitch = Math.atan2(lookY - EYE_HEIGHT, horiz)
  return { x: camX, z: camZ, yaw, pitch }
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
  await page.waitForTimeout(1600)
  await page
    .locator('[data-testid="open-world-garden"] canvas')
    .first()
    .waitFor({ state: 'visible', timeout: 45_000 })
  await page.waitForTimeout(900)
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
      sessionStorage.setItem('mg:walk-plant-focus', '1')
    },
    { user: demoUser, art: artStyle, seeded: memories },
  )
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  await page.evaluate((art) => {
    window.__mgWalkCapture?.setPlantArtStyle?.(art)
  }, artStyle)
  await page.waitForTimeout(1800)

  const plants = (await page.evaluate(() => window.__mgWalkCapture?.worldPlants?.() ?? [])) ?? []
  const plantCount = await page.evaluate(() => window.__mgWalkCapture?.plantCount?.() ?? 0)
  const voxelGroups = await page.evaluate(() => window.__mgWalkCapture?.voxelPlantGroupCount?.() ?? -1)
  const voxels = await page.evaluate(() => window.__mgWalkCapture?.voxelMeshCount?.() ?? -1)

  if (artStyle === 'pixel-art') {
    if (voxelGroups !== plantCount) {
      throw new Error(
        `Voxel plant groups (${voxelGroups}) must equal plant count (${plantCount}) in pixel-art mode`,
      )
    }
    if (voxels < plantCount * 12) {
      throw new Error(`Too few voxel meshes (${voxels}) for ${plantCount} plants — expected chunky blocks`)
    }
    console.log('pixel-art voxel check OK:', { plantCount, voxelGroups, voxels })
  }

  const tree = plants.find((p) => p.variety === 'tree')
  const flower = plants.find((p) => p.variety === 'flower')
  const mushroom = plants.find((p) => p.variety === 'mushroom')

  for (const shot of shots) {
    let pose = shot.pose
    if (shot.kind === 'overview' && plants.length >= 1) {
      const cx = plants.reduce((s, p) => s + p.x, 0) / plants.length
      const cz = plants.reduce((s, p) => s + p.z, 0) / plants.length
      const camX = cx - 4.5
      const camZ = cz + 5.8
      pose = {
        x: camX,
        z: camZ,
        yaw: Math.atan2(cx - camX, cz - camZ),
        pitch: -0.14,
      }
    }
    if (shot.kind === 'tree' && tree) {
      pose =
        (await page.evaluate(
          (id) => window.__mgWalkCapture?.plantCapturePose?.(id, 3.2),
          tree.id,
        )) ?? framePlant(tree, 3.1)
    }
    if (shot.kind === 'flower' && flower) {
      pose =
        (await page.evaluate(
          (id) => window.__mgWalkCapture?.plantCapturePose?.(id, 2.8),
          flower.id,
        )) ?? framePlant(flower, 2.9)
    }
    if (shot.kind === 'mushroom' && mushroom) {
      pose =
        (await page.evaluate(
          (id) => window.__mgWalkCapture?.plantCapturePose?.(id, 2.6),
          mushroom.id,
        )) ?? framePlant(mushroom, 2.7)
    }

    await page.evaluate(async (p) => {
      await window.__mgWalkCapture?.showcaseModel?.(null)
      window.__mgWalkCapture?.setPose?.(p)
    }, pose)
    await page.waitForTimeout(3200)
    const file = resolve(outDir, shot.file)
    await page
      .locator('[data-testid="open-world-garden"] canvas')
      .first()
      .screenshot({ path: file })
  const vAfter = await page.evaluate(() => window.__mgWalkCapture?.voxelMeshCount?.() ?? -1)
    console.log('Wrote', file, shot.kind, 'voxels', vAfter, 'pose', JSON.stringify(pose))
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
    { kind: 'mushroom', file: 'garden-art-style-walk-pixel-mushroom-closeup.png' },
  ])
  await captureWalk(page, 'watercolor', [
    { kind: 'overview', file: 'garden-art-style-walk-watercolor-3d-compare.png' },
  ])
} finally {
  await browser.close()
}
