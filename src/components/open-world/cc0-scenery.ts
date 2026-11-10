import * as THREE from 'three'
import type { ScenePalette } from '@/lib/garden/palettes'
import { CC0_MODELS, CC0_MODEL_BY_ID, type Cc0ModelId } from '@/lib/open-world/cc0-catalog'
import { createDefaultCc0Loader, loadCc0Template, retintCc0Object, type Cc0Template } from '@/lib/open-world/cc0-gltf-loader'
import {
  buildCc0Placements,
  CC0_SHOWCASE_ANCHOR,
  cc0TierForDevice,
  type Cc0Placement,
} from '@/lib/open-world/cc0-placement'
import type { GardenWorld } from '@/lib/open-world/types'

export interface Cc0SceneryOptions {
  reducedMotion: boolean
  coarsePointer: boolean
  gardenSeed: number
  onReady?: () => void
  onFailed?: () => void
}

export class Cc0SceneryLayer {
  readonly root = new THREE.Group()
  ready = false
  failed = false
  private templates = new Map<Cc0ModelId, Cc0Template>()
  private instanced = new Map<Cc0ModelId, THREE.InstancedMesh>()
  private singles: THREE.Object3D[] = []
  private palette: ScenePalette
  private world: GardenWorld
  private opts: Cc0SceneryOptions
  private disposed = false
  private showcaseActive = false

  constructor(scene: THREE.Scene, world: GardenWorld, palette: ScenePalette, opts: Cc0SceneryOptions) {
    this.root.name = 'cc0-scenery'
    scene.add(this.root)
    this.palette = palette
    this.world = world
    this.opts = opts
    void this.bootstrap()
  }

  setWorld(world: GardenWorld): void {
    this.world = world
    if (this.ready && !this.showcaseActive) this.rebuildInstances()
  }

  async setShowcase(modelId: Cc0ModelId | null): Promise<void> {
    if (!this.ready || this.failed) return
    this.clearRendered()
    if (!modelId) {
      this.showcaseActive = false
      this.rebuildInstances()
      return
    }
    this.showcaseActive = true
    if (!this.templates.has(modelId)) {
      const loader = await createDefaultCc0Loader()
      const template = await loadCc0Template(modelId, loader, this.palette)
      this.templates.set(modelId, template)
    }
    const template = this.templates.get(modelId)
    const def = CC0_MODEL_BY_ID[modelId]
    if (!template || !def) return
    const clone = template.group.clone(true)
    clone.position.set(CC0_SHOWCASE_ANCHOR.x, 0, CC0_SHOWCASE_ANCHOR.z)
    clone.rotation.y = CC0_SHOWCASE_ANCHOR.yaw
    const fill = Math.min(2.85, Math.max(1.35, 4.2 / def.targetHeight))
    clone.scale.multiplyScalar(fill)
    this.root.add(clone)
    this.singles.push(clone)
  }

  async ensureAllTemplatesLoaded(): Promise<void> {
    const loader = await createDefaultCc0Loader()
    for (const def of CC0_MODELS) {
      if (this.templates.has(def.id)) continue
      const template = await loadCc0Template(def.id, loader, this.palette)
      this.templates.set(def.id, template)
    }
  }

  setPalette(palette: ScenePalette): void {
    this.palette = palette
    if (!this.ready) return
    for (const t of this.templates.values()) {
      retintCc0Object(t.group, palette)
    }
    for (const mesh of this.instanced.values()) {
      const mat = mesh.material
      if (mat instanceof THREE.Material) mat.needsUpdate = true
    }
  }

  dispose(): void {
    this.disposed = true
    this.root.parent?.remove(this.root)
    for (const mesh of this.instanced.values()) {
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) mesh.material.dispose()
    }
    this.instanced.clear()
    for (const obj of this.singles) {
      this.root.remove(obj)
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          for (const m of mats) m.dispose()
        }
      })
    }
    this.singles = []
    for (const t of this.templates.values()) {
      t.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          for (const m of mats) m.dispose()
        }
      })
    }
    this.templates.clear()
  }

  private async bootstrap(): Promise<void> {
    try {
      const loader = await createDefaultCc0Loader()
      if (this.disposed) return
      const uniqueIds = new Set<Cc0ModelId>()
      const tier = cc0TierForDevice(this.opts)
      const placements = buildCc0Placements(this.world, this.opts.gardenSeed, tier)
      for (const p of placements) uniqueIds.add(p.modelId)
      for (const id of uniqueIds) {
        const template = await loadCc0Template(id, loader, this.palette)
        if (this.disposed) return
        this.templates.set(id, template)
      }
      this.rebuildInstances(placements)
      this.ready = true
      this.opts.onReady?.()
    } catch {
      this.failed = true
      this.opts.onFailed?.()
    }
  }

  private clearRendered(): void {
    for (const mesh of this.instanced.values()) {
      this.root.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) mesh.material.dispose()
    }
    this.instanced.clear()
    for (const obj of this.singles) {
      this.root.remove(obj)
    }
    this.singles = []
  }

  private rebuildInstances(placements?: Cc0Placement[]): void {
    this.clearRendered()

    const tier = cc0TierForDevice(this.opts)
    const list = placements ?? buildCc0Placements(this.world, this.opts.gardenSeed, tier)
    const byModel = new Map<Cc0ModelId, Cc0Placement[]>()
    for (const p of list) {
      const arr = byModel.get(p.modelId) ?? []
      arr.push(p)
      byModel.set(p.modelId, arr)
    }

    const dummy = new THREE.Object3D()
    for (const [modelId, items] of byModel) {
      const template = this.templates.get(modelId)
      const def = CC0_MODEL_BY_ID[modelId]
      if (!template) continue

      let meshCount = 0
      template.group.traverse((c) => {
        if (c instanceof THREE.Mesh) meshCount++
      })

      if (def.instancing && items.length > 1 && meshCount === 1) {
        let geo: THREE.BufferGeometry | null = null
        const mat = new THREE.MeshToonMaterial({ color: 0xffffff })
        template.group.traverse((c) => {
          if (c instanceof THREE.Mesh && !geo) {
            geo = c.geometry.clone()
            const sm = c.material
            const first = Array.isArray(sm) ? sm[0] : sm
            if (first instanceof THREE.MeshToonMaterial) {
              mat.copy(first)
            }
          }
        })
        if (!geo) continue
        const inst = new THREE.InstancedMesh(geo, mat, items.length)
        inst.castShadow = true
        inst.receiveShadow = true
        inst.frustumCulled = true
        items.forEach((pl, i) => {
          dummy.position.set(pl.x, 0, pl.z)
          dummy.rotation.set(0, pl.yaw, 0)
          dummy.scale.setScalar(pl.scale)
          dummy.updateMatrix()
          inst.setMatrixAt(i, dummy.matrix)
        })
        inst.instanceMatrix.needsUpdate = true
        this.root.add(inst)
        this.instanced.set(modelId, inst)
      } else {
        for (const pl of items) {
          const clone = template.group.clone(true)
          clone.position.set(pl.x, 0, pl.z)
          clone.rotation.y = pl.yaw
          clone.scale.multiplyScalar(pl.scale)
          this.root.add(clone)
          this.singles.push(clone)
        }
      }
    }
  }
}

export function defaultCc0GardenSeed(memories: { id: string }[]): number {
  if (memories.length === 0) return 7
  let acc = 11
  for (const m of memories) {
    for (let i = 0; i < m.id.length; i++) acc = (acc * 31 + m.id.charCodeAt(i)) | 0
  }
  return Math.abs(acc) || 7
}
