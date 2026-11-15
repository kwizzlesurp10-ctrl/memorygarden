/**
 * PR #238 round 2 — paired before (main preview) / after (branch) captures into agent store only.
 * Env: ARTIFACT_DIR, BEFORE_URL, AFTER_URL, CAPTURE_PHASE=before|after|both|diff
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const phase = (process.env.CAPTURE_PHASE || 'both').toLowerCase()
const passRoot =
  process.env.ARTIFACT_DIR || resolve('/cursor/stores/self/artifacts/3d-pass-1115c-r2')
const beforeDir = resolve(passRoot, 'before')
const afterDir = resolve(passRoot, 'after')
mkdirSync(beforeDir, { recursive: true })
mkdirSync(afterDir, { recursive: true })

const beforeSha =
  process.env.BEFORE_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'main'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()
const afterSha =
  process.env.AFTER_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()

const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'

function runNode(script, env = {}) {
  const r = spawnSync('node', [resolve(repoRoot, 'scripts', script)], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function alias(srcDir, from, to) {
  const src = resolve(srcDir, from)
  const dest = resolve(srcDir, to)
  if (existsSync(src)) copyFileSync(src, dest)
}

const canonical = [
  { wcDusk: true, alias: 'watercolor-dusk-overview.png' },
  { day: true, style: 'watercolor', alias: 'watercolor-day-overview.png' },
  { day: true, style: 'pixel-art', alias: 'pixel-art-day-overview.png' },
  { pixelDusk: true, alias: 'pixel-art-dusk-overview.png' },
  { scenery: 'rocks', style: 'watercolor', tod: 'day', alias: 'watercolor-day-rocks-closeup.png' },
  { scenery: 'fence', style: 'watercolor', tod: 'day', alias: 'watercolor-day-fence-closeup.png' },
  { elder: true, style: 'watercolor', tod: 'day', alias: 'watercolor-day-elder-closeup.png' },
]

if (phase === 'before' || phase === 'both') {
  writeFileSync(resolve(beforeDir, 'BUILD_SHA.txt'), `before_commit=${beforeSha}\n`)
  runNode('capture-walk-dusk-watercolor-overview.mjs', {
    ARTIFACT_DIR: beforeDir,
    PREVIEW_URL: beforeUrl,
    PHASE: 'before',
    BUILD_SHA: beforeSha,
  })
  runNode('capture-walk-dusk-overview.mjs', {
    ARTIFACT_DIR: beforeDir,
    BEFORE_URL: beforeUrl,
    CAPTURE_PHASE: 'before',
    BEFORE_SHA: beforeSha,
    AFTER_SHA: beforeSha,
  })
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: beforeDir,
    BEFORE_URL: beforeUrl,
    AFTER_URL: beforeUrl,
    BEFORE_SHA: beforeSha,
    AFTER_SHA: beforeSha,
    CAPTURE_PHASE: 'before',
    MODE: 'overview',
    WALK_ART_STYLES: 'watercolor,pixel-art',
  })
  runNode('capture-3d-rocks-props-pass.mjs', {
    ARTIFACT_DIR: beforeDir,
    BEFORE_URL: beforeUrl,
    AFTER_URL: beforeUrl,
    BEFORE_SHA: beforeSha,
    AFTER_SHA: beforeSha,
    CAPTURE_PHASE: 'before',
    SCENERY_ONLY: '1',
  })
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: beforeDir,
    BEFORE_URL: beforeUrl,
    AFTER_URL: beforeUrl,
    CAPTURE_PHASE: 'before',
    WALK_ART_STYLES: 'watercolor',
    CAPTURE_ONLY: 'elder',
  })
  alias(beforeDir, `walk-dusk-overview-watercolor-${beforeSha}.png`, 'watercolor-dusk-overview.png')
  alias(beforeDir, `minecraft-walk-dusk-before-${beforeSha}-pixel-art-desktop.png`, 'pixel-art-dusk-overview.png')
  alias(beforeDir, `minecraft-walk-before-${beforeSha}-watercolor-walk-overview-desktop.png`, 'watercolor-day-overview.png')
  alias(beforeDir, `minecraft-walk-before-${beforeSha}-pixel-art-walk-overview-desktop.png`, 'pixel-art-day-overview.png')
  alias(beforeDir, `garden-before-${beforeSha}-watercolor-open-world-fence-closeup-day-desktop.png`, 'watercolor-day-fence-closeup.png')
  alias(beforeDir, `garden-before-${beforeSha}-watercolor-open-world-rocks-closeup-day-desktop.png`, 'watercolor-day-rocks-closeup.png')
  alias(beforeDir, `minecraft-walk-before-${beforeSha}-watercolor-walk-tree-elder-closeup-desktop.png`, 'watercolor-day-elder-closeup.png')
}

if (phase === 'after' || phase === 'both') {
  const full = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()
  writeFileSync(resolve(afterDir, 'BUILD_SHA.txt'), `after_commit=${afterSha}\nfull=${full}\n`)
  runNode('capture-walk-dusk-watercolor-overview.mjs', {
    ARTIFACT_DIR: afterDir,
    PREVIEW_URL: afterUrl,
    PHASE: 'after',
    BUILD_SHA: afterSha,
  })
  runNode('capture-walk-dusk-overview.mjs', {
    ARTIFACT_DIR: afterDir,
    AFTER_URL: afterUrl,
    CAPTURE_PHASE: 'after',
    BEFORE_SHA: beforeSha,
    AFTER_SHA: afterSha,
  })
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: afterDir,
    BEFORE_URL: beforeUrl,
    AFTER_URL: afterUrl,
    CAPTURE_PHASE: 'after',
    MODE: 'overview',
    WALK_ART_STYLES: 'watercolor,pixel-art',
  })
  runNode('capture-3d-rocks-props-pass.mjs', {
    ARTIFACT_DIR: afterDir,
    BEFORE_URL: beforeUrl,
    AFTER_URL: afterUrl,
    BEFORE_SHA: beforeSha,
    AFTER_SHA: afterSha,
    CAPTURE_PHASE: 'after',
    SCENERY_ONLY: '1',
  })
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: afterDir,
    AFTER_URL: afterUrl,
    CAPTURE_PHASE: 'after',
    WALK_ART_STYLES: 'watercolor',
    CAPTURE_ONLY: 'elder',
  })
  alias(afterDir, `walk-dusk-overview-watercolor-${afterSha}.png`, 'watercolor-dusk-overview.png')
  alias(afterDir, `minecraft-walk-dusk-after-${afterSha}-pixel-art-desktop.png`, 'pixel-art-dusk-overview.png')
  alias(afterDir, `minecraft-walk-after-${afterSha}-watercolor-walk-overview-desktop.png`, 'watercolor-day-overview.png')
  alias(afterDir, `minecraft-walk-after-${afterSha}-pixel-art-walk-overview-desktop.png`, 'pixel-art-day-overview.png')
  alias(afterDir, `garden-after-${afterSha}-watercolor-open-world-fence-closeup-day-desktop.png`, 'watercolor-day-fence-closeup.png')
  alias(afterDir, `garden-after-${afterSha}-watercolor-open-world-rocks-closeup-day-desktop.png`, 'watercolor-day-rocks-closeup.png')
  alias(afterDir, `minecraft-walk-after-${afterSha}-watercolor-walk-tree-elder-closeup-desktop.png`, 'watercolor-day-elder-closeup.png')
}

if (phase === 'both' || phase === 'diff') {
  const pairs = canonical.map((c) => c.alias)
  const rows = []
  for (const name of pairs) {
    const b = resolve(beforeDir, name)
    const a = resolve(afterDir, name)
    if (!existsSync(b) || !existsSync(a)) {
      rows.push({ name, diffPercent: null, note: 'missing' })
      continue
    }
    const r = spawnSync('node', [resolve(repoRoot, 'scripts/measure-png-pair-diff.mjs'), b, a, '30'], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    const line = r.stdout.trim().split('\n').pop()
    try {
      rows.push({ name, ...JSON.parse(line ?? '{}') })
    } catch {
      rows.push({ name, diffPercent: null, raw: line })
    }
  }
  writeFileSync(resolve(passRoot, 'pixel-diff.json'), JSON.stringify(rows, null, 2))
  console.log(JSON.stringify(rows, null, 2))
}

console.log('R2 artifacts in', passRoot)
void canonical