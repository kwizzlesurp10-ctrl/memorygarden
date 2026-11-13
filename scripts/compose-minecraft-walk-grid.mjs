#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const tmp = resolve(outDir, '.grid-compose-tmp')
const out = resolve(outDir, 'minecraft-walk-pr224-grid-desktop.png')
const cellW = 420
const cellH = 262
const labelW = 108
const headerH = 56
const font = 'DejaVu-Sans'
const convertBin = process.env.CONVERT_BIN ?? '/usr/bin/convert'

mkdirSync(tmp, { recursive: true })

const rowFiles = [
  { label: 'overview', file: 'walk-overview' },
  { label: 'mature tree', file: 'walk-tree-mature-closeup' },
  { label: 'elder tree', file: 'walk-tree-elder-closeup' },
  { label: 'flower', file: 'walk-flower-closeup' },
  { label: 'mushroom', file: 'walk-mushroom-closeup' },
  { label: 'sprout', file: 'walk-sprout-closeup' },
]

const columns = [
  { header: 'before pixel-art\n(61887fe)', phase: 'before', style: 'pixel-art' },
  { header: 'after pixel-art', phase: 'after', style: 'pixel-art' },
  { header: 'after watercolor', phase: 'after', style: 'watercolor' },
]

function runConvert(args) {
  const r = spawnSync(convertBin, args, { stdio: 'pipe', encoding: 'utf8' })
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout)
    process.exit(r.status ?? 1)
  }
}

const spacer = resolve(tmp, 'spacer.png')
runConvert([
  '-size',
  `${labelW}x${headerH}`,
  'xc:#1a1a1a',
  spacer,
])

const headerParts = [spacer]
for (const col of columns) {
  const hp = resolve(tmp, `hdr-${col.style}.png`)
  runConvert([
    '-size',
    `${cellW}x${headerH}`,
    'xc:#1a1a1a',
    '-fill',
    'white',
    '-font',
    font,
    '-pointsize',
    '14',
    '-gravity',
    'center',
    '-annotate',
    '0',
    col.header,
    hp,
  ])
  headerParts.push(hp)
}
const headerRow = resolve(tmp, 'header-row.png')
runConvert([...headerParts, '+append', headerRow])

const bodyRows = []
for (const row of rowFiles) {
  const rowLabel = resolve(tmp, `row-${row.file}.png`)
  runConvert([
    '-size',
    `${labelW}x${cellH}`,
    'xc:#1a1a1a',
    '-fill',
    'white',
    '-font',
    font,
    '-pointsize',
    '13',
    '-gravity',
    'center',
    '-annotate',
    '0',
    row.label,
    rowLabel,
  ])
  const cells = [rowLabel]
  for (const col of columns) {
    const p = resolve(
      outDir,
      `minecraft-walk-${col.phase}-${col.style}-${row.file}-desktop.png`,
    )
    if (!existsSync(p)) {
      console.error('Missing', p)
      process.exit(1)
    }
    const thumb = resolve(tmp, `cell-${row.file}-${col.phase}-${col.style}.png`)
    runConvert([
      p,
      '-resize',
      `${cellW}x${cellH}^`,
      '-gravity',
      'center',
      '-extent',
      `${cellW}x${cellH}`,
      thumb,
    ])
    cells.push(thumb)
  }
  const rowImg = resolve(tmp, `row-${row.file}-full.png`)
  runConvert([...cells, '+append', rowImg])
  bodyRows.push(rowImg)
}

runConvert([headerRow, ...bodyRows, '-append', out])
console.log('Wrote', out)
try {
  rmSync(tmp, { recursive: true, force: true })
} catch {
  /* optional cleanup */
}
