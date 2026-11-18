/**
 * Round 6 — pixel dusk cloud fix; before baseline 197d299, three overview shots only.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const passRoot =
  process.env.ARTIFACT_DIR || resolve('/cursor/stores/self/artifacts/3d-pass-1115d-r6')
const beforeDir = resolve(passRoot, 'before')
const afterDir = resolve(passRoot, 'after')
mkdirSync(beforeDir, { recursive: true })
mkdirSync(afterDir, { recursive: true })

const beforeSha = process.env.BEFORE_SHA || '197d299'
const afterSha =
  process.env.AFTER_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()
const beforeUrl = process.env.BEFORE_URL || 'http://127.0.0.1:4173'
const afterUrl = process.env.AFTER_URL || 'http://127.0.0.1:4174'

const poseSrc =
  process.env.POSES_JSON ||
  resolve('/cursor/stores/self/artifacts/3d-pass-1115d-r5/before/minecraft-walk-poses-desktop.json')

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
  if (existsSync(src)) copyFileSync(src, resolve(srcDir, to))
}

function captureSide(dir, url, sha, phase) {
  if (existsSync(poseSrc)) {
    copyFileSync(poseSrc, resolve(dir, 'minecraft-walk-poses-desktop.json'))
  }
  runNode('capture-walk-dusk-overview.mjs', {
    ARTIFACT_DIR: dir,
    BEFORE_URL: url,
    AFTER_URL: url,
    CAPTURE_PHASE: phase,
    BEFORE_SHA: beforeSha,
    AFTER_SHA: sha,
  })
  for (const style of ['pixel-art', 'watercolor']) {
    runNode('capture-minecraft-walk-grid.mjs', {
      ARTIFACT_DIR: dir,
      BEFORE_URL: url,
      AFTER_URL: url,
      CAPTURE_PHASE: phase,
      AFTER_SHA: sha,
      BEFORE_SHA: beforeSha,
      WALK_ART_STYLES: style,
      MODE: 'overview',
    })
  }
  alias(
    dir,
    `minecraft-walk-dusk-${phase}-${sha}-pixel-art-desktop.png`,
    'pixel-art-dusk-overview.png',
  )
  alias(
    dir,
    `minecraft-walk-dusk-${phase}-pixel-art-desktop.png`,
    'pixel-art-dusk-overview.png',
  )
  alias(
    dir,
    `minecraft-walk-${phase}-${sha}-pixel-art-walk-overview-desktop.png`,
    'pixel-art-day-overview.png',
  )
  alias(
    dir,
    `minecraft-walk-${phase}-${sha}-watercolor-walk-overview-desktop.png`,
    'watercolor-day-overview.png',
  )
  writeFileSync(resolve(dir, 'BUILD_SHA.txt'), `${phase}_commit=${sha}\n`)
}

captureSide(beforeDir, beforeUrl, beforeSha, 'before')
captureSide(afterDir, afterUrl, afterSha, 'after')

const pairs = [
  'pixel-art-dusk-overview.png',
  'pixel-art-day-overview.png',
  'watercolor-day-overview.png',
]

const rows = []
for (const name of pairs) {
  const b = resolve(beforeDir, name)
  const a = resolve(afterDir, name)
  if (!existsSync(b) || !existsSync(a)) {
    rows.push({ name, note: 'missing' })
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
    rows.push({ name, raw: line })
  }
}
writeFileSync(resolve(passRoot, 'pixel-diff.json'), JSON.stringify(rows, null, 2))
console.log('1115d-r6 artifacts in', passRoot)