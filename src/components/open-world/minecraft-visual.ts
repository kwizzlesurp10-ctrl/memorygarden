import * as THREE from 'three'
import type { PlantStage } from '@/lib/types'
import type { PlantVisualRecipe } from '@/lib/open-world/plant-visual'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng, seedFromGenetics } from '@/lib/garden/prng'
import { plantStageToIndex } from '@/lib/garden/stage'
import { isWalkCaptureSession } from '@/lib/open-world/walk-capture-bridge'
import type { GardenWorld, WorldPlant } from '@/lib/open-world/types'

/** One voxel cube edge in world units (~Minecraft block scale). */
export const VOXEL_BLOCK_SIZE = 1
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

type BlockKind = 'grass' | 'grass_side' | 'dirt' | 'bark' | 'leaf' | 'gravel' | 'mushroom' | 'flower'

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
  const grassGreens = ['#5f9f35', '#6aad3d', '#7cbd4b', '#6ba838', '#578f30', '#4d852b']

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
  } else if (kind === 'grass' || kind === 'grass_side') {
    const dirtBrowns = ['#5a4332', '#4a3528', '#6b4e3a', '#3f2e22']
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const onTop = kind === 'grass' || y < 4
        if (onTop) {
          const n = hash01(seed + x * 9.1 + y * 14.7)
          const idx = Math.floor(n * grassGreens.length) % grassGreens.length
          ctx.fillStyle = grassGreens[idx] ?? base
        } else {
          const n = hash01(seed + x * 7.3 + y * 11.1)
          const idx = Math.floor(n * dirtBrowns.length) % dirtBrowns.length
          ctx.fillStyle = dirtBrowns[idx] ?? '#5a4332'
        }
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
  scaleMul = 1.05,
): void {
  for (const rotY of [0, Math.PI / 2]) {
    const plane = new THREE.Mesh(planeGeo, mat)
    plane.position.set(ix * VOXEL, (iy + 0.5) * VOXEL, iz * VOXEL)
    plane.scale.set(VOXEL * scaleMul, VOXEL * scaleMul, 1)
    plane.rotation.y = rotY
    plane.userData.voxel = true
    group.add(plane)
  }
}

function placeLeafLayer(
  g: THREE.Group,
  capY: number,
  radius: number,
  leaf: THREE.MeshBasicMaterial,
  trimCorners: boolean,
): void {
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      if (trimCorners && Math.abs(dx) === radius && Math.abs(dz) === radius) continue
      placeBlock(g, dx, capY, dz, leaf)
    }
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
    placeCrossSprite(g, 0, 1, 0, leaf)
    return
  }
  if (idx === 1) {
    placeBlock(g, 0, 1, 0, bark)
    placeCrossSprite(g, 0, 2, 0, leaf)
    return
  }
  const trunkH =
    idx >= 7 ? 6 : idx >= 6 ? 5 + Math.floor(rng() * 2) : idx >= 4 ? 4 : 3
  for (let y = 1; y <= trunkH; y++) {
    placeBlock(g, 0, y, 0, bark)
  }
  const capY = trunkH + 1
  if (idx >= 7) {
    placeLeafLayer(g, capY, 3, leaf, true)
    placeLeafLayer(g, capY + 1, 3, leaf, true)
    placeLeafLayer(g, capY + 2, 2, leaf, true)
    placeLeafLayer(g, capY + 3, 1, leaf, false)
  } else if (idx >= 6) {
    placeLeafLayer(g, capY, 2, leaf, true)
    placeLeafLayer(g, capY + 1, 2, leaf, true)
    placeLeafLayer(g, capY + 2, 1, leaf, false)
  } else {
    const radius = idx >= 4 ? 2 : 1
    placeLeafLayer(g, capY, radius, leaf, true)
    if (idx >= 4) placeLeafLayer(g, capY + 1, 1, leaf, false)
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
  const stemH = idx >= 5 ? 1 + Math.floor(rng() * 2) : 2
  for (let y = 1; y <= stemH; y++) {
    placeBlock(g, 0, y, 0, stem)
  }
  const headY = stemH + 1
  placeCrossSprite(g, 0, headY, 0, bloom, idx >= 5 ? 1.75 : 1.2)
}

function buildMushroom(
  g: THREE.Group,
  stem: THREE.MeshBasicMaterial,
  cap: THREE.MeshBasicMaterial,
  seed: number,
  stage: PlantStage,
): void {
  const idx = plantStageToIndex(stage)
  if (idx <= 1) {
    placeBlock(g, 0, 1, 0, stem)
    if (idx === 1) placeBlock(g, 0, 2, 0, cap)
    return
  }
  const stemH = idx >= 6 ? 2 : 1
  for (let y = 1; y <= stemH; y++) {
    placeBlock(g, 0, y, 0, stem)
  }
  const top = stemH + 1
  const capR = idx >= 6 ? 1 : 1
  for (let dx = -capR; dx <= capR; dx++) {
    for (let dz = -capR; dz <= capR; dz++) {
      if (Math.abs(dx) === capR && Math.abs(dz) === capR) continue
      placeBlock(g, dx, top, dz, cap)
    }
  }
}

function buildSproutSapling(
  g: THREE.Group,
  stem: THREE.MeshBasicMaterial,
  leaf: THREE.MeshBasicMaterial,
): void {
  placeBlock(g, 0, 1, 0, stem)
  placeCrossSprite(g, 0, 2, 0, leaf)
}

const MINECRAFT_BLOCK_UNIT = 1

