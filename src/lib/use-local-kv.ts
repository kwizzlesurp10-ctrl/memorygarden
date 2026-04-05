import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Drop-in replacement for @github/spark's useKV hook.
 * Persists state to localStorage with the same API:
 *   const [value, setValue] = useLocalKV<T>(key, defaultValue)
 */
export function useLocalKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const defaultRef = useRef(defaultValue)

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`memorygarden:${key}`)
      if (stored !== null) {
        return JSON.parse(stored) as T
      }
    } catch {
      // Corrupted or missing — fall back
    }
    return defaultRef.current
  })

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(`memorygarden:${key}`, JSON.stringify(state))
    } catch {
      // Storage full or unavailable — silent
    }
  }, [key, state])

  // Listen for changes from other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === `memorygarden:${key}` && e.newValue !== null) {
        try {
          setState(JSON.parse(e.newValue) as T)
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [key])

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(value)
  }, [])

  return [state, setValue]
}
