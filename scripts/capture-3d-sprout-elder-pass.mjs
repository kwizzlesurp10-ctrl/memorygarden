/**
 * Sprout + elder 3D close-up pass artifacts (before main vs after HEAD).
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'
import { measurePlantAreaFillFromPng } from './lib/walk-capture-pixel-fill.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/3d-sprout-elder-pass'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeSha = process.env.BEFORE_SHA || '595326c'
const afterSha =
  process.env.AFTER_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'sprout-elder-pass',
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
  { label: 'overview', file: 'walk-overview', plantId: null },
  { label: 'sprout-closeup', file: 'walk-sprout-closeup', plantId: 'sprout-walk', styles: ['watercolor'] },
  { label: 'elder-closeup', file: 'walk-tree-elder-closeup', plantId: 'tree-elder-walk', styles: ['watercolor', 'pixel-art'] },
]

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
  await page.evaluate(async () => window.__mgWalkCapture?.waitCaptureReady?.())
}

async function bootstrap(page, baseUrl, artStyle) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
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
    },
    { user: demoUser, art: artStyle, seeded: memories },
  )
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  await page.evaluate((art) => window.__mgWalkCapture?.setPlantArtStyle?.(art), artStyle)
  await page.waitForTimeout(1500)
  await page.evaluate(async () => window.__mgWalkCapture?.waitCaptureReady?.())
}

async function poseFor(page, shot) {
  if (!shot.plantId) {
    return page.evaluate(() => window.__mgWalkCapture?.clusterOverviewPose?.() ?? null)
  }
  if (shot.plantId === 'tree-elder-walk') {
    return page.evaluate(
      (id) => window.__mgWalkCapture?.elderCloseupPose?.(id) ?? window.__mgWalkCapture?.deterministicPlantPose?.(id),
      shot.plantId,
    )
  }
  return page.evaluate(
    (id) => window.__mgWalkCapture?.sproutCloseupPose?.(id) ?? window.__mgWalkCapture?.deterministicPlantPose?.(id),
    shot.plantId,
  )
}

const metrics = []

async function capture(page, phase, artStyle, shot, pose) {
  await page.evaluate((p) => window.__mgWalkCapture?.setPose?.(p), pose)
  await page.evaluate((plantId) => window.__mgWalkCapture?.setSoloPlantFocus?.(plantId ?? null), shot.plantId)
  await page.evaluate(async () => window.__mgWalkCapture?.waitCaptureReady?.())
  const shaTag = phase === 'before' ? beforeSha : afterSha
  const name = `${phase}-${shaTag}-${artStyle}-${shot.file}-desktop.png`
  const file = resolve(outDir, name)
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
  const live =
    shot.plantId &&
    (await page.evaluate(
      ({ id, p }) => {
        const b = window.__mgWalkCapture
        const proj = b?.plantProjectedAabbScreen?.(id)
        const cov = b?.plantScreenCoverage?.(id, p) ?? 0
        return { proj, cov }
      },
      { id: shot.plantId, p: pose },
    ))
  await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
  const soloFocus = shot.plantId !== null
  let fill = null
  if (shot.plantId) {
    fill = measurePlantAreaFillFromPng(file)
    const aabbSpan = live?.proj ? live.proj.bottom - live.proj.top : 0
    const row = {
      phase,
      artStyle,
      shot: shot.file,
      soloFocus,
      screenCoverage: live?.cov ?? 0,
      aabbSpan,
      ...fill,
    }
    metrics.push(row)
    console.log(
      `${phase} ${artStyle} ${shot.file} maskArea=${(fill.areaFrac * 100).toFixed(2)}% aabbH=${(aabbSpan * 100).toFixed(1)}% cov=${(row.screenCoverage * 100).toFixed(1)}%`,
    )
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
      const styles = shot.styles ?? ['watercolor', 'pixel-art']
      for (const artStyle of styles) {
        await bootstrap(page, run.url, artStyle)
        const pose = await poseFor(page, shot)
        if (!pose) throw new Error(`No pose for ${run.phase} ${shot.file}`)
        await capture(page, run.phase, artStyle, shot, pose)
      }
    }
  }

  writeFileSync(resolve(outDir, 'PIXEL_MASK_METRICS.json'), JSON.stringify(metrics, null, 2))
  writeFileSync(
    resolve(outDir, 'BUILD_SHA.txt'),
    `before=${beforeSha} ${beforeUrl}\nafter=${afterSha} ${afterUrl}\n`,
  )
} finally {
  await browser.close()
}