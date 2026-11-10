/**
 * Verifies AppHeader regions (garden selector, main nav, menu) do not overlap at desktop widths.
 * Run after `vite preview` with PREVIEW_URL.
 */
import { chromium } from 'playwright'

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173'
const widths = [768, 1024, 1280, 1440]

const DEMO_USER = {
  id: 'a0000000-0000-4000-8000-000000000001',
  login: 'AuditGardener',
  avatarUrl: '',
}

function rectsIntersect(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

const browser = await chromium.launch({ headless: true })
const failures = []

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.addInitScript(({ user }) => {
      localStorage.setItem('memorygarden:user', JSON.stringify(user))
      localStorage.setItem(`memorygarden:${user.id}:preferences`, JSON.stringify({
        hasCompletedOnboarding: true,
        soundEnabled: false,
        lastVisit: new Date().toISOString(),
      }))
      localStorage.setItem(`memorygarden:${user.id}:memories`, JSON.stringify([]))
    }, { user: DEMO_USER })

    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.waitForTimeout(400)

    const selector = page.getByRole('button', { name: /My Garden|Shared/ }).first()
    const nav = page.getByRole('navigation', { name: 'Main views' })
    const menu = page.getByRole('button', { name: 'Open menu' })

    const boxes = {
      selector: await selector.boundingBox(),
      nav: await nav.boundingBox(),
      menu: await menu.boundingBox(),
    }

    const pairs = [
      ['selector', 'nav'],
      ['selector', 'menu'],
      ['nav', 'menu'],
    ]

    for (const [aKey, bKey] of pairs) {
      const a = boxes[aKey]
      const b = boxes[bKey]
      if (!a || !b) {
        failures.push({ width, error: `missing box: ${aKey}=${!!a} ${bKey}=${!!b}` })
        continue
      }
      if (rectsIntersect(a, b)) {
        failures.push({
          width,
          pair: [aKey, bKey],
          a,
          b,
        })
      }
    }

    console.log(
      JSON.stringify({
        width,
        ok: !failures.some((f) => f.width === width),
        boxes,
      }),
    )

    await page.close()
  }
} finally {
  await browser.close()
}

if (failures.length > 0) {
  console.error('Header overlap failures:', JSON.stringify(failures, null, 2))
  process.exit(1)
}

console.log('Header overlap check: all widths OK')
