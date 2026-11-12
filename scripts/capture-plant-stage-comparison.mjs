import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
mkdirSync(outDir, { recursive: true })

const STAGES = [
  'seed',
  'sprout',
  'seedling',
  'young',
  'bud',
  'bloom',
  'mature',
  'elder',
]

const demoUser = {
  id: '11111111-1111-4111-8111-111111111111',
  login: 'stage-demo',
  avatarUrl: '',
}

function stageMemories(variety) {
  return STAGES.map((stage, i) => ({
    id: `cap-${variety}-${stage}`,
    photoUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: `${variety} ${stage}`,
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 200 + i * 100, y: 450 },
    emotionalTone: 'peaceful',
    plantStage: stage,
    plantVariety: variety,
    visitCount: 8,
    reflections: [],
    audioRecordings: [],
    geneticsSeed: `cap-${variety}-${stage}`,
  }))
}

async function enterWalk(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(120)
  }
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="enter-walk-button"]')
    if (btn instanceof HTMLElement) {
      btn.click()
      return true
    }
    return false
  })
  if (!clicked) throw new Error('enter-walk-button not found')
  await page.locator('[data-testid="open-world-garden"]').waitFor({ state: 'visible', timeout: 90_000 })
  await page.waitForFunction(() => window.__mgWalkCapture?.ready?.(), { timeout: 90_000 }).catch(() => {})
}

async function poseForRow(page) {
  return page.evaluate(() => ({
    x: 0,
    z: 10.2,
    yaw: 0,
    pitch: 0.2,
  }))
}

async function captureRow(browser, variety, outName) {
  const memories = stageMemories(variety)
  const context = await browser.newContext({ viewport: { width: 1440, height: 820 } })
  await context.addInitScript(
    ({ user, seeded }) => {
      sessionStorage.setItem('mg:walk-capture', '1')
      sessionStorage.setItem('mg:walk-plant-focus', '1')
      sessionStorage.setItem('mg:stage-row-capture', '1')
      sessionStorage.removeItem('mg:walk-capture-baseline')
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(`memorygarden:${user.id}:preferences`, JSON.stringify({ hasCompletedOnboarding: true }))
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(seeded))
      const OriginalDate = Date
      // eslint-disable-next-line no-global-assign
      Date = class extends OriginalDate {
        constructor(...args) {
          if (args.length === 0) super(2026, 5, 15, 19.5, 30, 0)
          else super(...args)
        }
        static now() {
          return new OriginalDate(2026, 5, 15, 19.5, 30, 0).getTime()
        }
      }
    },
    { user: demoUser, seeded: memories },
  )
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  const page = await context.newPage()
  await enterWalk(page)
  const pose = await poseForRow(page)
  await page.evaluate(({ p }) => {
    window.__mgWalkCapture?.setPose?.(p)
  }, { p: pose })
  await page.waitForTimeout(1200)
  await page.evaluate(({ p }) => {
    window.__mgWalkCapture?.setPose?.(p)
  }, { p: pose })
  await page.waitForTimeout(5500)
  await page.locator('[data-testid="open-world-garden"]').screenshot({
    path: resolve(outDir, outName),
  })
  await context.close()
}

function compositeHtml({ title, svgPath, pngPath, outHtml }) {
  const svg = readFileSync(svgPath, 'utf8')
  const pngData = readFileSync(pngPath).toString('base64')
  const body = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
body{margin:0;background:#1a1220;color:#f5efe6;font:12px system-ui,sans-serif}
h1{font-size:14px;font-weight:600;padding:12px 16px;margin:0}
.row{display:flex;align-items:flex-end;gap:12px;padding:0 16px 16px}
.panel{flex:1;background:#0f0a16;border-radius:12px;padding:12px}
.panel h2{font-size:11px;opacity:.75;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em}
.svg-wrap svg{max-width:100%;height:auto;display:block;margin:0 auto}
img{width:100%;height:auto;border-radius:8px;display:block}
</style></head><body>
<h1>${title} — 2D vs 3D growth stages (dusk)</h1>
<div class="row">
<div class="panel"><h2>2D pond palette</h2><div class="svg-wrap">${svg}</div></div>
<div class="panel"><h2>3D Walk</h2><img alt="3d stages" src="data:image/png;base64,${pngData}"/></div>
</div></body></html>`
  writeFileSync(outHtml, body, 'utf8')
}

const browser = await chromium.launch({ headless: true })
try {
  await captureRow(browser, 'tree', 'after-3d-tree-stages-row-dusk.png')
  await captureRow(browser, 'flower', 'after-3d-flower-stages-row-dusk.png')

  const treeSvg = resolve(outDir, 'plant-stages-tree-row-2d.svg')
  const flowerSvg = resolve(outDir, 'plant-stages-flower-row-dusk.svg')

  compositeHtml({
    title: 'Tree',
    svgPath: treeSvg,
    pngPath: resolve(outDir, 'after-3d-tree-stages-row-dusk.png'),
    outHtml: resolve(outDir, 'compare-tree-stages.html'),
  })
  compositeHtml({
    title: 'Flower',
    svgPath: flowerSvg,
    pngPath: resolve(outDir, 'after-3d-flower-stages-row-dusk.png'),
    outHtml: resolve(outDir, 'compare-flower-stages.html'),
  })

  const ctx = await browser.newContext({ viewport: { width: 1200, height: 700 } })
  const page = await ctx.newPage()
  await page.goto(`file://${resolve(outDir, 'compare-tree-stages.html')}`)
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(outDir, 'after-tree-stages-2d-3d-side-by-side.png'), fullPage: true })
  await page.goto(`file://${resolve(outDir, 'compare-flower-stages.html')}`)
  await page.waitForTimeout(400)
  await page.screenshot({ path: resolve(outDir, 'after-flower-stages-2d-3d-side-by-side.png'), fullPage: true })
  await ctx.close()
} finally {
  await browser.close()
}

console.log('Comparison artifacts in', outDir)
