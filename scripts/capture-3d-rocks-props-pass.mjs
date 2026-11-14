/**
 * Rocks + ambient props — daytime close-ups (40–60% frame) for walk + open-world watercolor.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import { computeGardenSceneryCloseupPose } from './lib/garden-scenery-poses.mjs'
import {
  centerSubjectFillRatio,
  centerTwentyPercentTooUniform,
} from './lib/scenery-capture-validate.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const afterSha =
  process.env.AFTER_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()
const beforeSha = process.env.BEFORE_SHA || '40da93a'

const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/3d-rocks-props-pass'
mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'rocks-props-capture',
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
]

const subjects = [
  { id: 'rock-tiers', slug: 'rocks-tier-closeup' },
  { id: 'fence', slug: 'fence-closeup' },
  { id: 'stump', slug: 'stump-closeup' },
]

const poseCachePath = resolve(outDir, 'garden-scenery-poses.json')
let pinnedSceneryPoses = existsSync(poseCachePath)
  ? JSON.parse(readFileSync(poseCachePath, 'utf8'))
  : {}

function diffRatio(aPath, bPath) {
  if (!existsSync(aPath) || !existsSync(bPath)) return NaN
  const a = PNG.sync.read(readFileSync(aPath))
  const b = PNG.sync.read(readFileSync(bPath))
  if (a.width !== b.width || a.height !== b.height) return NaN
  let n = 0
  for (let i = 0; i < a.data.length; i += 4) {
    const dr = Math.abs(a.data[i] - b.data[i])
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1])
    const db = Math.abs(a.data[i + 2] - b.data[i + 2])
    if (dr + dg + db > 36) n++
  }
  return n / (a.width * a.height)
}

function measureCenterSubjectFill(pngPath) {
  const png = PNG.sync.read(readFileSync(pngPath))
  const w = png.width
  const h = png.height
  const cx0 = Math.floor(w * 0.28)
  const cx1 = Math.ceil(w * 0.72)
  const cy0 = Math.floor(h * 0.22)
  const cy1 = Math.ceil(h * 0.88)
  let nonSkyGrass = 0
  let total = 0
  for (let y = cy0; y < cy1; y++) {
    for (let x = cx0; x < cx1; x++) {
      const i = (w * y + x) * 4
      const r = png.data[i]
      const g = png.data[i + 1]
      const b = png.data[i + 2]
      const sky = b >= 125 && g >= 88 && r >= 70 && b > r + 2
      const grass = g >= 88 && g > r + 14 && g > b - 12 && r < 150 && b < 200
      if (!sky && !grass) nonSkyGrass++
      total++
    }
  }
  return total > 0 ? nonSkyGrass / total : 0
}

async function enterWalk(page) {
  await page.evaluate(() => {
    sessionStorage.setItem('mg:walk-capture', '1')
    sessionStorage.setItem('mg:walk-plant-focus', '1')
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.locator('[data-testid="open-world-garden"] canvas').first().waitFor({ state: 'visible', timeout: 90_000 })
  await page.waitForFunction(() => window.__mgWalkCapture?.ready?.() === true, undefined, { timeout: 90_000 })
}

async function captureSubject(browser, artStyle, subject, phase, url, sha, lightingHour) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addInitScript(({ user, memories: seeded, style, todHour }) => {
    const baseDate = Date
    const atHour = () => {
      const d = new baseDate()
      const h = Math.floor(todHour)
      const m = Math.round((todHour - h) * 60)
      d.setHours(h, m, 0, 0)
      return d
    }
    // eslint-disable-next-line no-global-assign
    Date = class extends baseDate {
      constructor(...args) {
        if (args.length === 0) {
          return atHour()
        }
        super(...args)
      }
      static now() {
        return atHour().getTime()
      }
    }
    sessionStorage.setItem('mg:walk-capture', '1')
    sessionStorage.setItem('mg:walk-plant-focus', '1')
    sessionStorage.setItem('mg:walk-capture-tod', String(todHour))
    localStorage.setItem('memorygarden:user', JSON.stringify(user))
    localStorage.setItem(
      `memorygarden:${user.id}:preferences`,
      JSON.stringify({
        hasCompletedOnboarding: true,
        plantStylePreference: { artStyle: style },
      }),
    )
    localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
  }, { user: demoUser, memories, style: artStyle, todHour: lightingHour })
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  await page.evaluate((s) => window.__mgWalkCapture?.setPlantArtStyle?.(s), artStyle)
  await page.evaluate((h) => {
    sessionStorage.setItem('mg:walk-capture-tod', String(h))
    window.__mgWalkCapture?.setTodHour?.(h)
  }, lightingHour)
  await page.waitForTimeout(500)
  let pose = pinnedSceneryPoses[subject.id]
  if (!pose) {
    pose = await page.evaluate(
      (kind) => window.__mgWalkCapture?.gardenSceneryCloseupPose?.(kind) ?? null,
      subject.id,
    )
  }
  if (!pose) pose = computeGardenSceneryCloseupPose(subject.id)
  if (!pose) throw new Error(`No scenery pose for ${subject.id}`)
  const suffix =
    artStyle === 'pixel-art' ? `pixel-art-walk-${subject.slug}` : `watercolor-open-world-${subject.slug}`
  const todTag = lightingHour >= 18 ? 'dusk' : 'day'
  const file = resolve(outDir, `garden-${phase}-${sha}-${suffix}-${todTag}-desktop.png`)

  let chosenPose = pose
  let fill = 0
  let uniform = true
  let usedPullBack = 1
  const basePull = artStyle === 'watercolor' ? 0.58 : 1
  const duskExtra = lightingHour >= 18 ? 0.35 : 0
  for (let attempt = 0; attempt < 5; attempt++) {
    const pullBack = basePull + duskExtra + attempt * 0.12
    usedPullBack = pullBack
    chosenPose =
      (await page.evaluate(
        (kind) => window.__mgWalkCapture?.gardenSceneryCloseupPose?.(kind) ?? null,
        subject.id,
      )) ?? computeGardenSceneryCloseupPose(subject.id, undefined, pullBack)
    if (url !== afterUrl || phase === 'before') {
      chosenPose = computeGardenSceneryCloseupPose(subject.id, undefined, pullBack)
    }
    await page.evaluate((p) => window.__mgWalkCapture?.setPose?.(p), chosenPose)
    await page.waitForTimeout(650)
    await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
    uniform = centerTwentyPercentTooUniform(file)
    fill = centerSubjectFillRatio(file)
    if (!uniform && fill >= 0.32 && fill <= 0.62) break
  }

  if (phase === 'after' && uniform) {
    throw new Error(
      `Capture failed center-uniform check (camera inside geometry?) for ${artStyle} ${subject.id} ${phase}`,
    )
  }
  if (fill < 0.32 || fill > 0.62) {
    console.warn(
      `fill out of 35-60% band for ${artStyle} ${subject.id} ${phase}: ${(fill * 100).toFixed(1)}%`,
    )
  }

  if (phase === 'after' && url === afterUrl) {
    pinnedSceneryPoses[subject.id] = chosenPose
    writeFileSync(poseCachePath, JSON.stringify(pinnedSceneryPoses, null, 2))
  }

  console.log(
    `Wrote ${file} centerFill=${(fill * 100).toFixed(1)}% uniform=${uniform} pullBack=${usedPullBack.toFixed(2)}`,
  )
  await context.close()
  return { file, fill, subject: subject.id, artStyle, phase, todTag, pullBack: usedPullBack }
}

const metrics = []
const shotDescriptions = []

async function runArtStyle(artStyle) {
  const browser = await chromium.launch({ headless: true })
  try {
    const poses = {}
    for (const subject of subjects) {
      for (const [phase, url, sha] of [
        ['before', beforeUrl, beforeSha],
        ['after', afterUrl, afterSha],
      ]) {
        const shot = await captureSubject(browser, artStyle, subject, phase, url, sha, 14)
        const { file, fill } = shot
        poses[`${subject.id}-${phase}`] = file
        const beforeFile = poses[`${subject.id}-before`]
        const afterFile = poses[`${subject.id}-after`]
        shotDescriptions.push({
          file: shot.file,
          artStyle: shot.artStyle,
          phase: shot.phase,
          subject: shot.subject,
          centerFill: shot.fill,
        })
        if (phase === 'after') {
          const diff = diffRatio(beforeFile, afterFile)
          metrics.push({
            artStyle,
            subject: subject.id,
            lighting: 'day',
            before: beforeFile,
            after: afterFile,
            pixelDiff: diff,
            afterSubjectFill: fill,
            note: 'pixel diff is informational only; see SCENERY_SHOT_DESCRIPTIONS',
          })
          console.log(`${artStyle} ${subject.id} refDiff=${(diff * 100).toFixed(2)}% fill=${(fill * 100).toFixed(1)}%`)
        }
      }
    }
    if (artStyle === 'pixel-art') {
      const dusk = await captureSubject(
        browser,
        'pixel-art',
        { id: 'stump', slug: 'stump-closeup' },
        'after',
        afterUrl,
        afterSha,
        19.5,
      )
      shotDescriptions.push({
        file: dusk.file,
        artStyle: 'pixel-art',
        phase: 'after',
        subject: 'stump-dusk',
        centerFill: dusk.fill,
      })
    }
  } finally {
    await browser.close()
  }
}

await runArtStyle('pixel-art')
await runArtStyle('watercolor')

writeFileSync(
  resolve(outDir, 'BUILD_SHA.txt'),
  `before=${beforeSha} after=${afterSha}\n${spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()}\n`,
)
writeFileSync(resolve(outDir, 'SCENERY_CLOSEUP_METRICS.json'), JSON.stringify(metrics, null, 2))
writeFileSync(
  resolve(outDir, 'SCENERY_SHOT_DESCRIPTIONS.json'),
  JSON.stringify(shotDescriptions, null, 2),
)
console.log('Rocks/props artifacts in', outDir)