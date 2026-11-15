/**
 * Pass 1115c (watercolor-only): before @ 4173 (main), after @ 4174 (branch).
 * Artifacts in repo `3d-pass-1115c/`.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const passRoot = resolve(root, '3d-pass-1115c')
const phase = (process.env.CAPTURE_PHASE || 'both').toLowerCase()
const beforeDir = resolve(passRoot, 'before')
const afterDir = resolve(passRoot, 'after')
mkdirSync(beforeDir, { recursive: true })
mkdirSync(afterDir, { recursive: true })

const beforeSha =
  process.env.BEFORE_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'main'], { cwd: root, encoding: 'utf8' }).stdout.trim()
const afterSha =
  process.env.AFTER_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()

const walkEnv = { WALK_ART_STYLES: 'watercolor' }

function runNode(script, env = {}) {
  const r = spawnSync('node', [resolve(root, 'scripts', script)], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...walkEnv, ...env },
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function writeBuildSha(dir, label) {
  const short = dir.includes('before') ? beforeSha : afterSha
  writeFileSync(
    resolve(dir, 'BUILD_SHA.txt'),
    `${label}_commit=${short}\nfull=${spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()}\n`,
  )
}

function aliasDir(srcDir, patterns) {
  for (const { from, to } of patterns) {
    const src = resolve(srcDir, from)
    const dest = resolve(srcDir, to)
    if (existsSync(src)) copyFileSync(src, dest)
  }
}

const aliasList = [
  {
    from: `minecraft-walk-before-${beforeSha}-watercolor-walk-overview-desktop.png`,
    to: 'walk-overview-watercolor.png',
  },
  {
    from: `minecraft-walk-before-${beforeSha}-watercolor-walk-tree-elder-closeup-desktop.png`,
    to: 'walk-elder-closeup-watercolor.png',
  },
  {
    from: `minecraft-walk-before-${beforeSha}-watercolor-walk-flower-closeup-desktop.png`,
    to: 'walk-flower-closeup-watercolor.png',
  },
]

const afterAliasList = [
  {
    from: `minecraft-walk-after-${afterSha}-watercolor-walk-overview-desktop.png`,
    to: 'walk-overview-watercolor.png',
  },
  {
    from: `minecraft-walk-after-${afterSha}-watercolor-walk-tree-elder-closeup-desktop.png`,
    to: 'walk-elder-closeup-watercolor.png',
  },
  {
    from: `minecraft-walk-after-${afterSha}-watercolor-walk-flower-closeup-desktop.png`,
    to: 'walk-flower-closeup-watercolor.png',
  },
  { from: 'after-tree-stages-2d-3d-stacked.png', to: 'tree-stages-2d-3d-grid.png' },
]

if (phase === 'before' || phase === 'both') {
  writeBuildSha(beforeDir, 'before')
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: beforeDir,
    BEFORE_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173',
    AFTER_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173',
    BEFORE_SHA: beforeSha,
    AFTER_SHA: beforeSha,
    CAPTURE_PHASE: 'before',
  })
  runNode('capture-walk-dusk-watercolor-overview.mjs', {
    ARTIFACT_DIR: beforeDir,
    PREVIEW_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173',
    PHASE: 'before',
    BUILD_SHA: beforeSha,
  })
  runNode('capture-plant-stage-comparison.mjs', {
    ARTIFACT_DIR: beforeDir,
    PREVIEW_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173',
  })
  aliasDir(beforeDir, aliasList)
  const wcDusk = resolve(beforeDir, `walk-dusk-overview-watercolor-${beforeSha}.png`)
  if (existsSync(wcDusk)) copyFileSync(wcDusk, resolve(beforeDir, 'walk-dusk-overview-watercolor.png'))
}

if (phase === 'after' || phase === 'both') {
  writeBuildSha(afterDir, 'after')
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: afterDir,
    BEFORE_URL: process.env.BEFORE_URL || 'http://127.0.0.1:4173',
    AFTER_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
    BEFORE_SHA: beforeSha,
    AFTER_SHA: afterSha,
    CAPTURE_PHASE: 'after',
  })
  runNode('capture-walk-dusk-watercolor-overview.mjs', {
    ARTIFACT_DIR: afterDir,
    PREVIEW_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
    PHASE: 'after',
    BUILD_SHA: afterSha,
  })
  runNode('capture-plant-stage-comparison.mjs', {
    ARTIFACT_DIR: afterDir,
    PREVIEW_URL: process.env.AFTER_URL || 'http://127.0.0.1:4174',
  })
  aliasDir(afterDir, afterAliasList)
  const wcDuskA = resolve(afterDir, `walk-dusk-overview-watercolor-${afterSha}.png`)
  if (existsSync(wcDuskA)) copyFileSync(wcDuskA, resolve(afterDir, 'walk-dusk-overview-watercolor.png'))
  writeFileSync(
    resolve(afterDir, 'BUILD_SHA.txt'),
    `after_commit=${afterSha}\nfull=${spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim()}\n`,
  )
}

if (phase === 'both' || phase === 'diff') {
  const pairs = [
    'walk-dusk-overview-watercolor.png',
    'walk-overview-watercolor.png',
    'walk-elder-closeup-watercolor.png',
    'walk-flower-closeup-watercolor.png',
    'tree-stages-2d-3d-grid.png',
  ]
  const rows = []
  for (const name of pairs) {
    const b = resolve(beforeDir, name)
    const a = resolve(afterDir, name)
    if (!existsSync(b) || !existsSync(a)) {
      rows.push({ name, diffPercent: null, note: 'missing' })
      continue
    }
    const r = spawnSync('node', [resolve(root, 'scripts/measure-png-pair-diff.mjs'), b, a, '30'], {
      cwd: root,
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
  console.log('Pixel diff table:', JSON.stringify(rows, null, 2))
}

console.log('Pass 1115c (watercolor-only) artifacts in', passRoot)