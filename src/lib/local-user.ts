const ADJECTIVES = ['Gentle', 'Serene', 'Bright', 'Quiet', 'Warm', 'Calm', 'Soft', 'Kind']
const NOUNS = ['Gardener', 'Dreamer', 'Keeper', 'Wanderer', 'Grower', 'Tender', 'Planter', 'Watcher']
const STORAGE_KEY = 'memorygarden:user'

function createLocalUser(): { login: string; avatarUrl: string } {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const login = `${adj}${noun}`
  return { login, avatarUrl: '' }
}

export function getLocalUser(): { login: string; avatarUrl: string } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as { login: string; avatarUrl: string }
    }
  } catch {
    // ignore parse errors
  }

  const user = createLocalUser()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch {
    // ignore storage errors
  }
  return user
}
