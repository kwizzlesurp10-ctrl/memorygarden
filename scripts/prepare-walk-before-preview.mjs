/**
 * Build commit 61887fe in a git worktree and print preview command for port 4173.
 * Usage: node scripts/prepare-walk-before-preview.mjs
 */
import { execSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const sha = process.env.BEFORE_SHA || '61887fe'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const worktree = resolve(root, '..', `memorygarden-${sha}`)

if (!existsSync(worktree)) {
  execSync(`git worktree add "${worktree}" ${sha}`, { cwd: root, stdio: 'inherit' })
}

execSync('npm install --legacy-peer-deps', { cwd: worktree, stdio: 'inherit' })
execSync('npm run build', { cwd: worktree, stdio: 'inherit' })

const child = spawnSync(
  'npm',
  ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'],
  { cwd: worktree, detached: true, stdio: 'ignore' },
)
if (child.error) throw child.error

console.log(`Before preview: http://127.0.0.1:4173 (worktree ${worktree}, ${sha})`)
