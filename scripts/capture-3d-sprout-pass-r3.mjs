/**
 * Round-3 sprout pass: before main@6a99a4c vs after HEAD — main sprout aim + watercolor pull-in.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/3d-sprout-pass-r3'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeSha = process.env.BEFORE_SHA || '6a99a4c'
const afterSha =
  process.env.AFTER_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()

const SPROUT_CLOSEUP_MIN_PLANT_FRAC = 0.03

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'sprout-pass-r3',
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
  { file: 'watercolor-sprout-closeup', plantId: 'sprout-walk', art: 'watercolor', mode: 'capture' },
  { file: 'pixel-art-sprout-closeup', plantId: 'sprout-walk', art: 'pixel-art', mode: 'capture' },
  { file: 'watercolor-walk-overview', plantId: null, art: 'watercolor', mode: 'capture' },
  { file: 'pixel-art-walk-overview', plantId: null, art: 'pixel-art', mode: 'capture' },
  { file: 'walk-realflow-default', plantId: null, art: 'watercolor', mode: 'realflow' },
]

function rgbDist(a, b) {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function estimateGroundRgb(png) {
  const w = png.width
  const h = png.height
  const patch = Math.max(4, Math.floor(Math.min(w, h) * 0.06))
  let sr = 0
  let sg = 0
  let sb = 0
  let n = 0
  const corners = [
    [0, 0],
    [w - patch, 0],
    [0, h - patch],
    [w - patch, h - patch],
  ]
  for (const [ox, oy] of corners) {
    for (let y = oy; y < oy + patch; y++) {
      for (let x = ox; x < ox + patch; x++) {
        const i = (w * y + x) * 4
        sr += png.data[i]
        sg += png.data[i + 1]
        sb += png.data[i + 2]
        n++
      }
    }
  }
  return [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)]
}

export function measureSproutCloseupCenterPlant(pngPath) {
  const png = PNG.sync.read(readFileSync(pngPath))
  const w = png.width
  const h = png.height
  const x0 = Math.floor(w * 0.25)
  const x1 = Math.ceil(w * 0.75)
  const y0 = Math.floor(h * 0.25)
  const y1 = Math.ceil(h * 0.75)
  const ground = estimateGroundRgb(png)
  let plantPixels = 0
  let regionPixels = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      regionPixels++
      const i = (w * y + x) * 4
      const rgb = [png.data[i], png.data[i + 1], png.data[i + 2]]
      if (rgbDist(rgb, ground) > 40) plantPixels++
    }
  }
  const plantFrac = regionPixels > 0 ? plantPixels / regionPixels : 0
  return { plantPixels, regionPixels, plantFrac, groundRgb: ground }
}

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

async function bootstrapCapture(page, baseUrl, artStyle) {
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

async function bootstrapRealFlow(page, baseUrl, artStyle) {
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
      sessionStorage.removeItem('mg:walk-capture')
      sessionStorage.removeItem('mg:walk-plant-focus')
      sessionStorage.removeItem('mg:walk-hide-pointer-hint')
    },
    { user: demoUser, art: artStyle, seeded: memories },
  )
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 })
  await dismissUi(page)
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.locator('[data-testid="open-world-garden"] canvas').first().waitFor({ state: 'visible', timeout: 90_000 })
  await page.waitForTimeout(2500)
  await dismissUi(page)
}

async function capture(page, phase, shot) {
  const shaTag = phase === 'before' ? beforeSha : afterSha
  const name = `${phase}-${shaTag}-${shot.file}.png`
  const file = resolve(outDir, name)

  if (shot.mode === 'realflow') {
    await bootstrapRealFlow(page, phase === 'before' ? beforeUrl : afterUrl, shot.art)
    await page.waitForTimeout(400)
    await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
    console.log(`${phase} ${shot.file}`, file)
    return file
  }

  await bootstrapCapture(page, phase === 'before' ? beforeUrl : afterUrl, shot.art)
  if (shot.plantId) {
    await page.evaluate((plantId) => {
      window.__mgWalkCapture?.setSoloPlantFocus?.(plantId)
    }, shot.plantId)
    await page.evaluate(async () => window.__mgWalkCapture?.waitCaptureReady?.())
  }
  const poseExpr = await page.evaluate((s) => {
    if (!s.plantId) return window.__mgWalkCapture?.clusterOverviewPose?.() ?? null
    return window.__mgWalkCapture?.deterministicPlantPose?.(s.plantId)
  }, shot)
  if (!poseExpr) throw new Error(`No pose for ${phase} ${shot.file}`)
  await page.evaluate((p) => window.__mgWalkCapture?.setPose?.(p), poseExpr)
  if (!shot.plantId) {
    await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
  }
  await page.evaluate(async () => window.__mgWalkCapture?.waitCaptureReady?.())
  await dismissUi(page)
  await page.waitForTimeout(200)
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
  if (shot.plantId) {
    await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
  }
  console.log(`${phase} ${shot.file}`, file)
  return file
}

const browser = await chromium.launch({ headless: true })
const sproutChecks = []
let afterFailed = false
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
      const file = await capture(page, run.phase, shot)
      if (shot.plantId === 'sprout-walk') {
        const metrics = measureSproutCloseupCenterPlant(file)
        const pass = metrics.plantFrac >= SPROUT_CLOSEUP_MIN_PLANT_FRAC
        sproutChecks.push({
          phase: run.phase,
          file: shot.file,
          png: file,
          ...metrics,
          pass,
          minRequired: SPROUT_CLOSEUP_MIN_PLANT_FRAC,
        })
        console.log(
          `  sprout-check ${run.phase} ${shot.file}: plantFrac=${(metrics.plantFrac * 100).toFixed(2)}% ` +
            `(${metrics.plantPixels}/${metrics.regionPixels}) ground=${metrics.groundRgb.join(',')} ` +
            (pass ? 'PASS' : 'FAIL'),
        )
        if (run.phase === 'after' && !pass) afterFailed = true
      }
    }
  }

  writeFileSync(
    resolve(outDir, 'BUILD_SHA.txt'),
    `before=${beforeSha} ${beforeUrl}\nafter=${afterSha} ${afterUrl}\n`,
  )
  writeFileSync(resolve(outDir, 'SPROUT_CLOSEUP_CHECK.json'), JSON.stringify(sproutChecks, null, 2))
} finally {
  await browser.close()
}

if (afterFailed) {
  console.error(
    `SPROUT_CLOSEUP self-check failed: after sprout close-up has <${SPROUT_CLOSEUP_MIN_PLANT_FRAC * 100}% non-ground pixels in center 50%`,
  )
  process.exit(1)
}