export const GARDEN_POST_ACTIONS = ['join', 'leave', 'plant', 'water', 'reflect'] as const

export type GardenPostAction = (typeof GARDEN_POST_ACTIONS)[number]

function isGardenPostAction(value: string): value is GardenPostAction {
  return (GARDEN_POST_ACTIONS as readonly string[]).includes(value)
}

export function normalizeGardenAction(value: unknown): GardenPostAction | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().toLowerCase()
  return isGardenPostAction(trimmed) ? trimmed : undefined
}

/**
 * Action from URL path: /api/gardens/:action
 */
export function resolveGardensPathAction(pathname: string): GardenPostAction | undefined {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] !== 'api' || parts[1] !== 'gardens') return undefined
  return normalizeGardenAction(parts[2])
}

/**
 * Fallback when Vercel serves POST /api/gardens/join as /api/gardens (SPA rewrite).
 */
export function resolveGardensPostAction(
  pathname: string,
  searchParams: URLSearchParams,
  bodyAction: unknown,
): GardenPostAction | undefined {
  return (
    resolveGardensPathAction(pathname) ??
    normalizeGardenAction(searchParams.get('action')) ??
    normalizeGardenAction(bodyAction)
  )
}
