const ADJECTIVES = ['Gentle', 'Serene', 'Bright', 'Quiet', 'Warm', 'Calm', 'Soft', 'Kind']
const NOUNS = ['Gardener', 'Dreamer', 'Keeper', 'Wanderer', 'Grower', 'Tender', 'Planter', 'Watcher']
const STORAGE_KEY = 'memorygarden:user'

export interface LocalUser {
  id: string
  login: string
  avatarUrl: string
}

// Module-level cache so localStorage is only read once per page load
let _cachedUser: LocalUser | null = null

function secureRandInt(max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

export function generateId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for older browsers: manual UUID v4
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  arr[6] = (arr[6] & 0x0f) | 0x40
  arr[8] = (arr[8] & 0x3f) | 0x80
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, '0'))
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

function createLocalUser(): LocalUser {
  const adj = ADJECTIVES[secureRandInt(ADJECTIVES.length)]
  const noun = NOUNS[secureRandInt(NOUNS.length)]
  const login = `${adj}${noun}`
  return { id: generateId(), login, avatarUrl: '' }
}

export function getLocalUser(): LocalUser {
  if (_cachedUser) return _cachedUser

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<LocalUser>
      // Migrate legacy profiles that lack an id
      if (!parsed.id) {
        const migrated: LocalUser = { id: generateId(), login: parsed.login ?? 'Gardener', avatarUrl: parsed.avatarUrl ?? '' }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        } catch {
          // ignore storage errors
        }
        _cachedUser = migrated
        return migrated
      }
      _cachedUser = parsed as LocalUser
      return _cachedUser
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
  _cachedUser = user
  return user
}
