import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { EMBER_DUSK } from '@/lib/garden/palettes'
import { todPalette } from '@/lib/garden/day-night'
import {
  createStylizedMaterial,
  inferMaterialRoleFromColor,
  paletteToCc0Tokens,
  retintExistingMaterial,
  roleColor,
} from '@/lib/open-world/cc0-material-tint'

describe('cc0-material-tint', () => {
  it('maps garden palette tokens to coherent foliage and bark', () => {
    const tokens = paletteToCc0Tokens(EMBER_DUSK)
    expect(tokens.foliage.getHexString()).toBe(new THREE.Color(EMBER_DUSK.silSoft).getHexString())
    expect(roleColor(tokens, 'flower').r).toBeGreaterThan(0.4)

    const dusk = paletteToCc0Tokens(todPalette(19.5, 'summer'))
    expect(dusk.foliage.r + dusk.foliage.g + dusk.foliage.b).toBeGreaterThan(
      tokens.foliage.r + tokens.foliage.g + tokens.foliage.b,
    )
  })

  it('infers material roles from source albedo', () => {
    expect(inferMaterialRoleFromColor(0.2, 0.75, 0.25, 'generic')).toBe('foliage')
    expect(inferMaterialRoleFromColor(0.85, 0.2, 0.15, 'mushroom_cap')).toBe('mushroom_cap')
    expect(inferMaterialRoleFromColor(0.55, 0.4, 0.2, 'wood')).toBe('wood')
  })

  it('creates lit toon materials and can retint for dusk palette', () => {
    const tokens = paletteToCc0Tokens(EMBER_DUSK)
    const unlit = new THREE.MeshBasicMaterial({ color: '#88cc88' })
    const mat = createStylizedMaterial(tokens, 'foliage', unlit)
    expect(mat).toBeInstanceOf(THREE.MeshToonMaterial)
    expect(mat.userData.cc0Tinted).toBe(true)
    unlit.dispose()

    const twilight = paletteToCc0Tokens({
      ...EMBER_DUSK,
      silSoft: '#1a1234',
      accent: '#9f7bff',
    })
    const before = mat.color.getHexString()
    retintExistingMaterial(mat, twilight)
    expect(mat.color.getHexString()).not.toBe(before)
    mat.dispose()
  })
})
