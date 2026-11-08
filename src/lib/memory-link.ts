export const MAX_MEMORY_LINK_URL_LENGTH = 2048

const UNSAFE_SCHEME_RE = /^(javascript|data|vbscript|file):/i

export interface LinkUrlValidation {
  valid: boolean
  normalized: string
  error?: string
}

/**
 * Accept only explicit http(s) URLs for user-supplied links.
 * Returns a canonical href from the URL parser when valid.
 */
export function parseHttpHttpsLinkUrl(raw: string): LinkUrlValidation {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { valid: true, normalized: '' }
  }
  if (trimmed.length > MAX_MEMORY_LINK_URL_LENGTH) {
    return { valid: false, normalized: '', error: `Link must be at most ${MAX_MEMORY_LINK_URL_LENGTH} characters` }
  }
  if (UNSAFE_SCHEME_RE.test(trimmed)) {
    return { valid: false, normalized: '', error: 'Only http:// and https:// links are allowed' }
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return { valid: false, normalized: '', error: 'Link must start with http:// or https://' }
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, normalized: '', error: 'Only http:// and https:// links are allowed' }
    }
    const href = parsed.href
    if (href.length > MAX_MEMORY_LINK_URL_LENGTH) {
      return { valid: false, normalized: '', error: `Link must be at most ${MAX_MEMORY_LINK_URL_LENGTH} characters` }
    }
    return { valid: true, normalized: href }
  } catch {
    return { valid: false, normalized: '', error: 'Enter a valid web address' }
  }
}

export function getLinkHostname(linkUrl: string): string {
  try {
    return new URL(linkUrl).hostname.replace(/^www\./i, '')
  } catch {
    return linkUrl
  }
}

export function getLinkPlatformLabel(hostname: string): string | null {
  const host = hostname.toLowerCase().replace(/^www\./, '')
  if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'YouTube'
  if (host === 'x.com' || host.endsWith('twitter.com')) return 'X'
  if (host.endsWith('instagram.com')) return 'Instagram'
  if (host.endsWith('tiktok.com')) return 'TikTok'
  if (host === 'fb.com' || host.endsWith('facebook.com')) return 'Facebook'
  if (host.endsWith('reddit.com')) return 'Reddit'
  return null
}

export function memoryHasPlantableContent(parts: {
  text?: string
  photoFile?: boolean
  photoUrl?: string
  linkUrl?: string
}): boolean {
  const hasText = Boolean(parts.text?.trim())
  const hasPhoto = Boolean(parts.photoFile) || Boolean(parts.photoUrl?.trim())
  const link = parts.linkUrl?.trim() ?? ''
  const hasLink = link.length > 0 && parseHttpHttpsLinkUrl(link).valid
  return hasText || hasPhoto || hasLink
}

export function isHttpHttpsLinkUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return true
  return parseHttpHttpsLinkUrl(value).valid
}
