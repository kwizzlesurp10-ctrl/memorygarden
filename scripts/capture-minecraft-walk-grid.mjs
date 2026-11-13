/**
 * Full before/after grid with pinned camera poses (identical for watercolor & pixel).
 * Env: AFTER_URL, BEFORE_URL, ARTIFACT_DIR, VIEWPORT=desktop|mobile
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const viewportMode = process.env.VIEWPORT || 'desktop'
mkdirSync(outDir, { recursive: true })

const posePath = resolve(outDir, `minecraft-walk-poses-${viewportMode}.json`)

const viewports = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
}

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'minecraft-walk-v2',
  avatarUrl: '',
}

/** Tight cluster so overview shows multiple plants in midground. */
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

const shots = [
  { kind: 'overview', file: 'walk-overview', plantId: null },
  { kind: 'tree-mature', plantId: 'tree-mature-walk', file: 'walk-tree-mature-closeup', minCov: 0.42 },
  { kind: 'tree-elder', plantId: 'tree-elder-walk', file: 'walk-tree-elder-closeup', minCov: 0.42 },
  { kind: 'flower', plantId: 'flower-bloom-walk', file: 'walk-flower-closeup', minCov: 0.4 },
  { kind: 'mushroom', plantId: 'mushroom-walk', file: 'walk-mushroom-closeup', minCov: 0.4 },
  { kind: 'sprout', plantId: 'sprout-walk', file: 'walk-sprout-closeup', minCov: 0.28 },
]

async function enterWalk(page) {
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(50)
  }
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) btn.click()
  })
  await page.waitForTimeout(1800)
  await page.locator('[data-testid="open-world-garden"] canvas').first().waitFor({ state: 'visible', timeout: 90_000 })
  await page.waitForFunction(
    () => (window.__mgWalkCapture?.worldPlants?.() ?? []).length >= 5,
    undefined,
    { timeout: 90_000 },
  )
  await page.waitForFunction(
    () => typeof window.__mgWalkCapture?.plantCaptureFitNow === 'function',
    undefined,
    { timeout: 90_000 },
  )
  await page.waitForTimeout(800)
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
  await page.evaluate((art) => {
    window.__mgWalkCapture?.setPlantArtStyle?.(art)
  }, artStyle)
  await page.waitForTimeout(2800)
}

async function applyPose(page, pose) {
  await page.evaluate(async (p) => {
    await window.__mgWalkCapture?.showcaseModel?.(null)
    window.__mgWalkCapture?.setPose?.(p)
  }, pose)
  await page.waitForTimeout(2200)
}

async function derivePlantPose(page, plantId, targetFrac, minCov) {
  return page.evaluate(
    ({ plantId: id, targetFrac: target, minCov: min }) => {
      const wp = window.__mgWalkCapture?.worldPlants?.().find((p) => p.id === id)
      if (!wp) throw new Error(`No world plant ${id}`)
      if (!window.__mgWalkCapture?.hasPlantGroup?.(id)) {
        throw new Error(`No Object3D for plant ${id}`)
      }
      let best = null
      let bestScore = Infinity
      const pitchSteps = [-0.14, -0.22, -0.3]
      for (let a = 0; a < 16; a++) {
        const ang = a * (Math.PI / 8)
        for (let dist = 2.6; dist <= 10.5; dist += 0.38) {
          const x = wp.x + Math.sin(ang) * dist
          const z = wp.z + Math.cos(ang) * dist
          const baseYaw = Math.atan2(wp.x - x, wp.z - z)
          for (const pitch of pitchSteps) {
            for (const dYaw of [0, -0.4, 0.4]) {
              const pose = { x, z, yaw: baseYaw + dYaw, pitch, eyeY: 1.62 }
              window.__mgWalkCapture?.setPose?.(pose)
              const frac = window.__mgWalkCapture?.plantScreenCoverage?.(id) ?? 0
              const fit = window.__mgWalkCapture?.plantCaptureFitNow?.(id)
              if (frac < 0.25 || frac > 0.9) continue
              const cx = fit?.centerX ?? 2
              const cy = fit?.centerY ?? 2
              const score = Math.abs(frac - target) + Math.abs(cx) * 0.45 + Math.abs(cy) * 0.5
              if (score < bestScore) {
                bestScore = score
                best = { ...pose, screenFrac: frac }
              }
            }
          }
        }
      }
      if (!best) throw new Error(`No framed pose for plant ${id}`)
      return best
    },
    { plantId, targetFrac, minCov },
  )
}

