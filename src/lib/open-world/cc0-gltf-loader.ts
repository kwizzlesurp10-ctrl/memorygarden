import * as THREE from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CC0_BASE_URL, CC0_MODEL_BY_ID, type Cc0ModelDef, type Cc0ModelId } from './cc0-catalog'
import {
  createStylizedMaterial,
  paletteToCc0Tokens,
  retintExistingMaterial,
  type StylizedMaterial,
} from './cc0-material-tint'
import type { ScenePalette } from '@/lib/garden/palettes'

export interface GltfLoaderLike {
  loadAsync(url: string): Promise<GLTF>
  setMeshoptDecoder?(decoder: unknown): void
}

export interface Cc0Template {
  id: Cc0ModelId
  group: THREE.Group
  normalizedScale: number
}

export function normalizeGroupToHeight(group: THREE.Group, targetHeight: number): number {
  const box = new THREE.Box3().setFromObject(group)
  const size = new THREE.Vector3()
  box.getSize(size)
  const h = Math.max(size.y, 1e-4)
  const s = targetHeight / h
  group.scale.setScalar(s)
  const floor = box.min.y * s
  group.position.y = -floor
  return s
}

export function applyCc0TintToObject(root: THREE.Object3D, def: Cc0ModelDef, palette: ScenePalette): void {
  const tokens = paletteToCc0Tokens(palette)
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    const prev = obj.material
    const materials = Array.isArray(prev) ? prev : [prev]
    const nextMats = materials.map((m) => {
      const stylized = createStylizedMaterial(tokens, def.role, m, {
        meshName: obj.name,
        materialName: m?.name ?? '',
      }, palette)
      if (m) m.dispose()
      return stylized
    })
    obj.material = nextMats.length === 1 ? nextMats[0] : nextMats
    obj.castShadow = true
    obj.receiveShadow = true
  })
}

export function retintCc0Object(root: THREE.Object3D, palette: ScenePalette): void {
  const tokens = paletteToCc0Tokens(palette)
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const m of mats) {
      if (m instanceof THREE.MeshToonMaterial && (m as StylizedMaterial).userData.cc0Tinted) {
        retintExistingMaterial(m as StylizedMaterial, tokens, palette)
        const stylized = m as StylizedMaterial
        stylized.userData.cc0Palette = palette
      }
    }
  })
}

export async function loadCc0Template(
  modelId: Cc0ModelId,
  loader: GltfLoaderLike,
  palette: ScenePalette,
): Promise<Cc0Template> {
  const def = CC0_MODEL_BY_ID[modelId]
  const url = `${CC0_BASE_URL}${def.file}`
  const gltf = await loader.loadAsync(url)
  const group = gltf.scene
  group.name = `cc0:${modelId}`
  applyCc0TintToObject(group, def, palette)
  const normalizedScale = normalizeGroupToHeight(group, def.targetHeight)
  return { id: modelId, group, normalizedScale }
}

export async function createDefaultCc0Loader(): Promise<GltfLoaderLike> {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js'),
  ])
  await MeshoptDecoder.ready
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  return loader
}
