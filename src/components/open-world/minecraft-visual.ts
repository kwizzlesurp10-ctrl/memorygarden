import * as THREE from 'three'
import type { PlantStage } from '@/lib/types'
import type { PlantVisualRecipe } from '@/lib/open-world/plant-visual'
import type { ScenePalette } from '@/lib/garden/palettes'
import { gardenRng, seedFromGenetics } from '@/lib/garden/prng'
import { plantStageToIndex } from '@/lib/garden/stage'
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

type BlockKind =
  | 'grass'
  | 'grass_side'
  | 'dirt'
  | 'bark'
  | 'leaf'
  | 'gravel'
  | 'stone'
  | 'moss_stone'
  | 'mushroom'
  | 'mushroom_stem'
  | 'mushroom_cap'
  | 'flower'
  | 'poppy'
  | 'sapling'

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
  const grassGreens = ['#5fa037', '#6bb848', '#7ed65a', '#62b53a', '#73c94f', '#579a32']

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
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const onBorder = x === 0 || y === 0 || x === 15 || y === 15
        if (onBorder) ctx.fillRect(x, y, 1, 1)
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
  } else if (kind === 'poppy' || kind === 'sapling') {
    ctx.clearRect(0, 0, 16, 16)
    const cx = 7.5
    const cy = kind === 'sapling' ? 8 : 9
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dy = y - cy
        const dx = x - cx
        if (kind === 'sapling' && y >= 11 && Math.abs(dx) <= 1) {
          ctx.fillStyle = hash01(seed + x + y) > 0.4 ? '#6b4a30' : '#5a3a25'
          ctx.fillRect(x, y, 1, 1)
          continue
        }
        const r = Math.hypot(dx * 0.95, dy * (kind === 'sapling' ? 1.15 : 1))
        if (kind === 'poppy' && r < 5.5 && y < 13) {
          if (hash01(seed + x * 13 + y * 17) > 0.92) continue
          ctx.fillStyle =
            r < 2.2
              ? '#5a2020'
              : hash01(seed + x + y * 3) > 0.55
                ? '#d84848'
                : '#c43b3b'
          ctx.fillRect(x, y, 1, 1)
        } else if (kind === 'sapling') {
          const spread = y < 8 ? 3 : y < 11 ? 2 : 1
          if (Math.abs(dx) <= spread && y >= 3 && y <= 11) {
            const bright = hash01(seed + x * 9 + y * 13) > 0.42
            ctx.fillStyle = bright ? '#7ed65a' : '#5fa037'
            ctx.fillRect(x, y, 1, 1)
          }
        }
      }
    }
  } else if (kind === 'moss_stone') {
    const stones = ['#6a6a72', '#5c5c64', '#787880', '#4e4e56']
    const moss = ['#5fa037', '#62b53a', '#4a8f3a']
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 9.7 + y * 13.1)
        if (y < 5) {
          const idx = Math.floor(n * moss.length) % moss.length
          ctx.fillStyle = moss[idx] ?? '#5fa037'
        } else {
          const idx = Math.floor(n * stones.length) % stones.length
          ctx.fillStyle = stones[idx] ?? '#6a6a72'
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else if (kind === 'stone') {
    const stones = ['#6a6a72', '#5c5c64', '#787880', '#4e4e56', '#8a8a94']
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 11.9 + y * 17.3)
        const idx = Math.floor(n * stones.length) % stones.length
        ctx.fillStyle = stones[idx] ?? '#6a6a72'
        if (hash01(seed + x * 3 + y * 5) > 0.92) ctx.fillStyle = accent
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else if (kind === 'mushroom_stem') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (x < 6 || x > 9) continue
        const n = hash01(seed + x + y * 5)
        ctx.fillStyle = n > 0.5 ? '#e8dcc8' : '#d9c8ad'
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else if (kind === 'mushroom_cap') {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const spot = hash01(seed + x * 7 + y * 11) > 0.86
        ctx.fillStyle = spot ? '#f2e8dc' : hash01(seed + x + y) > 0.45 ? '#b53838' : '#c44a4a'
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
  const leafTag = kind === 'leaf' ? '-leafv4' : ''
  const key = `${hex}-${accent}-${seed}-${kind}-${transparent}${leafTag}`
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

function placeCrossPlantSprite(
  group: THREE.Group,
  ix: number,
  iz: number,
  baseY: number,
  height: number,
  width: number,
  mat: THREE.MeshBasicMaterial,
): void {
  const yCenter = baseY + height / 2
  for (const rotY of [0, Math.PI / 2]) {
    const plane = new THREE.Mesh(planeGeo, mat)
    plane.position.set(ix * VOXEL, yCenter, iz * VOXEL)
    plane.scale.set(width, height, 1)
    plane.rotation.y = rotY
    plane.userData.voxel = true
    group.add(plane)
  }
}

function placeLeafLayerAt(
  g: THREE.Group,
  ox: number,
  oy: number,
  oz: number,
  radius: number,
  leaf: THREE.MeshBasicMaterial,
  trimCorners: boolean,
  cornerSeed = 0,
  sparseEdges = true,
): void {
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      if (trimCorners && Math.abs(dx) === radius && Math.abs(dz) === radius) continue
      if (
        sparseEdges &&
        trimCorners &&
        radius >= 2 &&
        (Math.abs(dx) === radius || Math.abs(dz) === radius) &&
        hash01(cornerSeed + dx * 17.3 + dz * 23.1) > 0.58
      ) {
        continue
      }
      placeBlock(g, ox + dx, oy, oz + dz, leaf)
    }
  }
}

