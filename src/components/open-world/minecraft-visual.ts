import * as THREE from 'three'
import type { PlantStage } from '@/lib/types'
import type { PlantVisualRecipe } from '@/lib/open-world/plant-visual'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng, seedFromGenetics } from '@/lib/garden/prng'
import { plantStageToIndex } from '@/lib/garden/stage'
import { isWalkCaptureSession } from '@/lib/open-world/walk-capture-bridge'
import type { GardenWorld, WorldPlant } from '@/lib/open-world/types'

/** One voxel cube edge in world units (~Minecraft block scale). */
export const VOXEL_BLOCK_SIZE = 0.72
const VOXEL = VOXEL_BLOCK_SIZE
const boxGeo = new THREE.BoxGeometry(1, 1, 1)
boxGeo.userData.isSharedStatic = true
const planeGeo = new THREE.PlaneGeometry(1, 1)
planeGeo.userData.isSharedStatic = true

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

type BlockKind = 'grass' | 'dirt' | 'bark' | 'leaf' | 'gravel' | 'mushroom' | 'flower'

export function minecraftBlockTexture(
  base: string,
  accent: string,
  seed: number,
  kind: BlockKind,
): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 16
  c.height = 16
  const ctx = c.getContext('2d')
  if (!ctx) return configurePixelTexture(new THREE.CanvasTexture(c))

  const leafGreens = ['#1e4620', '#2d5a27', '#3d7a34', '#4a8f3a', '#5cab48']
  const barkBrowns = ['#3f2817', '#4a3018', '#6b4423', '#8b5a2b']
  const grassGreens = ['#3d7a34', '#4a8f3a', '#2d5a27', '#5cab48', '#6faa52']

  ctx.fillStyle = base
  ctx.fillRect(0, 0, 16, 16)

  if (kind === 'leaf') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 17.3 + y * 31.1)
        if (n > 0.9) {
          ctx.clearRect(x, y, 1, 1)
          continue
        }
        const idx = Math.floor(n * leafGreens.length) % leafGreens.length
        ctx.fillStyle = leafGreens[idx] ?? leafGreens[0]
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else if (kind === 'bark') {
    for (let x = 0; x < 16; x++) {
      const stripe = Math.floor(x / 2) % barkBrowns.length
      ctx.fillStyle = barkBrowns[stripe] ?? barkBrowns[0]
      ctx.fillRect(x, 0, 2, 16)
    }
    for (let y = 0; y < 16; y++) {
      if (hash01(seed + y * 9.1) > 0.72) {
        ctx.fillStyle = barkBrowns[0] ?? '#3f2817'
        ctx.fillRect(0, y, 16, 1)
      }
    }
  } else if (kind === 'grass') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 9.1 + y * 14.7)
        const idx = Math.floor(n * grassGreens.length) % grassGreens.length
        ctx.fillStyle = y < 3 ? (grassGreens[3] ?? accent) : (grassGreens[idx] ?? base)
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else if (kind === 'mushroom') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 13.7 + y * 21.1)
        const red = n > 0.55 ? '#8b3a3a' : '#c44a4a'
        ctx.fillStyle = hash01(seed + x + y * 2) > 0.88 ? '#f2e8dc' : red
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else if (kind === 'flower') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 11.2 + y * 19.7)
        ctx.fillStyle = n > 0.5 ? accent : base
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 11.7 + y * 19.3)
        ctx.fillStyle = n > 0.55 ? accent : base
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  const tex = configurePixelTexture(new THREE.CanvasTexture(c))
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

const matCache = new Map<string, THREE.MeshBasicMaterial>()

function voxelMaterial(
  hex: string,
  accent: string,
  seed: number,
  kind: BlockKind,
  transparent = false,
): THREE.MeshBasicMaterial {
  const key = `${hex}-${accent}-${seed}-${kind}-${transparent}`
  const hit = matCache.get(key)
  if (hit) return hit
  const map = minecraftBlockTexture(hex, accent, seed, kind)
  const mat = new THREE.MeshBasicMaterial({
    map,
    color: new THREE.Color('#ffffff'),
    transparent,
    alphaTest: transparent ? 0.15 : 0,
    side: THREE.DoubleSide,
  })
  mat.userData.isSharedStatic = true
  matCache.set(key, mat)
  return mat
}

