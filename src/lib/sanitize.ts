/**
 * Lightweight HTML sanitization for user-generated content.
 *
 * Escapes potentially dangerous characters to prevent XSS when
 * rendering user-supplied text in the DOM.  This is a defense-in-depth
 * measure — React already escapes JSX interpolation, but raw
 * innerHTML / `dangerouslySetInnerHTML` paths and `<mark>` highlight
 * injection in search results benefit from explicit sanitization.
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}

const ESCAPE_RE = /[&<>"']/g

/**
 * Escape HTML special characters in a string.
 *
 * ```ts
 * escapeHtml('<script>alert("xss")</script>')
 * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(input: string): string {
  return input.replace(ESCAPE_RE, ch => ESCAPE_MAP[ch] ?? ch)
}

/**
 * Strip all HTML tags from a string, returning plain text only.
 * Applies the regex iteratively to handle nested/malformed tags
 * like `<<script>script>` that a single pass would miss.
 */
export function stripHtml(input: string): string {
  const TAG_RE = /<[^>]*>/g
  let result = input
  let previous: string
  do {
    previous = result
    result = result.replace(TAG_RE, '')
  } while (result !== previous)
  return result
}

/**
 * Sanitize a URL to prevent `javascript:` and `data:` protocol injection.
 * Returns the URL if safe, or an empty string if suspicious.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''

  try {
    const parsed = new URL(trimmed, window.location.origin)
    const protocol = parsed.protocol.toLowerCase()
    if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
      return trimmed
    }
    // Allow custom protocol schemes used by the app
    if (
      protocol === 'web+plantmemory:' ||
      protocol === 'web+viewmemory:' ||
      protocol === 'web+memorygarden:'
    ) {
      return trimmed
    }
    return ''
  } catch {
    return ''
  }
}
