import * as THREE from 'three'
import { gardenRng } from '@/lib/garden/prng'
import type { ScenePalette } from '@/lib/garden/palettes'
import type { GardenWorld } from '@/lib/open-world/types'

export interface TerrainHandle {
  root: THREE.Group
  ground: THREE.Mesh
  water: THREE.Mesh
  sky: THREE.Mesh
  fogColor: THREE.Color
  dispose: () => void
  recolor: (palette: ScenePalette) => void
}

function hexColor(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

function grassTexture(palette: ScenePalette): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(c)
  ctx.fillStyle = palette.hills[1] ?? '#2c163c'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    ctx.fillStyle = i % 5 === 0 ? (palette.hills[0] ?? '#4e2749') : (palette.silSoft ?? '#241536')
    ctx.globalAlpha = 0.18 + Math.random() * 0.25
    ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 4)
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(18, 18)
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

function skyTexture(palette: ScenePalette): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 256
  const ctx = c.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(c)
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  const sky = palette.sky
  g.addColorStop(0, sky[0] ?? '#070619')
  g.addColorStop(0.35, sky[1] ?? sky[0] ?? '#1d1748')
  g.addColorStop(0.62, sky[2] ?? '#472a68')
  g.addColorStop(0.85, sky[3] ?? sky[2] ?? '#8a4a7d')
  g.addColorStop(1, sky[sky.length - 1] ?? '#d98a86')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 8, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

