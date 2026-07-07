export function cx3(p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}