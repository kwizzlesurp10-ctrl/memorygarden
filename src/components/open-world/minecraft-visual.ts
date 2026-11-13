import * as THREE from 'three'
import type { PlantVisualRecipe } from '@/lib/open-world/plant-visual'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng, seedFromGenetics } from '@/lib/garden/prng'
import { isWalkCaptureSession } from '@/lib/open-world/walk-capture-bridge'
import type { GardenWorld, WorldPlant } from '@/lib/open-world/types'

/** One voxel cube edge in world units (~Minecraft block scale). */
export const VOXEL_BLOCK_SIZE = 0.72
const VOXEL = VOXEL_BLOCK_SIZE
const boxGeo = new THREE.BoxGeometry(1, 1, 1)
boxGeo.userData.isSharedStatic = true

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
  kind: 'grass' | 'dirt' | 'bark' | 'leaf' | 'gravel',
): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 16
  c.height = 16
  const ctx = c.getContext('2d')
  if (!ctx) return configurePixelTexture(new THREE.CanvasTexture(c))

  const darkLeaf = '#1e4620'
  const midLeaf = '#3d7a34'
  const brightLeaf = '#5cab48'
  const darkBark = '#4a3018'
  const midBark = '#6b4423'
  const lightBark = '#8b5a2b'

  ctx.fillStyle = base
  ctx.fillRect(0, 0, 16, 16)

  if (kind === 'bark') {
    for (let x = 0; x < 16; x += 2) {
      const stripe = x % 4 === 0 ? lightBark : x % 4 === 2 ? midBark : darkBark
      ctx.fillStyle = stripe
      ctx.fillRect(x, 0, 2, 16)
    }
    for (let y = 0; y < 16; y += 4) {
      ctx.fillStyle = hash01(seed + y) > 0.5 ? darkBark : midBark
      ctx.fillRect(0, y, 16, 1)
    }
  } else if (kind === 'leaf') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const big = ((x >> 2) + (y >> 2)) % 2 === 0
        const small = ((x >> 1) + (y >> 1)) % 2
        let color = big ? midLeaf : brightLeaf
        if (small === 0) color = darkLeaf
        if (x % 5 === 0 && y % 5 === 0) color = darkLeaf
        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else if (kind === 'grass') {
    const topGreen = accent
    const soil = base
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (y < 4) {
          const checker = ((x >> 2) + (y >> 1)) % 2
          ctx.fillStyle = checker ? topGreen : brightLeaf
        } else {
          const shade = ((x >> 2) + (y >> 2)) % 3
          ctx.fillStyle = shade === 0 ? soil : shade === 1 ? accent : topGreen
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else if (kind === 'gravel') {
    const g0 = base
    const g1 = accent
    const g2 = '#6a5d52'
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const t = (x % 3) + (y % 4)
        ctx.fillStyle = t === 0 ? g2 : t < 3 ? g0 : g1
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const checker = ((x >> 2) + (y >> 2)) % 2
        ctx.fillStyle = checker ? accent : base
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
  kind: 'grass' | 'dirt' | 'bark' | 'leaf' | 'gravel',
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
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.userData.isSharedStatic = true
  mesh.userData.voxel = true
  group.add(mesh)
}

function fillBox(
  group: THREE.Group,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  mat: THREE.MeshBasicMaterial,
): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        placeBlock(group, x, y, z, mat)
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
  const grassMat = track(
    voxelMaterial(palette.hills[0] ?? '#5a9c48', palette.hills[1] ?? '#3d7a34', 71, 'grass'),
  )
  const rng = gardenRng(901)
  const span = 52
  const count = isWalkCaptureSession() ? 28 : 120
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * span
    const z = (rng() * 2 - 1) * span
    if (Math.hypot(x - world.pond.x, z - world.pond.z) < world.pond.radius + 0.35) continue
    const h = rng() > 0.5 ? 2 : 1
    for (let y = 0; y < h; y++) {
      const tuft = new THREE.Mesh(boxGeo, grassMat)
      tuft.position.set(x, (y + 0.5) * VOXEL, z)
      tuft.scale.setScalar(VOXEL)
      tuft.userData.voxel = true
      tuft.userData.isSharedStatic = true
      root.add(tuft)
    }
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
  g.userData.voxel = true
  const rng = gardenRng(seed)
  const blocks = 3 + Math.floor(rng() * 4)
  for (let b = 0; b < blocks; b++) {
    placeBlock(g, Math.floor(rng() * 3) - 1, Math.floor(rng() * 2), Math.floor(rng() * 3) - 1, rockMat)
  }
  root.add(g)
}

export function createVoxelPlantGroup(plant: WorldPlant, recipe: PlantVisualRecipe): THREE.Group {
  const g = new THREE.Group()
  g.name = `plant:${plant.id}`
  g.userData.memoryId = plant.id
  g.userData.voxelPlant = true
  const seedKey = plant.geneticsSeed ?? plant.id
  const seedN = seedFromGenetics(seedKey, `${plant.variety}-${plant.stage}`)

  const bark = voxelMaterial(recipe.stem, recipe.foliageAlt, seedN, 'bark')
  const leaf = voxelMaterial(recipe.foliage, recipe.foliageAlt, seedN + 3, 'leaf', true)
  const bloom = voxelMaterial(recipe.bloom, recipe.emissive, seedN + 7, 'leaf', true)
  const dirt = voxelMaterial('#5a4332', '#3f2e22', seedN + 11, 'dirt')
  const capMat = voxelMaterial(recipe.bloom, recipe.foliageAlt, seedN + 13, 'leaf')

  fillBox(g, -1, 0, -1, 1, 0, 1, dirt)

  const sizeBoost = recipe.kind === 'tree' ? 1.85 : recipe.kind === 'flower' ? 1.35 : 1.25
  const stemH = Math.max(4, Math.round((recipe.stemHeight * sizeBoost) / VOXEL))
  const stemW =
    recipe.kind === 'tree' ? 2 : recipe.kind === 'mushroom' ? 1 : Math.max(1, Math.round(recipe.stemRadius / VOXEL))

  for (let y = 1; y <= stemH; y++) {
    for (let dx = 0; dx < stemW; dx++) {
      for (let dz = 0; dz < stemW; dz++) {
        placeBlock(g, dx - Math.floor(stemW / 2), y, dz - Math.floor(stemW / 2), bark)
      }
    }
  }

  const top = stemH + 1
  const canopyR = Math.max(4, Math.round((recipe.canopyRadius * sizeBoost) / VOXEL))

  if (recipe.kind === 'mushroom') {
    const capR = Math.max(2, Math.round(canopyR * 0.95))
    for (let dx = -capR; dx <= capR; dx++) {
      for (let dz = -capR; dz <= capR; dz++) {
        if (dx * dx + dz * dz <= capR * capR + 0.4) {
          placeBlock(g, dx, top, dz, capMat)
          if (dx * dx + dz * dz <= (capR - 1) * (capR - 1)) {
            placeBlock(g, dx, top + 1, dz, capMat)
          }
        }
      }
    }
  } else if (recipe.kind === 'flower') {
    const bloomY = top
    fillBox(g, -1, bloomY, -1, 1, bloomY, 1, bloom)
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2
      const px = Math.round(Math.cos(ang) * 2.2)
      const pz = Math.round(Math.sin(ang) * 2.2)
      placeBlock(g, px, bloomY, pz, bloom)
      placeBlock(g, px, bloomY + 1, pz, bloom)
    }
  } else if (recipe.kind === 'tree') {
    for (let dy = 0; dy <= canopyR + 1; dy++) {
      const sliceR = Math.max(2, canopyR - Math.floor(dy * 0.35))
      for (let dx = -sliceR; dx <= sliceR; dx++) {
        for (let dz = -sliceR; dz <= sliceR; dz++) {
          if (dx * dx + dz * dz <= sliceR * sliceR + 0.8) {
            placeBlock(g, dx, top + dy, dz, leaf)
          }
        }
      }
    }
  } else {
    for (let dx = -canopyR; dx <= canopyR; dx++) {
      for (let dy = 0; dy < canopyR; dy++) {
        for (let dz = -canopyR; dz <= canopyR; dz++) {
          const d = Math.hypot(dx, dy * 0.85, dz)
          if (d <= canopyR + 0.2) {
            placeBlock(g, dx, top + dy, dz, leaf)
          }
        }
      }
    }
  }

  g.position.set(plant.x, 0, plant.z)
  g.scale.setScalar(1.55)
  g.userData.baseScale = 1.55
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
