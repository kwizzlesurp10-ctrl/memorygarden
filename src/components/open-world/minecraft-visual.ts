import * as THREE from 'three'
import type { PlantVisualRecipe } from '@/lib/open-world/plant-visual'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng, seedFromGenetics } from '@/lib/garden/prng'
import type { WorldPlant } from '@/lib/open-world/types'
import type { GardenWorld } from '@/lib/open-world/types'

const VOXEL = 0.13
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
  kind: 'grass' | 'dirt' | 'bark' | 'leaf',
): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 16
  c.height = 16
  const ctx = c.getContext('2d')
  if (!ctx) return configurePixelTexture(new THREE.CanvasTexture(c))
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 16, 16)

  if (kind === 'bark') {
    for (let y = 0; y < 16; y += 2) {
      ctx.fillStyle = hash01(seed + y) > 0.5 ? accent : base
      ctx.fillRect(0, y, 16, 1)
    }
    for (let x = 0; x < 16; x++) {
      if (hash01(seed + x * 7) > 0.7) {
        ctx.fillStyle = '#00000022'
        ctx.fillRect(x, 0, 1, 16)
      }
    }
  } else if (kind === 'leaf') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 17.3 + y * 31.1)
        if (n > 0.78) {
          ctx.clearRect(x, y, 1, 1)
        } else if (n > 0.52) {
          ctx.fillStyle = accent
          ctx.globalAlpha = 0.35 + n * 0.35
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    ctx.globalAlpha = 1
  } else if (kind === 'grass') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 9.1 + y * 14.7)
        if (y > 10 && n > 0.45) {
          ctx.fillStyle = accent
          ctx.fillRect(x, y, 1, 1)
        } else if (n > 0.68) {
          ctx.fillStyle = accent
          ctx.globalAlpha = 0.45
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    ctx.strokeStyle = '#1a301880'
    ctx.globalAlpha = 0.35
    for (let i = 0; i <= 16; i += 4) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 16)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(16, i)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  } else {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 11.7 + y * 19.3)
        if (n > 0.58) {
          ctx.fillStyle = accent
          ctx.globalAlpha = 0.35 + n * 0.3
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    ctx.globalAlpha = 1
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
  kind: 'grass' | 'dirt' | 'bark' | 'leaf',
  transparent = false,
): THREE.MeshBasicMaterial {
  const key = `${hex}-${accent}-${seed}-${kind}-${transparent}`
  const hit = matCache.get(key)
  if (hit) return hit
  const map = minecraftBlockTexture(hex, accent, seed, kind)
  const mat = new THREE.MeshBasicMaterial({
    map,
    color: new THREE.Color(hex),
    transparent,
    alphaTest: transparent ? 0.4 : 0,
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

export function minecraftGrassTexture(palette: ScenePalette): THREE.CanvasTexture {
  const base = palette.hills[1] ?? '#4a7c38'
  const accent = palette.hills[0] ?? '#6faa52'
  const tex = minecraftBlockTexture(base, accent, 42, 'grass')
  tex.repeat.set(32, 32)
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
  const count = 160
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * span
    const z = (rng() * 2 - 1) * span
    if (Math.hypot(x - world.pond.x, z - world.pond.z) < world.pond.radius + 0.35) continue
    const h = rng() > 0.55 ? 2 : 1
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
  const rng = gardenRng(seedN)

  const bark = voxelMaterial(recipe.stem, recipe.foliageAlt, seedN, 'bark')
  const leaf = voxelMaterial(recipe.foliage, recipe.foliageAlt, seedN + 3, 'leaf', true)
  const bloom = voxelMaterial(recipe.bloom, recipe.emissive, seedN + 7, 'leaf', true)
  const dirt = voxelMaterial('#5a4332', '#3f2e22', seedN + 11, 'dirt')
  const capMat = voxelMaterial(recipe.bloom, recipe.foliageAlt, seedN + 13, 'leaf')

  fillBox(g, -1, 0, -1, 1, 0, 1, dirt)

  const stemH = Math.max(2, Math.round(recipe.stemHeight / VOXEL))
  const stemW =
    recipe.kind === 'tree' ? 2 : recipe.kind === 'mushroom' ? 1 : Math.max(1, Math.round(recipe.stemRadius / VOXEL))

  const stemCenter = recipe.kind === 'tree' ? 0 : 0
  for (let y = 1; y <= stemH; y++) {
    for (let dx = 0; dx < stemW; dx++) {
      for (let dz = 0; dz < stemW; dz++) {
        placeBlock(g, stemCenter + dx - Math.floor(stemW / 2), y, dz - Math.floor(stemW / 2), bark)
      }
    }
  }

  const top = stemH + 1
  const canopyR = Math.max(2, Math.round(recipe.canopyRadius / VOXEL))

  if (recipe.kind === 'mushroom') {
    const capR = Math.max(2, Math.round(canopyR * 0.85))
    for (let dx = -capR; dx <= capR; dx++) {
      for (let dz = -capR; dz <= capR; dz++) {
        if (dx * dx + dz * dz <= capR * capR + 0.2) {
          placeBlock(g, dx, top, dz, capMat)
        }
      }
    }
  } else if (recipe.kind === 'flower') {
    const bloomY = top
    fillBox(g, -1, bloomY, -1, 1, bloomY, 1, bloom)
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2
      const px = Math.round(Math.cos(ang) * 2)
      const pz = Math.round(Math.sin(ang) * 2)
      placeBlock(g, px, bloomY, pz, bloom)
      placeBlock(g, px, bloomY + 1, pz, bloom)
    }
  } else if (recipe.kind === 'tree') {
    for (let dy = 0; dy < canopyR; dy++) {
      const sliceR = Math.max(1, canopyR - Math.floor(dy * 0.55))
      for (let dx = -sliceR; dx <= sliceR; dx++) {
        for (let dz = -sliceR; dz <= sliceR; dz++) {
          if (dx * dx + dz * dz <= sliceR * sliceR + 0.5 && rng() > 0.12 + dy * 0.04) {
            placeBlock(g, dx, top + dy, dz, leaf)
          }
        }
      }
    }
  } else {
    for (let dx = -canopyR; dx <= canopyR; dx++) {
      for (let dy = 0; dy < canopyR; dy++) {
        for (let dz = -canopyR; dz <= canopyR; dz++) {
          const d = Math.hypot(dx, dy * 0.9, dz)
          if (d <= canopyR && rng() > 0.15) {
            placeBlock(g, dx, top + dy, dz, leaf)
          }
        }
      }
    }
  }

  g.position.set(plant.x, 0, plant.z)
  g.userData.baseScale = 1
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
