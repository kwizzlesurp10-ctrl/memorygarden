/** Seeded PRNG matching prototype — always use unsigned shifts (>>>). */
export function gardenRng(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(str: string): number {
  let h = 2166136261
  for (const ch of str) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function seedFromGenetics(geneticsSeed: string | undefined, fallback: string): number {
  if (!geneticsSeed) return hashString(fallback)
  const n = parseInt(geneticsSeed, 10)
  if (!Number.isNaN(n) && n > 0) return n >>> 0
  return hashString(geneticsSeed)
}