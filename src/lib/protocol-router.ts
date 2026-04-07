/**
 * Protocol handler router — pure functions for deep-link resolution.
 *
 * Supported schemes:
 *   web+plantmemory://<optional-data>   → open the "plant memory" modal
 *   web+viewmemory://<memory-id>        → navigate to a specific memory
 *   web+memorygarden://<path>           → general-purpose / future use
 *
 * The router is intentionally decoupled from React so it can be tested
 * and reused outside component code.
 */

export type ProtocolAction =
  | { type: 'plant-memory'; data?: string }
  | { type: 'view-memory'; id: string }
  | { type: 'garden'; path: string }
  | { type: 'none' }

const SCHEME_PLANT = 'web+plantmemory://'
const SCHEME_VIEW = 'web+viewmemory://'
const SCHEME_GARDEN = 'web+memorygarden://'

/**
 * Parse a raw protocol URL string into a typed action.
 *
 * @example
 *   parseProtocolUrl('web+plantmemory://some-data')
 *   // → { type: 'plant-memory', data: 'some-data' }
 *
 *   parseProtocolUrl('web+viewmemory://memory-123')
 *   // → { type: 'view-memory', id: 'memory-123' }
 */
export function parseProtocolUrl(raw: string): ProtocolAction {
  if (!raw || typeof raw !== 'string') return { type: 'none' }

  const decoded = decodeURIComponent(raw.trim())

  if (decoded.startsWith(SCHEME_PLANT)) {
    const data = decoded.slice(SCHEME_PLANT.length).trim()
    return { type: 'plant-memory', data: data || undefined }
  }

  if (decoded.startsWith(SCHEME_VIEW)) {
    const id = decoded.slice(SCHEME_VIEW.length).trim()
    return id ? { type: 'view-memory', id } : { type: 'none' }
  }

  if (decoded.startsWith(SCHEME_GARDEN)) {
    const path = decoded.slice(SCHEME_GARDEN.length).trim()
    return { type: 'garden', path }
  }

  return { type: 'none' }
}

/**
 * Resolve the current page URL to a protocol action.
 *
 * Supports two routing conventions:
 *   1. Path-based: `/plant?data=…`, `/memory?id=…`
 *   2. Handler redirect: `/handle?protocol=<encoded-protocol-url>`
 */
export function resolveFromLocation(url: URL): ProtocolAction {
  // Convention 2: handler redirect
  if (url.pathname === '/handle') {
    const protocolParam = url.searchParams.get('protocol')
    if (protocolParam) {
      return parseProtocolUrl(protocolParam)
    }
    return { type: 'none' }
  }

  // Convention 1a: /plant
  if (url.pathname === '/plant') {
    const data = url.searchParams.get('data')
    return {
      type: 'plant-memory',
      data: data ? decodeURIComponent(data) : undefined,
    }
  }

  // Convention 1b: /memory
  if (url.pathname === '/memory') {
    const id = url.searchParams.get('id')
    return id ? { type: 'view-memory', id: decodeURIComponent(id) } : { type: 'none' }
  }

  return { type: 'none' }
}

/**
 * Build a protocol URL for external use (e.g. sharing a deep-link).
 */
export function buildProtocolUrl(action: ProtocolAction): string | null {
  switch (action.type) {
    case 'plant-memory':
      return action.data
        ? `${SCHEME_PLANT}${encodeURIComponent(action.data)}`
        : SCHEME_PLANT
    case 'view-memory':
      return `${SCHEME_VIEW}${encodeURIComponent(action.id)}`
    case 'garden':
      return `${SCHEME_GARDEN}${encodeURIComponent(action.path)}`
    case 'none':
      return null
  }
}