function placeOakSideBranches(
  g: THREE.Group,
  capY: number,
  _bark: THREE.MeshBasicMaterial,
  leaf: THREE.MeshBasicMaterial,
  seed: number,
): void {
  const dirs: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  for (let i = 0; i < dirs.length; i++) {
    const [dx, dz] = dirs[i]!
    placeLeafLayerAt(g, dx, capY, dz, 1, leaf, true, seed + 60 + i, false)
    placeBlock(g, dx, capY + 1, dz, leaf)
  }
}

function placeOakPlusCap(g: THREE.Group, capY: number, leaf: THREE.MeshBasicMaterial): void {
  const arms: Array<[number, number]> = [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  for (const [dx, dz] of arms) {
    placeBlock(g, dx, capY, dz, leaf)
  }
}

function buildPixelArtOak(
  g: THREE.Group,
  bark: THREE.MeshBasicMaterial,
  leaf: THREE.MeshBasicMaterial,
  elder: boolean,
  seed: number,
): void {
  const trunkH = elder ? 6 : 5
  for (let y = 0; y < trunkH; y++) {
    placeBlock(g, 0, y, 0, bark)
  }
  const capY = trunkH
  if (elder) {
    placeLeafLayer(g, capY, 3, leaf, true, seed + 40, false)
    placeLeafLayer(g, capY + 1, 3, leaf, true, seed + 41, false)
    placeLeafLayer(g, capY + 2, 3, leaf, true, seed + 42, false)
    placeLeafLayer(g, capY + 3, 2, leaf, true, seed + 43, false)
    placeLeafLayer(g, capY + 4, 2, leaf, true, seed + 44, false)
    placeLeafLayer(g, capY + 5, 1, leaf, false, seed + 45, false)
    placeOakSideBranches(g, capY, bark, leaf, seed)
  } else {
    placeLeafLayer(g, capY, 2, leaf, true, seed + 20)
    placeLeafLayer(g, capY + 1, 2, leaf, true, seed + 21)
    placeLeafLayer(g, capY + 2, 1, leaf, false, seed + 22)
    placeOakPlusCap(g, capY + 3, leaf)
  }
}

const MUSHROOM_WALK_VOXEL_SCALE = 0.52

/** Walk mushroom: 2-block stem (1×1), thin 3×3 cap with trimmed corners, small plus dome (no second cap layer). */
function buildPixelArtMushroom(
  g: THREE.Group,
  stem: THREE.MeshBasicMaterial,
  cap: THREE.MeshBasicMaterial,
  seed: number,
): void {
  placeBlock(g, 0, 0, 0, stem)
  placeBlock(g, 0, 1, 0, stem)
  const capY = 2
  placeLeafLayer(g, capY, 1, cap, true, seed + 7, false)
}

export function snapPlantGroupToTerrain(g: THREE.Group, terrainTop: number): void {
  g.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(g)
  if (box.isEmpty()) return
  const dy = terrainTop - box.min.y
  if (Math.abs(dy) > 0.0005) {
    g.position.y += dy
  }
}

function placeLeafLayer(
  g: THREE.Group,
  capY: number,
  radius: number,
  leaf: THREE.MeshBasicMaterial,
  trimCorners: boolean,
  cornerSeed = 0,
  sparseEdges = true,
  edgeTrim = 0.58,
): void {
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      if (trimCorners && Math.abs(dx) === radius && Math.abs(dz) === radius) continue
      if (
        sparseEdges &&
        trimCorners &&
        radius >= 2 &&
        (Math.abs(dx) === radius || Math.abs(dz) === radius) &&
        hash01(cornerSeed + dx * 17.3 + dz * 23.1) > edgeTrim
      ) {
        continue
      }
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
  if (idx <= 1) {
    const sapling = voxelMaterial('#5fa037', '#7ed65a', seed + 3, 'sapling', true)
    placeCrossPlantSprite(g, 0, 0, 0, 0.8, 0.56, sapling)
    return
  }
  if (idx >= 7) {
    buildPixelArtOak(g, bark, leaf, true, seed)
    return
  }
  if (idx >= 4) {
    buildPixelArtOak(g, bark, leaf, false, seed)
    return
  }
  const trunkH = 3
  for (let y = 0; y < trunkH; y++) {
    placeBlock(g, 0, y, 0, bark)
  }
  placeLeafLayer(g, trunkH, 1, leaf, true)
}

function buildFlower(
  g: THREE.Group,
  stem: THREE.MeshBasicMaterial,
  bloom: THREE.MeshBasicMaterial,
  seed: number,
  stage: PlantStage,
): void {
  const idx = plantStageToIndex(stage)
  if (idx <= 0) {
    placeBlock(g, 0, 1, 0, stem)
    return
  }
  if (idx === 1) {
    const sapling = voxelMaterial('#5fa037', '#7ed65a', seed + 3, 'sapling', true)
    placeCrossPlantSprite(g, 0, 0, 0, 0.8, 0.56, sapling)
    return
  }
  if (idx >= 5) {
    const poppy = voxelMaterial('#c43b3b', '#e85d5d', seed + 7, 'poppy', true)
    placeCrossPlantSprite(g, 0, 0, 0, 0.72, 0.55, poppy)
    return
  }
  const stemH = 2
  for (let y = 0; y < stemH; y++) {
    placeBlock(g, 0, y, 0, stem)
  }
  placeCrossSprite(g, 0, stemH, 0, bloom, 1.2)
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
    placeBlock(g, 0, 0, 0, stem)
    if (idx === 1) placeBlock(g, 0, 1, 0, cap)
    return
  }
  buildPixelArtMushroom(g, stem, cap, seed)
}