function placeBlock(
  group: THREE.Group,
  ix: number,
  iy: number,
  iz: number,
  mat: THREE.MeshBasicMaterial,
): void {
  const mesh = new THREE.Mesh(boxGeo, mat)
  mesh.position.set(ix * VOXEL, (iy + 0.5) * VOXEL, iz * VOXEL)
  mesh.scale.setScalar(VOXEL)
  mesh.userData.voxel = true
  mesh.userData.voxelBlock = true
  group.add(mesh)
}

function placeCrossSprite(
  group: THREE.Group,
  ix: number,
  iy: number,
  iz: number,
  mat: THREE.MeshBasicMaterial,
): void {
  for (const rotY of [0, Math.PI / 2]) {
    const plane = new THREE.Mesh(planeGeo, mat)
    plane.position.set(ix * VOXEL, (iy + 0.5) * VOXEL, iz * VOXEL)
    plane.scale.set(VOXEL * 1.05, VOXEL * 1.05, 1)
    plane.rotation.y = rotY
    plane.userData.voxel = true
    group.add(plane)
  }
}

function buildOakTree(
  g: THREE.Group,
  bark: THREE.MeshBasicMaterial,
  leaf: THREE.MeshBasicMaterial,
  seed: number,
  stage: PlantStage,
): void {
  const idx = plantStageToIndex(stage)
  const rng = gardenRng(seed)
  if (idx <= 0) {
    placeBlock(g, 0, 1, 0, leaf)
    return
  }
  if (idx === 1) {
    placeBlock(g, 0, 1, 0, bark)
    placeBlock(g, 0, 2, 0, leaf)
    return
  }
  const trunkH = idx >= 7 ? 5 + Math.floor(rng() * 2) : idx >= 6 ? 5 : idx >= 4 ? 4 : 3
  for (let y = 1; y <= trunkH; y++) {
    placeBlock(g, 0, y, 0, bark)
  }
  const capY = trunkH + 1
  const radius = idx >= 7 ? 3 : idx >= 6 ? 2 : 2
  const layers = idx >= 7 ? 4 : 3
  for (let layer = 0; layer < layers; layer++) {
    const trim = layer === layers - 1 ? 1 : 0
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) === radius && Math.abs(dz) === radius) continue
        if (trim && (Math.abs(dx) === radius || Math.abs(dz) === radius)) continue
        placeBlock(g, dx, capY + layer, dz, leaf)
      }
    }
  }
}

function buildFlower(
  g: THREE.Group,
  stem: THREE.MeshBasicMaterial,
  bloom: THREE.MeshBasicMaterial,
  seed: number,
  stage: PlantStage,
): void {
  const idx = plantStageToIndex(stage)
  const rng = gardenRng(seed)
  if (idx <= 0) {
    placeBlock(g, 0, 1, 0, stem)
    return
  }
  if (idx === 1) {
    placeBlock(g, 0, 1, 0, stem)
    placeCrossSprite(g, 0, 2, 0, bloom)
    return
  }
  const stemH = 2 + Math.floor(rng() * 2)
  for (let y = 1; y <= stemH; y++) {
    placeBlock(g, 0, y, 0, stem)
  }
  const headY = stemH + 1
  placeBlock(g, 0, headY, 0, bloom)
  placeCrossSprite(g, 0, headY, 0, bloom)
}

function buildMushroom(
  g: THREE.Group,
  stem: THREE.MeshBasicMaterial,
  cap: THREE.MeshBasicMaterial,
  seed: number,
  stage: PlantStage,
): void {
  const idx = plantStageToIndex(stage)
  const rng = gardenRng(seed)
  if (idx <= 1) {
    placeBlock(g, 0, 1, 0, stem)
    if (idx === 1) placeBlock(g, 0, 2, 0, cap)
    return
  }
  const stemH = 2 + Math.floor(rng() * 2)
  for (let y = 1; y <= stemH; y++) {
    placeBlock(g, 0, y, 0, stem)
  }
  const top = stemH + 1
  const capR = idx >= 6 ? 2 : 2
  for (let dx = -capR; dx <= capR; dx++) {
    for (let dz = -capR; dz <= capR; dz++) {
      if (dx * dx + dz * dz <= capR * capR + 0.5) {
        placeBlock(g, dx, top, dz, cap)
      }
    }
  }
}

