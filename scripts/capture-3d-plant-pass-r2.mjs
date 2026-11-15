/**
 * Round-2 plant polish artifacts: before main@225f0a9 vs after HEAD, identical pinned poses.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'
import { createRequire } from 'node:module'
import { classifyWalkCapturePixel, measureTreePixelFillFromPng } from './lib/walk-capture-pixel-fill.mjs'
import { computeGardenSceneryCloseupPose } from './lib/garden-scenery-poses.mjs'

const require = createRequire(import.meta.url)
const { PNG } = require('pngjs')

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/3d-plant-pass-r2'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeSha = process.env.BEFORE_SHA || '225f0a9'
const afterSha =
  process.env.AFTER_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'plant-pass-r2',
  avatarUrl: '',
}

const memories = [
  {
    id: 'tree-young-walk',
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'Young oak',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 438, y: 405 },
    emotionalTone: 'peaceful',
    plantStage: 'young',
    plantVariety: 'tree',
    visitCount: 2,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: 'walk-tree-young',
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
]

function measureNonSkyGrassHeightFillFromPng(pngPath) {
  const png = PNG.sync.read(readFileSync(pngPath))
  const w = png.width
  const h = png.height
  const x0 = Math.floor(w * 0.15)
  const x1 = Math.ceil(w * 0.85)
  let minY = h
  let maxY = -1
  let subjectPixels = 0
  for (let y = 0; y < h; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (w * y + x) * 4
      const r = png.data[i]
      const g = png.data[i + 1]
      const b = png.data[i + 2]
      const kind = classifyWalkCapturePixel(r, g, b)
      if (kind === 'sky' || kind === 'grass') continue
      subjectPixels++
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  if (subjectPixels < 40 || maxY < minY) {
    return { heightFill: 0, subjectPixels, top: NaN, bottom: NaN }
  }
  return {
    heightFill: (maxY - minY + 1) / h,
    subjectPixels,
    top: minY / h,
    bottom: (maxY + 1) / h,
    widthFill: (x1 - x0) / w,
  }
}

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
      sessionStorage.setItem('mg:walk-capture-tod', '14')
    },
    { user: demoUser, art: artStyle, seeded: memories },
  )
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  await page.evaluate((art) => window.__mgWalkCapture?.setPlantArtStyle?.(art), artStyle)
  await page.waitForTimeout(1500)
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
}

async function derivePinnedPoses(page) {
  await bootstrapWalk(page, afterUrl, 'watercolor')
  await page.evaluate((id) => window.__mgWalkCapture?.setSoloPlantFocus?.(id), 'tree-young-walk')
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
  const youngPose =
    (await page.evaluate((id) => window.__mgWalkCapture?.youngCloseupPose?.(id) ?? null, 'tree-young-walk')) ??
    (await page.evaluate((id) => window.__mgWalkCapture?.deterministicPlantPose?.(id) ?? null, 'tree-young-walk'))
  await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))

  await page.evaluate((art) => window.__mgWalkCapture?.setPlantArtStyle?.(art), 'pixel-art')
  await page.waitForTimeout(1200)
  await page.evaluate((id) => window.__mgWalkCapture?.setSoloPlantFocus?.(id), 'flower-bloom-walk')
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
  const flowerPose =
    (await page.evaluate((id) => window.__mgWalkCapture?.flowerCloseupPose?.(id) ?? null, 'flower-bloom-walk')) ??
    (await page.evaluate((id) => window.__mgWalkCapture?.deterministicPlantPose?.(id) ?? null, 'flower-bloom-walk'))
  await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))

  const overviewPose = await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
    return window.__mgWalkCapture?.clusterOverviewPose?.() ?? null
  })

  let stumpPose = await page.evaluate(() => window.__mgWalkCapture?.gardenSceneryCloseupPose?.('stump', 0.67) ?? null)
  if (!stumpPose) stumpPose = computeGardenSceneryCloseupPose('stump', undefined, 0.67)

  if (!youngPose || !flowerPose || !overviewPose || !stumpPose) {
    throw new Error(
      `Missing pose: young=${!!youngPose} flower=${!!flowerPose} overview=${!!overviewPose} stump=${!!stumpPose}`,
    )
  }

  const poses = { youngPose, flowerPose, overviewPose, stumpPose }
  writeFileSync(resolve(outDir, 'pinned-poses-r2.json'), JSON.stringify(poses, null, 2))
  return poses
}

async function captureWithPose(page, baseUrl, artStyle, { pose, plantId, fileName }) {
  await bootstrapWalk(page, baseUrl, artStyle)
  await page.evaluate((p) => window.__mgWalkCapture?.setPose?.(p), pose)
  if (plantId) {
    await page.evaluate((id) => window.__mgWalkCapture?.setSoloPlantFocus?.(id), plantId)
  } else {
    await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
  }
  await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
  })
  await page.waitForTimeout(500)
  let projected = null
  if (plantId) {
    projected = await page.evaluate((id) => window.__mgWalkCapture?.plantProjectedAabbScreen?.(id) ?? null, plantId)
  }
  const outPath = resolve(outDir, fileName)
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: outPath })
  if (plantId) await page.evaluate(() => window.__mgWalkCapture?.setSoloPlantFocus?.(null))
  return { outPath, projected }
}

const shotDescriptions = {
  'watercolor-young-tree-closeup-day':
    'Daytime watercolor Walk close-up of solo young oak (pinned youngCloseupPose).',
  'pixel-flower-closeup-day': 'Daytime pixel-art Walk close-up of happy bloom flower (tone-colored petals).',
  'pixel-stump-closeup-day': 'Daytime pixel-art log stump with ground roots (garden scenery pose).',
  'pixel-overview-day': 'Daytime pixel-art wide cluster overview (rocks/props parity check).',
}

const shots = [
  {
    slug: 'watercolor-young-tree-closeup-day',
    artStyle: 'watercolor',
    plantId: 'tree-young-walk',
    poseKey: 'youngPose',
    measure: 'tree-png',
  },
  {
    slug: 'pixel-flower-closeup-day',
    artStyle: 'pixel-art',
    plantId: 'flower-bloom-walk',
    poseKey: 'flowerPose',
    measure: 'subject-png',
  },
  {
    slug: 'pixel-stump-closeup-day',
    artStyle: 'pixel-art',
    plantId: null,
    poseKey: 'stumpPose',
    measure: 'subject-png',
  },
  {
    slug: 'pixel-overview-day',
    artStyle: 'pixel-art',
    plantId: null,
    poseKey: 'overviewPose',
    measure: 'overview',
  },
]

const browser = await chromium.launch({ headless: true })
const measurements = []
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addInitScript(({ user, seeded }) => {
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
    sessionStorage.setItem('mg:walk-capture', '1')
    sessionStorage.setItem('mg:walk-plant-focus', '1')
    sessionStorage.setItem('mg:walk-capture-tod', '14')
    localStorage.setItem('memorygarden:user', JSON.stringify(user))
    localStorage.setItem(
      `memorygarden:${user.id}:preferences`,
      JSON.stringify({ hasCompletedOnboarding: true, plantStylePreference: { artStyle: 'pixel-art' } }),
    )
    localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
  }, { user: demoUser, seeded: memories })
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  const page = await context.newPage()
  const poses = await derivePinnedPoses(page)

  for (const phase of ['before', 'after']) {
    const sha = phase === 'before' ? beforeSha : afterSha
    const url = phase === 'before' ? beforeUrl : afterUrl
    for (const shot of shots) {
      const fileName = `${shot.slug}-${phase}-${sha}.png`
      const { outPath, projected } = await captureWithPose(page, url, shot.artStyle, {
        pose: poses[shot.poseKey],
        plantId: shot.plantId,
        fileName,
      })
      let heightFillPng = null
      let widthFillPng = null
      if (shot.measure === 'tree-png') {
        const m = measureTreePixelFillFromPng(outPath)
        heightFillPng = m.height
        widthFillPng = m.width
        if (phase === 'after' && heightFillPng < 0.3) {
          throw new Error(`After young tree PNG height fill ${heightFillPng.toFixed(3)} < 0.30`)
        }
      } else if (shot.measure === 'subject-png') {
        const m = measureNonSkyGrassHeightFillFromPng(outPath)
        heightFillPng = m.heightFill
        widthFillPng = m.widthFill
        if (phase === 'after' && shot.slug.includes('flower') && heightFillPng < 0.2) {
          throw new Error(`After flower PNG height fill ${heightFillPng.toFixed(3)} < 0.20`)
        }
      }
      const projectedHeight =
        projected && Number.isFinite(projected.bottom) && Number.isFinite(projected.top)
          ? projected.bottom - projected.top
          : null
      const row = {
        file: fileName,
        path: outPath,
        phase,
        sha,
        shot: shot.slug,
        heightFillPng,
        widthFillPng,
        projectedHeightFill: projectedHeight,
        description: shotDescriptions[shot.slug],
      }
      measurements.push(row)
      console.log('captured', JSON.stringify(row))
    }
  }
} finally {
  await browser.close()
}

writeFileSync(
  resolve(outDir, 'BUILD_SHA.txt'),
  `before=${beforeSha} url=${beforeUrl}\nafter=${afterSha} url=${afterUrl}\ncaptured=${new Date().toISOString()}\n`,
)
writeFileSync(resolve(outDir, 'MEASUREMENTS.json'), JSON.stringify(measurements, null, 2))
writeFileSync(
  resolve(outDir, 'README.md'),
  `# 3D plant pass round 2\n\n${measurements.map((m) => `- **${m.file}**: PNG height fill ${m.heightFillPng == null ? 'n/a' : `${(m.heightFillPng * 100).toFixed(1)}%`}${m.projectedHeightFill != null ? `; projected ${(m.projectedHeightFill * 100).toFixed(1)}%` : ''} — ${m.description}`).join('\n')}\n`,
)