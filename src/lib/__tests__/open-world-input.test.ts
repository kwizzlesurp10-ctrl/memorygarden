import { describe, expect, it } from 'vitest'
import { mergeMotion, motionFromKeys } from '../open-world/input'
import { plantKind, plantRecipe } from '../open-world/plant-visual'
import { EMBER_DUSK } from '../garden/palettes'

describe('motionFromKeys', () => {
  it('maps WASD and sprint', () => {
    const m = motionFromKeys(new Set(['KeyW', 'KeyD', 'ShiftLeft']))
    expect(m.forward).toBe(1)
    expect(m.strafe).toBe(1)
    expect(m.sprint).toBe(true)
  })

  it('maps interact and turn', () => {
    const m = motionFromKeys(new Set(['KeyE', 'ArrowLeft']))
    expect(m.interact).toBe(true)
    expect(m.turn).toBe(1)
  })

  it('cancels opposing directions', () => {
    const m = motionFromKeys(new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD']))
    expect(m.forward).toBe(0)
    expect(m.strafe).toBe(0)
  })
})

describe('mergeMotion', () => {
  it('adds the virtual stick', () => {
    const keys = motionFromKeys(new Set())
    const merged = mergeMotion(keys, { x: 0.5, y: 1 })
    expect(merged.forward).toBe(1)
    expect(merged.strafe).toBe(0.5)
  })
})

describe('plantRecipe', () => {
  it('maps varieties to kinds and scales with stage', () => {
    expect(plantKind('ancient_oak')).toBe('tree')
    expect(plantKind('lotus')).toBe('lotus')
    const seed = plantRecipe('flower', 'seed', 'happy', EMBER_DUSK, 0.12, false)
    const bloom = plantRecipe('flower', 'bloom', 'happy', EMBER_DUSK, 1.35, false)
    expect(bloom.stemHeight).toBeGreaterThan(seed.stemHeight)
    expect(bloom.bloomCount).toBeGreaterThan(seed.bloomCount)
  })

  it('marks hybrids as more emissive', () => {
    const plain = plantRecipe('flower', 'bloom', 'nostalgic', EMBER_DUSK, 1.3, false)
    const hybrid = plantRecipe('flower', 'bloom', 'nostalgic', EMBER_DUSK, 1.3, true)
    expect(hybrid.emissiveIntensity).toBeGreaterThan(plain.emissiveIntensity)
  })
})
