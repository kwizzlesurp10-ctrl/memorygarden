import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium, devices } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/after/screenshots'
const prefix = process.env.SCREENSHOT_PREFIX || 'after'

const routes = [
  { name: 'garden-home', path: '/' },
  { name: 'explore', path: '/?view=explore' },
]

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const mobile = await browser.newContext({ ...devices['iPhone 13'] })

  for (const ctx of [
    { label: 'desktop', context: desktop },
    { label: 'mobile', context: mobile },
  ]) {
    for (const route of routes) {
      const page = await ctx.context.newPage()
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle', timeout: 60_000 })
      await page.waitForTimeout(1200)
      const file = resolve(outDir, `${prefix}-${route.name}-${ctx.label}.png`)
      await page.screenshot({ path: file, fullPage: false })
      await page.close()
    }
    await ctx.context.close()
  }
} finally {
  await browser.close()
}

console.log('Screenshots written to', outDir)
