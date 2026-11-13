/**
 * Build commit 256ca59 in a git worktree and print preview command for port 4173.
 * Usage: node scripts/prepare-walk-before-preview.mjs
 */
import { execSync, spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const sha = process.env.BEFORE_SHA || '256ca59'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const worktree = resolve(root, '..', `memorygarden-${sha}`)

if (!existsSync(worktree)) {
  execSync(`git worktree add "${worktree}" ${sha}`, { cwd: root, stdio: 'inherit' })
}

execSync('npm install --legacy-peer-deps', { cwd: worktree, stdio: 'inherit' })
execSync('npm run build', { cwd: worktree, stdio: 'inherit' })

spawnSync('npx', ['kill-port', '4173'], { cwd: worktree, stdio: 'ignore' })
const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], {
  cwd: worktree,
  detached: true,
  stdio: 'ignore',
})
preview.unref()

console.log(`Before preview: http://127.0.0.1:4173 (worktree ${worktree}, ${sha})`)
