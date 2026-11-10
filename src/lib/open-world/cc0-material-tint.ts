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
  nightStrength: number
}

export interface Cc0MaterialHints {
  meshName?: string
  materialName?: string
  variationSeed?: number
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function paletteToCc0Tokens(palette: ScenePalette): Cc0TintTokens {
  const nightStrength = Math.max(0, (palette.starAlpha ?? 0) - 0.2)
  const rim = new THREE.Color(palette.rim)
  const glow = new THREE.Color(palette.glow)
  const hills0 = new THREE.Color(palette.hills[0] ?? palette.silSoft)
  const hills2 = new THREE.Color(palette.hills[2] ?? palette.hills[1] ?? palette.sil)
  const bank = new THREE.Color(palette.bank)
  const sil = new THREE.Color(palette.sil)
  const silSoft = new THREE.Color(palette.silSoft)

  return {
    foliage: hills0.clone().lerp(silSoft, 0.22),
    foliageDeep: hills2.clone().lerp(bank, 0.12),
    bark: new THREE.Color('#6a4d38').lerp(new THREE.Color('#4a3528'), 0.45).lerp(bank, 0.15),
    wood: new THREE.Color('#a67a52').lerp(new THREE.Color('#7d5a3c'), 0.35).lerp(bank, 0.12),
    rock: sil.clone().lerp(new THREE.Color('#7d8b94'), 0.55).lerp(bank, 0.18),
    flower: new THREE.Color(palette.accent).lerp(glow, 0.18),
    berry: new THREE.Color(palette.accent).lerp(new THREE.Color('#9c3d52'), 0.25),
    mushroomCap: new THREE.Color('#cc4e45').lerp(new THREE.Color(palette.accent), 0.32),
    mushroomStem: new THREE.Color('#efe2cc').lerp(bank, 0.18),
    moss: silSoft.clone().lerp(hills0, 0.45).lerp(hills2, 0.15),
    generic: sil.clone(),
    rim,
    emissive: glow,
    nightStrength,
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
  if (max < 0.08) return fallback

  if (r > 0.45 && g < 0.42 && b < 0.45 && r >= g * 1.2) {
    return fallback === 'mushroom_cap' || fallback === 'mushroom_stem' ? 'mushroom_cap' : 'berry'
  }
  if (r > 0.52 && g > 0.38 && b > 0.42 && r > b * 1.05) return 'flower'
  if (g > r * 1.08 && g > b * 1.05 && g > 0.28) return 'foliage'
  if (g > r * 1.02 && g > b && g > 0.35 && b > 0.25) return 'moss'
  if (r > 0.38 && g > 0.28 && b < 0.26 && r > b * 1.3) return 'wood'
  if (r < 0.32 && g < 0.34 && b < 0.36) return 'bark'
  if (r > 0.3 && g > 0.3 && b > 0.3 && Math.abs(r - g) < 0.12 && Math.abs(g - b) < 0.12) return 'rock'
  return fallback
}

const NAME_ROLE_RULES: Array<{ pattern: RegExp; role: Cc0MaterialRole }> = [
  { pattern: /(bark|woodbark|trunk|branch)/i, role: 'bark' },
  { pattern: /(log|stump|woodinner|innerwood|inner|plank|fence)/i, role: 'wood' },
  { pattern: /\bwood\b/i, role: 'bark' },
  { pattern: /(leafsgreen|leafs?|leaves|foliage|grass|foli)/i, role: 'foliage' },
  { pattern: /\bgreen\b/i, role: 'foliage' },
  { pattern: /\b(flower|petal|blossom|bloom|purple|violet)\b/i, role: 'flower' },
  { pattern: /\b(berry|berries)\b/i, role: 'berry' },
  { pattern: /\b(moss|lichen)\b/i, role: 'moss' },
  { pattern: /\b(rock|stone|boulder|gravel|dirt)\b/i, role: 'rock' },
  { pattern: /\b(red|cap|colorred)\b/i, role: 'mushroom_cap' },
  { pattern: /\b(stem|stipe|mushroom)\b/i, role: 'mushroom_stem' },
]

export function inferMaterialRoleFromName(
  meshName: string,
  materialName: string,
  fallback: Cc0MaterialRole,
): Cc0MaterialRole | null {
  const hay = `${meshName} ${materialName}`.toLowerCase()
  if (/\bmushroom\b/.test(hay) && /(red|cap|color)/.test(hay)) return 'mushroom_cap'
  if (/\bmushroom\b/.test(hay) && /(default|stem|stipe|_defaultmat)/.test(hay)) return 'mushroom_stem'
  for (const { pattern, role } of NAME_ROLE_RULES) {
    if (pattern.test(hay)) {
      if (role === 'mushroom_stem' && fallback !== 'mushroom_cap' && fallback !== 'mushroom_stem') {
        continue
      }
      return role
    }
  }
  return null
}

export function resolveMaterialRole(
  meshName: string,
  materialName: string,
  srcColor: THREE.Color,
  modelFallback: Cc0MaterialRole,
): Cc0MaterialRole {
  const fromName = inferMaterialRoleFromName(meshName, materialName, modelFallback)
  const fromColor = inferMaterialRoleFromColor(srcColor.r, srcColor.g, srcColor.b, modelFallback)
  if (fromName) {
    if (fromName === fromColor) return fromName
    if (
      fromName === 'foliage' ||
      fromName === 'flower' ||
      fromName === 'mushroom_cap' ||
      fromName === 'bark' ||
      fromName === 'wood' ||
      fromName === 'rock'
    ) {
      return fromName
    }
    if (fromColor === 'foliage') return 'foliage'
    return fromName
  }
  return fromColor
}

function blendPreserveSourceHue(
  roleBase: THREE.Color,
  source: THREE.Color,
  role: Cc0MaterialRole,
): THREE.Color {
  const preserve =
    role === 'foliage' || role === 'moss' || role === 'flower' || role === 'berry'
      ? 0.38
      : role === 'mushroom_cap'
        ? 0.32
        : role === 'rock'
          ? 0.22
          : role === 'bark' || role === 'wood'
            ? 0.1
            : 0.18

  const roleHsl = { h: 0, s: 0, l: 0 }
  const srcHsl = { h: 0, s: 0, l: 0 }
  roleBase.getHSL(roleHsl)
  source.getHSL(srcHsl)

  if (srcHsl.s < 0.07) return roleBase.clone()

  const hue =
    srcHsl.s > 0.1 ? roleHsl.h * (1 - preserve) + srcHsl.h * preserve : roleHsl.h
  const sat = Math.min(
    1,
    Math.max(roleHsl.s, srcHsl.s * preserve * 0.55 + roleHsl.s * (1 - preserve * 0.45)),
  )
  const lit = roleHsl.l * (1 - preserve * 0.25) + srcHsl.l * (preserve * 0.25)
  const out = new THREE.Color()
  out.setHSL(hue, sat, Math.max(0.1, Math.min(0.82, lit)))
  return out
}

function applyInstanceVariation(color: THREE.Color, seed: number, role: Cc0MaterialRole): THREE.Color {
  const rngA = (seed % 997) / 997
  const rngB = ((seed * 7) % 991) / 991
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.h += (rngA - 0.5) * 0.05
  hsl.l = Math.max(0.14, Math.min(0.8, hsl.l + (rngB - 0.5) * 0.1))
  if (role === 'foliage' || role === 'moss' || role === 'flower') {
    hsl.s = Math.min(1, hsl.s + 0.06 + rngA * 0.04)
  }
  const out = color.clone()
  out.setHSL(hsl.h, hsl.s, hsl.l)
  return out
}

function applyNightRoleTint(
  color: THREE.Color,
  role: Cc0MaterialRole,
  tokens: Cc0TintTokens,
  palette: ScenePalette,
): THREE.Color {
  const t = tokens.nightStrength
  if (t <= 0.05) return color.clone()

  const out = color.clone()
  const bank = new THREE.Color(palette.bank)
  const hills1 = new THREE.Color(palette.hills[1] ?? palette.silSoft)

  switch (role) {
    case 'foliage':
    case 'moss':
      out.lerp(hills1, t * 0.28).multiplyScalar(0.88 + t * 0.22)
      break
    case 'berry':
      out.lerp(tokens.foliageDeep, t * 0.35).multiplyScalar(0.82 + t * 0.2)
      break
    case 'flower':
    case 'mushroom_cap':
      out.lerp(new THREE.Color(palette.accent), t * 0.22).multiplyScalar(0.9 + t * 0.28)
      break
    case 'mushroom_stem':
      out.lerp(tokens.mushroomStem, t * 0.15).multiplyScalar(0.92 + t * 0.15)
      break
    case 'bark':
    case 'wood':
      out.lerp(bank, t * 0.25).multiplyScalar(0.78 + t * 0.12)
      break
    case 'rock':
      out.lerp(new THREE.Color(palette.sil), t * 0.32).multiplyScalar(0.85 + t * 0.18)
      break
    default:
      out.lerp(bank, t * 0.2).multiplyScalar(0.86 + t * 0.14)
  }
  return out
}

function roleEmissiveStrength(role: Cc0MaterialRole, night: number): number {
  if (night <= 0.05) return 0.02
  switch (role) {
    case 'mushroom_cap':
    case 'flower':
      return 0.07 + night * 0.06
    case 'foliage':
    case 'moss':
      return 0.035 + night * 0.03
    case 'berry':
      return 0.05 + night * 0.04
    default:
      return 0.02 + night * 0.02
  }
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
  userData: { cc0Role?: Cc0MaterialRole; cc0Tinted?: boolean; cc0Palette?: ScenePalette }
}

export function createStylizedMaterial(
  tokens: Cc0TintTokens,
  modelRole: Cc0MaterialRole,
  source?: THREE.Material | null,
  hints?: Cc0MaterialHints,
  palette?: ScenePalette,
): StylizedMaterial {
  let srcColor = new THREE.Color(0.72, 0.78, 0.7)
  if (source) {
    const m = source as THREE.MeshStandardMaterial
    if (m.color) srcColor = m.color.clone()
    else if ('color' in source && source.color instanceof THREE.Color) {
      srcColor = source.color.clone()
    }
  }

  const meshName = hints?.meshName ?? ''
  const materialName = hints?.materialName ?? ''
  const inferred = resolveMaterialRole(meshName, materialName, srcColor, modelRole)
  const roleBase = roleColor(tokens, inferred)
  let tinted = blendPreserveSourceHue(roleBase, srcColor, inferred)

  const seed = hints?.variationSeed ?? hashString(`${meshName}|${materialName}|${inferred}`)
  tinted = applyInstanceVariation(tinted, seed, inferred)

  if (palette) {
    tinted = applyNightRoleTint(tinted, inferred, tokens, palette)
  } else if (tokens.nightStrength > 0.05) {
    tinted.multiplyScalar(0.9 + tokens.nightStrength * 0.15)
  }

  const night = tokens.nightStrength
  const emissiveScale = roleEmissiveStrength(inferred, night)

  const mat = new THREE.MeshToonMaterial({
    color: tinted,
    gradientMap: getSharedToonGradient(),
    emissive:
      inferred === 'foliage' || inferred === 'moss'
        ? tokens.foliage.clone().multiplyScalar(emissiveScale)
        : inferred === 'mushroom_cap' || inferred === 'flower'
          ? tokens.mushroomCap.clone().multiplyScalar(emissiveScale)
          : tokens.emissive.clone().multiplyScalar(emissiveScale),
  }) as StylizedMaterial
  mat.userData.cc0Role = inferred
  mat.userData.cc0Tinted = true
  if (palette) mat.userData.cc0Palette = palette
  return mat
}

export function retintExistingMaterial(
  material: StylizedMaterial,
  tokens: Cc0TintTokens,
  palette?: ScenePalette,
): void {
  const role = material.userData.cc0Role ?? 'generic'
  const p = palette ?? material.userData.cc0Palette
  let base = roleColor(tokens, role)
  if (p) base = applyNightRoleTint(base, role, tokens, p)
  material.color.copy(base)
  const night = tokens.nightStrength
  material.emissive.copy(
    role === 'foliage' || role === 'moss'
      ? tokens.foliage
      : role === 'mushroom_cap' || role === 'flower'
        ? tokens.mushroomCap
        : tokens.emissive,
  ).multiplyScalar(roleEmissiveStrength(role, night))
  material.needsUpdate = true
}
