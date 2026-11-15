/**
 * Round-3: watercolor sprout walk close-up only (before @ e750d88:4173, after @ branch:4174).
 */
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/3d-pass-1115b-r3'
const r2Dir = '/opt/cursor/artifacts/3d-pass-1115b-r2'
mkdirSync(outDir, { recursive: true })

const branchSha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()
const mainShort = 'e750d88'

writeFileSync(
  resolve(outDir, 'BUILD_SHA.txt'),
  `before_commit=${mainShort}\nafter_commit=${branchSha}\nshot=watercolor-walk-sprout-closeup-desktop\n`,
)

function runNode(script, env = {}) {
  const r = spawnSync('node', [resolve(root, 'scripts', script)], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      ARTIFACT_DIR: outDir,
      CAPTURE_ONLY: 'sprout',
      BEFORE_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173',
      AFTER_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
      AFTER_SHA: branchSha,
      BEFORE_SHA: mainShort,
      ...env,
    },
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

const beforeAlias = resolve(outDir, 'before-watercolor-walk-sprout-closeup-desktop.png')
const r2Before = resolve(r2Dir, 'before-watercolor-walk-sprout-closeup-desktop.png')
if (existsSync(r2Before)) {
  copyFileSync(r2Before, beforeAlias)
  console.log('Kept before from r2', r2Before)
} else {
  runNode('capture-minecraft-walk-grid.mjs', { CAPTURE_PHASE: 'before' })
  const legacy = resolve(
    outDir,
    `minecraft-walk-before-${mainShort}-watercolor-walk-sprout-closeup-desktop.png`,
  )
  if (existsSync(legacy)) copyFileSync(legacy, beforeAlias)
}

runNode('capture-minecraft-walk-grid.mjs', { CAPTURE_PHASE: 'after' })

const afterLegacy = [
  `minecraft-walk-after-${branchSha}-watercolor-walk-sprout-closeup-desktop.png`,
  `minecraft-walk-after-${spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()}-watercolor-walk-sprout-closeup-desktop.png`,
  'minecraft-walk-after-watercolor-walk-sprout-closeup-desktop.png',
]
for (const name of afterLegacy) {
  const p = resolve(outDir, name)
  if (existsSync(p)) {
    copyFileSync(p, resolve(outDir, 'after-watercolor-walk-sprout-closeup-desktop.png'))
    break
  }
}

console.log('R3 artifacts in', outDir)