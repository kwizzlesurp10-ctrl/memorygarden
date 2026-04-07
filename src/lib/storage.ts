/**
 * Centralized persistence module.
 *
 * All reads/writes go through this module so the storage backend can
 * be swapped (e.g. from localStorage to IndexedDB or a remote API)
 * without touching consumer code.
 *
 * The public React hook `useKV` is re-exported from here so imports
 * can be consolidated to a single module.
 */

export { useLocalKV as useKV } from './use-local-kv'

/** Key prefix shared across the app. */
export const STORAGE_PREFIX = 'memorygarden' as const

/**
 * Direct (non-React) read from the backing store.
 * Useful in module-level helpers that run outside a component tree.
 */
export function readRaw<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${key}`)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Direct (non-React) write to the backing store.
 */
export function writeRaw<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value))
  } catch {
    // quota / private-browsing — silently drop
  }
}

/**
 * Direct remove from backing store.
 */
export function removeRaw(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}:${key}`)
  } catch {
    // ignore
  }
}