function minecraftGrassBlockMaterials(
  palette: ScenePalette,
): THREE.MeshLambertMaterial[] {
  const grassTop = configurePixelTexture(
    minecraftBlockTexture('#5f9f35', '#7cbd4b', 42, 'grass'),
  )
  const grassSide = configurePixelTexture(
    minecraftBlockTexture('#5f9f35', '#7cbd4b', 44, 'grass_side'),
  )
  const dirtBottom = configurePixelTexture(
    minecraftBlockTexture('#5a4332', '#3f2e22', 5, 'dirt'),
  )
  grassTop.repeat.set(1, 1)
  grassSide.repeat.set(1, 1)
  dirtBottom.repeat.set(1, 1)
  const white = new THREE.Color('#ffffff')
  const mk = (tex: THREE.CanvasTexture) =>
    new THREE.MeshLambertMaterial({ map: tex, color: white })
  return [
    mk(grassSide),
    mk(grassSide),
    mk(grassTop),
    mk(dirtBottom),
    mk(grassSide),
    mk(grassSide),
  ]
}

const WALK_CAPTURE_PINS: Array<{ x: number; z: number }> = [
  { x: 0, z: 14 },
  { x: 24, z: 14 },
  { x: -24, z: 14 },
  { x: 0, z: 30 },
  { x: -24, z: 30 },
]

function walkCaptureFlatPad(ix: number, iz: number): boolean {
  for (const pin of WALK_CAPTURE_PINS) {
    if (Math.abs(ix - pin.x) <= 3 && Math.abs(iz - pin.z) <= 3) return true
  }
  return false
}

function walkCaptureColumnSurface(ix: number, iz: number): number {
  if (Math.hypot(ix, iz) > 52) return 1
  if (walkCaptureFlatPad(ix, iz)) return 1
  return Math.abs((ix + iz) % 7) === 0 ? 2 : 1
}

export function walkCaptureGroundY(x: number, z: number): number {
  const ix = Math.round(x)
  const iz = Math.round(z)
  return walkCaptureColumnSurface(ix, iz)
}

/** Stepped grass blocks for walk-capture screenshots (grass top + dirt sides). */
export function addWalkCaptureGrassField(
  world: GardenWorld,
  palette: ScenePalette,
  root: THREE.Group,
  track: <T extends { dispose: () => void }>(o: T) => T,
): void {
  const mats = minecraftGrassBlockMaterials(palette)
  for (const m of mats) track(m)
  const blockGeo = track(new THREE.BoxGeometry(1, 1, 1))
  const minX = Math.floor(world.bounds.minX) - 2
  const maxX = Math.ceil(world.bounds.maxX) + 2
  const minZ = Math.floor(world.bounds.minZ) - 2
  const maxZ = Math.ceil(world.bounds.maxZ) + 2
  for (let ix = minX; ix <= maxX; ix++) {
    for (let iz = minZ; iz <= maxZ; iz++) {
      const columnHeight = walkCaptureColumnSurface(ix, iz)
      for (let y = 0; y < columnHeight; y++) {
        const mesh = new THREE.Mesh(blockGeo, mats)
        mesh.position.set(ix + 0.5, y + 0.5, iz + 0.5)
        mesh.receiveShadow = true
        mesh.castShadow = y === columnHeight - 1
        root.add(mesh)
      }
    }
  }
}

export function minecraftGrassTexture(
  palette: ScenePalette,
  planeW: number,
  planeD: number,
): THREE.CanvasTexture {
  const base = '#5f9f35'
  const accent = '#7cbd4b'
  const seed = 42 + Math.floor(hash01(planeW + planeD) * 120)
  const tex = minecraftBlockTexture(base, accent, seed, 'grass')
  tex.repeat.set(planeW / MINECRAFT_BLOCK_UNIT, planeD / MINECRAFT_BLOCK_UNIT)
  tex.offset.set(0, 0)
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

  const walkSolo = isWalkCaptureSession() && plant.id.endsWith('-walk')
  if (!walkSolo) {
    placeBlock(g, 0, 0, 0, dirt)
    if (plantStageToIndex(stage) > 0) {
      placeBlock(g, -1, 0, 0, dirt)
      placeBlock(g, 0, 0, -1, dirt)
    }
  }

  if (walkSolo && plant.id === 'flower-bloom-walk') {
    const poppy = voxelMaterial('#c43b3b', '#e85d5d', seedN + 7, 'flower', true)
    placeBlock(g, 0, 1, 0, stemMat)
    placeCrossSprite(g, 0, 2, 0, poppy, 2.0)
  } else if (walkSolo && plant.id === 'mushroom-walk') {
    placeBlock(g, 0, 1, 0, stemMat)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (Math.abs(dx) === 1 && Math.abs(dz) === 1) continue
        placeBlock(g, dx, 2, dz, cap)
      }
    }
  } else if (walkSolo && plant.id === 'sprout-walk') {
    placeCrossSprite(g, 0, 1, 0, leaf, 1.25)
  } else if (recipe.kind === 'tree') {
    buildOakTree(g, bark, leaf, seedN, stage)
  } else if (recipe.kind === 'flower') {
    if (plant.id === 'sprout-walk' || plantStageToIndex(stage) <= 1) {
      buildSproutSapling(g, stemMat, bloom)
    } else {
      buildFlower(g, stemMat, bloom, seedN, stage)
    }
  } else if (recipe.kind === 'mushroom') {
    buildMushroom(g, stemMat, cap, seedN, stage)
  } else {
    buildOakTree(g, bark, leaf, seedN + 19, stage)
  }

  const groundY = isWalkCaptureSession() ? walkCaptureGroundY(plant.x, plant.z) : 0
  g.position.set(plant.x, groundY, plant.z)
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
