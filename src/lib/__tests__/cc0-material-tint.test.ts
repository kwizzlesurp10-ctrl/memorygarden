import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { EMBER_DUSK } from '@/lib/garden/palettes'
import { todPalette } from '@/lib/garden/day-night'
import {
  createStylizedMaterial,
  inferMaterialRoleFromColor,
  inferMaterialRoleFromName,
  paletteToCc0Tokens,
  resolveMaterialRole,
  retintExistingMaterial,
  roleColor,
} from '@/lib/open-world/cc0-material-tint'

describe('cc0-material-tint', () => {
  it('maps garden palette tokens to distinct foliage, bark, and rock', () => {
    const summer = todPalette(14, 'summer')
    const tokens = paletteToCc0Tokens(summer)
    expect(tokens.foliage.g).toBeGreaterThan(tokens.bark.g)
    expect(tokens.rock.b).toBeGreaterThan(tokens.rock.r * 0.95)
    const cap = roleColor(tokens, 'mushroom_cap')
    const stem = roleColor(tokens, 'mushroom_stem')
    expect(cap.r / Math.max(cap.g, 0.01)).toBeGreaterThan(stem.r / Math.max(stem.g, 0.01))
  })

  it('keeps dusk role hues distinct from bark and foliage', () => {
    const duskPalette = todPalette(19.5, 'summer')
    const tokens = paletteToCc0Tokens(duskPalette)
    const leaf = createStylizedMaterial(
      tokens,
      'foliage',
      new THREE.MeshBasicMaterial({ color: '#4b8f52' }),
      { meshName: 'canopy', materialName: 'leafsGreen' },
      duskPalette,
    )
    const bark = createStylizedMaterial(
      tokens,
      'foliage',
      new THREE.MeshBasicMaterial({ color: '#f2be9e' }),
      { meshName: 'trunk', materialName: 'woodBark' },
      duskPalette,
    )
    const rock = createStylizedMaterial(
      tokens,
      'rock',
      new THREE.MeshBasicMaterial({ color: '#aaaaaa' }),
      { meshName: 'stone', materialName: 'dirt' },
      duskPalette,
    )
    expect(leaf.color.g).toBeGreaterThan(leaf.color.r * 1.05)
    expect(bark.color.r).toBeGreaterThan(bark.color.g)
    expect(rock.color.b).toBeGreaterThan(rock.color.r * 0.9)
    leaf.dispose()
    bark.dispose()
    rock.dispose()
  })

  it('lifts dusk foliage without gray-washing to rim', () => {
    const day = paletteToCc0Tokens(todPalette(14, 'summer'))
    const dusk = paletteToCc0Tokens(todPalette(19.5, 'summer'))
    expect(dusk.nightStrength).toBeGreaterThan(0)
    const dayLeaf = createStylizedMaterial(
      day,
      'foliage',
      new THREE.MeshBasicMaterial({ color: '#4b8f52' }),
      { meshName: 'leaf', materialName: 'Green' },
      todPalette(14, 'summer'),
    )
    const duskLeaf = createStylizedMaterial(
      dusk,
      'foliage',
      new THREE.MeshBasicMaterial({ color: '#4b8f52' }),
      { meshName: 'leaf', materialName: 'Green' },
      todPalette(19.5, 'summer'),
    )
    expect(duskLeaf.color.g).toBeGreaterThan(duskLeaf.color.r)
    expect(dayLeaf.color.g).toBeGreaterThan(dayLeaf.color.r * 1.05)
    dayLeaf.dispose()
    duskLeaf.dispose()
  })

  it('infers material roles from names and source albedo', () => {
    expect(inferMaterialRoleFromColor(0.2, 0.75, 0.25, 'generic')).toBe('foliage')
    expect(inferMaterialRoleFromColor(0.85, 0.2, 0.15, 'mushroom_cap')).toBe('mushroom_cap')
    expect(inferMaterialRoleFromName('Mesh_tree', 'woodBark', 'foliage')).toBe('bark')
    expect(inferMaterialRoleFromName('Mesh_tree', 'leafsGreen', 'foliage')).toBe('foliage')
    expect(
      resolveMaterialRole('Mesh_mushroom', 'colorRed', new THREE.Color('#f19398'), 'mushroom_cap'),
    ).toBe('mushroom_cap')
  })

  it('creates lit toon materials and can retint for dusk palette', () => {
    const tokens = paletteToCc0Tokens(EMBER_DUSK)
    const unlit = new THREE.MeshBasicMaterial({ color: '#88cc88' })
    const mat = createStylizedMaterial(
      tokens,
      'foliage',
      unlit,
      { meshName: 'leaves', materialName: 'leafsGreen' },
      EMBER_DUSK,
    )
    expect(mat).toBeInstanceOf(THREE.MeshToonMaterial)
    expect(mat.userData.cc0Role).toBe('foliage')
    expect(mat.userData.cc0Tinted).toBe(true)
    expect(mat.userData.cc0Role).toBe('foliage')
    unlit.dispose()

    const twilight = paletteToCc0Tokens({
      ...EMBER_DUSK,
      silSoft: '#1a1234',
      accent: '#9f7bff',
      starAlpha: 0.55,
    })
    const before = mat.color.getHexString()
    retintExistingMaterial(mat, twilight, { ...EMBER_DUSK, starAlpha: 0.55 })
    expect(mat.color.getHexString()).not.toBe(before)
    mat.dispose()
  })

  it('keeps summer greens and mushroom contrast from bank browns', () => {
    const palette = { ...todPalette(14, 'summer'), starAlpha: 0 }
    const tokens = paletteToCc0Tokens(palette)
    const bark = createStylizedMaterial(
      tokens,
      'foliage',
      new THREE.MeshBasicMaterial({ color: '#f2be9e' }),
      { meshName: 'trunk', materialName: 'woodBark' },
      palette,
    )
    const leaf = createStylizedMaterial(
      tokens,
      'foliage',
      new THREE.MeshBasicMaterial({ color: '#70e6d6' }),
      { meshName: 'canopy', materialName: 'leafsGreen' },
      palette,
    )
    expect(leaf.color.g).toBeGreaterThan(leaf.color.r * 1.2)
    expect(bark.color.r).toBeGreaterThan(bark.color.g)
    bark.dispose()
    leaf.dispose()
  })
})
