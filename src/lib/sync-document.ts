import { parseHttpHttpsLinkUrl } from '@/lib/memory-link'

/**
 * Cloud sync must stay backward compatible with memories written under older
 * client rules. Only sanitize the optional `linkUrl` field.
 */
export function sanitizeMemoryLinkUrlFields(memories: unknown): unknown {
  if (!Array.isArray(memories)) return memories

  return memories.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry
    const memory = entry as Record<string, unknown>
    if (!Object.prototype.hasOwnProperty.call(memory, 'linkUrl')) {
      return entry
    }
    const raw = memory.linkUrl
    if (raw === undefined || raw === null || raw === '') {
      return entry
    }
    if (typeof raw !== 'string') {
      const { linkUrl: _removed, ...rest } = memory
      return rest
    }
    const parsed = parseHttpHttpsLinkUrl(raw)
    if (!parsed.valid || !parsed.normalized) {
      const { linkUrl: _removed, ...rest } = memory
      return rest
    }
    return { ...memory, linkUrl: parsed.normalized }
  })
}

export function sanitizeSyncDocument(document: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(document.memories)) {
    return document
  }
  return {
    ...document,
    memories: sanitizeMemoryLinkUrlFields(document.memories),
  }
}