const MINECRAFT_BLOCK_UNIT = 1

type SurfaceHeightFn = (x: number, z: number) => number

let walkSurfaceHeight: SurfaceHeightFn = () => 0

export function setWalkSurfaceHeightSampler(fn: SurfaceHeightFn | null): void {
  walkSurfaceHeight = fn ?? (() => 0)
}

/** World Y of the stepped terrain block top at x,z for voxel plants. */
export function walkCaptureGroundY(x: number, z: number): number {
  return walkSurfaceHeight(x, z) * VOXEL
}

const WALK_HEIGHT_BUMPS = [
  { x: -14, z: -10, rx: 8.5, rz: 6.5, peak: 2 },
  { x: 12, z: -16, rx: 9, rz: 7, peak: 2 },
  { x: -18, z: 12, rx: 7.5, rz: 8, peak: 2 },
  { x: 16, z: 8, rx: 8, rz: 7.5, peak: 2 },
  { x: 0, z: -22, rx: 10, rz: 6, peak: 2 },
  { x: -32, z: -44, rx: 18, rz: 15, peak: 5 },
  { x: 8, z: -48, rx: 22, rz: 18, peak: 6 },
  { x: 36, z: -40, rx: 16, rz: 14, peak: 5 },
  { x: -40, z: 12, rx: 15, rz: 12, peak: 4 },
  { x: 42, z: 18, rx: 17, rz: 14, peak: 5 },
]

export function minecraftAnalyticSurfaceY(x: number, z: number): number {
  let h = 0
  for (const b of WALK_HEIGHT_BUMPS) {
    const dx = (x - b.x) / b.rx
    const dz = (z - b.z) / b.rz
    const t = 1 - dx * dx - dz * dz
    if (t > 0) h = Math.max(h, b.peak * t)
  }
  return Math.max(0, Math.round(h))
}

