import * as THREE from 'three'
import type { ScenePalette } from '@/lib/garden/palettes'
import type { Cc0MaterialRole } from './cc0-catalog'

export interface Cc0TintTokens {
  foliage: THREE.Color
  foliageDeep: THREE.Color
  bark: THREE.Color
  wood: THREE.Color
  rock: THREE.Color
  flower: THREE.Color
  berry: THREE.Color
  mushroomCap: THREE.Color
  mushroomStem: THREE.Color
  moss: THREE.Color
  generic: THREE.Color
  rim: THREE.Color
  emissive: THREE.Color
}

function liftedAccent(color: THREE.Color, rim: THREE.Color, glow: THREE.Color, amount: number): THREE.Color {
  return color.clone().lerp(rim, amount * 0.45).lerp(glow, amount * 0.55)
}

export function paletteToCc0Tokens(palette: ScenePalette): Cc0TintTokens {
  const night = (palette.starAlpha ?? 0) > 0.35
  const lift = night ? 0.22 + (palette.starAlpha ?? 0) * 0.35 : 0
  const rim = new THREE.Color(palette.rim)
  const glow = new THREE.Color(palette.glow)
  const pick = (base: THREE.Color, nightAmount: number, dayAmount = 0): THREE.Color => {
    if (night) return liftedAccent(base, rim, glow, lift || nightAmount)
    if (dayAmount > 0) return liftedAccent(base, rim, glow, dayAmount)
    return base.clone()
  }
  return {
    foliage: pick(new THREE.Color(palette.silSoft), 0.32),
    foliageDeep: pick(new THREE.Color(palette.hills[1] ?? palette.silSoft), 0.28),
    bark: pick(new THREE.Color(palette.bank), 0.34),
    wood: pick(new THREE.Color(palette.hills[0] ?? palette.bank), 0.36),
    rock: pick(new THREE.Color(palette.bank).lerp(new THREE.Color(palette.sil), 0.35), 0.3),
    flower: pick(new THREE.Color(palette.accent).lerp(glow, 0.25), 0.38, 0.14),
    berry: pick(new THREE.Color(palette.accent), 0.35, 0.12),
    mushroomCap: pick(new THREE.Color(palette.accent).lerp(new THREE.Color('#c44d4d'), 0.35), 0.4, 0.16),
    mushroomStem: pick(new THREE.Color(palette.bank).lerp(new THREE.Color('#e8dcc8'), 0.35), 0.3),
    moss: pick(new THREE.Color(palette.silSoft).lerp(new THREE.Color(palette.hills[2] ?? palette.sil), 0.4), 0.28),
    generic: pick(new THREE.Color(palette.sil), 0.26),
    rim,
    emissive: glow,
  }
}

export function roleColor(tokens: Cc0TintTokens, role: Cc0MaterialRole): THREE.Color {
  switch (role) {
    case 'foliage':
      return tokens.foliage
    case 'bark':
      return tokens.bark
    case 'wood':
      return tokens.wood
    case 'rock':
      return tokens.rock
    case 'flower':
      return tokens.flower
    case 'berry':
      return tokens.berry
    case 'mushroom_cap':
      return tokens.mushroomCap
    case 'mushroom_stem':
      return tokens.mushroomStem
    case 'moss':
      return tokens.moss
    case 'generic':
      return tokens.generic
    default: {
      const _exhaustive: never = role
      return _exhaustive
    }
  }
}

/** Classify mesh tint role from source material color (Kenney / Quaternius). */
export function inferMaterialRoleFromColor(
  r: number,
  g: number,
  b: number,
  fallback: Cc0MaterialRole,
): Cc0MaterialRole {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max < 0.08) return fallback

  if (r > 0.45 && g < 0.35 && b < 0.4 && r >= g * 1.25) {
    return fallback === 'mushroom_cap' ? 'mushroom_cap' : 'berry'
  }
  if (r > 0.55 && g > 0.35 && b > 0.45 && r > b) return 'flower'
  if (g > r * 1.05 && g > b * 1.05) return 'foliage'
  if (r > 0.35 && g > 0.25 && b < 0.22 && r > b * 1.35) return 'wood'
  if (r < 0.28 && g < 0.32 && b < 0.34) return 'bark'
  return fallback
}

export function createToonGradientMap(): THREE.DataTexture {
  const data = new Uint8Array([0, 64, 128, 192, 255])
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat)
  tex.needsUpdate = true
  return tex
}

let sharedGradient: THREE.DataTexture | null = null

export function getSharedToonGradient(): THREE.DataTexture {
  sharedGradient ??= createToonGradientMap()
  return sharedGradient
}

export interface StylizedMaterial extends THREE.MeshToonMaterial {
  userData: { cc0Role?: Cc0MaterialRole; cc0Tinted?: boolean }
}

export function createStylizedMaterial(
  tokens: Cc0TintTokens,
  role: Cc0MaterialRole,
  source?: THREE.Material | null,
): StylizedMaterial {
  let srcColor = new THREE.Color(0.72, 0.78, 0.7)
  if (source) {
    const m = source as THREE.MeshStandardMaterial
    if (m.color) srcColor = m.color.clone()
    else if ('color' in source && source.color instanceof THREE.Color) {
      srcColor = source.color.clone()
    }
  }

  const inferred = inferMaterialRoleFromColor(srcColor.r, srcColor.g, srcColor.b, role)
  const base = roleColor(tokens, inferred)
  const duskLift = base.clone().lerp(tokens.rim, 0.16).lerp(tokens.emissive, 0.08)

  const mat = new THREE.MeshToonMaterial({
    color: duskLift,
    gradientMap: getSharedToonGradient(),
    emissive: tokens.emissive.clone().multiplyScalar(0.06),
  }) as StylizedMaterial
  mat.userData.cc0Role = inferred
  mat.userData.cc0Tinted = true
  return mat
}

export function retintExistingMaterial(
  material: StylizedMaterial,
  tokens: Cc0TintTokens,
): void {
  const role = material.userData.cc0Role ?? 'generic'
  const base = roleColor(tokens, role)
  material.color.copy(base).lerp(tokens.rim, 0.16).lerp(tokens.emissive, 0.08)
  material.emissive.copy(tokens.emissive).multiplyScalar(0.06)
  material.needsUpdate = true
}
