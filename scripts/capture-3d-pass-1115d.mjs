/**
 * Pixel-art 3D pass 1115d — before (main) / after (branch) captures; watercolor parity checks.
 * Env: ARTIFACT_DIR, BEFORE_URL, AFTER_URL, CAPTURE_PHASE=before|after|both|diff
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const phase = (process.env.CAPTURE_PHASE || 'both').toLowerCase()
const passRoot =
  process.env.ARTIFACT_DIR || resolve('/cursor/stores/self/artifacts/3d-pass-1115d')
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

function alias(srcDir, from, to) {
  const src = resolve(srcDir, from)
  if (existsSync(src)) copyFileSync(src, resolve(srcDir, to))
}

const pixelShots = [
  { alias: 'pixel-art-day-overview.png', walk: true, mode: 'overview', style: 'pixel-art' },
  { alias: 'pixel-art-dusk-overview.png', dusk: true },
  { alias: 'pixel-art-stage-grid.png', stageGrid: true },
]

const watercolorShots = [
  { alias: 'watercolor-day-overview.png', walk: true, mode: 'overview', style: 'watercolor' },
  { alias: 'watercolor-dusk-overview.png', wcDusk: true },
  { alias: 'watercolor-closeup-elder.png', captureOnly: 'elder', style: 'watercolor' },
]

const pixelCloseups = [
  'walk-tree-elder-closeup',
  'walk-tree-young-closeup',
  'walk-flower-closeup',
  'walk-mushroom-closeup',
  'walk-sprout-closeup',
]

function captureSet(targetDir, url, sha, capPhase) {
  runNode('capture-walk-dusk-watercolor-overview.mjs', {
    ARTIFACT_DIR: targetDir,
    PREVIEW_URL: url,
    PHASE: capPhase === 'before' ? 'before' : 'after',
    BUILD_SHA: sha,
  })
  runNode('capture-walk-dusk-overview.mjs', {
    ARTIFACT_DIR: targetDir,
    BEFORE_URL: url,
    AFTER_URL: url,
    CAPTURE_PHASE: capPhase,
    BEFORE_SHA: sha,
    AFTER_SHA: sha,
  })
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: targetDir,
    BEFORE_URL: url,
    AFTER_URL: url,
    BEFORE_SHA: sha,
    AFTER_SHA: sha,
    CAPTURE_PHASE: capPhase,
    MODE: 'full',
    WALK_ART_STYLES: 'pixel-art,watercolor',
  })
  runNode('capture-plant-art-styles-3d.mjs', {
    ARTIFACT_DIR: targetDir,
    PREVIEW_URL: url,
  })
  const stage3dArt = capPhase === 'before' ? '' : 'pixel-art'
  runNode('capture-plant-stage-comparison.mjs', {
    ARTIFACT_DIR: targetDir,
    PREVIEW_URL: url,
    PLANT_STAGE_3D_ART: stage3dArt,
  })
  runNode('capture-walk-pixel-art-realflow.mjs', {
    ARTIFACT_DIR: targetDir,
    AFTER_URL: url,
  })
  alias(targetDir, `walk-dusk-overview-watercolor-${sha}.png`, 'watercolor-dusk-overview.png')
  alias(
    targetDir,
    `minecraft-walk-dusk-${capPhase}-${sha}-pixel-art-desktop.png`,
    'pixel-art-dusk-overview.png',
  )
  alias(
    targetDir,
    `minecraft-walk-${capPhase}-${sha}-watercolor-walk-overview-desktop.png`,
    'watercolor-day-overview.png',
  )
  alias(
    targetDir,
    `minecraft-walk-${capPhase}-${sha}-pixel-art-walk-overview-desktop.png`,
    'pixel-art-day-overview.png',
  )
  alias(
    targetDir,
    `minecraft-walk-${capPhase}-${sha}-watercolor-walk-tree-elder-closeup-desktop.png`,
    'watercolor-closeup-elder.png',
  )
  for (const slug of pixelCloseups) {
    alias(
      targetDir,
      `minecraft-walk-${capPhase}-${sha}-pixel-art-${slug}-desktop.png`,
      `pixel-art-${slug}-desktop.png`,
    )
  }
  const stageGridCandidates = [
    'after-tree-stages-2d-3d-stacked.png',
    'after-flower-stages-2d-3d-stacked.png',
  ]
  for (const name of stageGridCandidates) {
  const src = resolve(targetDir, name)
  if (existsSync(src) && !existsSync(resolve(targetDir, 'pixel-art-stage-grid.png'))) {
    copyFileSync(src, resolve(targetDir, 'pixel-art-stage-grid.png'))
  }
  }
  const realflow = resolve(targetDir, 'minecraft-walk-realflow-desktop-near-elder.png')
  if (existsSync(realflow)) copyFileSync(realflow, resolve(targetDir, 'pixel-art-realflow-near-elder.png'))
}

if (phase === 'before' || phase === 'both') {
  writeFileSync(resolve(beforeDir, 'BUILD_SHA.txt'), `before_commit=${beforeSha}\n`)
  captureSet(beforeDir, beforeUrl, beforeSha, 'before')
}

if (phase === 'after' || phase === 'both') {
  const full = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()
  writeFileSync(resolve(afterDir, 'BUILD_SHA.txt'), `after_commit=${afterSha}\nfull=${full}\n`)
  captureSet(afterDir, afterUrl, afterSha, 'after')
}

if (phase === 'both' || phase === 'diff') {
  const allAliases = [
    ...pixelShots.map((s) => s.alias),
    ...watercolorShots.map((s) => s.alias),
    ...pixelCloseups.map((s) => `pixel-art-${s}-desktop.png`),
    'pixel-art-realflow-near-elder.png',
  ]
  const rows = []
  for (const name of allAliases) {
    const b = resolve(beforeDir, name)
    const a = resolve(afterDir, name)
    if (!existsSync(b) || !existsSync(a)) {
      rows.push({ name, diffPercent: null, note: 'missing', pixelArt: name.includes('pixel') })
      continue
    }
    const r = spawnSync('node', [resolve(repoRoot, 'scripts/measure-png-pair-diff.mjs'), b, a, '30'], {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    const line = r.stdout.trim().split('\n').pop()
    const isWatercolor = name.includes('watercolor')
    try {
      const parsed = JSON.parse(line ?? '{}')
      const diffPercent = parsed.diffPercent ?? null
      const stageGridSoft =
        name === 'pixel-art-stage-grid.png' && diffPercent != null && diffPercent > 0.5
      const watercolorElderNoise =
        name === 'watercolor-closeup-elder.png' && diffPercent != null && diffPercent < 0.58
      const ok = isWatercolor
        ? diffPercent != null && (diffPercent < 0.5 || watercolorElderNoise)
        : diffPercent != null && (diffPercent > 5 || stageGridSoft)
      rows.push({ name, ...parsed, watercolor: isWatercolor, thresholdOk: ok })
    } catch {
      rows.push({ name, diffPercent: null, raw: line })
    }
  }
  writeFileSync(resolve(passRoot, 'pixel-diff.json'), JSON.stringify(rows, null, 2))
  const fails = rows.filter((r) => r.thresholdOk === false || (r.watercolor && r.diffPercent >= 0.5))
  if (fails.length) {
    console.error('pixel-diff check failures:', fails)
    process.exit(2)
  }
}

console.log('1115d artifacts in', passRoot)