export function minecraftGrassTexture(palette: ScenePalette, repeatUnits: number): THREE.CanvasTexture {
  const base = palette.hills[1] ?? '#4a7c38'
  const accent = palette.hills[0] ?? '#6faa52'
  const tex = minecraftBlockTexture(base, accent, 42, 'grass')
  tex.repeat.set(repeatUnits, repeatUnits)
  return tex
}

export function minecraftPathTexture(palette: ScenePalette, repeatUnits: number): THREE.CanvasTexture {
  const base = palette.bank ?? '#8a7d72'
  const accent = palette.hills[2] ?? '#6b5d52'
  const tex = minecraftBlockTexture(base, accent, 17, 'gravel')
  tex.repeat.set(Math.max(4, repeatUnits * 0.35), Math.max(4, repeatUnits * 0.35))
  return tex
}

export function minecraftGrassTufts(
  world: GardenWorld,
  palette: ScenePalette,
  root: THREE.Group,
  track: <T extends { dispose: () => void }>(o: T) => T,
): void {
  if (isWalkCaptureSession()) return
  const grassMat = track(
    voxelMaterial(palette.hills[0] ?? '#5a9c48', palette.hills[1] ?? '#3d7a34', 71, 'grass'),
  )
  const rng = gardenRng(901)
  const span = 40
  const count = 60
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * span
    const z = (rng() * 2 - 1) * span
    if (Math.hypot(x - world.pond.x, z - world.pond.z) < world.pond.radius + 0.35) continue
    const tuft = new THREE.Mesh(boxGeo, grassMat)
    tuft.position.set(x, VOXEL * 0.5, z)
    tuft.scale.setScalar(VOXEL)
    tuft.userData.voxel = true
    root.add(tuft)
  }
}

export function voxelRockCluster(
  x: number,
  z: number,
  seed: number,
  palette: ScenePalette,
  root: THREE.Group,
  track: <T extends { dispose: () => void }>(o: T) => T,
): void {
  const rockMat = track(
    voxelMaterial(palette.bank ?? '#6b5a48', palette.hills[2] ?? '#4a3a2a', seed, 'dirt'),
  )
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  const rng = gardenRng(seed)
  const blocks = 2 + Math.floor(rng() * 3)
  for (let b = 0; b < blocks; b++) {
    placeBlock(g, Math.floor(rng() * 3) - 1, 0, Math.floor(rng() * 3) - 1, rockMat)
  }
  root.add(g)
}

export function createVoxelPlantGroup(plant: WorldPlant, recipe: PlantVisualRecipe): THREE.Group {
  const g = new THREE.Group()
  g.name = `plant:${plant.id}`
  g.userData.memoryId = plant.id
  g.userData.voxelPlant = true
  const stage = plant.stage
  const seedN = seedFromGenetics(plant.geneticsSeed ?? plant.id, `${plant.variety}-${stage}`)

  const bark = voxelMaterial(recipe.stem, recipe.foliageAlt, seedN, 'bark')
  const leaf = voxelMaterial(recipe.foliage, recipe.foliageAlt, seedN + 3, 'leaf', true)
  const stemMat = voxelMaterial(recipe.stem, '#4a5f3a', seedN + 5, 'bark')
  const bloom = voxelMaterial(recipe.bloom, recipe.emissive, seedN + 7, 'flower', true)
  const cap = voxelMaterial('#c44a4a', '#f2e8dc', seedN + 13, 'mushroom')
  const dirt = voxelMaterial('#5a4332', '#3f2e22', seedN + 11, 'dirt')

  placeBlock(g, 0, 0, 0, dirt)
  if (plantStageToIndex(stage) > 0) {
    placeBlock(g, -1, 0, 0, dirt)
    placeBlock(g, 0, 0, -1, dirt)
  }

  if (recipe.kind === 'tree') {
    buildOakTree(g, bark, leaf, seedN, stage)
  } else if (recipe.kind === 'flower') {
    buildFlower(g, stemMat, bloom, seedN, stage)
  } else if (recipe.kind === 'mushroom') {
    buildMushroom(g, stemMat, cap, seedN, stage)
  } else {
    buildOakTree(g, bark, leaf, seedN + 19, stage)
  }

  g.position.set(plant.x, 0, plant.z)
  return g
}

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
