export function isNeonAuthConfigured(): boolean {
  const url = import.meta.env.VITE_NEON_AUTH_URL
  return typeof url === 'string' && url.trim().length > 0
}

export function getNeonAuthUrl(): string | null {
  if (!isNeonAuthConfigured()) return null
  return import.meta.env.VITE_NEON_AUTH_URL!.trim()
}
