import { format } from 'date-fns'
import type { Memory } from '@/lib/types'
import { getLinkHostname, getLinkPlatformLabel } from '@/lib/memory-link'

type MemoryLike = Pick<Memory, 'text' | 'date' | 'linkUrl' | 'photoUrl'>

export function formatMemoryDateLabel(date: string): string {
  try {
    return format(new Date(date), 'MMMM d, yyyy')
  } catch {
    return 'This memory'
  }
}

/** Short label for lists, minimap titles, and export snippets */
export function memoryPrimaryLabel(memory: MemoryLike): string {
  const text = memory.text?.trim()
  if (text) {
    const collapsed = text.replace(/\s+/g, ' ')
    if (collapsed.length <= 72) return collapsed
    return `${collapsed.slice(0, 69).trimEnd()}…`
  }
  if (memory.linkUrl?.trim()) {
    const host = getLinkHostname(memory.linkUrl)
    const platform = getLinkPlatformLabel(host)
    return platform ? `Link · ${platform}` : `Link · ${host}`
  }
  if (memory.photoUrl?.trim()) {
    return `Photo · ${formatMemoryDateLabel(memory.date)}`
  }
  return formatMemoryDateLabel(memory.date)
}

/** Body copy for detail views when text is absent */
export function memoryBodyFallback(memory: MemoryLike): string {
  if (memory.linkUrl?.trim()) {
    const host = getLinkHostname(memory.linkUrl)
    const platform = getLinkPlatformLabel(host)
    if (platform) return `A saved link to ${platform}.`
    return `A saved link from ${host}.`
  }
  if (memory.photoUrl?.trim()) {
    return `A moment captured on ${formatMemoryDateLabel(memory.date)}.`
  }
  return `A quiet memory from ${formatMemoryDateLabel(memory.date)}.`
}

export function memoryExportSnippet(memory: MemoryLike, maxLen = 120): string {
  const text = memory.text?.trim()
  if (text) {
    return text.length <= maxLen ? text : `${text.slice(0, maxLen - 1)}…`
  }
  return memoryPrimaryLabel(memory)
}