export function applyVoxelPlantNightTint(root: THREE.Object3D, palette: ScenePalette): void {
  const star = palette.starAlpha ?? 0
  const twilight = star > 0.22
  const tint = new THREE.Color(twilight ? '#5a6e62' : '#ffffff')
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    const mat = obj.material
    if (!(mat instanceof THREE.MeshBasicMaterial)) return
    if (!obj.userData.voxel) return
    mat.color.copy(tint)
  })
}

export function buildMinecraftSteppedHills(
  root: THREE.Group,
  track: <T extends { dispose: () => void }>(o: T) => T,
  _palette: ScenePalette,
): SurfaceHeightFn {
  const span = 52
  const grassTop = track(voxelMaterial('#62b53a', '#7ed64f', 91, 'grass'))
  const dirt = track(voxelMaterial('#5a4332', '#3f2e22', 93, 'dirt'))
  const hillGroup = new THREE.Group()
  hillGroup.name = 'minecraft-hills'
  for (let ix = -span; ix <= span; ix++) {
    for (let iz = -span; iz <= span; iz++) {
      const hy = minecraftAnalyticSurfaceY(ix, iz)
      if (hy <= 0) continue
      for (let y = 0; y < hy; y++) {
        const mat = y === hy - 1 ? grassTop : dirt
        const mesh = new THREE.Mesh(boxGeo, mat)
        mesh.position.set(ix * VOXEL, (y + 0.5) * VOXEL, iz * VOXEL)
        mesh.scale.setScalar(VOXEL)
        mesh.userData.voxel = true
        hillGroup.add(mesh)
      }
    }
  }
  root.add(hillGroup)
  return (x, z) => minecraftAnalyticSurfaceY(Math.round(x), Math.round(z))
}

export function minecraftGrassTexture(
  palette: ScenePalette,
  planeW: number,
  planeD: number,
): THREE.CanvasTexture {
  const base = '#62b53a'
  const accent = '#7ed64f'
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
  surfaceBlockY?: (x: number, z: number) => number,
): void {
  const topBlocks = surfaceBlockY ?? ((x, z) => minecraftAnalyticSurfaceY(Math.round(x), Math.round(z)))
  const grassBright = track(
    voxelMaterial(palette.hills[0] ?? '#5a9c48', palette.hills[1] ?? '#7ed65a', 71, 'grass'),
  )
  const grassDark = track(
    voxelMaterial(palette.hills[1] ?? '#3d7a34', palette.hills[2] ?? '#62b53a', 72, 'grass'),
  )
  const rng = gardenRng(901)
  const span = 38
  const count = 52
  const placed: Array<{ x: number; z: number }> = []
  let i = 0
  let attempts = 0
  while (i < count && attempts < count * 12) {
    attempts++
    const x = (rng() * 2 - 1) * span
    const z = (rng() * 2 - 1) * span
    if (Math.hypot(x - world.pond.x, z - world.pond.z) < world.pond.radius + 0.5) continue
    if (placed.some((p) => Math.hypot(p.x - x, p.z - z) < 1.8)) continue
    const mat = rng() > 0.45 ? grassBright : grassDark
    const topY = topBlocks(x, z) * VOXEL
    const tall = 0.32 + rng() * 0.38
    for (const rotY of [0, Math.PI / 2]) {
      const blade = new THREE.Mesh(planeGeo, mat)
      blade.position.set(x, topY + tall / 2, z)
      blade.scale.set(0.42, tall, 1)
      blade.rotation.y = rotY
      blade.userData.voxel = true
      blade.userData.grassTuft = true
      root.add(blade)
    }
    placed.push({ x, z })
    i++
  }
}

export const MINECRAFT_WALK_ROCK_CLUSTERS: Array<{ x: number; z: number; seed: number }> = [
  { x: -11, z: 6, seed: 501 },
  { x: 13, z: -6, seed: 502 },
  { x: -16, z: -9, seed: 503 },
  { x: 18, z: 10, seed: 504 },
]

