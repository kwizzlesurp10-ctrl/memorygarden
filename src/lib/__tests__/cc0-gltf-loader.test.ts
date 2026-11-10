import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { EMBER_DUSK } from '@/lib/garden/palettes'
import { applyCc0TintToObject, loadCc0Template, normalizeGroupToHeight, type GltfLoaderLike } from '@/lib/open-world/cc0-gltf-loader'

function mockGltfScene(): THREE.Group {
  const group = new THREE.Group()
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1, 0.2),
    new THREE.MeshBasicMaterial({ color: '#6b4423' }),
  )
  trunk.position.y = 0.5
  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 6, 6),
    new THREE.MeshBasicMaterial({ color: '#3d8b4f' }),
  )
  leaves.position.y = 1.2
  group.add(trunk, leaves)
  return group
}

describe('cc0-gltf-loader', () => {
  it('normalizes model height to target units', () => {
    const group = mockGltfScene()
    const scale = normalizeGroupToHeight(group, 2)
    const box = new THREE.Box3().setFromObject(group)
    const size = new THREE.Vector3()
    box.getSize(size)
    expect(size.y).toBeCloseTo(2, 2)
    expect(scale).toBeGreaterThan(0)
  })

  it('replaces unlit materials with garden-tinted toon materials', () => {
    const group = mockGltfScene()
    applyCc0TintToObject(group, { id: 'kenney_tree_oak', file: 'kenney_tree_oak.glb', role: 'foliage', targetHeight: 3, instancing: false }, EMBER_DUSK)
    let toonCount = 0
    group.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        expect(c.material).toBeInstanceOf(THREE.MeshToonMaterial)
        toonCount++
      }
    })
    expect(toonCount).toBe(2)
  })

  it('loads via injected GLTFLoader mock', async () => {
    const scene = mockGltfScene()
    const loadAsync = vi.fn().mockResolvedValue({ scene })
    const loader: GltfLoaderLike = { loadAsync }
    const template = await loadCc0Template('kenney_flower_purpleA', loader, EMBER_DUSK)
    expect(loadAsync).toHaveBeenCalledWith('/models/cc0/kenney_flower_purpleA.glb')
    expect(template.id).toBe('kenney_flower_purpleA')
    expect(template.group.children.length).toBeGreaterThan(0)
  })
})
