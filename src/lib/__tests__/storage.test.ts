import { describe, it, expect, beforeEach } from 'vitest'
import { readRaw, writeRaw, removeRaw, STORAGE_PREFIX } from '../storage'

describe('storage module', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('STORAGE_PREFIX', () => {
    it('equals "memorygarden"', () => {
      expect(STORAGE_PREFIX).toBe('memorygarden')
    })
  })

  describe('writeRaw / readRaw', () => {
    it('writes and reads a string value', () => {
      writeRaw('test-key', 'hello')
      expect(readRaw<string>('test-key')).toBe('hello')
    })

    it('writes and reads an object value', () => {
      const obj = { name: 'garden', count: 42 }
      writeRaw('obj-key', obj)
      expect(readRaw<typeof obj>('obj-key')).toEqual(obj)
    })

    it('returns null for missing keys', () => {
      expect(readRaw('nonexistent')).toBeNull()
    })

    it('stores under the correct prefixed key', () => {
      writeRaw('mykey', 'value')
      expect(localStorage.getItem(`${STORAGE_PREFIX}:mykey`)).toBe('"value"')
    })

    it('overwrites existing values', () => {
      writeRaw('k', 1)
      writeRaw('k', 2)
      expect(readRaw<number>('k')).toBe(2)
    })
  })

  describe('removeRaw', () => {
    it('removes an existing key', () => {
      writeRaw('del-key', 'data')
      removeRaw('del-key')
      expect(readRaw('del-key')).toBeNull()
    })

    it('does nothing for non-existent keys', () => {
      removeRaw('nope')
      expect(readRaw('nope')).toBeNull()
    })
  })

  describe('readRaw error handling', () => {
    it('returns null for corrupted JSON', () => {
      localStorage.setItem(`${STORAGE_PREFIX}:bad`, '{not valid json')
      expect(readRaw('bad')).toBeNull()
    })
  })
})
