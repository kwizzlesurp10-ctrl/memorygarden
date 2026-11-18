/**
 * Round 5 — targeted before/after shots vs c0c289c + pixel-diff notes.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const passRoot =
  process.env.ARTIFACT_DIR || resolve('/cursor/stores/self/artifacts/3d-pass-1115d-r5')
const beforeDir = resolve(passRoot, 'before')
const afterDir = resolve(passRoot, 'after')
mkdirSync(beforeDir, { recursive: true })
mkdirSync(afterDir, { recursive: true })

const beforeSha =
  process.env.BEFORE_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'c0c289c'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()
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

function aliasPair(srcDir, from, to) {
  const src = resolve(srcDir, from)
  if (existsSync(src)) copyFileSync(src, resolve(srcDir, to))
}

function captureSide(dir, url, sha, phase) {
  runNode('capture-walk-dusk-overview.mjs', {
    ARTIFACT_DIR: dir,
    BEFORE_URL: url,
    AFTER_URL: url,
    CAPTURE_PHASE: phase,
    BEFORE_SHA: beforeSha,
    AFTER_SHA: sha,
  })
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: dir,
    BEFORE_URL: url,
    AFTER_URL: url,
    CAPTURE_PHASE: phase,
    AFTER_SHA: sha,
    BEFORE_SHA: beforeSha,
    WALK_ART_STYLES: 'pixel-art,watercolor',
    MODE: 'overview',
  })
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: dir,
    BEFORE_URL: url,
    AFTER_URL: url,
    CAPTURE_PHASE: phase,
    AFTER_SHA: sha,
    BEFORE_SHA: beforeSha,
    WALK_ART_STYLES: 'pixel-art,watercolor',
    CAPTURE_ONLY: 'elder',
  })
  aliasPair(
    dir,
    `minecraft-walk-${phase}-${sha}-pixel-art-walk-overview-desktop.png`,
    'pixel-art-day-overview.png',
  )
  aliasPair(
    dir,
    `minecraft-walk-dusk-${phase}-${sha}-pixel-art-desktop.png`,
    'pixel-art-dusk-overview.png',
  )
  aliasPair(
    dir,
    `minecraft-walk-${phase}-${sha}-watercolor-walk-overview-desktop.png`,
    'watercolor-day-overview.png',
  )
  aliasPair(
    dir,
    `minecraft-walk-${phase}-${sha}-pixel-art-walk-tree-elder-closeup-desktop.png`,
    'pixel-art-elder-closeup.png',
  )
  aliasPair(
    dir,
    `minecraft-walk-${phase}-${sha}-watercolor-walk-tree-elder-closeup-desktop.png`,
    'watercolor-elder-closeup.png',
  )
  writeFileSync(resolve(dir, 'BUILD_SHA.txt'), `${phase}_commit=${sha}\n`)
}

captureSide(beforeDir, beforeUrl, beforeSha, 'before')
captureSide(afterDir, afterUrl, afterSha, 'after')

const pairs = [
  'pixel-art-day-overview.png',
  'pixel-art-dusk-overview.png',
  'pixel-art-elder-closeup.png',
  'watercolor-day-overview.png',
  'watercolor-elder-closeup.png',
]

const rows = []
const fails = []
for (const name of pairs) {
  const b = resolve(beforeDir, name)
  const a = resolve(afterDir, name)
  if (!existsSync(b) || !existsSync(a)) {
    rows.push({ name, diffPercent: null, note: 'missing' })
    fails.push(name)
    continue
  }
  const r = spawnSync('node', [resolve(repoRoot, 'scripts/measure-png-pair-diff.mjs'), b, a, '30'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  const line = r.stdout.trim().split('\n').pop()
  const wc = name.startsWith('watercolor')
  try {
    const parsed = JSON.parse(line ?? '{}')
    const ok = wc ? parsed.diffPercent != null && parsed.diffPercent <= 0.5 : true
    rows.push({ name, ...parsed, watercolor: wc, thresholdOk: ok })
    if (!ok) fails.push(name)
  } catch {
    rows.push({ name, raw: line })
    fails.push(name)
  }
}

writeFileSync(resolve(passRoot, 'pixel-diff.json'), JSON.stringify(rows, null, 2))
spawnSync(
  'node',
  [
    resolve(repoRoot, 'scripts/sample-sky-rows.mjs'),
    resolve(afterDir, 'pixel-art-dusk-overview.png'),
    resolve(passRoot, 'dusk-sky-rgb-samples.json'),
  ],
  { cwd: repoRoot, stdio: 'inherit' },
)

if (fails.length) {
  console.error('threshold failures:', fails)
  process.exit(2)
}
console.log('1115d-r5 artifacts in', passRoot)