/**
 * Scoped garden props + rock parity captures (watercolor fence, pixel stump, wide overview).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'
import { computeGardenSceneryCloseupPose } from './lib/garden-scenery-poses.mjs'
import { centerTwentyPercentTooUniform } from './lib/scenery-capture-validate.mjs'

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

async function captureSubject(browser, { artStyle, subject, phase, url, sha, lightingHour, pullBack }) {
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
        if (args.length === 0) return atHour()
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
      JSON.stringify({ hasCompletedOnboarding: true, plantStylePreference: { artStyle: style } }),
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
  const pose = computeGardenSceneryCloseupPose(subject, undefined, pullBack)
  if (!pose) throw new Error(`No scenery pose for ${subject}`)
  await page.evaluate((p) => window.__mgWalkCapture?.setPose?.(p), pose)
  await page.waitForTimeout(600)
  const slug = subject === 'fence' ? 'fence-closeup' : 'stump-closeup'
  const todTag = lightingHour >= 18 ? 'dusk' : 'day'
  const styleTag =
    artStyle === 'pixel-art' ? `pixel-art-walk-${slug}` : `watercolor-open-world-${slug}`
  const file = resolve(
    outDir,
    `garden-${phase}-${sha}-${styleTag}-${todTag}-desktop.png`,
  )
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
  const uniform = phase === 'after' && artStyle === 'pixel-art' && centerTwentyPercentTooUniform(file)
  if (uniform) {
    throw new Error(`Capture center-uniform check failed for ${artStyle} ${subject}`)
  }
  console.log(`Wrote ${file}`)
  await context.close()
  return file
}

async function captureWideOverview(browser, artStyle, phase, url, sha) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addInitScript(({ user, memories: seeded, style }) => {
    sessionStorage.setItem('mg:walk-capture', '1')
    sessionStorage.setItem('mg:walk-plant-focus', '1')
    localStorage.setItem('memorygarden:user', JSON.stringify(user))
    localStorage.setItem(
      `memorygarden:${user.id}:preferences`,
      JSON.stringify({ hasCompletedOnboarding: true, plantStylePreference: { artStyle: style } }),
    )
    localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
  }, { user: demoUser, memories, style: artStyle })
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  await page.evaluate((s) => window.__mgWalkCapture?.setPlantArtStyle?.(s), artStyle)
  const pose = await page.evaluate(async () => {
    await window.__mgWalkCapture?.waitCaptureReady?.()
    return window.__mgWalkCapture?.clusterOverviewPose?.() ?? null
  })
  if (!pose) throw new Error('clusterOverviewPose unavailable')
  await page.evaluate((p) => window.__mgWalkCapture?.setPose?.(p), pose)
  await page.waitForTimeout(600)
  const file = resolve(
    outDir,
    `garden-${phase}-${sha}-${artStyle === 'pixel-art' ? 'pixel-art' : 'watercolor'}-walk-overview-desktop.png`,
  )
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
  console.log(`Wrote ${file}`)
  await context.close()
  return file
}

const shotLog = []

const browser = await chromium.launch({ headless: true })
try {
  for (const [phase, url, sha] of [
    ['before', beforeUrl, beforeSha],
    ['after', afterUrl, afterSha],
  ]) {
    const wcFence = await captureSubject(browser, {
      artStyle: 'watercolor',
      subject: 'fence',
      phase,
      url,
      sha,
      lightingHour: 14,
      pullBack: 0.88,
    })
    shotLog.push({ file: wcFence, subject: 'watercolor-fence', phase })
    const pxStump = await captureSubject(browser, {
      artStyle: 'pixel-art',
      subject: 'stump',
      phase,
      url,
      sha,
      lightingHour: 14,
      pullBack: 0.67,
    })
    shotLog.push({ file: pxStump, subject: 'pixel-stump-day', phase })
    for (const wideStyle of ['pixel-art', 'watercolor']) {
      const wide = await captureWideOverview(browser, wideStyle, phase, url, sha)
      shotLog.push({ file: wide, subject: `${wideStyle}-overview`, phase })
    }
  }
  const dusk = await captureSubject(browser, {
    artStyle: 'pixel-art',
    subject: 'stump',
    phase: 'after',
    url: afterUrl,
    sha: afterSha,
    lightingHour: 19.5,
    pullBack: 0.64,
  })
  shotLog.push({ file: dusk, subject: 'pixel-stump-dusk', phase: 'after' })
} finally {
  await browser.close()
}

writeFileSync(
  resolve(outDir, 'BUILD_SHA.txt'),
  `before=${beforeSha} after=${afterSha}\n${spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()}\n`,
)
writeFileSync(resolve(outDir, 'SCENERY_SHOT_DESCRIPTIONS.json'), JSON.stringify(shotLog, null, 2))
writeFileSync(
  resolve(outDir, 'SCENERY_SHOT_DESCRIPTIONS.md'),
  `# Scenery captures (after @ \`${afterSha}\`, before @ \`${beforeSha}\`)

## In-world scope after this PR
- **Rocks:** identical to main @ \`40da93a\` (no tier lineup, no voxelSteppedBoulder, no walk rock culling).
- **Watercolor fence:** ~1.08 m posts + rail at \`(19, 24)\`.
- **Pixel stump:** voxel log at \`(-17, 27)\`; no pixel fence; no watercolor stump.

## Shots
${shotLog.map((s) => `- \`${s.file.split('/').pop()}\` — ${s.subject} (${s.phase})`).join('\n')}
`,
)
console.log('Artifacts in', outDir)