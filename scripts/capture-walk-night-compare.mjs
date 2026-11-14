/**
 * Night walk comparison: pixel-art vs watercolor at the same clock time.
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const night = { y: 2026, m: 5, d: 15, h: 22, min: 30 }

mkdirSync(outDir, { recursive: true })

const demoUser = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  login: 'minecraft-walk-night',
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
]

const seedPayload = { user: demoUser, memories }

async function waitWalkScene(page) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-testid="open-world-garden"]')
      const canvas = root?.querySelector('canvas')
      if (!(canvas instanceof HTMLCanvasElement)) return false
      if (canvas.clientWidth < 80) return false
      return typeof window.__mgWalkSceneReady === 'function' && window.__mgWalkSceneReady() === true
    },
    undefined,
    { timeout: 120_000 },
  )
  await page.evaluate(async () => {
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => requestAnimationFrame(r))
    }
  })
}

async function enterWalk(page) {
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

async function captureStyle(browser, artStyle, file) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await context.addInitScript((payload) => {
    localStorage.setItem('memorygarden:user', JSON.stringify(payload.user))
    localStorage.setItem(
      `memorygarden:${payload.user.id}:preferences`,
      JSON.stringify({
        hasCompletedOnboarding: true,
        plantStylePreference: { artStyle: payload.artStyle },
      }),
    )
    localStorage.setItem(`memorygarden:${payload.user.id}:memories`, JSON.stringify(payload.memories))
    sessionStorage.setItem('mg:walk-plant-focus', '1')
    sessionStorage.setItem('mg:walk-hide-pointer-hint', '1')
    const OriginalDate = Date
    const { y, m, d, h, min } = payload.night
    // eslint-disable-next-line no-global-assign
    Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) super(y, m, d, h, min, 0)
        else super(...args)
      }
      static now() {
        return new OriginalDate(y, m, d, h, min, 0).getTime()
      }
    }
  }, { ...seedPayload, artStyle, night })
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await enterWalk(page)
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(1400)
  await page.keyboard.up('KeyW')
  await waitWalkScene(page)
  const path = resolve(outDir, file)
  await page.locator('[data-testid="open-world-garden"] canvas').first().screenshot({ path })
  const avg = await page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="open-world-garden"] canvas')
    if (!(canvas instanceof HTMLCanvasElement)) return null
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return null
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    for (let yi = 0.55; yi <= 0.75; yi += 0.05) {
      for (let xi = 0.35; xi <= 0.65; xi += 0.05) {
        const px = new Uint8Array(4)
        gl.readPixels(
          Math.floor(canvas.width * xi),
          Math.floor(canvas.height * yi),
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          px,
        )
        r += px[0]
        g += px[1]
        b += px[2]
        n++
      }
    }
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
  })
  console.log('Wrote', path, 'avg', avg)
  await context.close()
  return avg
}

const browser = await chromium.launch({ headless: true })
try {
  const watercolor = await captureStyle(browser, 'watercolor', 'minecraft-walk-night-watercolor-desktop.png')
  const pixel = await captureStyle(browser, 'pixel-art', 'minecraft-walk-night-pixel-art-desktop.png')
  const report = {
    time: `${night.h}:${String(night.min).padStart(2, '0')}`,
    watercolorAvg: watercolor,
    pixelArtAvg: pixel,
  }
  console.log('night compare', JSON.stringify(report))
} finally {
  await browser.close()
}
