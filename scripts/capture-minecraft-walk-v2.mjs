/**
 * Before/after walk captures: main (smooth 3D) vs pixel-art (Minecraft voxels).
 * Env: PREVIEW_URL, ARTIFACT_DIR, PHASE=before|after, VIEWPORT=desktop|mobile
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const phase = process.env.PHASE || 'after'
const viewportMode = process.env.VIEWPORT || 'desktop'
mkdirSync(outDir, { recursive: true })

const viewports = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
}

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'minecraft-walk-v2',
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
    position: { x: 380, y: 400 },
    emotionalTone: 'peaceful',
    plantStage: 'mature',
    plantVariety: 'tree',
    visitCount: 4,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-tree-mature',
  },
  {
    id: 'tree-elder-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Elder oak',
    date: '2025-06-01',
    plantedAt: '2025-06-02T12:00:00.000Z',
    position: { x: 440, y: 400 },
    emotionalTone: 'peaceful',
    plantStage: 'elder',
    plantVariety: 'tree',
    visitCount: 6,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-tree-elder',
  },
  {
    id: 'flower-bloom-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Bloom flower',
    date: '2025-06-02',
    plantedAt: '2025-06-02T12:00:00.000Z',
    position: { x: 520, y: 420 },
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
    position: { x: 480, y: 440 },
    emotionalTone: 'peaceful',
    plantStage: 'mature',
    plantVariety: 'mushroom',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-mushroom',
  },
  {
    id: 'sprout-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Sprout',
    date: '2025-06-04',
    plantedAt: '2025-06-04T12:00:00.000Z',
    position: { x: 500, y: 460 },
    emotionalTone: 'happy',
    plantStage: 'sprout',
    plantVariety: 'flower',
    visitCount: 1,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-sprout',
  },
]

const shots = [
  { kind: 'overview', file: 'walk-overview' },
  { kind: 'tree-mature', plantId: 'tree-mature-walk', file: 'walk-tree-mature-closeup' },
  { kind: 'tree-elder', plantId: 'tree-elder-walk', file: 'walk-tree-elder-closeup' },
  { kind: 'flower', plantId: 'flower-bloom-walk', file: 'walk-flower-closeup' },
  { kind: 'mushroom', plantId: 'mushroom-walk', file: 'walk-mushroom-closeup' },
  { kind: 'sprout', plantId: 'sprout-walk', file: 'walk-sprout-closeup' },
]

async function enterWalk(page) {
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(60)
  }
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.waitForTimeout(2000)
  const canvas = page.locator('[data-testid="open-world-garden"] canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 90_000 })
  await page.waitForFunction(
    () => (window.__mgWalkCapture?.worldPlants?.() ?? []).length >= 3,
    undefined,
    { timeout: 90_000 },
  )
  await page.waitForTimeout(1200)
}

async function captureSet(page, artStyle) {
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
  await page.waitForTimeout(1200)

  if (artStyle === 'pixel-art' && phase === 'after') {
    const check = await page.evaluate(() => ({
      v: window.__mgWalkCapture?.voxelMeshCount?.() ?? -1,
      g: window.__mgWalkCapture?.voxelPlantGroupCount?.() ?? -1,
      p: window.__mgWalkCapture?.plantCount?.() ?? -1,
    }))
    if (check.v < 8) {
      throw new Error(`Pixel-art walk expected voxel meshes; got ${JSON.stringify(check)}`)
    }
    console.log('voxel check', check)
  }

  for (const shot of shots) {
    let pose = null
    if (shot.kind === 'overview') {
      pose = await page.evaluate(() => window.__mgWalkCapture?.clusterOverviewPose?.() ?? null)
      if (!pose) {
        const plants = (await page.evaluate(() => window.__mgWalkCapture?.worldPlants?.() ?? [])) ?? []
        const cx = plants.reduce((s, p) => s + p.x, 0) / Math.max(1, plants.length)
        const cz = plants.reduce((s, p) => s + p.z, 0) / Math.max(1, plants.length)
        pose = { x: cx - 5.5, z: cz + 7.2, yaw: Math.atan2(cx - (cx - 5.5), cz - (cz + 7.2)), pitch: -0.1, eyeY: 1.62 }
      }
    } else if (shot.plantId) {
      pose = await page.evaluate(
        (id) => window.__mgWalkCapture?.plantCapturePose?.(id) ?? null,
        shot.plantId,
      )
      if (!pose) {
        const plants = (await page.evaluate(() => window.__mgWalkCapture?.worldPlants?.() ?? [])) ?? []
        const p = plants.find((pl) => pl.id === shot.plantId)
        if (p) {
          const lookY = p.variety === 'tree' ? 3.2 : p.variety === 'mushroom' ? 1.1 : 1.3
          const dist = 3.1
          const camX = p.x - dist * 0.72
          const camZ = p.z - dist * 0.68
          const horiz = Math.hypot(p.x - camX, p.z - camZ)
          pose = {
            x: camX,
            z: camZ,
            yaw: Math.atan2(p.x - camX, p.z - camZ),
            pitch: -Math.atan2(lookY - 1.62, horiz),
            eyeY: 1.62,
          }
        }
      }
    }
    if (!pose) throw new Error(`No pose for ${shot.file}`)
    await page.evaluate(async (p) => {
      await window.__mgWalkCapture?.showcaseModel?.(null)
      window.__mgWalkCapture?.setPose?.(p)
    }, pose)
    await page.waitForTimeout(2600)
    const name = `minecraft-walk-${phase}-${artStyle}-${shot.file}-${viewportMode}.png`
    const file = resolve(outDir, name)
    await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
    console.log('Wrote', file, 'frac', pose.screenFrac?.toFixed?.(3) ?? 'n/a')
  }
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: viewports[viewportMode] ?? viewports.desktop })
  await context.addInitScript(({ user, memories: seeded }) => {
    sessionStorage.setItem('mg:walk-capture', '1')
    sessionStorage.setItem('mg:walk-plant-focus', '1')
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

  await captureSet(page, 'pixel-art')
  await captureSet(page, 'watercolor')
} finally {
  await browser.close()
}