export function voxelRockCluster(
  x: number,
  z: number,
  seed: number,
  palette: ScenePalette,
  root: THREE.Group,
  track: <T extends { dispose: () => void }>(o: T) => T,
  blockTopY?: (wx: number, wz: number) => number,
): void {
  const rockMat = track(
    voxelMaterial(palette.bank ?? '#6b6b74', palette.hills[2] ?? '#8a8a94', seed, 'stone'),
  )
  const mossMat = track(
    voxelMaterial(palette.hills[0] ?? '#5fa037', palette.hills[1] ?? '#3d7a34', seed + 3, 'moss_stone'),
  )
  const topAt = blockTopY ?? ((wx, wz) => walkCaptureGroundY(wx, wz))
  const surfaceY = Math.max(0, Math.round(topAt(x, z)))
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  const rng = gardenRng(seed)
  const blockCount = 3 + Math.floor(rng() * 4)
  const used = new Set<string>()
  const colHeight = new Map<string, number>()
  const offsets: Array<[number, number]> = [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
  ]
  let placed = 0
  let guard = 0
  while (placed < blockCount && guard < 40) {
    guard++
    const pick = offsets[Math.floor(rng() * offsets.length)]!
    const ix = pick[0]
    const iz = pick[1]
    const colKey = `${ix},${iz}`
    const layer = colHeight.get(colKey) ?? 0
    if (layer > 1) continue
    const key = `${colKey},${layer}`
    if (used.has(key)) continue
    used.add(key)
    colHeight.set(colKey, layer + 1)
    const mat = layer === 0 ? mossMat : rockMat
    placeBlock(g, ix, surfaceY + layer, iz, mat)
    const scale = 0.82 + rng() * 0.28
    const child = g.children[g.children.length - 1]
    if (child) child.scale.set(VOXEL * scale, VOXEL * scale, VOXEL * scale)
    placed++
  }
  root.add(g)
}

export function minecraftWaterBlockTexture(palette: ScenePalette, seed = 44): THREE.CanvasTexture {
  const base = palette.waterTint[0] ?? '#2a4a6e'
  const accent = palette.waterTint[1] ?? '#1a3050'
  const highlight = palette.ripple ?? '#6a9ac8'
  const tex = minecraftBlockTexture('#3a9ad8', '#1a4878', seed, 'gravel')
  const img = tex.image as HTMLCanvasElement
  const ctx = img.getContext('2d')
  if (ctx) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = hash01(seed + x * 19.1 + y * 23.7)
        if (n > 0.88) {
          ctx.fillStyle = highlight
          ctx.fillRect(x, y, 1, 1)
        } else if (n < 0.08) {
          ctx.fillStyle = accent
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    tex.needsUpdate = true
  }
  return configurePixelTexture(tex)
}

function usesCompactPixelFooting(kind: PlantVisualRecipe['kind'], stage: PlantStage): boolean {
  const idx = plantStageToIndex(stage)
  if (kind === 'tree') return idx <= 1 || idx >= 6
  if (kind === 'flower') return idx <= 1 || idx >= 5
  if (kind === 'mushroom') return idx >= 2
  return false
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
  const stemMushroom = voxelMaterial('#e8dcc8', '#d9c8ad', seedN + 5, 'mushroom_stem')
  const cap = voxelMaterial('#c44a4a', '#f2e8dc', seedN + 13, 'mushroom_cap')
  const dirt = voxelMaterial('#5a4332', '#3f2e22', seedN + 11, 'dirt')

  const compact = usesCompactPixelFooting(recipe.kind, stage)
  if (!compact) {
    placeBlock(g, 0, 0, 0, dirt)
    if (plantStageToIndex(stage) > 0) {
      placeBlock(g, -1, 0, 0, dirt)
      placeBlock(g, 0, 0, -1, dirt)
    }
  }

  if (plant.id === 'sprout-walk') {
    const sapling = voxelMaterial('#5fa037', '#7ed65a', seedN + 3, 'sapling', true)
    placeCrossPlantSprite(g, 0, 0, 0, 0.8, 0.64, sapling)
  } else if (recipe.kind === 'tree') {
    buildOakTree(g, bark, leaf, seedN, stage)
  } else if (recipe.kind === 'flower') {
    buildFlower(g, stemMat, bloom, seedN, stage)
  } else if (recipe.kind === 'mushroom') {
    buildMushroom(g, stemMushroom, cap, seedN, stage)
    if (plantStageToIndex(stage) >= 2) {
      g.userData.walkVoxelScale = MUSHROOM_WALK_VOXEL_SCALE
      g.scale.setScalar(MUSHROOM_WALK_VOXEL_SCALE)
    }
  } else {
    buildOakTree(g, bark, leaf, seedN + 19, stage)
  }

  const terrainTop = walkCaptureGroundY(plant.x, plant.z)
  g.position.set(plant.x, terrainTop, plant.z)
  snapPlantGroupToTerrain(g, terrainTop)
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
