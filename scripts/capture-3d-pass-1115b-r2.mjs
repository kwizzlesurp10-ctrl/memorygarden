/**
 * Round-2 artifacts: before @ main preview (4173), after @ branch preview (4174).
 */
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/3d-pass-1115b-r2'
mkdirSync(outDir, { recursive: true })

const branchSha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()
const mainSha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()
const mainShort =
  spawnSync('git', ['rev-parse', '--short', 'e750d88'], { cwd: root, encoding: 'utf8' }).stdout.trim() ||
  'e750d88'

writeFileSync(
  resolve(outDir, 'BUILD_SHA.txt'),
  `before_commit=${mainShort}\nafter_commit=${branchSha}\nafter_bundle_index=dist/assets/index-*.js (rebuild branch head)\n`,
)

function runNode(script, env = {}) {
  const r = spawnSync('node', [resolve(root, 'scripts', script)], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      ARTIFACT_DIR: outDir,
      BEFORE_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173',
      AFTER_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
      AFTER_SHA: branchSha,
      BEFORE_SHA: mainShort,
      ...env,
    },
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

runNode('capture-minecraft-walk-grid.mjs', { CAPTURE_PHASE: 'before' })
runNode('capture-minecraft-walk-grid.mjs', { CAPTURE_PHASE: 'after' })
runNode('capture-walk-dusk-overview.mjs')
runNode('capture-2d-plant-popup-r6.mjs', { PREVIEW_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173' })

// Elder popup before
const elderBefore = resolve(outDir, 'popup-elder-tree-watercolor-desktop.png')
if (existsSync(elderBefore)) {
  copyFileSync(elderBefore, resolve(outDir, 'before-popup-elder-tree-watercolor-desktop.png'))
}

spawnSync(
  'node',
  [
    resolve(root, 'scripts/capture-2d-plant-popup-r6.mjs'),
  ],
  {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      ARTIFACT_DIR: resolve(outDir, '_after_popup_tmp'),
      PREVIEW_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
    },
  },
)
const elderAfterTmp = resolve(outDir, '_after_popup_tmp/popup-elder-tree-watercolor-desktop.png')
if (existsSync(elderAfterTmp)) {
  copyFileSync(elderAfterTmp, resolve(outDir, 'after-popup-elder-tree-watercolor-desktop.png'))
}

function alias(src, dest) {
  const full = resolve(outDir, src)
  if (existsSync(full)) copyFileSync(full, resolve(outDir, dest))
}

alias(
  `minecraft-walk-before-${mainShort}-watercolor-walk-sprout-closeup-desktop.png`,
  'before-watercolor-walk-sprout-closeup-desktop.png',
)
const afterSprout = [
  `minecraft-walk-after-${branchSha}-watercolor-walk-sprout-closeup-desktop.png`,
  `minecraft-walk-after-${spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()}-watercolor-walk-sprout-closeup-desktop.png`,
  'minecraft-walk-after-watercolor-walk-sprout-closeup-desktop.png',
]
for (const f of afterSprout) {
  alias(f, 'after-watercolor-walk-sprout-closeup-desktop.png')
}

console.log('R2 artifacts in', outDir)