#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const out = resolve(outDir, 'minecraft-walk-pr224-grid-desktop.png')

const rowFiles = [
  { label: 'overview', file: 'walk-overview' },
  { label: 'mature tree', file: 'walk-tree-mature-closeup' },
  { label: 'elder tree', file: 'walk-tree-elder-closeup' },
  { label: 'flower', file: 'walk-flower-closeup' },
  { label: 'mushroom', file: 'walk-mushroom-closeup' },
  { label: 'sprout', file: 'walk-sprout-closeup' },
]

const columns = [
  { col: 'before pixel-art', phase: 'before', style: 'pixel-art' },
  { col: 'after pixel-art', phase: 'after', style: 'pixel-art' },
  { col: 'after watercolor', phase: 'after', style: 'watercolor' },
]

const args = []
for (const row of rowFiles) {
  for (const col of columns) {
    const p = resolve(outDir, `minecraft-walk-${col.phase}-${col.style}-${row.file}-desktop.png`)
    if (!existsSync(p)) {
      console.error('Missing', p)
      process.exit(1)
    }
    const label = `${col.col}\n${row.label}`
    args.push('(', p, '-label', label, ')')
  }
}
args.push('-tile', '3x6', '-geometry', '420x262+4+4', '-background', '#1a1a1a', '-fill', 'white', '-font', 'DejaVu-Sans', '-pointsize', '13', out)

const montageBin =
  process.env.MONTAGE_BIN ??
  (process.platform === 'win32' ? 'magick' : '/usr/bin/montage')
const r = spawnSync(montageBin, args, { stdio: 'inherit' })
if (r.status !== 0) process.exit(r.status ?? 1)
console.log('Wrote', out)
