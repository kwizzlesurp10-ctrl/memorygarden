/**
 * PR #238 round 3 — dusk sky fix verification (agent store only).
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PNG } = require('pngjs')

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const passRoot =
  process.env.ARTIFACT_DIR || resolve('/cursor/stores/self/artifacts/3d-pass-1115c-r3')
const phase = (process.env.CAPTURE_PHASE || 'both').toLowerCase()
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
  if (existsSync(src)) copyFileSync(src, resolve(srcDir, to))
}

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
  })
  alias(beforeDir, `walk-dusk-overview-watercolor-${beforeSha}.png`, 'watercolor-dusk-overview.png')
  alias(beforeDir, `minecraft-walk-dusk-before-${beforeSha}-pixel-art-desktop.png`, 'pixel-art-dusk-overview.png')
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
  })
  alias(afterDir, `walk-dusk-overview-watercolor-${afterSha}.png`, 'watercolor-dusk-overview.png')
  alias(afterDir, `minecraft-walk-dusk-after-${afterSha}-pixel-art-desktop.png`, 'pixel-art-dusk-overview.png')
}

function pxAt(png, x, y) {
  const i = (png.width * y + x) << 2
  return { x, y, yPct: y / png.height, r: png.data[i], g: png.data[i + 1], b: png.data[i + 2] }
}

function rgbDelta(a, b) {
  return [Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b)]
}

function sampleColumn(pngPath) {
  const buf = readFileSync(pngPath)
  const png = PNG.sync.read(buf)
  const { width, height } = png
  const centerX = Math.floor(width / 2)
  const quarterX = Math.floor(width / 4)
  const ys = [0.05, 0.25, 0.5, 0.7].map((f) => Math.floor(height * f))
  const samples = []
  for (const x of [quarterX, centerX]) {
    for (const y of ys) samples.push(pxAt(png, x, y))
  }
  const skyYs = [0.05, 0.25, 0.38].map((f) => Math.floor(height * f))
  const skyColumn = skyYs.map((y) => pxAt(png, centerX, y))
  const skyStrip = []
  const yMax = Math.min(200, height - 1)
  for (let y = 2; y <= yMax; y += Math.max(1, Math.floor((yMax - 2) / 12))) {
    skyStrip.push(pxAt(png, quarterX, y), pxAt(png, centerX, y))
  }
  return { width, height, samples, skyColumn, skyStrip }
}

function isSkyPixel(p, height) {
  return p.y / height <= 0.4 || p.r > 95
}

function verifyGradient({ width, height, samples, skyColumn, skyStrip }) {
  const issues = []
  for (let i = 0; i < skyColumn.length - 1; i++) {
    const a = skyColumn[i]
    const b = skyColumn[i + 1]
    const [dr, dg, db] = rgbDelta(a, b)
    if (dr < 15 && dg < 15 && db < 15) {
      issues.push(`sky column y ${a.y}→${b.y}: delta rgb too small (${dr},${dg},${db})`)
    }
  }
  const top = skyColumn[0]
  const horizonSky = skyColumn[skyColumn.length - 1]
  const topLuma = top.r + top.g + top.b
  const horizonLuma = horizonSky.r + horizonSky.g + horizonSky.b
  if (topLuma >= horizonLuma - 6) {
    issues.push(
      `top not darker than horizon sky (top ${top.r},${top.g},${top.b} vs ${horizonSky.r},${horizonSky.g},${horizonSky.b})`,
    )
  }
  if (top.r >= horizonSky.r) {
    issues.push(`top not cooler/darker than horizon (r ${top.r} vs ${horizonSky.r})`)
  }
  const centerX = Math.floor(width / 2)
  const center = samples.filter((s) => s.x === centerX).sort((a, b) => a.y - b.y)
  for (let i = 0; i < center.length - 1; i++) {
    const a = center[i]
    const b = center[i + 1]
    if (!isSkyPixel(a, height) || !isSkyPixel(b, height)) continue
    const [dr, dg, db] = rgbDelta(a, b)
    if (dr < 15 && dg < 15 && db < 15) {
      issues.push(`center column y ${a.y}→${b.y}: delta rgb too small (${dr},${dg},${db})`)
    }
  }
  let minR = 255
  let maxR = 0
  for (const s of skyStrip) {
    minR = Math.min(minR, s.r)
    maxR = Math.max(maxR, s.r)
  }
  if (maxR - minR < 15) issues.push(`sky strip y=2..200 lacks vertical spread (Δr=${maxR - minR})`)
  return issues
}

if (phase === 'both' || phase === 'diff') {
  const rows = []
  for (const name of ['watercolor-dusk-overview.png', 'pixel-art-dusk-overview.png']) {
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
      rows.push({ name, raw: line })
    }
  }
  writeFileSync(resolve(passRoot, 'pixel-diff.json'), JSON.stringify(rows, null, 2))
  console.log('diff', JSON.stringify(rows, null, 2))

  const afterWc = resolve(afterDir, 'watercolor-dusk-overview.png')
  if (existsSync(afterWc)) {
    const column = sampleColumn(afterWc)
    const issues = verifyGradient({ ...column, height: column.height })
    const report = {
      width: column.width,
      height: column.height,
      samples: column.samples,
      skyColumn: column.skyColumn,
      skyStripSpread: column.skyStrip,
      gradientOk: issues.length === 0,
      issues,
    }
    writeFileSync(resolve(passRoot, 'sky-rgb-samples.json'), JSON.stringify(report, null, 2))
    console.log('sky RGB samples (after watercolor dusk):', JSON.stringify(report, null, 2))
    if (issues.length) {
      console.error('Gradient self-check FAILED:', issues.join('; '))
      process.exit(1)
    }
  }
}

console.log('R3 artifacts in', passRoot)