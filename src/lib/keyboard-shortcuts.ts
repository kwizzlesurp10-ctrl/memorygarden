/**
 * Keyboard shortcut registry for MemoryGarden.
 *
 * Provides a lightweight, framework-agnostic registry for app-wide keyboard
 * shortcuts.  React components use the exported `useKeyboardShortcuts` hook
 * (or call `registerShortcut` / `unregisterShortcut` directly in effects).
 *
 * Design goals:
 * - Zero external dependencies
 * - Supports modifier keys (Ctrl / Cmd, Shift, Alt)
 * - Prevents default browser behaviour when a shortcut is matched
 * - Respects focus context (ignored when typing in inputs / textareas)
 */

import { useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export type ModifierKey = 'ctrl' | 'meta' | 'shift' | 'alt' | 'ctrlOrMeta'

export interface ShortcutDescriptor {
  /** The key code (e.g. 'k', 'Enter', 'Escape', 'ArrowLeft') */
  key: string
  /** Modifier keys that must be held */
  modifiers?: ModifierKey[]
  /** Human-readable description shown in the shortcuts panel */
  description: string
  /** Category for grouping in the shortcuts panel */
  category?: string
  /**
   * When true, the shortcut fires even if focus is in an input/textarea.
   * Default: false.
   */
  global?: boolean
}

export interface RegisteredShortcut extends ShortcutDescriptor {
  id: string
  handler: () => void
}

// ── Registry ─────────────────────────────────────────────────────────────────

const _registry = new Map<string, RegisteredShortcut>()
let _listenerAttached = false

function buildKey(descriptor: ShortcutDescriptor): string {
  const mods = (descriptor.modifiers ?? [])
    .map(m => (m === 'ctrlOrMeta' ? 'ctrlOrMeta' : m))
    .sort()
    .join('+')
  return mods ? `${mods}+${descriptor.key.toLowerCase()}` : descriptor.key.toLowerCase()
}

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  )
}

function matchesModifiers(event: KeyboardEvent, modifiers: ModifierKey[]): boolean {
  return modifiers.every(mod => {
    switch (mod) {
      case 'ctrl':        return event.ctrlKey
      case 'meta':        return event.metaKey
      case 'shift':       return event.shiftKey
      case 'alt':         return event.altKey
      case 'ctrlOrMeta':  return event.ctrlKey || event.metaKey
      default:            return false
    }
  })
}

function handleKeyDown(event: KeyboardEvent): void {
  for (const shortcut of _registry.values()) {
    // Skip when typing unless the shortcut is marked global
    if (!shortcut.global && isInputFocused()) continue

    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
    const modMatch = matchesModifiers(event, shortcut.modifiers ?? [])

    if (keyMatch && modMatch) {
      event.preventDefault()
      shortcut.handler()
      return
    }
  }
}

function ensureListener(): void {
  if (_listenerAttached) return
  if (typeof window === 'undefined') return
  window.addEventListener('keydown', handleKeyDown)
  _listenerAttached = true
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register a keyboard shortcut.
 * Returns the generated shortcut ID for later removal.
 */
export function registerShortcut(
  id: string,
  descriptor: ShortcutDescriptor,
  handler: () => void
): string {
  ensureListener()
  _registry.set(id, { id, ...descriptor, handler })
  return id
}

/**
 * Remove a previously registered shortcut by ID.
 */
export function unregisterShortcut(id: string): void {
  _registry.delete(id)
}

/**
 * Return a snapshot of all registered shortcuts.
 * Useful for rendering a "keyboard shortcuts" reference panel.
 */
export function listShortcuts(): RegisteredShortcut[] {
  return [..._registry.values()]
}

/**
 * Clear all registered shortcuts and detach the event listener.
 * Mainly used in tests.
 */
export function clearShortcuts(): void {
  _registry.clear()
  if (_listenerAttached && typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
    _listenerAttached = false
  }
}

// ── React hook ────────────────────────────────────────────────────────────────

export interface UseKeyboardShortcutsOptions {
  shortcuts: Array<{
    id: string
    descriptor: ShortcutDescriptor
    handler: () => void
  }>
  /** When false, shortcuts are not registered. Useful for conditional enabling. */
  enabled?: boolean
}

/**
 * Register a set of keyboard shortcuts for the lifetime of a React component.
 * Shortcuts are automatically unregistered when the component unmounts or
 * when the `shortcuts` / `enabled` dependencies change.
 *
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       id: 'open-plant-modal',
 *       descriptor: { key: 'n', modifiers: ['ctrlOrMeta'], description: 'Plant a memory' },
 *       handler: () => setIsPlantModalOpen(true),
 *     },
 *   ],
 * })
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return

    const ids = shortcuts.map(({ id, descriptor, handler }) =>
      registerShortcut(id, descriptor, handler)
    )

    return () => {
      for (const id of ids) {
        unregisterShortcut(id)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...shortcuts.map(s => s.handler)])
}

// ── Pre-defined shortcut descriptors ──────────────────────────────────────────

/**
 * Well-known shortcut descriptors used throughout the app.
 * Import these constants instead of hard-coding strings.
 */
export const APP_SHORTCUTS = {
  PLANT_MEMORY: {
    key: 'n',
    modifiers: ['ctrlOrMeta'] as ModifierKey[],
    description: 'Plant a new memory',
    category: 'Garden',
  },
  TOGGLE_SEARCH: {
    key: 'k',
    modifiers: ['ctrlOrMeta'] as ModifierKey[],
    description: 'Focus search',
    category: 'Navigation',
  },
  CLOSE_MODAL: {
    key: 'Escape',
    description: 'Close current modal',
    category: 'Navigation',
    global: true,
  },
  VIEW_GARDEN: {
    key: '1',
    description: 'Switch to garden view',
    category: 'Navigation',
  },
  VIEW_TIMELINE: {
    key: '2',
    description: 'Switch to timeline view',
    category: 'Navigation',
  },
  VIEW_CLUSTERS: {
    key: '3',
    description: 'Switch to clusters view',
    category: 'Navigation',
  },
  EXPORT: {
    key: 'e',
    modifiers: ['ctrlOrMeta', 'shift'] as ModifierKey[],
    description: 'Export garden',
    category: 'Garden',
  },
} as const satisfies Record<string, ShortcutDescriptor>

/**
 * Format a shortcut descriptor as a human-readable key combination string.
 *
 * @example
 * formatShortcut(APP_SHORTCUTS.PLANT_MEMORY) // "⌘N" on Mac, "Ctrl+N" on Windows
 */
export function formatShortcut(descriptor: ShortcutDescriptor, platform = navigator.platform): string {
  const isMac = platform.toLowerCase().includes('mac')
  const parts: string[] = []

  for (const mod of descriptor.modifiers ?? []) {
    switch (mod) {
      case 'ctrlOrMeta':
        parts.push(isMac ? '⌘' : 'Ctrl')
        break
      case 'ctrl':
        parts.push(isMac ? '⌃' : 'Ctrl')
        break
      case 'meta':
        parts.push(isMac ? '⌘' : 'Win')
        break
      case 'shift':
        parts.push(isMac ? '⇧' : 'Shift')
        break
      case 'alt':
        parts.push(isMac ? '⌥' : 'Alt')
        break
    }
  }

  const key = descriptor.key.length === 1 ? descriptor.key.toUpperCase() : descriptor.key
  parts.push(key)

  return isMac ? parts.join('') : parts.join('+')
}
