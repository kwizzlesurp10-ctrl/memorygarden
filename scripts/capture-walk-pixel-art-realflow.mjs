/**
 * Pixel-art Walk via normal UI — no mg:walk-capture.
 * Uses addInitScript so getLocalUser() reads the seeded profile on first load.
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'minecraft-walk-realflow',
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
]

const seedPayload = { user: demoUser, memories }

async function waitWalkScene(page) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-testid="open-world-garden"]')
      const canvas = root?.querySelector('canvas')
      if (!(canvas instanceof HTMLCanvasElement)) return false
      if (canvas.clientWidth < 80 || canvas.clientHeight < 80) return false
      return typeof window.__mgWalkSceneReady === 'function' && window.__mgWalkSceneReady() === true
    },
    undefined,
    { timeout: 120_000 },
  )
  await page.evaluate(async () => {
    for (let i = 0; i < 6; i++) {
      await new Promise((resolve) => requestAnimationFrame(() => resolve()))
    }
  })
}

async function enterWalk(page) {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(30)
  }
  const enterBtn = page.getByTestId('enter-walk-button')
  if (await enterBtn.isVisible().catch(() => false)) {
    await enterBtn.click({ timeout: 30_000 })
  } else {
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="enter-walk-button"]')
      if (btn instanceof HTMLElement) btn.click()
    })
  }
  await waitWalkScene(page)
}

async function walkToward(page, ms, keys) {
  for (const code of keys) await page.keyboard.down(code)
  await page.waitForTimeout(ms)
  for (const code of keys) await page.keyboard.up(code)
  await page.waitForTimeout(800)
}

async function shotCanvas(page, file) {
  const path = resolve(outDir, file)
  const errors = await page.evaluate(() => {
    const failed = document.body.innerText.includes('hit a snag')
    return { failed, webglFailed: !!document.querySelector('[data-testid="open-world-garden"]')?.textContent?.includes('WebGL') }
  })
  if (errors.failed) {
    throw new Error(`Open-world walk error before shot ${file}`)
  }
  const canvas = page.locator('[data-testid="open-world-garden"] canvas').first()
  const stats = await page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="open-world-garden"] canvas')
    if (!(canvas instanceof HTMLCanvasElement)) return { ok: false, reason: 'no canvas' }
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return { ok: false, reason: 'no webgl' }
    const x = Math.floor(canvas.width * 0.45)
    const y = Math.floor(canvas.height * 0.45)
    const px = new Uint8Array(4)
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
    return { ok: true, avg: { r: px[0], g: px[1], b: px[2] } }
  })
  if (!stats.ok) {
    console.warn('canvas sample skipped', stats.reason)
  }
  await canvas.screenshot({ path })
  console.log('Wrote', path, stats.ok ? `avg rgb ${JSON.stringify(stats.avg)}` : '')
}

const browser = await chromium.launch({ headless: true })

try {
  const makeContext = async (viewport, mobile) => {
    const context = await browser.newContext({
      viewport,
      isMobile: mobile,
      hasTouch: mobile,
    })
    await context.addInitScript((payload) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(payload.user))
      localStorage.setItem(
        `memorygarden:${payload.user.id}:preferences`,
        JSON.stringify({
          hasCompletedOnboarding: true,
          plantStylePreference: { artStyle: 'pixel-art' },
        }),
      )
      localStorage.setItem(`memorygarden:${payload.user.id}:memories`, JSON.stringify(payload.memories))
      sessionStorage.setItem('mg:walk-plant-focus', '1')
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
    }, seedPayload)
    await context.route('**/api/**', (route) =>
      route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
    )
    return context
  }

  const desktop = await makeContext({ width: 1280, height: 800 }, false)
  const desktopPage = await desktop.newPage()
  const consoleErrors = []
  const logConsole = (prefix, msg) => consoleErrors.push(`[${prefix}] ${msg}`)
  desktopPage.on('pageerror', (e) => logConsole('pageerror', String(e)))
  desktopPage.on('console', (msg) => {
    if (msg.type() === 'error') logConsole('console', msg.text())
  })
  await desktopPage.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(desktopPage)
  await walkToward(desktopPage, 1600, ['KeyW'])
  await shotCanvas(desktopPage, 'minecraft-walk-realflow-desktop-near-tree.png')

  await walkToward(desktopPage, 3200, ['KeyW'])
  await shotCanvas(desktopPage, 'minecraft-walk-realflow-desktop-hill-step.png')

  await walkToward(desktopPage, 2200, ['KeyA'])
  await walkToward(desktopPage, 800, ['KeyW'])
  const canvas = desktopPage.locator('[data-testid="open-world-garden"] canvas').first()
  await canvas.click({ position: { x: 640, y: 400 }, force: true })
  await desktopPage.waitForTimeout(200)
  await desktopPage.evaluate(() => {
    window.__mgWalkNudgePose?.({
      x: -22.4567746653731,
      z: 16.03001368630009,
      yaw: 0.65,
      pitch: -0.42,
      eyeY: 2.44,
    })
  })
  await desktopPage.waitForTimeout(800)
  await shotCanvas(desktopPage, 'minecraft-walk-realflow-desktop-near-flowers.png')
  if (consoleErrors.length) console.log('desktop page errors', consoleErrors.slice(0, 3))
  await desktop.close()

  const mobile = await makeContext({ width: 390, height: 844 }, true)
  const mobilePage = await mobile.newPage()
  await mobilePage.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(mobilePage)
  await walkToward(mobilePage, 2600, ['KeyW'])
  await shotCanvas(mobilePage, 'minecraft-walk-realflow-mobile-walk-height.png')
  await mobile.close()
} finally {
  await browser.close()
}
