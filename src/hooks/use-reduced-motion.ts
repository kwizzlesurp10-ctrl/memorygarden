import { useReducedMotion as framerUseReducedMotion } from 'framer-motion'

/**
 * Custom hook for reduced motion preference.
 * Wraps Framer Motion's useReducedMotion for consistency and future extensibility (e.g., user toggle in settings).
 * Follows WCAG 2.2 2.3.3 and NN/g motion sensitivity guidelines.
 */
export function useReducedMotion(): boolean {
  return framerUseReducedMotion()
}
