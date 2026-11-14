/**
 * Rocks + ambient props — pixel-art walk and watercolor open-world at the same overview pose.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { chromium } from 'playwright'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const afterSha =
  process.env.AFTER_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()
const beforeSha =
  process.env.BEFORE_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'main'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()

const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/3d-rocks-props-pass'
mkdirSync(outDir, { recursive: true })

const posePath = resolve(
  process.env.ARTIFACT_DIR || resolve(repoRoot, '..', 'artifacts'),
  'minecraft-walk-poses-desktop.json',
)

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

async function capturePair(artStyle) {
  let overviewPose = null
  if (existsSync(posePath)) {
    const poses = JSON.parse(readFileSync(posePath, 'utf8'))
    overviewPose = poses['walk-overview'] ?? null
  }
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [phase, url, sha] of [
      ['before', beforeUrl, beforeSha],
      ['after', afterUrl, afterSha],
    ]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
      await context.addInitScript(({ user, memories: seeded, style }) => {
        sessionStorage.setItem('mg:walk-capture', '1')
        sessionStorage.setItem('mg:walk-plant-focus', '1')
        localStorage.setItem('memorygarden:user', JSON.stringify(user))
        localStorage.setItem(
          `memorygarden:${user.id}:preferences`,
          JSON.stringify({
            hasCompletedOnboarding: true,
            plantStylePreference: { artStyle: style },
          }),
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
      await page.waitForTimeout(1200)
      const pose =
        (await page.evaluate(() => window.__mgWalkCapture?.clusterOverviewPose?.() ?? null)) ?? overviewPose
      if (!pose) throw new Error(`No overview pose for ${phase} ${artStyle}`)
      await page.evaluate((p) => window.__mgWalkCapture?.setPose?.(p), pose)
      await page.waitForTimeout(700)
      const suffix = artStyle === 'pixel-art' ? 'pixel-art-walk-rocks-props' : 'watercolor-open-world-rocks-props'
      const file = resolve(outDir, `garden-${phase}-${sha}-${suffix}-desktop.png`)
      await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
      console.log('Wrote', file)
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

writeFileSync(
  resolve(outDir, 'BUILD_SHA.txt'),
  `${spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()}\n`,
)

await capturePair('pixel-art')
await capturePair('watercolor')
console.log('Rocks/props artifacts in', outDir)