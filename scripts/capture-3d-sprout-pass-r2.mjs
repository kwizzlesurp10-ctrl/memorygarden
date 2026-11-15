/**
 * Round-2 sprout pass: before main@6a99a4c vs after HEAD — same deterministic poses, no UI overlays.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'
import { measureSproutPlantHeightInPng } from './lib/walk-capture-pixel-fill.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/3d-sprout-pass-r2'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeSha = process.env.BEFORE_SHA || '6a99a4c'
const afterSha =
  process.env.AFTER_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'sprout-pass-r2',
  avatarUrl: '',
}

const memories = [
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

const shots = [
  { file: 'watercolor-sprout-closeup', plantId: 'sprout-walk', art: 'watercolor' },
  { file: 'pixel-art-sprout-closeup', plantId: 'sprout-walk', art: 'pixel-art' },
  { file: 'watercolor-walk-overview', plantId: null, art: 'watercolor' },
]

async function dismissUi(page) {
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(50)
  }
  await page.evaluate(() => {
    document.querySelectorAll('[role="dialog"],[data-sonner-toast]').forEach((el) => el.remove())
  })
}

async function enterWalk(page) {
  await dismissUi(page)
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.locator('[data-testid="open-world-garden"] canvas').first().waitFor({ state: 'visible', timeout: 90_000 })
  await page.waitForFunction(() => window.__mgWalkCapture?.ready?.() === true, undefined, { timeout: 90_000 })
  await page.evaluate(async () => window.__mgWalkCapture?.waitCaptureReady?.())
}

async function bootstrap(page, baseUrl, artStyle) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await dismissUi(page)
  await page.evaluate(
    ({ user, art, seeded }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(
        `memorygarden:${user.id}:preferences`,
        JSON.stringify({ hasCompletedOnboarding: true, plantStylePreference: { artStyle: art } }),
      )
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
      sessionStorage.setItem('mg:walk-capture', '1')
      sessionStorage.setItem('mg:walk-plant-focus', '1')
      sessionStorage.setItem('mg:walk-hide-pointer-hint', '1')
    },
    { user: demoUser, art: artStyle, seeded: memories },
  )
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  await page.evaluate((art) => window.__mgWalkCapture?.setPlantArtStyle?.(art), artStyle)
  await page.waitForTimeout(800)
  await dismissUi(page)
}

async function poseFor(shot) {
  return shot.plantId
    ? `(window.__mgWalkCapture?.sproutCloseupPose?.('${shot.plantId}') ?? window.__mgWalkCapture?.deterministicPlantPose?.('${shot.plantId}'))`
    : `window.__mgWalkCapture?.clusterOverviewPose?.()`
}

const metrics = []

async function capture(page, phase, shot) {
  if (shot.plantId) {
    await page.evaluate((plantId) => {
      window.__mgWalkCapture?.setSoloPlantFocus?.(plantId)
    }, shot.plantId)
    await page.evaluate(async () => window.__mgWalkCapture?.waitCaptureReady?.())
  }
  const poseExpr = await page.evaluate(
    (s) => {
      if (!s.plantId) return window.__mgWalkCapture?.clusterOverviewPose?.() ?? null
      return (
        window.__mgWalkCapture?.sproutCloseupPose?.(s.plantId) ??
        window.__mgWalkCapture?.deterministicPlantPose?.(s.plantId)
      )
    },
    shot,
  )
  if (!poseExpr) throw new Error(`No pose for ${phase} ${shot.file}`)
  await page.evaluate((p) => window.__mgWalkCapture?.setPose?.(p), poseExpr)
  if (!shot.plantId) {
    await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
  }
  await page.evaluate(async () => window.__mgWalkCapture?.waitCaptureReady?.())
  await dismissUi(page)
  await page.waitForTimeout(200)
  const shaTag = phase === 'before' ? beforeSha : afterSha
  const name = `${phase}-${shaTag}-${shot.file}.png`
  const file = resolve(outDir, name)
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
  await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
  if (shot.plantId) {
    const visual = measureSproutPlantHeightInPng(file)
    metrics.push({ phase, shot: shot.file, art: shot.art, ...visual })
    console.log(`${phase} ${shot.file} visualPlantHeight=${(visual.heightFrac * 100).toFixed(1)}% rows=${visual.plantRows}`)
  }
  return file
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  await context.addInitScript(({ user, seeded }) => {
    localStorage.setItem('memorygarden:user', JSON.stringify(user))
    localStorage.setItem(
      `memorygarden:${user.id}:preferences`,
      JSON.stringify({ hasCompletedOnboarding: true, plantStylePreference: { artStyle: 'watercolor' } }),
    )
    localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
    const OriginalDate = Date
    // eslint-disable-next-line no-global-assign
    Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(2026, 5, 15, 18, 30, 0)
        else super(...args)
      }
      static now() {
        return new OriginalDate(2026, 5, 15, 18, 30, 0).getTime()
      }
    }
  }, { user: demoUser, seeded: memories })
  const page = await context.newPage()

  for (const run of [
    { phase: 'before', url: beforeUrl },
    { phase: 'after', url: afterUrl },
  ]) {
    for (const shot of shots) {
      await bootstrap(page, run.url, shot.art)
      await capture(page, run.phase, shot)
    }
  }

  writeFileSync(resolve(outDir, 'VISUAL_PLANT_HEIGHT.json'), JSON.stringify(metrics, null, 2))
  writeFileSync(
    resolve(outDir, 'BUILD_SHA.txt'),
    `before=${beforeSha} ${beforeUrl}\nafter=${afterSha} ${afterUrl}\n`,
  )
} finally {
  await browser.close()
}