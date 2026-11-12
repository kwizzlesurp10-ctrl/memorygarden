import * as THREE from 'three'
import type { PlantVisualRecipe } from '@/lib/open-world/plant-visual'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng, seedFromGenetics } from '@/lib/garden/prng'
import type { WorldPlant } from '@/lib/open-world/types'

const VOXEL = 0.09
const boxGeo = new THREE.BoxGeometry(1, 1, 1)
boxGeo.userData.isSharedStatic = true

export type MinecraftTerrainMode = boolean

export function configurePixelTexture(tex: THREE.CanvasTexture): THREE.CanvasTexture {
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function hash01(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

export function minecraftBlockTexture(
  base: string,
  accent: string,
  seed: number,
  kind: 'grass' | 'dirt' | 'bark' | 'leaf',
): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 16
  c.height = 16
  const ctx = c.getContext('2d')
  if (!ctx) return configurePixelTexture(new THREE.CanvasTexture(c))
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 16, 16)
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const n = hash01(seed + x * 13.7 + y * 29.3)
      if (n > 0.62) {
        ctx.fillStyle = accent
        ctx.globalAlpha = kind === 'leaf' ? 0.35 + n * 0.4 : 0.25 + n * 0.35
        ctx.fillRect(x, y, 1, 1)
      }
      if (kind === 'grass' && y > 11 && n > 0.55) {
        ctx.fillStyle = accent
        ctx.globalAlpha = 0.9
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  ctx.globalAlpha = 1
  const tex = configurePixelTexture(new THREE.CanvasTexture(c))
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

const matCache = new Map<string, THREE.MeshLambertMaterial>()

function voxelMaterial(
  hex: string,
  accent: string,
  seed: number,
  kind: 'grass' | 'dirt' | 'bark' | 'leaf',
): THREE.MeshLambertMaterial {
  const key = `${hex}-${accent}-${seed}-${kind}`
  const hit = matCache.get(key)
  if (hit) return hit
  const map = minecraftBlockTexture(hex, accent, seed, kind)
  const mat = new THREE.MeshLambertMaterial({ map, color: new THREE.Color(hex) })
  mat.userData.isSharedStatic = true
  matCache.set(key, mat)
  return mat
}

function placeBlock(
  group: THREE.Group,
  ix: number,
  iy: number,
  iz: number,
  mat: THREE.MeshLambertMaterial,
): void {
  const mesh = new THREE.Mesh(boxGeo, mat)
  mesh.position.set(ix * VOXEL, (iy + 0.5) * VOXEL, iz * VOXEL)
  mesh.scale.setScalar(VOXEL * 0.98)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData.isSharedStatic = true
  group.add(mesh)
}

export function minecraftGrassTexture(palette: ScenePalette): THREE.CanvasTexture {
  const base = palette.hills[1] ?? '#3d7a34'
  const accent = palette.hills[0] ?? '#5a9c48'
  const tex = minecraftBlockTexture(base, accent, 42, 'grass')
  tex.repeat.set(12, 12)
  return tex
}

export function minecraftDirtTexture(palette: ScenePalette): THREE.CanvasTexture {
  const base = palette.bank ?? '#6b4a32'
  const accent = palette.hills[2] ?? '#5a3d28'
  const tex = minecraftBlockTexture(base, accent, 88, 'dirt')
  tex.repeat.set(8, 8)
  return tex
}

export function createVoxelPlantGroup(plant: WorldPlant, recipe: PlantVisualRecipe): THREE.Group {
  const g = new THREE.Group()
  g.name = `plant:${plant.id}`
  g.userData.memoryId = plant.id
  const seedKey = plant.geneticsSeed ?? plant.id
  const seedN = seedFromGenetics(seedKey, `${plant.variety}-${plant.stage}`)
  const rng = gardenRng(seedN)

  const bark = voxelMaterial(recipe.stem, recipe.foliageAlt, seedN, 'bark')
  const leaf = voxelMaterial(recipe.foliage, recipe.foliageAlt, seedN + 3, 'leaf')
  const bloom = voxelMaterial(recipe.bloom, recipe.emissive, seedN + 7, 'leaf')
  const dirt = voxelMaterial('#4a3628', '#3a2a1e', seedN + 11, 'dirt')

  const stemH = Math.max(1, Math.round(recipe.stemHeight / VOXEL))
  const stemR = Math.max(1, Math.round(recipe.stemRadius / VOXEL))

  placeBlock(g, 0, 0, 0, dirt)
  placeBlock(g, -1, 0, 0, dirt)
  placeBlock(g, 1, 0, 0, dirt)

  for (let y = 0; y < stemH; y++) {
    for (let dx = -stemR; dx <= stemR; dx++) {
      for (let dz = -stemR; dz <= stemR; dz++) {
        if (dx * dx + dz * dz <= stemR * stemR + 0.25) {
          placeBlock(g, dx, y + 1, dz, bark)
        }
      }
    }
  }

  const canopyBase = stemH + 1
  const canopyR = Math.max(2, Math.round(recipe.canopyRadius / VOXEL))
  const isFlower = recipe.kind === 'flower' || recipe.bloomCount > 2
  const mat = isFlower ? bloom : leaf

  if (recipe.kind === 'mushroom') {
    const capR = Math.max(2, Math.round(canopyR * 0.7))
    for (let dx = -capR; dx <= capR; dx++) {
      for (let dz = -capR; dz <= capR; dz++) {
        if (dx * dx + dz * dz <= capR * capR) {
          placeBlock(g, dx, canopyBase, dz, bloom)
        }
      }
    }
  } else if (isFlower && recipe.kind !== 'tree') {
    const petals = 4 + Math.floor(rng() * 4)
    for (let p = 0; p < petals; p++) {
      const ang = (p / petals) * Math.PI * 2
      const px = Math.round(Math.cos(ang) * canopyR * 0.5)
      const pz = Math.round(Math.sin(ang) * canopyR * 0.5)
      placeBlock(g, px, canopyBase, pz, bloom)
      placeBlock(g, px, canopyBase + 1, pz, bloom)
    }
    placeBlock(g, 0, canopyBase + 1, 0, bloom)
  } else {
    for (let dx = -canopyR; dx <= canopyR; dx++) {
      for (let dy = -canopyR; dy <= canopyR; dy++) {
        for (let dz = -canopyR; dz <= canopyR; dz++) {
          const d = Math.hypot(dx, dy * 0.85, dz)
          if (d <= canopyR + 0.3 && rng() > 0.08 + d * 0.03) {
            placeBlock(g, dx, canopyBase + dy, dz, d > canopyR * 0.65 ? leaf : mat)
          }
        }
      }
    }
  }

  g.position.set(plant.x, 0, plant.z)
  g.userData.baseScale = 1
  return g
}

/** Slight wash on standard meshes for watercolor walk comparison. */
export function applyWatercolorWalkTint(group: THREE.Group): void {
  group.traverse((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
      obj.material = obj.material.clone()
      obj.material.color.multiplyScalar(1.04)
      obj.material.roughness = Math.min(1, obj.material.roughness + 0.12)
      obj.material.metalness *= 0.35
    }
  })
}
