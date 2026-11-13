import * as THREE from 'three'
import { gardenRng } from '@/lib/garden/prng'
import type { ScenePalette } from '@/lib/garden/palettes'
import type { GardenWorld } from '@/lib/open-world/types'
import { isWalkCaptureSession } from '@/lib/open-world/walk-capture-bridge'
import { minecraftGrassTexture, minecraftPathTexture, voxelRockCluster } from './minecraft-visual'

export interface TerrainHandle {
  root: THREE.Group
  ground: THREE.Mesh
  water: THREE.Mesh
  sky: THREE.Mesh
  fogColor: THREE.Color
  tick?: (time: number, dt: number) => void
  dispose: () => void
  recolor: (palette: ScenePalette) => void
}

function hexColor(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

function twilightSceneryColor(palette: ScenePalette, base: string, twilight: boolean): THREE.Color {
  const color = new THREE.Color(base)
  if (!twilight) return color
  color.lerp(new THREE.Color(palette.hills[0] ?? palette.silSoft), 0.62)
  color.lerp(new THREE.Color(palette.hills[1] ?? palette.silSoft), 0.28)
  return color
}

function twilightSceneryMat(
  palette: ScenePalette,
  base: string,
  twilight: boolean,
  starAlpha: number,
  roughness = 0.88,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: twilightSceneryColor(palette, base, twilight),
    roughness,
    emissive: twilight ? (palette.hills[0] ?? palette.glow ?? palette.silSoft) : '#000000',
    emissiveIntensity: twilight ? 0.22 + starAlpha * 0.24 : 0,
  })
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
  const star = palette.starAlpha ?? 0
  const twilight = star > 0.22
  const top = sky[0] ?? '#070619'
  const upper = sky[1] ?? sky[0] ?? '#1d1748'
  const mid = twilight ? (sky[3] ?? sky[2] ?? '#8a4a7d') : (sky[2] ?? '#472a68')
  const lower = twilight ? (sky[4] ?? sky[3] ?? '#d97a4e') : (sky[3] ?? sky[2] ?? '#8a4a7d')
  const horizon = sky[sky.length - 1] ?? '#d98a86'
  g.addColorStop(0, top)
  g.addColorStop(0.32, upper)
  g.addColorStop(0.58, mid)
  g.addColorStop(0.82, lower)
  g.addColorStop(1, horizon)
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
  minecraftMode = false,
): TerrainHandle {
  const root = new THREE.Group()
  root.name = 'terrain'
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(obj: T): T => {
    disposables.push(obj)
    return obj
  }

  const starAlpha = palette.starAlpha ?? 0
  const isNight = starAlpha > 0.45
  const twilight = starAlpha > 0.22

  // ── Ground Plane ────────────────────────────────────────────────────────
  const planeW = world.bounds.maxX - world.bounds.minX + 16
  const planeD = world.bounds.maxZ - world.bounds.minZ + 16
  const grassTex = track(
    minecraftMode
      ? minecraftGrassTexture(palette, planeW, planeD)
      : grassTexture(palette),
  )
  const groundTint = new THREE.Color(palette.hills[1] ?? '#2c163c')
  if (twilight) {
    groundTint.lerp(new THREE.Color(palette.hills[0] ?? palette.silSoft), 0.62 + starAlpha * 0.22)
    groundTint.lerp(new THREE.Color(palette.hills[2] ?? palette.hills[1] ?? '#5a3d52'), 0.18)
  }
  const groundMat = track(
    minecraftMode
      ? new THREE.MeshLambertMaterial({
          map: grassTex,
          color: new THREE.Color('#ffffff'),
        })
      : new THREE.MeshStandardMaterial({
          map: grassTex,
          color: groundTint,
          roughness: twilight ? 0.84 : 0.95,
          emissive: twilight ? (palette.hills[0] ?? palette.glow ?? palette.silSoft) : '#000000',
          emissiveIntensity: twilight ? 0.22 + starAlpha * 0.22 : 0,
        }),
  )
  const ground = new THREE.Mesh(
    track(new THREE.PlaneGeometry(world.bounds.maxX - world.bounds.minX + 16, world.bounds.maxZ - world.bounds.minZ + 16)),
    groundMat,
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  root.add(ground)
  const walkCapture = isWalkCaptureSession()

  // ── Gentle Flowerbed Soil Berms ─────────────────────────────────────────
  const soilBermMat = track(
    new THREE.MeshStandardMaterial({ color: palette.hills[0] ?? '#3a1f33', roughness: 0.98 }),
  )
  if (!minecraftMode) {
    const bermGeo = track(new THREE.SphereGeometry(1, 10, 8))
    const bermPositions = [
      { x: -14, z: -10, sx: 8.5, sz: 6.5 },
      { x: 12, z: -16, sx: 9.0, sz: 7.0 },
      { x: -18, z: 12, sx: 7.5, sz: 8.0 },
      { x: 16, z: 8, sx: 8.0, sz: 7.5 },
      { x: 0, z: -22, sx: 10.0, sz: 6.0 },
    ]
    for (const berm of bermPositions) {
      const mesh = new THREE.Mesh(bermGeo, soilBermMat)
      mesh.scale.set(berm.sx, 0.4, berm.sz)
      mesh.position.set(berm.x, -0.15, berm.z)
      mesh.receiveShadow = true
      root.add(mesh)
    }
  }

  // ── Pathway Ribbon & Flagstone Stepping Stones ──────────────────────────
  const pathTex = minecraftMode ? track(minecraftPathTexture(palette, Math.max(planeW, planeD))) : null
  const pathMat = track(
    minecraftMode && pathTex
      ? new THREE.MeshLambertMaterial({ map: pathTex, color: new THREE.Color('#ffffff') })
      : new THREE.MeshStandardMaterial({ color: palette.bank, roughness: 1 }),
  )
  const steppingStoneMat = track(
    minecraftMode && pathTex
      ? new THREE.MeshLambertMaterial({ map: pathTex, color: new THREE.Color('#ffffff') })
      : new THREE.MeshStandardMaterial({ color: palette.bank, roughness: 0.85, metalness: 0.05 }),
  )
  const stoneGeo = track(new THREE.CylinderGeometry(0.38, 0.44, 0.04, 8))

  for (const path of world.paths) {
    if (path.points.length < 2) continue
    if (minecraftMode && walkCapture) continue
    const ribbon = new THREE.Mesh(track(pathRibbon(path.points, path.width)), pathMat)
    ribbon.receiveShadow = true
    root.add(ribbon)

    // Flagstones along the walkway path
    for (let i = 0; i < path.points.length; i += 2) {
      const pt = path.points[i]
      const stone = new THREE.Mesh(stoneGeo, steppingStoneMat)
      const s = 0.85 + ((i * 17) % 5) * 0.1
      stone.scale.set(s, 1, s * 0.9)
      stone.position.set(pt.x + ((i % 3) - 1) * 0.15, 0.045, pt.z + (((i + 1) % 3) - 1) * 0.15)
      stone.rotation.y = (i * 0.7) % Math.PI
      stone.receiveShadow = true
      root.add(stone)
    }
  }

  // ── Pond & Bank ────────────────────────────────────────────────────────
  const waterMat = track(
    new THREE.MeshStandardMaterial({
      color: palette.waterTint[1] ?? '#1a0f2b',
      roughness: 0.12,
      metalness: 0.25,
      transparent: true,
      opacity: 0.9,
      emissive: palette.ripple,
      emissiveIntensity: 0.12,
    }),
  )
  const water = new THREE.Mesh(track(new THREE.CircleGeometry(world.pond.radius, 36)), waterMat)
  water.rotation.x = -Math.PI / 2
  water.position.set(world.pond.x, 0.05, world.pond.z)
  root.add(water)

  const bank = new THREE.Mesh(
    track(new THREE.RingGeometry(world.pond.radius * 0.98, world.pond.radius + 0.65, 36)),
    track(new THREE.MeshStandardMaterial({ color: palette.bank, roughness: 1 })),
  )
  bank.rotation.x = -Math.PI / 2
  bank.position.set(world.pond.x, 0.04, world.pond.z)
  bank.receiveShadow = true
  root.add(bank)

  // ── Floating Remembrance Candle Boats on Pond ───────────────────────────
  const candleFlameMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffcf8f',
      emissive: palette.glow ?? '#ffd700',
      emissiveIntensity: 1.25,
      roughness: 0.2,
    }),
  )
  const candleWaxMat = track(new THREE.MeshStandardMaterial({ color: '#f5ead0', roughness: 0.5 }))
  const boatDishMat = track(new THREE.MeshStandardMaterial({ color: palette.sil, roughness: 0.8 }))
  const rippleRingMat = track(
    new THREE.MeshBasicMaterial({ color: palette.ripple, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
  )

  const boatDishGeo = track(new THREE.ConeGeometry(0.24, 0.09, 4))
  const candleWaxGeo = track(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 8))
  const flameGeo = track(new THREE.ConeGeometry(0.025, 0.065, 6))
  const rippleGeo = track(new THREE.RingGeometry(0.25, 0.38, 16))

  interface CandleBoat {
    group: THREE.Group
    baseY: number
    phase: number
  }
  const candleBoats: CandleBoat[] = []

  const candleOffsets = [
    { r: world.pond.radius * 0.45, a: 0.5 },
    { r: world.pond.radius * 0.65, a: 2.1 },
    { r: world.pond.radius * 0.35, a: 3.7 },
    { r: world.pond.radius * 0.72, a: 4.9 },
  ]

  candleOffsets.forEach((cOff, idx) => {
    const bGroup = new THREE.Group()
    const dish = new THREE.Mesh(boatDishGeo, boatDishMat)
    dish.rotation.x = Math.PI
    dish.position.y = 0.045
    dish.castShadow = true
    bGroup.add(dish)

    const wax = new THREE.Mesh(candleWaxGeo, candleWaxMat)
    wax.position.y = 0.1
    bGroup.add(wax)

    const flame = new THREE.Mesh(flameGeo, candleFlameMat)
    flame.position.y = 0.19
    bGroup.add(flame)

    const ripple = new THREE.Mesh(rippleGeo, rippleRingMat)
    ripple.rotation.x = -Math.PI / 2
    ripple.position.y = 0.005
    bGroup.add(ripple)

    const bx = world.pond.x + Math.cos(cOff.a) * cOff.r
    const bz = world.pond.z + Math.sin(cOff.a) * cOff.r
    bGroup.position.set(bx, 0.05, bz)
    root.add(bGroup)
    candleBoats.push({ group: bGroup, baseY: 0.05, phase: idx * 1.4 })
  })

  // ── Floating Water Lily Pads ────────────────────────────────────────────
  const lilyPadMat = track(new THREE.MeshStandardMaterial({ color: palette.silSoft, roughness: 0.7 }))
  const lilyPadGeo = track(new THREE.CircleGeometry(0.36, 16))
  const lilyOffsets = [
    { r: world.pond.radius * 0.82, a: 1.1 },
    { r: world.pond.radius * 0.55, a: 2.8 },
    { r: world.pond.radius * 0.78, a: 4.2 },
    { r: world.pond.radius * 0.42, a: 5.6 },
  ]
  lilyOffsets.forEach((lOff) => {
    const pad = new THREE.Mesh(lilyPadGeo, lilyPadMat)
    pad.rotation.x = -Math.PI / 2
    pad.position.set(
      world.pond.x + Math.cos(lOff.a) * lOff.r,
      0.052,
      world.pond.z + Math.sin(lOff.a) * lOff.r,
    )
    pad.receiveShadow = true
    root.add(pad)
  })

  // ── Mossy River Boulders & Garden Rocks ──────────────────────────────────
  const rockMat = track(twilightSceneryMat(palette, palette.bank, twilight, starAlpha, 0.9))
  const rockGeo = track(new THREE.DodecahedronGeometry(1, 1))
  const rockPositions = [
    { x: world.pond.x + world.pond.radius * 0.95, z: world.pond.z - 0.5, s: 0.65 },
    { x: world.pond.x - world.pond.radius * 0.85, z: world.pond.z + 1.2, s: 0.8 },
    { x: world.pond.x + 0.4, z: world.pond.z + world.pond.radius * 0.98, s: 0.55 },
    { x: -16, z: -14, s: 1.1 },
    { x: 18, z: -12, s: 0.9 },
    { x: -12, z: 18, s: 0.75 },
    { x: 14, z: 16, s: 0.85 },
  ]
  for (let ri = 0; ri < rockPositions.length; ri++) {
    const rp = rockPositions[ri]
    if (minecraftMode) {
      voxelRockCluster(rp.x, rp.z, 300 + ri * 17, palette, root, track)
    } else {
      const rMesh = new THREE.Mesh(rockGeo, rockMat)
      rMesh.scale.set(rp.s * 1.2, rp.s * 0.7, rp.s * 0.9)
      rMesh.position.set(rp.x, rp.s * 0.35, rp.z)
      rMesh.rotation.set(rp.s * 1.5, rp.s * 2.3, rp.s)
      rMesh.castShadow = true
      rMesh.receiveShadow = true
      root.add(rMesh)
    }
  }

  const walkCaptureDecor = isWalkCaptureSession()
  // ── Wooden Garden Pergola / Trellis Arch near Gate ──────────────────────
  const wood = track(new THREE.MeshStandardMaterial({ color: '#543825', roughness: 0.82 }))
  const ivyLeafMat = track(new THREE.MeshStandardMaterial({ color: palette.silSoft, roughness: 0.7 }))
  const archGroup = new THREE.Group()
  const archW = 3.6
  const archH = 2.85
  const archD = 1.2
  const postThickness = 0.18

  // 4 Arch Columns
  const archPostGeo = track(new THREE.BoxGeometry(postThickness, archH, postThickness))
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const aPost = new THREE.Mesh(archPostGeo, wood)
      aPost.position.set((sx * archW) / 2, archH / 2, (sz * archD) / 2)
      aPost.castShadow = true
      archGroup.add(aPost)

      // Creeping ivy foliage along arch posts
      for (let iv = 0; iv < 4; iv++) {
        const ivyCluster = new THREE.Mesh(track(new THREE.SphereGeometry(0.18, 6, 6)), ivyLeafMat)
        ivyCluster.position.set(
          (sx * archW) / 2 + sx * 0.08,
          0.6 + iv * 0.65,
          (sz * archD) / 2 + sz * 0.08,
        )
        ivyCluster.scale.set(1.2, 0.8, 1)
        archGroup.add(ivyCluster)
      }
    }
  }

  // Overhead Beams & Rafters
  const beamGeo = track(new THREE.BoxGeometry(postThickness, 0.16, archD + 0.5))
  for (const sx of [-1, 1]) {
    const beam = new THREE.Mesh(beamGeo, wood)
    beam.position.set((sx * archW) / 2, archH, 0)
    beam.castShadow = true
    archGroup.add(beam)
  }

  const rafterGeo = track(new THREE.BoxGeometry(archW + 0.6, 0.12, 0.14))
  for (let r = -2; r <= 2; r++) {
    const rafter = new THREE.Mesh(rafterGeo, wood)
    rafter.position.set(0, archH + 0.12, (r * archD) / 4)
    rafter.castShadow = true
    archGroup.add(rafter)
  }

  archGroup.position.set(0, 0, world.gate.z - 2.8)
  if (!walkCaptureDecor) root.add(archGroup)

  // ── Crafted Wooden Garden Bench ─────────────────────────────────────────
  const benchGroup = new THREE.Group()
  const benchLegGeo = track(new THREE.BoxGeometry(0.1, 0.45, 0.5))
  for (const bx of [-0.75, 0.75]) {
    const bLeg = new THREE.Mesh(benchLegGeo, wood)
    bLeg.position.set(bx, 0.225, 0)
    bLeg.castShadow = true
    benchGroup.add(bLeg)
  }
  const seatSlatGeo = track(new THREE.BoxGeometry(1.8, 0.04, 0.12))
  for (let s = -1; s <= 1; s++) {
    const slat = new THREE.Mesh(seatSlatGeo, wood)
    slat.position.set(0, 0.45, s * 0.16)
    slat.castShadow = true
    benchGroup.add(slat)
  }
  const backSlatGeo = track(new THREE.BoxGeometry(1.8, 0.12, 0.04))
  for (let bs = 1; bs <= 2; bs++) {
    const backSlat = new THREE.Mesh(backSlatGeo, wood)
    backSlat.position.set(0, 0.55 + bs * 0.16, -0.22)
    backSlat.castShadow = true
    benchGroup.add(backSlat)
  }
  // Position bench looking toward the pond
  benchGroup.position.set(world.pond.x + world.pond.radius + 1.8, 0, world.pond.z - 0.8)
  benchGroup.rotation.y = -Math.PI * 0.65
  if (!walkCaptureDecor) root.add(benchGroup)

  // ── Classical Stone Birdbath ────────────────────────────────────────────
  const birdbathGroup = new THREE.Group()
  const bbBase = new THREE.Mesh(track(new THREE.CylinderGeometry(0.32, 0.38, 0.12, 12)), rockMat)
  bbBase.position.y = 0.06
  birdbathGroup.add(bbBase)

  const bbCol = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.15, 0.72, 12)), rockMat)
  bbCol.position.y = 0.46
  bbCol.castShadow = true
  birdbathGroup.add(bbCol)

  const bbBasin = new THREE.Mesh(track(new THREE.CylinderGeometry(0.55, 0.22, 0.18, 16)), rockMat)
  bbBasin.position.y = 0.88
  bbBasin.castShadow = true
  birdbathGroup.add(bbBasin)

  const bbWater = new THREE.Mesh(track(new THREE.CircleGeometry(0.48, 16)), waterMat)
  bbWater.rotation.x = -Math.PI / 2
  bbWater.position.y = 0.95
  birdbathGroup.add(bbWater)

  birdbathGroup.position.set(-8.5, 0, -4.5)
  if (!walkCaptureDecor) root.add(birdbathGroup)

  // ── Warm Garden Path Lanterns on Wooden Posts ───────────────────────────
  const lanternGlassMat = track(
    new THREE.MeshStandardMaterial({
      color: palette.glow,
      emissive: palette.glow,
      emissiveIntensity: isNight ? 1.4 : 0.4,
      roughness: 0.3,
    }),
  )
  const lanternPostGeo = track(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 8))
  const lanternCapGeo = track(new THREE.ConeGeometry(0.18, 0.14, 4))
  const lanternCoreGeo = track(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 8))

  const lanternCoords = [
    { x: -3.5, z: -6.0 },
    { x: 3.8, z: -12.5 },
    { x: -5.0, z: 8.5 },
    { x: 4.5, z: 12.0 },
  ]

  if (!walkCaptureDecor) {
    lanternCoords.forEach((lc) => {
      const lGroup = new THREE.Group()
      const lPost = new THREE.Mesh(lanternPostGeo, wood)
      lPost.position.y = 0.9
      lPost.castShadow = true
      lGroup.add(lPost)

      const arm = new THREE.Mesh(track(new THREE.BoxGeometry(0.35, 0.05, 0.05)), wood)
      arm.position.set(0.15, 1.75, 0)
      lGroup.add(arm)

      const glass = new THREE.Mesh(lanternCoreGeo, lanternGlassMat)
      glass.position.set(0.28, 1.58, 0)
      lGroup.add(glass)

      const cap = new THREE.Mesh(lanternCapGeo, wood)
      cap.position.set(0.28, 1.72, 0)
      lGroup.add(cap)

      lGroup.position.set(lc.x, 0, lc.z)
      root.add(lGroup)
    })
  }

  // ── The Sanctuary Circle (Collaborative Plot) ──────────────────────────
  const scCenter = world.sanctuaryCircle ?? { x: 0, z: -25, radius: 7.0 }
  const sanctuaryGroup = new THREE.Group()

  // Outer mossy stone border
  const stoneRingGeo = track(new THREE.RingGeometry(scCenter.radius * 0.95, scCenter.radius + 0.45, 36))
  const stoneRing = new THREE.Mesh(stoneRingGeo, steppingStoneMat)
  stoneRing.rotation.x = -Math.PI / 2
  stoneRing.position.set(scCenter.x, 0.04, scCenter.z)
  stoneRing.receiveShadow = true
  sanctuaryGroup.add(stoneRing)

  // Perimeter engraved contributor stones (12 stepping stones around border)
  const scStoneGeo = track(new THREE.CircleGeometry(0.48, 12))
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const cStone = new THREE.Mesh(scStoneGeo, steppingStoneMat)
    cStone.rotation.x = -Math.PI / 2
    cStone.position.set(
      scCenter.x + Math.cos(a) * (scCenter.radius + 0.1),
      0.045,
      scCenter.z + Math.sin(a) * (scCenter.radius + 0.1),
    )
    cStone.receiveShadow = true
    sanctuaryGroup.add(cStone)
  }

  // Central Starlight Basin & Pool
  const basinLip = new THREE.Mesh(track(new THREE.CylinderGeometry(1.4, 1.6, 0.32, 24)), rockMat)
  basinLip.position.set(scCenter.x, 0.16, scCenter.z)
  basinLip.castShadow = true
  basinLip.receiveShadow = true
  sanctuaryGroup.add(basinLip)

  const basinPoolMat = track(
    new THREE.MeshStandardMaterial({
      color: '#1a1f3c',
      roughness: 0.15,
      metalness: 0.3,
      emissive: '#38bdf8',
      emissiveIntensity: 0.28,
    }),
  )
  const basinPool = new THREE.Mesh(track(new THREE.CircleGeometry(1.32, 24)), basinPoolMat)
  basinPool.rotation.x = -Math.PI / 2
  basinPool.position.set(scCenter.x, 0.3, scCenter.z)
  sanctuaryGroup.add(basinPool)

  // Rustic Timber Gateway at the South entrance of Sanctuary Circle
  const scArch = new THREE.Group()
  for (const sx of [-1.8, 1.8]) {
    const post = new THREE.Mesh(track(new THREE.BoxGeometry(0.25, 2.5, 0.25)), wood)
    post.position.set(sx, 1.25, 0)
    post.castShadow = true
    scArch.add(post)
  }
  const scLintel = new THREE.Mesh(track(new THREE.BoxGeometry(4.2, 0.2, 0.3)), wood)
  scLintel.position.set(0, 2.45, 0)
  scLintel.castShadow = true
  scArch.add(scLintel)
  scArch.position.set(scCenter.x, 0, scCenter.z + scCenter.radius)
  sanctuaryGroup.add(scArch)

  // ── "The Grove Project" Community Milestone 3D Unlocks ─────────────────
  const unlockedFeatures = new Set(world.groveMilestone?.unlockedFeatures ?? [])
  let sanctuaryFireflies: THREE.Points | null = null
  let sanctuaryFireflyPositions: Float32Array | null = null
  const auroraRibbons: THREE.Mesh[] = []

  // Tier 1 (25 waterings): Sanctuary Carved Birdbath & Songbirds
  if (unlockedFeatures.has('birdbath')) {
    const scBb = new THREE.Group()
    const scBbCol = new THREE.Mesh(track(new THREE.CylinderGeometry(0.12, 0.18, 0.78, 12)), rockMat)
    scBbCol.position.y = 0.39
    scBb.add(scBbCol)
    const scBbTop = new THREE.Mesh(track(new THREE.CylinderGeometry(0.52, 0.24, 0.16, 16)), rockMat)
    scBbTop.position.y = 0.82
    scBb.add(scBbTop)
    const birdMat = track(
      new THREE.MeshStandardMaterial({ color: '#7dd3fc', emissive: '#38bdf8', emissiveIntensity: 0.35 }),
    )
    const bird = new THREE.Mesh(track(new THREE.ConeGeometry(0.06, 0.14, 6)), birdMat)
    bird.position.set(0.32, 0.94, 0)
    bird.rotation.z = -0.35
    scBb.add(bird)
    scBb.position.set(scCenter.x - scCenter.radius - 1.2, 0, scCenter.z + 1.5)
    sanctuaryGroup.add(scBb)
  }

  // Tier 2 (75 waterings): 40 Bioluminescent Emerald Fireflies over Sanctuary Circle
  if (unlockedFeatures.has('fireflies')) {
    const ffCount = 40
    sanctuaryFireflyPositions = new Float32Array(ffCount * 3)
    const ffRng = gardenRng(75)
    for (let i = 0; i < ffCount; i++) {
      const a = ffRng() * Math.PI * 2
      const r = ffRng() * (scCenter.radius * 0.92)
      sanctuaryFireflyPositions[i * 3] = scCenter.x + Math.cos(a) * r
      sanctuaryFireflyPositions[i * 3 + 1] = 0.45 + ffRng() * 2.2
      sanctuaryFireflyPositions[i * 3 + 2] = scCenter.z + Math.sin(a) * r
    }
    const ffGeo = track(new THREE.BufferGeometry())
    ffGeo.setAttribute('position', new THREE.BufferAttribute(sanctuaryFireflyPositions, 3))
    const ffMat = track(
      new THREE.PointsMaterial({
        color: '#34d399',
        size: 0.14,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      }),
    )
    sanctuaryFireflies = new THREE.Points(ffGeo, ffMat)
    sanctuaryGroup.add(sanctuaryFireflies)
  }

  // Tier 3 (150 waterings): Ancient Grandfather Sakura Tree at (0, -32.2)
  if (unlockedFeatures.has('sakura_tree')) {
    const sakuraGroup = new THREE.Group()
    sakuraGroup.name = 'grove:sakura_tree'
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: '#432818', roughness: 0.88 }))
    const sakuraBlossomMat = track(
      new THREE.MeshStandardMaterial({
        color: '#fbcfe8',
        emissive: '#f472b6',
        emissiveIntensity: 0.48,
        roughness: 0.45,
      }),
    )
    const trunk = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42, 0.72, 4.2, 10)), trunkMat)
    trunk.position.y = 2.1
    trunk.castShadow = true
    sakuraGroup.add(trunk)

    const canopyOffsets = [
      { x: 0, y: 4.8, z: 0, rx: 2.8, ry: 1.7, rz: 2.8 },
      { x: -1.6, y: 4.1, z: 0.8, rx: 1.9, ry: 1.3, rz: 1.9 },
      { x: 1.6, y: 4.2, z: 0.7, rx: 1.9, ry: 1.3, rz: 1.9 },
      { x: 0, y: 3.9, z: 1.6, rx: 2.0, ry: 1.2, rz: 1.8 },
      { x: 0, y: 5.7, z: -0.3, rx: 2.1, ry: 1.4, rz: 2.1 },
    ]
    const sakuraSphereGeo = track(new THREE.SphereGeometry(1, 12, 10))
    for (const co of canopyOffsets) {
      const lobe = new THREE.Mesh(sakuraSphereGeo, sakuraBlossomMat)
      lobe.scale.set(co.rx, co.ry, co.rz)
      lobe.position.set(co.x, co.y, co.z)
      lobe.castShadow = true
      sakuraGroup.add(lobe)
    }
    sakuraGroup.position.set(scCenter.x, 0, scCenter.z - scCenter.radius - 1.2)
    sanctuaryGroup.add(sakuraGroup)
  }

  // Tier 4 (300 waterings): Illuminated Starlight Fountain Jets in Central Basin
  if (unlockedFeatures.has('starlight_fountain')) {
    const fountainJetMat = track(
      new THREE.MeshStandardMaterial({
        color: '#bae6fd',
        emissive: '#38bdf8',
        emissiveIntensity: 1.15,
        transparent: true,
        opacity: 0.85,
        roughness: 0.15,
      }),
    )
    const centerSpire = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.18, 0.36, 1.85, 16)),
      fountainJetMat,
    )
    centerSpire.position.set(scCenter.x, 1.15, scCenter.z)
    sanctuaryGroup.add(centerSpire)

    const upperBowl = new THREE.Mesh(track(new THREE.CylinderGeometry(0.68, 0.25, 0.18, 16)), rockMat)
    upperBowl.position.set(scCenter.x, 1.25, scCenter.z)
    sanctuaryGroup.add(upperBowl)
  }

  // Tier 5 (500 waterings): Aurora Borealis Night Sky Ribbons
  if (unlockedFeatures.has('aurora')) {
    const auroraColors = ['#34d399', '#a855f7']
    auroraColors.forEach((col, idx) => {
      const aMat = track(
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      )
      const aGeo = track(new THREE.CylinderGeometry(68 + idx * 6, 72 + idx * 6, 14, 32, 1, true, Math.PI * 0.65, Math.PI * 0.7))
      const ribbon = new THREE.Mesh(aGeo, aMat)
      ribbon.position.set(0, 46 + idx * 6, -15)
      root.add(ribbon)
      auroraRibbons.push(ribbon)
    })
  }

  root.add(sanctuaryGroup)

  // ── Negative-Space Masking: Bed Filler Flora (Wild Clover & Ferns) ──────
  let fillerMat: THREE.MeshStandardMaterial | null = null
  if (!minecraftMode && world.fillerFlora && world.fillerFlora.length > 0) {
    const fillerGeo = track(new THREE.ConeGeometry(0.14, 0.22, 6))
    fillerMat = track(twilightSceneryMat(palette, palette.silSoft ?? '#3e6b3f', twilight, starAlpha, 0.92))
    const fillerInst = new THREE.InstancedMesh(fillerGeo, fillerMat, world.fillerFlora.length)
    const fDummy = new THREE.Object3D()
    world.fillerFlora.forEach((fl, i) => {
      fDummy.position.set(fl.x, 0.1, fl.z)
      fDummy.rotation.y = (i * 1.618) % (Math.PI * 2)
      fDummy.scale.setScalar(fl.scale)
      fDummy.updateMatrix()
      fillerInst.setMatrixAt(i, fDummy.matrix)
    })
    fillerInst.instanceMatrix.needsUpdate = true
    root.add(fillerInst)
  }

  // ── Garden Bonds: Twin Fireflies at Entrance Pergola ─────────────────
  let bondFireflies: THREE.Points | null = null
  let bondPositions: Float32Array | null = null
  if (world.hasGardenBonds) {
    const bCount = 2
    bondPositions = new Float32Array(bCount * 3)
    const bondGeo = track(new THREE.BufferGeometry())
    bondGeo.setAttribute('position', new THREE.BufferAttribute(bondPositions, 3))
    const bondMat = track(
      new THREE.PointsMaterial({
        color: '#fbbf24',
        size: 0.16,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    )
    bondFireflies = new THREE.Points(bondGeo, bondMat)
    root.add(bondFireflies)
  }

  // ── Garden Shed ────────────────────────────────────────────────────────
  const roof = track(new THREE.MeshStandardMaterial({ color: palette.sil, roughness: 0.7 }))
  const shed = new THREE.Group()
  const body = new THREE.Mesh(track(new THREE.BoxGeometry(world.shed.width, 2.4, world.shed.depth)), wood)
  body.position.y = 1.2
  body.castShadow = true
  shed.add(body)
  const roofMesh = new THREE.Mesh(
    track(new THREE.ConeGeometry(Math.max(world.shed.width, world.shed.depth) * 0.72, 1.1, 4)),
    roof,
  )
  roofMesh.position.y = 2.85
  roofMesh.rotation.y = Math.PI / 4
  shed.add(roofMesh)
  shed.position.set(world.shed.x, 0, world.shed.z)
  shed.rotation.y = world.shed.yaw
  if (!walkCaptureDecor) root.add(shed)

  // ── Perimeter Fence & Gate ──────────────────────────────────────────────
  const hedgeMat = track(
    twilightSceneryMat(palette, palette.hills[2] ?? palette.silSoft ?? palette.sil, twilight, starAlpha, 0.9),
  )
  if (!walkCaptureDecor) {
  const postGeo = track(new THREE.BoxGeometry(0.28, 1.35, 0.28))
  const railGeo = track(new THREE.BoxGeometry(1, 0.12, 0.1))
  const fencePostMat = minecraftMode ? wood : hedgeMat
  const addFence = (ax: number, az: number, bx: number, bz: number) => {
    const dist = Math.hypot(bx - ax, bz - az)
    const posts = Math.max(2, Math.round(dist / 2.1))
    for (let i = 0; i <= posts; i++) {
      const t = i / posts
      const x = ax + (bx - ax) * t
      const z = az + (bz - az) * t
      const gateGap = Math.abs(x) < 2.4 && Math.abs(z - world.gate.z) < 1.2
      if (gateGap) continue
      const post = new THREE.Mesh(postGeo, fencePostMat)
      post.position.set(x, 0.67, z)
      root.add(post)
      if (i < posts) {
        const rail = new THREE.Mesh(railGeo, wood)
        rail.position.set(x + (bx - ax) / posts / 2, 0.85, z + (bz - az) / posts / 2)
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
  }

  // ── Distant Hills ───────────────────────────────────────────────────────
  const hillColor = palette.hills[1] ?? palette.hills[0] ?? palette.silSoft
  const hillMat = track(
    new THREE.MeshStandardMaterial({
      color: hillColor,
      roughness: 0.94,
      emissive: twilight ? (palette.hills[0] ?? palette.silSoft) : '#000000',
      emissiveIntensity: twilight ? 0.14 + starAlpha * 0.08 : 0,
    }),
  )
  const hillGeo = track(new THREE.SphereGeometry(1, 10, 8))
  const hills = [
    { x: -32, z: -44, s: 18 },
    { x: 8, z: -48, s: 22 },
    { x: 36, z: -40, s: 16 },
    { x: -40, z: 12, s: 15 },
    { x: 42, z: 18, s: 17 },
  ]
  if (!minecraftMode) {
    for (const h of hills) {
      const mesh = new THREE.Mesh(hillGeo, hillMat)
      mesh.scale.set(h.s, h.s * 0.42, h.s * 0.85)
      mesh.position.set(h.x, -1.2, h.z)
      root.add(mesh)
    }
  }

  // ── Grass Tufts ─────────────────────────────────────────────────────────
  if (!minecraftMode && !reducedMotion) {
    const tuftGeo = track(new THREE.ConeGeometry(0.07, 0.28, 5))
    const tuftMat = track(new THREE.MeshStandardMaterial({ color: palette.hills[0] ?? '#4e2749', roughness: 1 }))
    const count = 480
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

  // ── Celestial Sphere & Stylized Floating Clouds ──────────────────────────
  const skyTex = track(skyTexture(palette))
  const skyMat = track(new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false }))
  const sky = new THREE.Mesh(track(new THREE.SphereGeometry(180, 16, 12)), skyMat)
  root.add(sky)

  // Celestial Body (Sun or Moon)
  const celestialMat = track(
    new THREE.MeshBasicMaterial({
      color: isNight ? '#e2ecf8' : (palette.sun?.disk ?? '#ffe7a0'),
    }),
  )
  const celestialMesh = new THREE.Mesh(track(new THREE.SphereGeometry(isNight ? 3.8 : 4.6, 16, 16)), celestialMat)
  if (isNight) {
    celestialMesh.position.set(-18, 52, -75)
  } else {
    celestialMesh.position.set(24, 60, -78)
  }
  root.add(celestialMesh)

  // Floating Low-Poly Clouds
  const clouds: { group: THREE.Group; speed: number; startX: number }[] = []
  const cloudMat = track(
    new THREE.MeshStandardMaterial({
      color: isNight ? '#3a2d52' : '#f8f4f9',
      roughness: 0.9,
      transparent: true,
      opacity: isNight ? 0.45 : 0.75,
    }),
  )
  const cloudSphereGeo = track(new THREE.SphereGeometry(1, 8, 8))

  const cloudConfigs = [
    { x: -50, y: 55, z: -60, s: 6, speed: 0.4 },
    { x: 10, y: 62, z: -70, s: 7.5, speed: 0.35 },
    { x: 55, y: 58, z: -55, s: 6.5, speed: 0.45 },
    { x: -25, y: 65, z: -45, s: 8, speed: 0.3 },
    { x: 35, y: 52, z: -65, s: 7, speed: 0.38 },
  ]

  cloudConfigs.forEach((cfg) => {
    const cGroup = new THREE.Group()
    // Multi-puff cumulus shape
    const puffs = [
      { x: 0, y: 0, z: 0, s: 1.0 },
      { x: -0.7, y: -0.15, z: 0.1, s: 0.75 },
      { x: 0.7, y: -0.12, z: -0.1, s: 0.8 },
      { x: -1.3, y: -0.3, z: 0, s: 0.55 },
      { x: 1.25, y: -0.28, z: 0, s: 0.6 },
    ]
    puffs.forEach((p) => {
      const puff = new THREE.Mesh(cloudSphereGeo, cloudMat)
      puff.scale.set(p.s * cfg.s * 1.4, p.s * cfg.s * 0.75, p.s * cfg.s * 1.1)
      puff.position.set(p.x * cfg.s, p.y * cfg.s, p.z * cfg.s)
      cGroup.add(puff)
    })
    cGroup.position.set(cfg.x, cfg.y, cfg.z)
    root.add(cGroup)
    clouds.push({ group: cGroup, speed: cfg.speed, startX: cfg.x })
  })

  const fogColor = hexColor(palette.sky[2] ?? palette.bank)

  return {
    root,
    ground,
    water,
    sky,
    fogColor,
    tick: (time: number, dt: number) => {
      if (reducedMotion) return

      // Floating candle boats bobbing & drifting on the water
      candleBoats.forEach((boat) => {
        const bob = Math.sin(time * 0.0022 + boat.phase) * 0.012
        boat.group.position.y = boat.baseY + bob
        boat.group.rotation.z = Math.sin(time * 0.0018 + boat.phase) * 0.035
        boat.group.rotation.x = Math.cos(time * 0.0015 + boat.phase) * 0.025
      })

      // Clouds gently drifting across the garden sky
      clouds.forEach((c) => {
        c.group.position.x += dt * c.speed
        if (c.group.position.x > 95) {
          c.group.position.x = -95
        }
      })

      // Twin Fireflies of Friendship orbiting near entrance pergola
      if (bondFireflies && bondPositions) {
        const t = time * 0.0024
        const gateZ = world.gate.z - 2.8
        // Firefly 1
        bondPositions[0] = Math.cos(t) * 0.48
        bondPositions[1] = 2.15 + Math.sin(t * 1.6) * 0.2
        bondPositions[2] = gateZ + Math.sin(t) * 0.48

        // Firefly 2 (intertwined harmonic orbit)
        bondPositions[3] = Math.cos(t + Math.PI) * 0.48
        bondPositions[4] = 2.15 + Math.sin((t + Math.PI) * 1.6) * 0.2
        bondPositions[5] = gateZ + Math.sin(t + Math.PI) * 0.48

        bondFireflies.geometry.attributes.position.needsUpdate = true
      }

      // Sanctuary Circle firefly swarm gentle vertical oscillation
      if (sanctuaryFireflies && sanctuaryFireflyPositions) {
        const sCount = sanctuaryFireflyPositions.length / 3
        for (let i = 0; i < sCount; i++) {
          sanctuaryFireflyPositions[i * 3 + 1] += Math.sin(time * 0.002 + i * 0.7) * 0.003
        }
        sanctuaryFireflies.geometry.attributes.position.needsUpdate = true
      }

      // Aurora Borealis slow celestial drift
      auroraRibbons.forEach((rib, idx) => {
        rib.rotation.y = Math.sin(time * 0.0004 + idx) * 0.12
      })
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose())
    },
    recolor: (next) => {
      const star = next.starAlpha ?? 0
      const nextNight = star > 0.45
      const twilight = star > 0.22
      const ground = new THREE.Color(next.hills[1] ?? '#2c163c')
      if (twilight) {
        ground.lerp(new THREE.Color(next.hills[0] ?? next.silSoft), 0.55 + star * 0.28)
        ground.lerp(new THREE.Color(next.bank), 0.12)
      }
      groundMat.color.copy(ground)
      if (groundMat instanceof THREE.MeshStandardMaterial) {
        if (twilight) {
          groundMat.emissive.set(next.hills[0] ?? next.glow ?? next.silSoft)
          groundMat.emissiveIntensity = 0.24 + star * 0.24
          groundMat.roughness = 0.86
        } else {
          groundMat.emissive.set('#000000')
          groundMat.emissiveIntensity = 0
          groundMat.roughness = 0.95
        }
      }
      waterMat.color.set(next.waterTint[1] ?? '#1a0f2b')
      waterMat.emissive.set(next.ripple)
      const nextHill = next.hills[1] ?? next.hills[0] ?? next.silSoft
      hillMat.color.set(nextHill)
      if (twilight) {
        hillMat.emissive.set(next.hills[0] ?? next.silSoft)
        hillMat.emissiveIntensity = 0.12 + star * 0.1
      } else {
        hillMat.emissive.set('#000000')
        hillMat.emissiveIntensity = 0
      }
      soilBermMat.color.set(next.hills[0] ?? '#3a1f33')
      steppingStoneMat.color.set(next.bank)
      const nextTwilight = star > 0.22
      const sceneryRock = twilightSceneryColor(next, next.bank, nextTwilight)
      rockMat.color.copy(sceneryRock)
      if (nextTwilight) {
        rockMat.emissive.set(next.hills[0] ?? next.glow ?? next.silSoft)
        rockMat.emissiveIntensity = 0.14 + star * 0.16
      } else {
        rockMat.emissive.set('#000000')
        rockMat.emissiveIntensity = 0
      }
      hedgeMat.color.copy(twilightSceneryColor(next, next.hills[2] ?? next.silSoft ?? next.sil, nextTwilight))
      if (nextTwilight) {
        hedgeMat.emissive.set(next.hills[0] ?? next.glow ?? next.silSoft)
        hedgeMat.emissiveIntensity = 0.14 + star * 0.16
      } else {
        hedgeMat.emissive.set('#000000')
        hedgeMat.emissiveIntensity = 0
      }
      if (fillerMat) {
        fillerMat.color.copy(twilightSceneryColor(next, next.silSoft ?? '#3e6b3f', nextTwilight))
        if (nextTwilight) {
          fillerMat.emissive.set(next.hills[0] ?? next.glow ?? next.silSoft)
          fillerMat.emissiveIntensity = 0.14 + star * 0.16
        } else {
          fillerMat.emissive.set('#000000')
          fillerMat.emissiveIntensity = 0
        }
      }
      ivyLeafMat.color.set(next.silSoft)
      lilyPadMat.color.set(next.silSoft)
      candleFlameMat.emissive.set(next.glow ?? '#ffd700')
      lanternGlassMat.color.set(next.glow)
      lanternGlassMat.emissive.set(next.glow)
      lanternGlassMat.emissiveIntensity = nextNight ? 1.4 : 0.4
      celestialMat.color.set(nextNight ? '#e2ecf8' : (next.sun?.disk ?? '#ffe7a0'))
      cloudMat.color.set(nextNight ? '#3a2d52' : '#f8f4f9')
      cloudMat.opacity = nextNight ? 0.45 : 0.75
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
