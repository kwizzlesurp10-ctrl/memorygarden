/**
 * Evolution pass PR artifacts: elder framing, terrain/rocks, water, dusk/night, realflow.
 * Requires AFTER preview on 4174 and BEFORE worktree on 4173 (prepare-walk-before-preview.mjs).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { Resvg } from '@resvg/resvg-js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.env.ARTIFACT_DIR || resolve('/opt/cursor/artifacts', '3d-evolution-pass')
mkdirSync(outDir, { recursive: true })

function runNode(script, env = {}) {
  const r = spawnSync('node', [resolve(root, 'scripts', script)], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ARTIFACT_DIR: outDir, ...env },
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function labelShot(src, dest, title) {
  if (!existsSync(src)) throw new Error(`Missing capture ${src}`)
  const b64 = readFileSync(src).toString('base64')
  const safe = title.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="836" viewBox="0 0 1280 836">
  <rect width="1280" height="836" fill="#141414"/>
  <text x="24" y="28" fill="#f5f5f5" font-size="18" font-family="system-ui,sans-serif">${safe}</text>
  <image href="data:image/png;base64,${b64}" x="0" y="36" width="1280" height="800" preserveAspectRatio="xMidYMid meet"/>
</svg>`
  writeFileSync(dest, new Resvg(svg, { fitTo: { mode: 'width', value: 1280 } }).render().asPng())
  console.log('Labeled', dest)
}

writeFileSync(resolve(outDir, 'BUILD_SHA.txt'), `${spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()}\n`)

runNode('capture-minecraft-walk-grid.mjs', {
  AFTER_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
  BEFORE_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173',
  VIEWPORT: 'desktop',
  CAPTURE_ONLY: 'detail',
})

runNode('capture-walk-dusk-overview.mjs', {
  AFTER_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
  BEFORE_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173',
})

runNode('capture-walk-night-compare.mjs', {
  AFTER_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
})

runNode('capture-walk-pixel-art-realflow.mjs', {
  AFTER_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
})

const pairs = [
  {
    dest: 'label-elder-closeup-before-main-312e660.png',
    src: 'minecraft-walk-before-pixel-art-walk-tree-elder-closeup-desktop.png',
    title: 'Elder oak close-up — BEFORE main@312e660 (pixel-art)',
  },
  {
    dest: 'label-elder-closeup-after.png',
    src: 'minecraft-walk-after-pixel-art-walk-tree-elder-closeup-desktop.png',
    title: 'Elder oak close-up — AFTER evolution pass (~70% frame, canopy in view)',
  },
  {
    dest: 'label-dusk-overview-before.png',
    src: 'minecraft-walk-dusk-before-pixel-art-desktop.png',
    title: 'Dusk overview — BEFORE (terrain / pond)',
  },
  {
    dest: 'label-dusk-overview-after.png',
    src: 'minecraft-walk-dusk-after-pixel-art-desktop.png',
    title: 'Dusk overview — AFTER (grass tufts, stone clusters, blocky water)',
  },
  {
    dest: 'label-night-overview-after.png',
    src: 'minecraft-walk-night-pixel-art-desktop.png',
    title: 'Night — AFTER pixel-art walk',
  },
  {
    dest: 'label-realflow-desktop-near-elder-after.png',
    src: 'minecraft-walk-realflow-desktop-near-elder.png',
    title: 'Real flow — near elder (no mg:walk-capture)',
  },
]

for (const { dest, src, title } of pairs) {
  labelShot(resolve(outDir, src), resolve(outDir, dest), title)
}

console.log('Evolution pass artifacts in', outDir)