/**
 * Pixel-art 3D pass 1115d round 3 — artifacts + pixel-diff (lum>30) + dusk RGB + WC noise.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const phase = (process.env.CAPTURE_PHASE || 'both').toLowerCase()
const passRoot =
  process.env.ARTIFACT_DIR || resolve('/cursor/stores/self/artifacts/3d-pass-1115d-r3')
const beforeDir = resolve(passRoot, 'before')
const afterDir = resolve(passRoot, 'after')
mkdirSync(beforeDir, { recursive: true })
mkdirSync(afterDir, { recursive: true })

const beforeSha =
  process.env.BEFORE_SHA ||
  spawnSync('git', ['rev-parse', '--short', 'c0c289c'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()

function resolveAfterSha() {
  if (process.env.AFTER_SHA) return process.env.AFTER_SHA
  return spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim()
}

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

const pixelCloseups = [
  'walk-tree-elder-closeup',
  'walk-tree-young-closeup',
  'walk-flower-closeup',
  'walk-mushroom-closeup',
  'walk-sprout-closeup',
]

function captureSet(targetDir, url, sha, capPhase, isAfter) {
  const gridEnv = {
    ARTIFACT_DIR: targetDir,
    BEFORE_URL: url,
    AFTER_URL: url,
    CAPTURE_PHASE: capPhase,
    WALK_ART_STYLES: 'pixel-art,watercolor',
  }
  if (isAfter) {
    gridEnv.AFTER_SHA = sha
    gridEnv.BEFORE_SHA = beforeSha
  } else {
    gridEnv.BEFORE_SHA = sha
    delete gridEnv.AFTER_SHA
  }

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
    BEFORE_SHA: isAfter ? beforeSha : sha,
    AFTER_SHA: isAfter ? sha : undefined,
  })
  runNode('capture-minecraft-walk-grid.mjs', {
    ...gridEnv,
    MODE: 'full',
  })
  runNode('capture-plant-art-styles-3d.mjs', {
    ARTIFACT_DIR: targetDir,
    PREVIEW_URL: url,
  })
  const stage3dArt = isAfter ? 'pixel-art' : ''
  runNode('capture-plant-stage-comparison.mjs', {
    ARTIFACT_DIR: targetDir,
    PREVIEW_URL: url,
    PLANT_STAGE_3D_ART: stage3dArt,
  })
  const realflowEnv = {
    ARTIFACT_DIR: targetDir,
    AFTER_URL: url,
    CAPTURE_PHASE: capPhase,
    AFTER_SHA: sha,
  }
  runNode('capture-walk-pixel-art-realflow.mjs', realflowEnv)

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
  const stageGrid = resolve(targetDir, 'after-tree-stages-2d-3d-stacked.png')
  if (existsSync(stageGrid)) copyFileSync(stageGrid, resolve(targetDir, 'pixel-art-stage-grid.png'))
  const realflowCandidates = [
    resolve(targetDir, `minecraft-walk-realflow-${capPhase}-${sha}-desktop-near-elder.png`),
    resolve(targetDir, 'minecraft-walk-realflow-desktop-near-elder.png'),
    resolve(targetDir, `minecraft-walk-realflow-after-${sha}-desktop-near-elder.png`),
  ]
  const realflow = realflowCandidates.find((p) => existsSync(p))
  if (realflow) copyFileSync(realflow, resolve(targetDir, 'pixel-art-realflow-near-elder.png'))

  writeFileSync(
    resolve(targetDir, 'BUILD_SHA.txt'),
    isAfter ? `after_commit=${sha}\n` : `before_commit=${sha}\n`,
  )
}

const parityPairs = [
  'pixel-art-day-overview.png',
  'pixel-art-dusk-overview.png',
  'pixel-art-stage-grid.png',
  'watercolor-day-overview.png',
  'watercolor-dusk-overview.png',
  'watercolor-closeup-elder.png',
  ...pixelCloseups.map((s) => `pixel-art-${s}-desktop.png`),
  'pixel-art-realflow-near-elder.png',
]

if (phase === 'before' || phase === 'both') {
  captureSet(beforeDir, beforeUrl, beforeSha, 'before', false)
}

if (phase === 'after' || phase === 'both') {
  const afterSha = resolveAfterSha()
  captureSet(afterDir, afterUrl, afterSha, 'after', true)
}

if (phase === 'both' || phase === 'diff') {
  const rows = []
  const fails = []
  const pixelTargets = {
    'pixel-art-day-overview.png': 4,
    'pixel-art-dusk-overview.png': 10,
  }
  for (const name of parityPairs) {
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
    const isWatercolor = name.includes('watercolor')
    try {
      const parsed = JSON.parse(line ?? '{}')
      const diffPercent = parsed.diffPercent ?? null
      const minPixel = pixelTargets[name]
      const ok = isWatercolor
        ? diffPercent != null && diffPercent < 0.5
        : minPixel != null
          ? diffPercent != null && diffPercent >= minPixel
          : diffPercent != null && diffPercent > 5
      rows.push({ name, ...parsed, watercolor: isWatercolor, thresholdOk: ok, minPercent: minPixel ?? null })
      if (!ok) fails.push(name)
    } catch {
      rows.push({ name, diffPercent: null, raw: line })
      fails.push(name)
    }
  }
  writeFileSync(resolve(passRoot, 'pixel-diff.json'), JSON.stringify(rows, null, 2))

  const duskPng = resolve(afterDir, 'pixel-art-dusk-overview.png')
  if (existsSync(duskPng)) {
    spawnSync(
      'node',
      [resolve(repoRoot, 'scripts/sample-sky-rows.mjs'), duskPng, resolve(passRoot, 'dusk-sky-rgb-samples.json')],
      { cwd: repoRoot, stdio: 'inherit' },
    )
  }

  const noiseDir = resolve(passRoot, 'watercolor-elder-noise')
  mkdirSync(noiseDir, { recursive: true })
  runNode('capture-minecraft-walk-grid.mjs', {
    ARTIFACT_DIR: noiseDir,
    BEFORE_URL: beforeUrl,
    AFTER_URL: beforeUrl,
    CAPTURE_PHASE: 'after',
    AFTER_SHA: beforeSha,
    WALK_ART_STYLES: 'watercolor',
    CAPTURE_ONLY: 'elder',
  })
  const elderA = resolve(noiseDir, `minecraft-walk-after-${beforeSha}-watercolor-walk-tree-elder-closeup-desktop.png`)
  const elderB = resolve(noiseDir, 'watercolor-elder-repeat.png')
  if (existsSync(elderA)) {
    copyFileSync(elderA, resolve(noiseDir, 'watercolor-elder-run1.png'))
    runNode('capture-minecraft-walk-grid.mjs', {
      ARTIFACT_DIR: noiseDir,
      BEFORE_URL: beforeUrl,
      AFTER_URL: beforeUrl,
      CAPTURE_PHASE: 'after',
      AFTER_SHA: beforeSha,
      WALK_ART_STYLES: 'watercolor',
      CAPTURE_ONLY: 'elder',
    })
    if (existsSync(elderA)) copyFileSync(elderA, resolve(noiseDir, 'watercolor-elder-run2.png'))
    if (existsSync(resolve(noiseDir, 'watercolor-elder-run1.png')) && existsSync(resolve(noiseDir, 'watercolor-elder-run2.png'))) {
      const nr = spawnSync(
        'node',
        [
          resolve(repoRoot, 'scripts/measure-png-pair-diff.mjs'),
          resolve(noiseDir, 'watercolor-elder-run1.png'),
          resolve(noiseDir, 'watercolor-elder-run2.png'),
          '30',
        ],
        { cwd: repoRoot, encoding: 'utf8' },
      )
      const line = nr.stdout.trim().split('\n').pop()
      try {
        const parsed = JSON.parse(line ?? '{}')
        writeFileSync(
          resolve(passRoot, 'watercolor-elder-noise-floor.json'),
          JSON.stringify({ baseline: beforeSha, sameBuildTwice: parsed }, null, 2),
        )
      } catch {
        writeFileSync(resolve(passRoot, 'watercolor-elder-noise-floor.json'), JSON.stringify({ raw: line }, null, 2))
      }
    }
  }

  if (fails.length) {
    console.error('pixel-diff check failures:', fails)
    process.exit(2)
  }
}

console.log('1115d-r3 artifacts in', passRoot)