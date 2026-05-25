/**
 * Post-build checks for Vercel static + Edge `/api` deployment.
 * Run after `npm run build` (see `npm run test:vercel`).
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function fail(msg) {
  console.error(`\n[vercel-compat] FAIL: ${msg}`)
  process.exit(1)
}

function ok(msg) {
  console.log(`[vercel-compat] OK: ${msg}`)
}

const vercelPath = join(root, 'vercel.json')
if (!existsSync(vercelPath)) fail('vercel.json missing')

let vercel
try {
  vercel = JSON.parse(readFileSync(vercelPath, 'utf8'))
} catch {
  fail('vercel.json is not valid JSON')
}

const rewrites = vercel.rewrites
if (!Array.isArray(rewrites) || rewrites.length === 0) fail('vercel.json: rewrites must be a non-empty array')

const spa = rewrites.find((r) => r.destination === '/index.html')
if (!spa?.source) fail('vercel.json: no SPA fallback rewrite to /index.html')

if (spa.source === '/(.*)' || spa.source === '^(.*)$' || /^\(\.\*\)$/.test(spa.source)) {
  fail(
    'vercel.json: SPA rewrite must not be a bare catch-all — it routes /api/* to index.html. Use "/((?!api/).*)" (or equivalent) so Edge functions under /api stay reachable.',
  )
}

if (!String(spa.source).includes('(?!api/')) {
  fail(
    `vercel.json: SPA rewrite source should exclude /api paths; got: ${JSON.stringify(spa.source)}`,
  )
}

ok('vercel.json SPA rewrite excludes /api/*')

const dist = join(root, 'dist')
if (!existsSync(dist)) fail('dist/ missing — run npm run build first')
if (!existsSync(join(dist, 'index.html'))) fail('dist/index.html missing')

const assetsDir = join(dist, 'assets')
if (!existsSync(assetsDir)) fail('dist/assets/ missing')
const assets = readdirSync(assetsDir).filter((f) => f.endsWith('.js'))
if (assets.length === 0) fail('dist/assets has no .js bundles')

ok(`dist has index.html and ${assets.length} JS chunk(s) in assets/`)

const apiDir = join(root, 'api')
for (const name of ['llm.ts', 'sync.ts']) {
  const p = join(apiDir, name)
  if (!existsSync(p)) fail(`api/${name} missing`)
  const src = readFileSync(p, 'utf8')
  if (!src.includes("runtime: 'edge'") && !src.includes('runtime: "edge"')) {
    fail(`api/${name}: expected Edge runtime config export`)
  }
  if (!/export\s+default\s+async\s+function\s+handler/.test(src)) {
    fail(`api/${name}: expected default export async function handler`)
  }
  if (/\bfrom\s+['"]fs['"]|require\(['"]fs['"]\)/.test(src)) {
    fail(`api/${name}: must not import Node fs (incompatible with Edge)`)
  }
}

ok('api/llm.ts and api/sync.ts look like Vercel Edge handlers')

console.log('\n[vercel-compat] All checks passed.\n')
