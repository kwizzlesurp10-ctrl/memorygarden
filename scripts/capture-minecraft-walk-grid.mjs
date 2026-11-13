/**
 * Minecraft walk capture grid — deterministic plant cameras, pinned poses.
 * Env: AFTER_URL, BEFORE_URL (61887fe preview on 4173 — see prepare-walk-before-preview.mjs),
 *       ARTIFACT_DIR, VIEWPORT=desktop|mobile, MODE=full|overview
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const viewportMode = process.env.VIEWPORT || 'desktop'
const mode = process.env.MODE || 'full'
const covThreshold = 0.15

mkdirSync(outDir, { recursive: true })

const posePath = resolve(outDir, 'minecraft-walk-poses-desktop.json')

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
    id: 'tree-elder-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Elder oak',
    date: '2025-06-01',
    plantedAt: '2025-06-02T12:00:00.000Z',
    position: { x: 455, y: 400 },
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
  {
    id: 'sprout-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Sprout',
    date: '2025-06-04',
    plantedAt: '2025-06-04T12:00:00.000Z',
    position: { x: 460, y: 430 },
    emotionalTone: 'happy',
    plantStage: 'sprout',
    plantVariety: 'flower',
    visitCount: 1,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-sprout',
  },
]

const allShots = [
  { kind: 'overview', file: 'walk-overview', plantId: null, label: 'overview' },
  {
    kind: 'tree-mature',
    plantId: 'tree-mature-walk',
    file: 'walk-tree-mature-closeup',
    label: 'mature tree',
  },
  { kind: 'tree-elder', plantId: 'tree-elder-walk', file: 'walk-tree-elder-closeup', label: 'elder tree' },
  { kind: 'flower', plantId: 'flower-bloom-walk', file: 'walk-flower-closeup', label: 'flower' },
  { kind: 'mushroom', plantId: 'mushroom-walk', file: 'walk-mushroom-closeup', label: 'mushroom' },
  { kind: 'sprout', plantId: 'sprout-walk', file: 'walk-sprout-closeup', label: 'sprout' },
]

const shots = mode === 'overview' ? allShots.filter((s) => s.file === 'walk-overview') : allShots

async function enterWalk(page) {
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(40)
  }
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.locator('[data-testid="open-world-garden"] canvas').first().waitFor({ state: 'visible', timeout: 90_000 })
  await page.waitForFunction(() => window.__mgWalkCapture?.ready?.() === true, undefined, { timeout: 90_000 })
  await page.waitForFunction(
    () => (window.__mgWalkCapture?.worldPlants?.() ?? []).length >= 5,
    undefined,
    { timeout: 90_000 },
  )
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
}

async function bootstrapWalk(page, baseUrl, artStyle) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
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
  await page.evaluate((art) => window.__mgWalkCapture?.setPlantArtStyle?.(art), artStyle)
  await page.waitForTimeout(2000)
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
}

async function poseForShot(page, shot) {
  return page.evaluate(async (s) => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
    if (!s.plantId) {
      return window.__mgWalkCapture?.clusterOverviewPose?.() ?? null
    }
    if (!window.__mgWalkCapture?.hasPlantGroup?.(s.plantId)) {
      throw new Error(`Missing plant group ${s.plantId}`)
    }
    return window.__mgWalkCapture?.deterministicPlantPose?.(s.plantId) ?? null
  }, shot)
}

async function applyPose(page, pose) {
  await page.evaluate((p) => {
    window.__mgWalkCapture?.setPose?.(p)
  }, pose)
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
}

async function deriveAllPoses(page) {
  const poses = {}
  for (const shot of shots) {
    const pose = await poseForShot(page, shot)
    if (!pose) throw new Error(`No deterministic pose for ${shot.file}`)
    poses[shot.file] = pose
    console.log('pinned pose', shot.file, JSON.stringify(pose))
  }
  if (viewportMode === 'desktop' && mode === 'full') {
    writeFileSync(posePath, JSON.stringify(poses, null, 2))
  }
  return poses
}

async function captureShot(page, phase, artStyle, shot, pose) {
  await applyPose(page, pose)
  await page.evaluate((plantId) => {
    window.__mgWalkCapture?.setSoloPlantFocus?.(plantId ?? null)
  }, shot.plantId ?? null)
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
  const name = `minecraft-walk-${phase}-${artStyle}-${shot.file}-${viewportMode}.png`
  const file = resolve(outDir, name)
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
  await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
  if (shot.plantId) {
    const cov = await page.evaluate(
      ({ id, p }) => window.__mgWalkCapture?.plantScreenCoverage?.(id, p) ?? 0,
      { id: shot.plantId, p: pose },
    )
    const flag = cov >= covThreshold ? 'ok' : 'LOW'
    console.log(`coverage[${flag}]`, phase, artStyle, shot.file, cov.toFixed(3))
  }
  console.log('Wrote', file)
  return file
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: viewports[viewportMode] ?? viewports.desktop,
  })
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

  let poses = null
  if (existsSync(posePath)) {
    poses = JSON.parse(readFileSync(posePath, 'utf8'))
  }

  if (!poses && mode === 'overview') {
    throw new Error(`Missing ${posePath} — run desktop full capture first`)
  }

  if (!poses) {
    await bootstrapWalk(page, afterUrl, 'pixel-art')
    const v = await page.evaluate(() => window.__mgWalkCapture?.voxelMeshCount?.() ?? 0)
    if (v < 40) throw new Error(`Expected voxels on AFTER build, got ${v}`)
    poses = await deriveAllPoses(page)
  }

  const runs =
    mode === 'overview'
      ? [
          { phase: 'after', url: afterUrl, styles: ['pixel-art', 'watercolor'] },
          { phase: 'before', url: beforeUrl, styles: ['pixel-art', 'watercolor'] },
        ]
      : [
          { phase: 'after', url: afterUrl, styles: ['pixel-art', 'watercolor'] },
          { phase: 'before', url: beforeUrl, styles: ['pixel-art', 'watercolor'] },
        ]

  for (const run of runs) {
    for (const artStyle of run.styles) {
      await bootstrapWalk(page, run.url, artStyle)
      for (const shot of shots) {
        const pose = poses[shot.file]
        if (!pose) throw new Error(`Missing pose for ${shot.file}`)
        await captureShot(page, run.phase, artStyle, shot, pose)
      }
    }
  }
} finally {
  await browser.close()
}
