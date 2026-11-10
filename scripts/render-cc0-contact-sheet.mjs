import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/after'
const tilesDir = resolve(outDir, 'cc0-tiles')
mkdirSync(tilesDir, { recursive: true })

const SHOWCASE_POSE = { x: 0, z: 5.6, yaw: Math.PI, pitch: -0.16 }

const MODELS = [
  { id: 'quat_CommonTree_1', label: 'Common tree 1 (Quaternius)' },
  { id: 'quat_Willow_1', label: 'Willow 1 (Quaternius)' },
  { id: 'kenney_tree_oak', label: 'Oak tree (Kenney)' },
  { id: 'kenney_tree_pineTallA_detailed', label: 'Tall pine (Kenney)' },
  { id: 'kenney_tree_detailed', label: 'Branching tree (Kenney)' },
  { id: 'quat_BushBerries_1', label: 'Berry bush (Quaternius)' },
  { id: 'kenney_plant_bushDetailed', label: 'Detailed bush (Kenney)' },
  { id: 'kenney_flower_purpleA', label: 'Purple flower (Kenney)' },
  { id: 'quat_Flowers', label: 'Flower cluster (Quaternius)' },
  { id: 'kenney_mushroom_redGroup', label: 'Red mushrooms (Kenney)' },
  { id: 'kenney_grass_large', label: 'Large grass (Kenney)' },
  { id: 'quat_Grass', label: 'Grass tuft (Quaternius)' },
  { id: 'kenney_stump_roundDetailed', label: 'Round stump (Kenney)' },
  { id: 'quat_TreeStump_Moss', label: 'Mossy stump (Quaternius)' },
  { id: 'kenney_log', label: 'Log (Kenney)' },
  { id: 'kenney_rock_largeA', label: 'Large rock (Kenney)' },
  { id: 'kenney_fence_simple', label: 'Fence (Kenney)' },
]

const demoUser = {
  id: '11111111-1111-4111-8111-111111111111',
  login: 'demo-gardener',
  avatarUrl: '',
}

const memories = [
  {
    id: 'cc0-sheet-1',
    photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    text: 'A remembered rose among the new garden trees.',
    date: '2025-06-01',
    plantedAt: '2025-06-01T12:00:00.000Z',
    position: { x: 200, y: 200 },
    emotionalTone: 'peaceful',
    plantStage: 'bloom',
    plantVariety: 'flower',
    visitCount: 1,
    reflections: [],
    audioRecordings: [],
  },
]

async function makeContext(browser, hour) {
  const context = await browser.newContext({
    viewport: { width: 640, height: 480 },
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  })
  await context.addInitScript(
    ({ user, mems, h }) => {
      sessionStorage.setItem('mg:walk-capture', '1')
      localStorage.setItem('memorygarden:preferences', JSON.stringify({ hasCompletedOnboarding: true }))
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify(mems))
      const OriginalDate = Date
      // eslint-disable-next-line no-global-assign
      Date = class extends OriginalDate {
        constructor(...args) {
          if (args.length === 0) super(2026, 5, 15, h, 20, 0)
          else super(...args)
        }
        static now() {
          return new OriginalDate(2026, 5, 15, h, 20, 0).getTime()
        }
      }
    },
    { user: demoUser, mems: memories, h: hour },
  )
  await context.route('**/api/**', (route) =>
    route.fulfill({ status: 503, body: '{}', contentType: 'application/json' }),
  )
  return context
}

async function enterWalk(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120_000 })
  await page.getByRole('tab', { name: /Walk/i }).click({ timeout: 15_000 })
  await page.waitForTimeout(800)
  await page.waitForFunction(() => window.__cc0SceneryReady === true, { timeout: 90_000 })
  await page.waitForFunction(() => window.__mgWalkCapture?.ready?.(), { timeout: 30_000 })
}

const browser = await chromium.launch({ headless: true })
const tilePaths = []

try {
  for (const { id, label } of MODELS) {
    for (const { suffix, hour } of [
      { suffix: 'day', hour: 14 },
      { suffix: 'dusk', hour: 19.5 },
    ]) {
      const ctx = await makeContext(browser, hour)
      const page = await ctx.newPage()
      await enterWalk(page)
      await page.evaluate(
        async ({ modelId, pose }) => {
          await window.__mgWalkCapture?.showcaseModel(modelId)
          window.__mgWalkCapture?.setPose(pose)
        },
        { modelId: id, pose: SHOWCASE_POSE },
      )
      await page.waitForTimeout(1600)
      const file = `${id}-${suffix}.png`
      const path = resolve(tilesDir, file)
      await page.locator('[data-testid="open-world-garden"] > canvas').screenshot({ path })
      tilePaths.push({ label, suffix, file, path })
      await ctx.close()
    }
  }
} finally {
  await browser.close()
}

const rows = MODELS.map((m) => {
  const day = tilePaths.find((t) => t.file === `${m.id}-day.png`)
  const dusk = tilePaths.find((t) => t.file === `${m.id}-dusk.png`)
  const dayB64 = day ? readFileSync(day.path).toString('base64') : ''
  const duskB64 = dusk ? readFileSync(dusk.path).toString('base64') : ''
  return `
    <tr>
      <th scope="row">${m.label}<br/><code>${m.id}</code></th>
      <td><img alt="${m.id} day" src="data:image/png;base64,${dayB64}" width="280"/></td>
      <td><img alt="${m.id} dusk" src="data:image/png;base64,${duskB64}" width="280"/></td>
    </tr>`
}).join('')

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<title>CC0 hybrid toon — day vs dusk</title>
<style>
  body { background: #120a1c; color: #f0e7da; font-family: system-ui, sans-serif; margin: 24px; }
  h1 { font-size: 1.25rem; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; max-width: 1200px; }
  th, td { border: 1px solid rgba(240,231,218,0.15); padding: 12px; vertical-align: top; }
  th { text-align: left; font-size: 0.85rem; width: 220px; }
  code { font-size: 0.75rem; opacity: 0.7; }
</style></head><body>
  <h1>MemoryGarden CC0 nature models — hybrid MeshToon tint (summer)</h1>
  <p>Kenney Nature Kit + Quaternius Ultimate Nature (2019). Left: day (~14:30). Right: dusk (~19:30).</p>
  <table>
    <thead><tr><th>Model</th><th>Day palette</th><th>Dusk palette</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`

const htmlPath = resolve(outDir, 'cc0-tinted-contact-sheet.html')
writeFileSync(htmlPath, html, 'utf8')

const sheetBrowser = await chromium.launch({ headless: true })
const sheetPage = await sheetBrowser.newPage({ viewport: { width: 1280, height: 8200 } })
await sheetPage.goto(`file://${htmlPath}`, { waitUntil: 'load' })
await sheetPage.screenshot({
  path: resolve(outDir, 'after-cc0-tinted-contact-sheet.png'),
  fullPage: true,
})
await sheetBrowser.close()

console.log('Contact sheet:', resolve(outDir, 'after-cc0-tinted-contact-sheet.png'))
