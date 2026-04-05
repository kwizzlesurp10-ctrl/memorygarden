import { useState, useCallback } from 'react'

type Updater<T> = T | ((current: T) => T)

export function useLocalKV<T>(key: string, defaultValue: T): [T, (updater: Updater<T>) => void] {
  const storageKey = `memorygarden:${key}`

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        return JSON.parse(stored) as T
      }
    } catch {
      // ignore parse errors, fall through to default
    }
    return defaultValue
  })

  const setter = useCallback(
    (updater: Updater<T>) => {
      setValue((current) => {
        const next =
          typeof updater === 'function'
            ? (updater as (current: T) => T)(current)
            : updater
        try {
          localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          // ignore storage errors (e.g. private browsing quota)
        }
        return next
      })
    },
    [storageKey],
  )

  return [value, setter]
}
