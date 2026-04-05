const ADJECTIVES = ['Gentle', 'Serene', 'Bright', 'Quiet', 'Warm', 'Calm', 'Soft', 'Kind']
const NOUNS = ['Gardener', 'Dreamer', 'Keeper', 'Wanderer', 'Grower', 'Tender', 'Planter', 'Watcher']
const STORAGE_KEY = 'memorygarden:user'

function secureRandInt(max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

function createLocalUser(): { login: string; avatarUrl: string } {
  const adj = ADJECTIVES[secureRandInt(ADJECTIVES.length)]
  const noun = NOUNS[secureRandInt(NOUNS.length)]
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