async function derivePoses(page) {
  const poses = {}
  const overview = await page.evaluate(() => window.__mgWalkCapture?.clusterOverviewPose?.())
  if (!overview) throw new Error('clusterOverviewPose returned null')
  poses['walk-overview'] = overview

  for (const shot of shots) {
    if (!shot.plantId) continue
    const target = shot.plantId.includes('sprout') ? 0.48 : 0.58
    const pose = await derivePlantPose(page, shot.plantId, target, shot.minCov)
    await applyPose(page, pose)
    const cov = await page.evaluate(
      ({ id, p }) => window.__mgWalkCapture?.plantScreenCoverage?.(id, p) ?? 0,
      { id: shot.plantId, p: pose },
    )
    const centered = await page.evaluate(
      ({ id, p }) => {
        const fit = window.__mgWalkCapture?.plantCaptureFitAt?.(id, p)
        return fit ? Math.abs(fit.centerX) < 0.55 && Math.abs(fit.centerY) < 0.55 : false
      },
      { id: shot.plantId, p: pose },
    )
    if (!centered) {
      throw new Error(`Plant ${shot.plantId} not centered at pinned pose`)
    }
    if (cov < shot.minCov) {
      throw new Error(`Plant ${shot.plantId} screen coverage ${cov.toFixed(3)} < min ${shot.minCov}`)
    }
    console.log('pose ok', shot.file, 'cov', cov.toFixed(3), 'frac', pose.screenFrac?.toFixed(3))
    poses[shot.file] = pose
  }
  writeFileSync(posePath, JSON.stringify(poses, null, 2))
  return poses
}

async function captureShot(page, phase, artStyle, shot, pose) {
  await applyPose(page, pose)
  const shouldAssert = phase === 'after' && artStyle === 'pixel-art' && shot.plantId
  if (shouldAssert) {
    const cov = await page.evaluate(
      ({ id, p }) => window.__mgWalkCapture?.plantScreenCoverage?.(id, p) ?? 0,
      { id: shot.plantId, p: pose },
    )
    if (cov < shot.minCov) {
      throw new Error(
        `[${phase}/${artStyle}] ${shot.file}: plant coverage ${cov.toFixed(3)} < ${shot.minCov}`,
      )
    }
    console.log('capture cov', phase, artStyle, shot.file, cov.toFixed(3))
  }
  const name = `minecraft-walk-${phase}-${artStyle}-${shot.file}-${viewportMode}.png`
  const file = resolve(outDir, name)
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path: file })
  console.log('Wrote', file)
  return file
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

  let poses = null
  if (process.env.LOAD_POSES === '1' && existsSync(posePath)) {
    poses = JSON.parse(readFileSync(posePath, 'utf8'))
  } else {
    await bootstrapWalk(page, afterUrl, 'pixel-art')
    const v = await page.evaluate(() => window.__mgWalkCapture?.voxelMeshCount?.() ?? 0)
    if (v < 40) throw new Error(`Expected voxels on AFTER build, got ${v}`)
    poses = await derivePoses(page)
  }

  const runs = [
    { phase: 'after', url: afterUrl, styles: ['pixel-art', 'watercolor'] },
    { phase: 'before', url: beforeUrl, styles: ['pixel-art', 'watercolor'] },
  ]

  for (const run of runs) {
    for (const artStyle of run.styles) {
      await bootstrapWalk(page, run.url, artStyle)
      for (const shot of shots) {
        const pose = poses[shot.file]
        if (!pose) throw new Error(`Missing pinned pose for ${shot.file}`)
        await captureShot(page, run.phase, artStyle, shot, pose)
      }
    }
  }
} finally {
  await browser.close()
}