function pathRibbon(points: { x: number; z: number }[], width: number): THREE.BufferGeometry {
  const half = width / 2
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const dirs: { x: number; z: number }[] = []
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)]
    const next = points[Math.min(points.length - 1, i + 1)]
    let dx = next.x - prev.x
    let dz = next.z - prev.z
    const len = Math.hypot(dx, dz) || 1
    dx /= len
    dz /= len
    dirs.push({ x: -dz, z: dx })
  }
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const n = dirs[i]
    positions.push(p.x + n.x * half, 0.035, p.z + n.z * half)
    positions.push(p.x - n.x * half, 0.035, p.z - n.z * half)
    const v = i / (points.length - 1 || 1)
    uvs.push(0, v, 1, v)
    if (i < points.length - 1) {
      const b = i * 2
      indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export function buildTerrain(
  world: GardenWorld,
  palette: ScenePalette,
  reducedMotion: boolean,
): TerrainHandle {
  const root = new THREE.Group()
  root.name = 'terrain'
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(obj: T): T => {
    disposables.push(obj)
    return obj
  }

  const grassTex = track(grassTexture(palette))
  const groundMat = track(new THREE.MeshStandardMaterial({
    map: grassTex,
    color: palette.hills[1] ?? '#2c163c',
    roughness: 0.95,
  }))
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(world.bounds.maxX - world.bounds.minX + 8, world.bounds.maxZ - world.bounds.minZ + 8)), groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  root.add(ground)

  const pathMat = track(new THREE.MeshStandardMaterial({
    color: palette.bank,
    roughness: 1,
  }))
  for (const path of world.paths) {
    if (path.points.length < 2) continue
    const ribbon = new THREE.Mesh(track(pathRibbon(path.points, path.width)), pathMat)
    ribbon.receiveShadow = true
    root.add(ribbon)
  }

  const waterMat = track(new THREE.MeshStandardMaterial({
    color: palette.waterTint[1] ?? '#1a0f2b',
    roughness: 0.18,
    metalness: 0.12,
    transparent: true,
    opacity: 0.88,
    emissive: palette.ripple,
    emissiveIntensity: 0.08,
  }))
  const water = new THREE.Mesh(track(new THREE.CircleGeometry(world.pond.radius, 32)), waterMat)
  water.rotation.x = -Math.PI / 2
  water.position.set(world.pond.x, 0.05, world.pond.z)
  root.add(water)

  const bank = new THREE.Mesh(
    track(new THREE.RingGeometry(world.pond.radius * 0.98, world.pond.radius + 0.55, 32)),
    track(new THREE.MeshStandardMaterial({ color: palette.bank, roughness: 1 })),
  )
  bank.rotation.x = -Math.PI / 2
  bank.position.set(world.pond.x, 0.04, world.pond.z)
  root.add(bank)

  const wood = track(new THREE.MeshStandardMaterial({ color: '#5c3a28', roughness: 0.85 }))
  const roof = track(new THREE.MeshStandardMaterial({ color: palette.sil, roughness: 0.7 }))
  const shed = new THREE.Group()
  const body = new THREE.Mesh(track(new THREE.BoxGeometry(world.shed.width, 2.4, world.shed.depth)), wood)
  body.position.y = 1.2
  body.castShadow = true
  shed.add(body)
  const roofMesh = new THREE.Mesh(track(new THREE.ConeGeometry(Math.max(world.shed.width, world.shed.depth) * 0.72, 1.1, 4)), roof)
  roofMesh.position.y = 2.85
  roofMesh.rotation.y = Math.PI / 4
  shed.add(roofMesh)
  shed.position.set(world.shed.x, 0, world.shed.z)
  shed.rotation.y = world.shed.yaw
  root.add(shed)

  const hedgeMat = track(new THREE.MeshStandardMaterial({ color: palette.hills[2] ?? palette.sil, roughness: 0.9 }))
  const postGeo = track(new THREE.BoxGeometry(0.28, 1.35, 0.28))
  const railGeo = track(new THREE.BoxGeometry(1, 0.12, 0.1))
  const addFence = (ax: number, az: number, bx: number, bz: number) => {
    const dist = Math.hypot(bx - ax, bz - az)
    const posts = Math.max(2, Math.round(dist / 2.1))
    for (let i = 0; i <= posts; i++) {
      const t = i / posts
      const x = ax + (bx - ax) * t
      const z = az + (bz - az) * t
      const gateGap = Math.abs(x) < 2.4 && Math.abs(z - world.gate.z) < 1.2
      if (gateGap) continue
      const post = new THREE.Mesh(postGeo, hedgeMat)
      post.position.set(x, 0.67, z)
      root.add(post)
      if (i < posts) {
        const rail = new THREE.Mesh(railGeo, wood)
        rail.position.set(
          x + (bx - ax) / posts / 2,
          0.85,
          z + (bz - az) / posts / 2,
        )
        rail.scale.x = dist / posts
        rail.lookAt(bx, 0.85, bz)
        root.add(rail)
      }
    }
  }
  const b = world.bounds
  addFence(b.minX, b.minZ, b.maxX, b.minZ)
  addFence(b.maxX, b.minZ, b.maxX, b.maxZ)
  addFence(b.maxX, b.maxZ, b.minX, b.maxZ)
  addFence(b.minX, b.maxZ, b.minX, b.minZ)

  const gatePostL = new THREE.Mesh(track(new THREE.BoxGeometry(0.35, 2.2, 0.35)), wood)
  const gatePostR = gatePostL.clone()
  gatePostL.position.set(-2.2, 1.1, world.gate.z)
  gatePostR.position.set(2.2, 1.1, world.gate.z)
  root.add(gatePostL, gatePostR)
  const lintel = new THREE.Mesh(track(new THREE.BoxGeometry(4.8, 0.22, 0.3)), wood)
  lintel.position.set(0, 2.15, world.gate.z)
  root.add(lintel)

  const hillMat = track(new THREE.MeshStandardMaterial({ color: palette.hills[2] ?? palette.sil, roughness: 1 }))
  const hillGeo = track(new THREE.SphereGeometry(1, 10, 8))
  const hills = [
    { x: -28, z: -36, s: 14 },
    { x: 8, z: -40, s: 18 },
    { x: 32, z: -34, s: 12 },
  ]
  for (const h of hills) {
    const mesh = new THREE.Mesh(hillGeo, hillMat)
    mesh.scale.set(h.s, h.s * 0.38, h.s * 0.8)
    mesh.position.set(h.x, -1.2, h.z)
    root.add(mesh)
  }

  if (!reducedMotion) {
    const tuftGeo = track(new THREE.ConeGeometry(0.07, 0.28, 5))
    const tuftMat = track(new THREE.MeshStandardMaterial({ color: palette.hills[0] ?? '#4e2749', roughness: 1 }))
    const count = 420
    const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, count)
    const rng = gardenRng(7)
    const dummy = new THREE.Object3D()
    let placed = 0
    while (placed < count) {
      const x = (rng() * 2 - 1) * (WORLD_SPAN(world) * 0.48)
      const z = (rng() * 2 - 1) * (WORLD_SPAN(world) * 0.48)
      const inPond = Math.hypot(x - world.pond.x, z - world.pond.z) < world.pond.radius + 0.4
      if (inPond) continue
      dummy.position.set(x, 0.12, z)
      dummy.rotation.y = rng() * Math.PI
      dummy.scale.setScalar(0.7 + rng() * 1.1)
      dummy.updateMatrix()
      tufts.setMatrixAt(placed, dummy.matrix)
      placed++
    }
    tufts.instanceMatrix.needsUpdate = true
    root.add(tufts)
  }

  const skyTex = track(skyTexture(palette))
  const skyMat = track(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false }))
  const sky = new THREE.Mesh(track(new THREE.SphereGeometry(180, 16, 12)), skyMat)
  root.add(sky)

  const fogColor = hexColor(palette.sky[2] ?? palette.bank)

  return {
    root,
    ground,
    water,
    sky,
    fogColor,
    dispose: () => {
      disposables.forEach((d) => d.dispose())
    },
    recolor: (next) => {
      groundMat.color.set(next.hills[1] ?? '#2c163c')
      waterMat.color.set(next.waterTint[1] ?? '#1a0f2b')
      waterMat.emissive.set(next.ripple)
      hedgeMat.color.set(next.hills[2] ?? next.sil)
      hillMat.color.set(next.hills[2] ?? next.sil)
      fogColor.set(next.sky[2] ?? next.bank)
      const newSky = skyTexture(next)
      skyMat.map?.dispose()
      skyMat.map = newSky
      skyMat.needsUpdate = true
      disposables.push(newSky)
    },
  }
}

function WORLD_SPAN(world: GardenWorld): number {
  return world.bounds.maxX - world.bounds.minX
}
