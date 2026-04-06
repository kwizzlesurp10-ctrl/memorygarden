import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getLocalUser } from '../local-user'

// Reset the module-level cache between tests by re-importing the module.
// vi.resetModules() clears the module registry so each dynamic import
// in the test cases gets a fresh module instance with _cachedUser === null.
describe('getLocalUser', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset module so the _cachedUser variable is cleared
    vi.resetModules()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('creates a new user when localStorage is empty', async () => {
    const { getLocalUser: freshGet } = await import('../local-user')
    const user = freshGet()
    expect(user).toMatchObject({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/i),
      login: expect.stringMatching(/^[A-Z][a-z]+[A-Z][a-z]+$/),
      avatarUrl: '',
    })
  })

  it('persists the created user to localStorage', async () => {
    const { getLocalUser: freshGet } = await import('../local-user')
    const user = freshGet()
    const stored = JSON.parse(localStorage.getItem('memorygarden:user')!)
    expect(stored).toEqual(user)
  })

  it('returns the same user on subsequent calls (cache hit)', async () => {
    const { getLocalUser: freshGet } = await import('../local-user')
    const first = freshGet()
    const second = freshGet()
    expect(first).toBe(second) // exact same reference
  })

  it('reads an existing user from localStorage', async () => {
    const existing = { id: 'abc-123', login: 'TestGardener', avatarUrl: '' }
    localStorage.setItem('memorygarden:user', JSON.stringify(existing))
    const { getLocalUser: freshGet } = await import('../local-user')
    const user = freshGet()
    expect(user).toEqual(existing)
  })

  it('migrates a legacy profile that lacks an id', async () => {
    localStorage.setItem('memorygarden:user', JSON.stringify({ login: 'OldGardener', avatarUrl: '' }))
    const { getLocalUser: freshGet } = await import('../local-user')
    const user = freshGet()
    expect(user.login).toBe('OldGardener')
    expect(user.id).toBeTruthy()
    // The migrated profile must also be saved back to storage
    const stored = JSON.parse(localStorage.getItem('memorygarden:user')!)
    expect(stored.id).toBe(user.id)
  })

  it('handles corrupt localStorage JSON gracefully', async () => {
    localStorage.setItem('memorygarden:user', '<<<not json>>>')
    const { getLocalUser: freshGet } = await import('../local-user')
    const user = freshGet()
    expect(user.id).toBeTruthy()
  })
})
