import * as THREE from 'three'
import type { ArtStyle, Memory } from '@/lib/types'
import { resolvePlantArtStyle } from '@/lib/garden/plant-art-style'
import { isWalkCaptureSession, type WalkCapturePose } from '@/lib/open-world/walk-capture-bridge'
import type { ScenePalette } from '@/lib/garden/palettes'
import { EYE_HEIGHT, LOOK_SENSITIVITY } from '@/lib/open-world/constants'
import { isTypingTarget, mergeMotion, motionFromKeys, type Stick } from '@/lib/open-world/input'
import { layoutGardenWorld } from '@/lib/open-world/layout'
import { createPlayer, eyeOffset, findNearestPlant, stepPlayer } from '@/lib/open-world/locomotion'
import { plantRecipe } from '@/lib/open-world/plant-visual'
import type { GardenWorld, PlayerState, WorldPlant } from '@/lib/open-world/types'
import {
  applyVoxelPlantNightTint,
  applyWatercolorWalkTint,
  setWalkSurfaceHeightSampler,
  snapPlantGroupToTerrain,
  walkCaptureGroundY,
} from './minecraft-visual'
import { createPlantGroup, disposePlantGroup } from './plant-mesh'
import { buildTerrain, type TerrainHandle } from './terrain'
import type { Cc0ModelId } from '@/lib/open-world/cc0-catalog'
import { Cc0SceneryLayer, defaultCc0GardenSeed } from './cc0-scenery'
import { playWaterSfx } from '@/lib/water-sound'

export interface EngineHooks {
  onProximity: (plant: WorldPlant | null) => void
  onPlayer: (player: PlayerState, locked: boolean) => void
  onInteract: (plant: WorldPlant) => void
  onWater?: (plant: WorldPlant) => void
  onPondInteract?: () => void
}

interface WaterArc {
  points: THREE.Points
  positions: Float32Array
  startT: number
  duration: number
  from: THREE.Vector3
  to: THREE.Vector3
  plantId: string
}

export class OpenWorldEngine {
  failed = false
  private renderer: THREE.WebGLRenderer | null = null
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(68, 1, 0.08, 220)
  private readonly hemi = new THREE.HemisphereLight('#88aacc', '#2a1a18', 0.85)
  private readonly sun = new THREE.DirectionalLight('#fff4d8', 1.15)
  private readonly fill = new THREE.AmbientLight('#1a1220', 0.22)
  private readonly rim = new THREE.DirectionalLight('#ffcf9a', 0.35)
  private world: GardenWorld
  private player: PlayerState
  private terrain: TerrainHandle | null = null
  private readonly plantsRoot = new THREE.Group()
  private readonly plantGroups = new Map<string, THREE.Group>()
  private fireflies: THREE.Points | null = null
  private fireflyShift = 0
  private readonly keys = new Set<string>()
  private stick: Stick | null = null
  private yawAcc = 0
  private pitchAcc = 0
  private raf = 0
  private lastT = 0
  private paused = false
  private reducedMotion: boolean
  private palette: ScenePalette
  private highlighted: Set<string> | null = null
  private growing = new Set<string>()
  private nearby: WorldPlant | null = null
  private interactArmed = true
  private waterArmed = true
  private wateringArcs: WaterArc[] = []
  private playerNotifyAt = 0
  private readonly canvas: HTMLCanvasElement
  private readonly hooks: EngineHooks
  private readonly onKeyDown: (e: KeyboardEvent) => void
  private readonly onKeyUp: (e: KeyboardEvent) => void
  private readonly onMouseMove: (e: MouseEvent) => void
  private readonly onPointerLockChange: () => void
  private readonly onResize: () => void
  private resizeObserver: ResizeObserver | null = null

  private cc0Scenery: Cc0SceneryLayer | null = null
  private captureBackdrop = false
  private soloCapturePlantId: string | null = null
  private plantArtStyle: ArtStyle
  private framesRendered = 0

  constructor(
    canvas: HTMLCanvasElement,
    memories: Memory[],
    palette: ScenePalette,
    opts: {
      reducedMotion: boolean
      coarsePointer?: boolean
      hooks: EngineHooks
      plantArtStyle?: ArtStyle
    },
  ) {
    this.canvas = canvas
    this.hooks = opts.hooks
    this.reducedMotion = opts.reducedMotion
    this.plantArtStyle = resolvePlantArtStyle(opts.plantArtStyle)
    this.palette = palette
    this.world = layoutGardenWorld(memories)
    this.player = createPlayer(this.world)

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: this.plantArtStyle !== 'pixel-art',
        alpha: false,
        powerPreference: 'high-performance',
      })
    } catch {
      this.failed = true
      this.onKeyDown = () => undefined
      this.onKeyUp = () => undefined
      this.onMouseMove = () => undefined
      this.onPointerLockChange = () => undefined
      this.onResize = () => undefined
      return
    }

    const renderer = this.renderer
    renderer.setPixelRatio(
      this.plantArtStyle === 'pixel-art' ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    )
    renderer.setClearColor(palette.sky[2] ?? '#20123a', 1)
    renderer.shadowMap.enabled = !opts.reducedMotion
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace

    this.scene.fog = new THREE.Fog(palette.sky[2] ?? '#20123a', 18, 78)
    this.sun.castShadow = !opts.reducedMotion
    this.sun.shadow.mapSize.set(1024, 1024)
    this.sun.shadow.camera.near = 1
    this.sun.shadow.camera.far = 90
    this.sun.shadow.camera.left = -40
    this.sun.shadow.camera.right = 40
    this.sun.shadow.camera.top = 40
    this.sun.shadow.camera.bottom = -40
    this.rim.castShadow = false
    this.scene.add(this.hemi, this.sun, this.fill, this.rim, this.plantsRoot)

    this.rebuildTerrain()
    this.rebuildPlants()
    const skipCc0 =
      typeof window !== 'undefined' &&
      (isWalkCaptureSession() ||
        sessionStorage.getItem('mg:walk-capture-baseline') === '1' ||
        sessionStorage.getItem('mg:stage-row-capture') === '1' ||
        sessionStorage.getItem('mg:walk-plant-focus') === '1' ||
        this.plantArtStyle === 'pixel-art')
    if (!this.failed && !skipCc0) {
      this.cc0Scenery = new Cc0SceneryLayer(this.scene, this.world, this.palette, {
        reducedMotion: opts.reducedMotion,
        coarsePointer: opts.coarsePointer ?? false,
        gardenSeed: defaultCc0GardenSeed(memories),
        onReady: () => {
          if (typeof window !== 'undefined') {
            ;(window as unknown as { __cc0SceneryReady?: boolean }).__cc0SceneryReady = true
          }
        },
      })
    }
    this.applyLighting()
    this.applyRendererExposure()
    this.spawnFireflies()
    this.applyCamera()
    this.resize()

    this.onKeyDown = (e) => {
      if (this.paused || isTypingTarget(e.target)) return
      this.keys.add(e.code)
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'KeyQ'].includes(e.code)) {
        e.preventDefault()
      }
      if (e.code === 'KeyQ' && this.waterArmed && this.nearby) {
        this.waterArmed = false
        this.hooks.onWater?.(this.nearby)
      }
    }
    this.onKeyUp = (e) => {
      this.keys.delete(e.code)
      if (e.code === 'KeyE' || e.code === 'Enter') this.interactArmed = true
      if (e.code === 'KeyQ') this.waterArmed = true
    }
    this.onMouseMove = (e) => {
      if (document.pointerLockElement !== this.canvas) return
      this.yawAcc -= e.movementX * LOOK_SENSITIVITY
      this.pitchAcc -= e.movementY * LOOK_SENSITIVITY
    }
    this.onPointerLockChange = () => {
      this.hooks.onPlayer(this.player, this.isLocked())
    }
    this.onResize = () => this.resize()

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
    window.addEventListener('resize', this.onResize)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas.parentElement ?? canvas)

    this.raf = requestAnimationFrame(this.tick)
  }

  isLocked(): boolean {
    return document.pointerLockElement === this.canvas
  }

  requestLock(): void {
    if (this.failed) return
    void this.canvas.requestPointerLock()
  }

  exitLock(): void {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock()
  }

  setPaused(paused: boolean): void {
    this.paused = paused
    if (paused) this.exitLock()
  }

  setStick(stick: Stick | null): void {
    this.stick = stick
  }

  addLook(dx: number, dy: number): void {
    this.yawAcc -= dx * LOOK_SENSITIVITY * 1.15
    this.pitchAcc -= dy * LOOK_SENSITIVITY * 1.15
  }

  setHighlighted(ids: Set<string> | null): void {
    this.highlighted = ids
    this.applyHighlight()
  }

  setGrowing(ids: Set<string>): void {
    this.growing = ids
  }

  setPlantArtStyle(style: ArtStyle | undefined): void {
    const next = resolvePlantArtStyle(style)
    if (next === this.plantArtStyle) return
    this.plantArtStyle = next
    this.applyLighting()
    if (next === 'pixel-art' && this.cc0Scenery) {
      this.cc0Scenery.dispose()
      this.cc0Scenery = null
    }
    this.rebuildTerrain()
    this.rebuildPlants()
  }

  setPalette(palette: ScenePalette): void {
    this.palette = palette
    this.terrain?.recolor(palette)
    if (this.plantArtStyle === 'pixel-art' && this.terrain) {
      applyVoxelPlantNightTint(this.terrain.root, palette)
    }
    this.cc0Scenery?.setPalette(palette)
    this.applyLighting()
    this.renderer?.setClearColor(palette.sky[2] ?? '#20123a', 1)
    if (this.scene.fog instanceof THREE.Fog) {
      const fogColor = new THREE.Color(palette.sky[2] ?? '#20123a')
      const star = palette.starAlpha ?? 0
      if (star > 0.22) fogColor.lerp(new THREE.Color(palette.hills[1] ?? palette.bank), 0.28)
      this.scene.fog.color.copy(fogColor)
      if (star > 0.35 && !this.captureBackdrop) {
        fogColor.lerp(new THREE.Color(palette.sky[3] ?? palette.hills[1] ?? palette.bank), 0.42)
        this.scene.fog.near = 16
        this.scene.fog.far = 88
      } else if (!this.captureBackdrop) {
        this.scene.fog.near = 20
        this.scene.fog.far = 82
      }
    }
    if (this.captureBackdrop) this.applyCaptureFog()
    this.applyRendererExposure()
    this.rebuildPlants()
  }

  private applyRendererExposure(): void {
    if (!this.renderer) return
    const star = this.palette.starAlpha ?? 0
    if (star > 0.22) {
      this.renderer.toneMappingExposure = 1.18 + star * 0.42
    } else {
      this.renderer.toneMappingExposure = 1.02
    }
  }

  setMemories(memories: Memory[]): void {
    const next = layoutGardenWorld(memories)
    this.world = next
    this.rebuildPlants()
    this.cc0Scenery?.setWorld(next)
    if (positionNeedsReset(this.player, next) && !isWalkCaptureSession()) {
      this.player = createPlayer(next)
    }
  }

  getWorld(): GardenWorld {
    return this.world
  }

  countVoxelMeshes(): number {
    let n = 0
    this.plantsRoot.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.userData.voxel) n++
    })
    return n
  }

  countVoxelPlantGroups(): number {
    let n = 0
    for (const group of this.plantGroups.values()) {
      if (group.userData.voxelPlant) n++
    }
    return n
  }

  getPlayer(): PlayerState {
    return this.player
  }

  setPlayerPose(x: number, z: number, yaw: number, pitch: number, eyeY?: number): void {
    this.player.x = x
    this.player.z = z
    this.player.yaw = yaw
    this.player.pitch = pitch
    if (eyeY !== undefined) this.player.y = eyeY
    this.applyCamera()
    if (isWalkCaptureSession()) {
      this.renderOnce()
    }
  }

  private findPlantGroup(plantId: string): THREE.Group | null {
    const direct = this.plantGroups.get(plantId)
    if (direct) return direct
    for (const group of this.plantGroups.values()) {
      if (group.userData.memoryId === plantId || group.name === `plant:${plantId}`) {
        return group
      }
    }
    let found: THREE.Group | null = null
    this.plantsRoot.traverse((obj) => {
      if (found) return
      if (obj instanceof THREE.Group && (obj.userData.memoryId === plantId || obj.name === `plant:${plantId}`)) {
        found = obj
      }
    })
    return found
  }

  private plantWorldBox(plantId: string): THREE.Box3 | null {
    const group = this.findPlantGroup(plantId)
    if (!group) return null
    group.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(group)
    return box.isEmpty() ? null : box
  }

  hasPlantGroup(plantId: string): boolean {
    return this.findPlantGroup(plantId) !== null
  }

  setSoloPlantFocus(plantId: string | null): void {
    this.soloCapturePlantId = plantId
    this.rebuildPlants()
    this.renderOnce()
  }

  plantBoxSize(plantId: string): { x: number; y: number; z: number } | null {
    const box = this.plantWorldBox(plantId)
    if (!box) return null
    const size = box.getSize(new THREE.Vector3())
    return { x: size.x, y: size.y, z: size.z }
  }

  plantCaptureFitAt(
    plantId: string,
    pose: WalkCapturePose,
  ): { frac: number; centerX: number; centerY: number } | null {
    const box = this.plantWorldBox(plantId)
    if (!box) return null
    const saved = { ...this.player }
    this.setPlayerPose(pose.x, pose.z, pose.yaw, pose.pitch, pose.eyeY)
    this.renderOnce()
    const fit = this.plantCaptureFit(box)
    this.player.x = saved.x
    this.player.z = saved.z
    this.player.y = saved.y
    this.player.yaw = saved.yaw
    this.player.pitch = saved.pitch
    this.applyCamera()
    return fit
  }

  plantCaptureFitNow(plantId: string): { frac: number; centerX: number; centerY: number } | null {
    const box = this.plantWorldBox(plantId)
    if (!box) return null
    this.renderOnce()
    return this.plantCaptureFit(box)
  }

  plantScreenCoverage(plantId: string, pose?: WalkCapturePose): number {
    const box = this.plantWorldBox(plantId)
    if (!box) return 0
    if (pose) {
      return this.withCapturePose(pose, () => this.screenHeightFraction(box))
    }
    this.renderOnce()
    return this.screenHeightFraction(box)
  }

  private projectBoxCenter(box: THREE.Box3): THREE.Vector3 {
    const center = box.getCenter(new THREE.Vector3())
    return center.clone().project(this.camera)
  }

  private screenHeightFraction(box: THREE.Box3): number {
    const { min, max } = box
    const cx = (min.x + max.x) / 2
    const cz = (min.z + max.z) / 2
    const samples = [
      [cx, min.y, cz],
      [cx, max.y, cz],
      [min.x, min.y, min.z],
      [max.x, max.y, max.z],
      [min.x, max.y, max.z],
      [max.x, min.y, min.z],
    ]
    let minNdcY = Infinity
    let maxNdcY = -Infinity
    for (const [x, y, z] of samples) {
      const p = new THREE.Vector3(x, y, z).project(this.camera)
      if (p.z < -1 || p.z > 1) continue
      minNdcY = Math.min(minNdcY, p.y)
      maxNdcY = Math.max(maxNdcY, p.y)
    }
    if (!Number.isFinite(minNdcY)) return 0
    return Math.min(0.92, (maxNdcY - minNdcY) / 2)
  }

  private plantCaptureFit(box: THREE.Box3): { frac: number; centerX: number; centerY: number } {
    const centerNdc = this.projectBoxCenter(box)
    if (centerNdc.z < -1 || centerNdc.z > 1) {
      return { frac: 0, centerX: centerNdc.x, centerY: centerNdc.y }
    }
    if (Math.abs(centerNdc.x) > 0.92 || Math.abs(centerNdc.y) > 0.92) {
      return { frac: 0, centerX: centerNdc.x, centerY: centerNdc.y }
    }
    const frac = this.screenHeightFraction(box)
    return { frac, centerX: centerNdc.x, centerY: centerNdc.y }
  }

  private withCapturePose(pose: WalkCapturePose, fn: () => number): number {
    const saved = { ...this.player }
    this.setPlayerPose(pose.x, pose.z, pose.yaw, pose.pitch, pose.eyeY)
    this.renderOnce()
    const frac = fn()
    this.player.x = saved.x
    this.player.z = saved.z
    this.player.y = saved.y
    this.player.yaw = saved.yaw
    this.player.pitch = saved.pitch
    this.applyCamera()
    return frac
  }

  private isDescendantOf(obj: THREE.Object3D, ancestor: THREE.Object3D): boolean {
    let o: THREE.Object3D | null = obj
    while (o) {
      if (o === ancestor) return true
      o = o.parent
    }
    return false
  }

  private isTerrainHit(obj: THREE.Object3D): boolean {
    const root = this.terrain?.root
    return root ? this.isDescendantOf(obj, root) : false
  }

  private plantOccludedFrom(cam: THREE.Vector3, plantId: string, target: THREE.Vector3): boolean {
    const group = this.findPlantGroup(plantId)
    if (!group) return true
    const dir = target.clone().sub(cam)
    const dist = dir.length()
    if (dist < 0.01) return false
    dir.normalize()
    const ray = new THREE.Raycaster(cam, dir, 0.05, dist - 0.08)
    const hits = ray.intersectObjects(this.scene.children, true)
    for (const hit of hits) {
      if (this.isDescendantOf(hit.object, group)) return false
      if (this.isTerrainHit(hit.object)) continue
      return true
    }
    return false
  }

  getTerrainFootY(x: number, z: number): number {
    return this.terrainFootY(x, z)
  }

  private terrainFootY(x: number, z: number): number {
    if (this.plantArtStyle === 'pixel-art') return walkCaptureGroundY(x, z)
    return 0
  }

  private eyeHeightAt(x: number, z: number, clearance: number): number {
    return this.terrainFootY(x, z) + clearance
  }

  private poseLookAt(aim: THREE.Vector3, camPos: THREE.Vector3, eyeY: number): WalkCapturePose {
    this.camera.position.set(camPos.x, eyeY, camPos.z)
    this.camera.lookAt(aim)
    this.camera.rotation.order = 'YXZ'
    this.camera.updateMatrixWorld(true)
    this.camera.updateProjectionMatrix()
    return {
      x: camPos.x,
      z: camPos.z,
      yaw: this.camera.rotation.y,
      pitch: this.camera.rotation.x,
      eyeY,
    }
  }

  deterministicPlantCapturePose(plantId: string): WalkCapturePose | null {
    const box = this.plantWorldBox(plantId)
    const group = this.findPlantGroup(plantId)
    if (!box || !group) return null

  if (isWalkCaptureSession() && plantId.endsWith('-walk')) {
      const wp = this.world.plants.find((p) => p.id === plantId)
      const size = box.getSize(new THREE.Vector3())
      if (plantId.includes('tree')) {
        if (!wp) return null
        const elder = plantId.includes('elder')
        const ground = box.min.y
        const aimY = ground + size.y * 0.68
        const aim = new THREE.Vector3(wp.x, aimY, wp.z)
        const dist = elder ? 8.25 : 10.75
        const yaw = elder ? -0.68 : 2.05
        const camX = wp.x + Math.sin(yaw) * dist
        const camZ = wp.z + Math.cos(yaw) * dist
        const clearance = elder
          ? Math.min(size.y * 0.42, 4.2)
          : Math.min(size.y * 0.48, 4.5)
        const eyeY = this.eyeHeightAt(camX, camZ, clearance)
        return this.poseLookAt(aim, new THREE.Vector3(camX, eyeY, camZ), eyeY)
      }
      if (wp) {
        const ground = box.min.y
        if (plantId === 'sprout-walk') {
          const aim = new THREE.Vector3(wp.x, ground + size.y * 0.5, wp.z)
          const yaw = Math.PI / 4
          const targetFrac = 0.25
          let bestPose: WalkCapturePose | null = null
          let bestDelta = Infinity
          for (let pass = 0; pass < 18; pass++) {
            const dist = 0.55 + (pass / 17) * 2.4
            const camX = wp.x + Math.sin(yaw) * dist
            const camZ = wp.z + Math.cos(yaw) * dist
            const eyeY = this.eyeHeightAt(camX, camZ, 0.92)
            const pose = this.poseLookAt(aim, new THREE.Vector3(camX, eyeY, camZ), eyeY)
            const fit = this.plantCaptureFitAt(plantId, pose)
            const frac = fit?.frac ?? 0
            const centerPen =
              fit ? Math.abs(fit.centerX) + Math.abs(fit.centerY) : 2
            const delta = Math.abs(frac - targetFrac) + centerPen * 0.12
            if (Math.abs(frac - targetFrac) < 0.05 && centerPen < 0.35) return pose
            if (delta < bestDelta) {
              bestDelta = delta
              bestPose = pose
            }
          }
          return bestPose
        }
        if (wp.variety === 'mushroom') {
          const aim = new THREE.Vector3(wp.x, ground + 0.28, wp.z)
          const yaw = -0.55
          const dist = 2.75
          const camX = wp.x + Math.sin(yaw) * dist
          const camZ = wp.z + Math.cos(yaw) * dist
          const eyeY = this.eyeHeightAt(camX, camZ, 0.82)
          return this.poseLookAt(aim, new THREE.Vector3(camX, eyeY, camZ), eyeY)
        }
        if (wp.variety === 'flower') {
          const aimY = ground + 0.44
          const aim = new THREE.Vector3(wp.x, aimY, wp.z)
          const yaw = 0.65
          const dist = 2.55
          const camX = wp.x + Math.sin(yaw) * dist
          const camZ = wp.z + Math.cos(yaw) * dist
          const eyeY = this.eyeHeightAt(camX, camZ, 1.42)
          const pose = this.poseLookAt(aim, new THREE.Vector3(camX, eyeY, camZ), eyeY)
          this.camera.rotation.x = -0.42
          this.camera.updateProjectionMatrix()
          return { ...pose, pitch: -0.42 }
        }
        const aimY = ground + 0.42
        const aim = new THREE.Vector3(wp.x, aimY, wp.z)
        const yaw = -0.45
        const dist = 2.05
        const camX = wp.x + Math.sin(yaw) * dist
        const camZ = wp.z + Math.cos(yaw) * dist
        const eyeY = this.eyeHeightAt(camX, camZ, 1.05)
        return this.poseLookAt(aim, new THREE.Vector3(camX, eyeY, camZ), eyeY)
      }
    }

    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const c = sphere.center.clone()
    const size = box.getSize(new THREE.Vector3())
    const wp = this.world.plants.find((p) => p.id === plantId)
    const aim = c.clone()
    if (wp?.variety === 'tree') {
      aim.y = box.min.y + size.y * 0.62
    } else if (wp?.variety === 'mushroom') {
      aim.y = box.min.y + size.y * 0.48
    } else if (wp?.variety === 'flower') {
      aim.y = box.min.y + size.y * 0.55
    }
    let r = sphere.radius
    if (plantId.includes('sprout')) {
      r = Math.max(r, 0.25)
    }

    const fovRad = (this.camera.fov * Math.PI) / 180
    let standoff = (r / Math.sin(fovRad / 2)) * 1.15
    if (wp?.variety === 'tree') {
      standoff *= plantId.includes('elder') ? 1.3 : 1.15
    }
    const terrainY = box.min.y
    const baseDir = (() => {
      if (wp?.variety === 'flower') return new THREE.Vector3(-1, 0.4, 1)
      if (wp?.variety === 'mushroom') return new THREE.Vector3(0.85, 0.35, -1)
      if (wp?.variety === 'tree' && plantId.includes('elder')) return new THREE.Vector3(1, 0.35, 0.75)
      if (wp?.variety === 'tree') return new THREE.Vector3(0.7, 0.35, 1)
      return new THREE.Vector3(1, 0.35, 1)
    })().normalize()

    let best: (WalkCapturePose & { screenFrac?: number }) | null = null
    let bestFrac = -1
    let fallback: (WalkCapturePose & { screenFrac?: number }) | null = null
    let fallbackFrac = -1

    for (let step = 0; step < 8; step++) {
      const ang = step * (Math.PI / 4)
      const cos = Math.cos(ang)
      const sin = Math.sin(ang)
      const dir = new THREE.Vector3(
        baseDir.x * cos - baseDir.z * sin,
        baseDir.y,
        baseDir.x * sin + baseDir.z * cos,
      ).normalize()

      const camPos = c.clone().add(dir.multiplyScalar(standoff))
      const foot = this.terrainFootY(camPos.x, camPos.z)
      camPos.y = Math.max(camPos.y, foot + 0.5, terrainY + 0.5)

      const pose = this.poseLookAt(aim, camPos, camPos.y)
      const fit = this.plantCaptureFitAt(plantId, pose)
      const frac = fit?.frac ?? 0
      const centerPen = fit ? Math.min(1, Math.abs(fit.centerX) + Math.abs(fit.centerY)) : 1
      const score = frac * (1.15 - 0.35 * centerPen)
      const labeled = { ...pose, screenFrac: frac }

      if (score > fallbackFrac) {
        fallbackFrac = score
        fallback = labeled
      }

      if (this.plantOccludedFrom(camPos, plantId, aim)) continue
      if (score > bestFrac) {
        bestFrac = score
        best = labeled
      }
    }

    return best ?? fallback
  }

  capturePoseForPlant(plantId: string): WalkCapturePose | null {
    return this.deterministicPlantCapturePose(plantId)
  }


  captureClusterOverviewPose(): WalkCapturePose {
    const walkPlants = this.world.plants.filter(
      (p) => p.id.endsWith('-walk') || p.id.includes('walk-'),
    )
    const plants = walkPlants.length > 0 ? walkPlants : this.world.plants
    const cx = plants.reduce((s, p) => s + p.x, 0) / Math.max(1, plants.length)
    const cz = plants.reduce((s, p) => s + p.z, 0) / Math.max(1, plants.length)
    const aim = new THREE.Vector3(cx, 2.4, cz)
    const camX = cx + 11
    const camZ = cz + 15
    const eyeY = this.eyeHeightAt(camX, camZ, 5.2)
    const camPos = new THREE.Vector3(camX, eyeY, camZ)
    const aimY = this.terrainFootY(cx, cz) + 2.4
    return this.poseLookAt(new THREE.Vector3(cx, aimY, cz), camPos, eyeY)
  }

  setWalkCaptureBackdrop(active: boolean): void {
    if (this.captureBackdrop === active) return
    this.captureBackdrop = active
    this.plantsRoot.visible = !active
    if (this.terrain) {
      const children = this.terrain.root.children
      for (let i = 0; i < children.length; i++) {
        children[i].visible = !active || i === 0
      }
    }
    if (this.fireflies) this.fireflies.visible = !active && !this.reducedMotion
    if (active) this.applyCaptureFog()
    else if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.near = 18
      this.scene.fog.far = 78
    }
  }

  private applyCaptureFog(): void {
    if (!(this.scene.fog instanceof THREE.Fog)) return
    this.scene.fog.near = 8
    this.scene.fog.far = 52
  }

  async setCc0Showcase(modelId: Cc0ModelId | null): Promise<void> {
    this.setWalkCaptureBackdrop(modelId !== null)
    await this.cc0Scenery?.setShowcase(modelId)
    this.applyCamera()
  }

  renderOnce(): void {
    const renderer = this.renderer
    if (!renderer) return
    this.applyCamera()
    renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
    window.removeEventListener('resize', this.onResize)
    this.resizeObserver?.disconnect()
    this.exitLock()
    this.clearPlants()
    this.terrain?.dispose()
    this.cc0Scenery?.dispose()
    this.cc0Scenery = null
    for (const arc of this.wateringArcs) {
      this.scene.remove(arc.points)
      arc.points.geometry.dispose()
      if (arc.points.material instanceof THREE.Material) arc.points.material.dispose()
    }
    this.wateringArcs = []
    this.fireflies?.geometry.dispose()
    if (this.fireflies?.material instanceof THREE.Material) this.fireflies.material.dispose()
    this.renderer?.dispose()
    this.renderer = null
  }

  private tick = (time: number): void => {
    this.raf = requestAnimationFrame(this.tick)
    const renderer = this.renderer
    if (!renderer) return
    const dt = Math.min(0.05, (time - this.lastT) / 1000 || 0.016)
    this.lastT = time
    if (!this.paused) {
      const keys = motionFromKeys(this.keys)
      const motion = mergeMotion(keys, this.stick)
      this.player = stepPlayer(
        this.player,
        {
          forward: motion.forward,
          strafe: motion.strafe,
          yawDelta: this.yawAcc,
          pitchDelta: this.pitchAcc,
          turn: motion.turn,
          sprint: motion.sprint,
        },
        dt,
        this.world,
        this.reducedMotion,
      )
      if (this.plantArtStyle === 'pixel-art') {
        this.player.y = walkCaptureGroundY(this.player.x, this.player.z) + EYE_HEIGHT
      } else {
        this.player.y = EYE_HEIGHT
      }
      this.yawAcc = 0
      this.pitchAcc = 0
      this.applyCamera()
      this.pulseGrowing(time)
      this.swayPlants(time)
      this.terrain?.tick?.(time, dt)
      this.updateWateringArcs(time)
      this.driftFireflies(dt)
      const near = findNearestPlant(this.player.x, this.player.z, this.world.plants)
      if (near?.id !== this.nearby?.id) {
        this.nearby = near
        this.hooks.onProximity(near)
      }
      if (motion.interact && this.interactArmed) {
        if (near) {
          this.interactArmed = false
          this.hooks.onInteract(near)
        } else if (
          this.hooks.onPondInteract &&
          Math.hypot(this.player.x - this.world.pond.x, this.player.z - this.world.pond.z) <= 4.2
        ) {
          this.interactArmed = false
          this.hooks.onPondInteract()
        }
      }
      if (time - this.playerNotifyAt > 80) {
        this.playerNotifyAt = time
        this.hooks.onPlayer(this.player, this.isLocked())
      }
    }
    renderer.render(this.scene, this.camera)
    this.framesRendered++
  }

  sceneReady(): boolean {
    return !this.failed && this.framesRendered >= 4
  }

  refreshCanvasSize(): void {
    this.resize()
  }

  private applyCamera(): void {
    const bob = eyeOffset(this.player.bob, this.reducedMotion)
    this.camera.position.set(this.player.x, this.player.y + bob, this.player.z)
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.player.yaw
    this.camera.rotation.x = this.player.pitch
    this.camera.updateMatrixWorld(true)
    this.camera.updateProjectionMatrix()
  }

  private resize(): void {
    const renderer = this.renderer
    if (!renderer) return
    const parent = this.canvas.parentElement
    const w = Math.max(1, parent?.clientWidth ?? this.canvas.clientWidth)
    const h = Math.max(1, parent?.clientHeight ?? this.canvas.clientHeight)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }

  private rebuildTerrain(): void {
    if (this.terrain) {
      this.scene.remove(this.terrain.root)
      this.terrain.dispose()
    }
    const minecraftMode = this.plantArtStyle === 'pixel-art'
    this.terrain = buildTerrain(this.world, this.palette, this.reducedMotion, minecraftMode)
    this.scene.add(this.terrain.root)
    if (minecraftMode && this.terrain.surfaceY) {
      setWalkSurfaceHeightSampler(this.terrain.surfaceY)
      applyVoxelPlantNightTint(this.terrain.root, this.palette)
    } else {
      setWalkSurfaceHeightSampler(null)
    }
  }

  private rebuildPlants(): void {
    this.clearPlants()
    const style = this.plantArtStyle
    for (const plant of this.world.plants) {
      if (this.soloCapturePlantId && plant.id !== this.soloCapturePlantId) continue
      const recipe = plantRecipe(
        plant.variety,
        plant.stage,
        plant.tone,
        this.palette,
        plant.height,
        plant.isHybrid,
      )
      const group = createPlantGroup(plant, recipe, style)
      if (style === 'watercolor') {
        applyWatercolorWalkTint(group)
      }
      if (style === 'pixel-art') {
        snapPlantGroupToTerrain(group, walkCaptureGroundY(plant.x, plant.z))
        applyVoxelPlantNightTint(group, this.palette)
      }
      this.plantsRoot.add(group)
      this.plantGroups.set(plant.id, group)
    }
    this.applyHighlight()
  }

  private clearPlants(): void {
    for (const group of this.plantGroups.values()) {
      this.plantsRoot.remove(group)
      disposePlantGroup(group)
    }
    this.plantGroups.clear()
  }

  private applyHighlight(): void {
    const ids = this.highlighted
    for (const [id, group] of this.plantGroups) {
      const dim = ids !== null && !ids.has(id)
      group.traverse((obj: THREE.Object3D) => {
        if (
          obj instanceof THREE.Mesh &&
          (obj.material instanceof THREE.MeshStandardMaterial ||
            obj.material instanceof THREE.MeshLambertMaterial)
        ) {
          obj.material.opacity = dim ? 0.22 : 1
          obj.material.transparent = dim
        }
      })
    }
  }

  private pulseGrowing(time: number): void {
    const s = 1 + Math.sin(time / 280) * 0.06
    for (const [id, group] of this.plantGroups) {
      let scale = this.growing.has(id) && !this.reducedMotion ? s : 1
      if (group.userData.bounceUntil && group.userData.bounceUntil > time) {
        const remain = (group.userData.bounceUntil - time) / 450
        const bounce = Math.sin(remain * Math.PI * 3) * 0.14 * remain
        scale *= 1 + bounce
      }
      group.scale.setScalar(scale)
    }
  }

  waterPlantAnimation(plant: WorldPlant): void {
    playWaterSfx()
    const from = new THREE.Vector3(this.camera.position.x, this.camera.position.y - 0.2, this.camera.position.z)
    const to = new THREE.Vector3(plant.x, 0.05, plant.z)
    const count = 36
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = from.x
      positions[i * 3 + 1] = from.y
      positions[i * 3 + 2] = from.z
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: '#6ee7b7',
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
    const points = new THREE.Points(geo, mat)
    this.scene.add(points)
    this.wateringArcs.push({
      points,
      positions,
      startT: performance.now(),
      duration: 0.55,
      from,
      to,
      plantId: plant.id,
    })

    // Soil mound darkens to moist earth
    const group = this.plantGroups.get(plant.id)
    if (group) {
      group.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.ConeGeometry && obj.position.y <= 0.05) {
          if (obj.material instanceof THREE.MeshStandardMaterial) {
            obj.material.color.set('#160e0a')
            obj.material.roughness = 0.4
          }
        }
      })
    }
  }

  private updateWateringArcs(time: number): void {
    for (let i = this.wateringArcs.length - 1; i >= 0; i--) {
      const arc = this.wateringArcs[i]
      const elapsed = (time - arc.startT) / 1000
      const t = Math.min(1, elapsed / arc.duration)
      const count = arc.positions.length / 3

      for (let p = 0; p < count; p++) {
        const pT = Math.max(0, Math.min(1, t - (p / count) * 0.28))
        const x = arc.from.x + (arc.to.x - arc.from.x) * pT + Math.sin(p * 2.1) * (1 - pT) * 0.18
        const z = arc.from.z + (arc.to.z - arc.from.z) * pT + Math.cos(p * 2.7) * (1 - pT) * 0.18
        const y = arc.from.y + (arc.to.y - arc.from.y) * pT + Math.sin(pT * Math.PI) * 1.35
        arc.positions[p * 3] = x
        arc.positions[p * 3 + 1] = y
        arc.positions[p * 3 + 2] = z
      }
      arc.points.geometry.attributes.position.needsUpdate = true

      if (t >= 1) {
        // Turgor bounce on the plant
        const grp = this.plantGroups.get(arc.plantId)
        if (grp) {
          grp.userData.bounceUntil = time + 450
        }
        // Cleanup arc
        this.scene.remove(arc.points)
        arc.points.geometry.dispose()
        if (arc.points.material instanceof THREE.Material) arc.points.material.dispose()
        this.wateringArcs.splice(i, 1)
      }
    }
  }

  private swayPlants(time: number): void {
    if (this.reducedMotion) return
    const t = time * 0.0016
    for (const group of this.plantGroups.values()) {
      const phase = group.position.x * 0.4 + group.position.z * 0.3
      const swayZ = Math.sin(t * 1.6 + phase) * 0.035
      const swayX = Math.cos(t * 1.2 + phase * 0.8) * 0.025
      group.rotation.z = swayZ
      group.rotation.x = swayX
    }
  }

  private applyLighting(): void {
    if (this.plantArtStyle === 'pixel-art') {
      const star = this.palette.starAlpha ?? 0
      const night = star > 0.22
      if (!night) {
        this.hemi.color.set('#c8e8ff')
        this.hemi.groundColor.set('#6b9a48')
        this.hemi.intensity = 1.12
        this.fill.color.set('#e8f0ff')
        this.fill.intensity = 0.48
        this.sun.color.set('#fff8e8')
        this.sun.intensity = 0.92
        this.sun.position.set(18, 38, -14)
        this.rim.position.set(-12, 22, 18)
        this.rim.intensity = 0.06
      } else {
        const p = this.palette
        const skyWash = new THREE.Color(p.sky[3] ?? p.sky[2] ?? '#88aacc')
        this.hemi.color.set(p.sky[1] ?? '#88aacc').lerp(skyWash, 0.35)
        const groundColor = new THREE.Color(p.hills[1] ?? p.bank)
        groundColor.lerp(new THREE.Color(p.hills[0] ?? p.silSoft), 0.55 + star * 0.2)
        this.hemi.groundColor.copy(groundColor)
        this.hemi.intensity = 1.02 + star * 0.14
        this.fill.color.set(p.glow ?? '#c8b8e8')
        this.fill.intensity = 0.62 + star * 0.18
        this.sun.color.set(p.sun?.disk ?? p.glow ?? '#fff4d8')
        this.sun.intensity = 0.62 + star * 0.24
        this.rim.intensity = 0.28 + star * 0.2
        if (p.moon) {
          this.sun.position.set((p.moon.x / 1200 - 0.5) * 40, 18, -12)
          this.sun.color.set('#c9d8ea')
        }
      }
      return
    }
    const p = this.palette
    const star = p.starAlpha ?? 0
    const twilight = star > 0.22
    const deepNight = star > 0.45
    const skyWash = new THREE.Color(p.sky[3] ?? p.sky[2] ?? '#88aacc')
    this.hemi.color.set(p.sky[1] ?? '#88aacc').lerp(skyWash, twilight ? 0.35 : 0)
    const groundColor = new THREE.Color(p.hills[1] ?? p.bank)
    if (twilight) {
      groundColor.lerp(new THREE.Color(p.hills[0] ?? p.silSoft), 0.55 + star * 0.2)
    } else {
      groundColor.lerp(new THREE.Color(p.bank), 0.35)
    }
    this.hemi.groundColor.copy(groundColor)
    this.hemi.intensity = deepNight ? 1.05 : twilight ? 1.12 : 0.92
    this.fill.color.set(p.glow ?? p.silSoft)
    if (twilight) this.fill.color.lerp(new THREE.Color(p.sky[4] ?? p.sky[3] ?? p.glow), 0.28)
    this.fill.intensity = deepNight ? 0.62 : twilight ? 0.58 : 0.24
    this.sun.color.set(p.sun?.disk ?? p.glow)
    this.sun.intensity = deepNight ? 0.58 : twilight ? 0.95 : 1.18
    if (p.sun) {
      const u = p.sun.x / 1200 - 0.5
      const v = (470 - p.sun.y) / 400
      this.sun.position.set(u * 55, 8 + v * 36, -18)
      this.rim.position.set(-u * 42, 6 + v * 22, 24)
      this.rim.color.set(p.glow ?? '#ffd9a0')
      this.rim.intensity = twilight ? 0.42 + star * 0.25 : 0.18
    } else if (p.moon) {
      this.sun.position.set((p.moon.x / 1200 - 0.5) * 40, 18, -12)
      this.sun.color.set('#c9d8ea')
      this.rim.position.set(8, 14, 20)
      this.rim.intensity = 0.35
    } else {
      this.sun.position.set(12, 28, -10)
      this.rim.position.set(-10, 18, 22)
      this.rim.intensity = 0.2
    }
    if (this.fireflies) {
      this.fireflies.visible = !this.reducedMotion
      if (this.fireflies.material instanceof THREE.PointsMaterial) {
        this.fireflies.material.color.set(deepNight ? p.fire : (p.glow ?? '#ffdf9e'))
        this.fireflies.material.opacity = deepNight ? 0.85 : 0.45
      }
    }
  }

  private spawnFireflies(): void {
    const count = 72
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * 32
      positions[i * 3 + 1] = 0.35 + Math.random() * 2.6
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * 32
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const isNight = (this.palette.starAlpha ?? 0) > 0.45
    const mat = new THREE.PointsMaterial({
      color: isNight ? this.palette.fire : (this.palette.glow ?? '#ffdf9e'),
      size: 0.11,
      transparent: true,
      opacity: isNight ? 0.85 : 0.45,
      depthWrite: false,
    })
    this.fireflies = new THREE.Points(geo, mat)
    this.scene.add(this.fireflies)
  }

  private driftFireflies(dt: number): void {
    if (!this.fireflies || !this.fireflies.visible) return
    this.fireflyShift += dt
    const pos = this.fireflies.geometry.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const y = 0.6 + Math.sin(this.fireflyShift * 0.7 + i) * 0.35 + (i % 5) * 0.15
      pos.setY(i, y)
    }
    pos.needsUpdate = true
  }
}

function positionNeedsReset(player: PlayerState, world: GardenWorld): boolean {
  return (
    player.x < world.bounds.minX ||
    player.x > world.bounds.maxX ||
    player.z < world.bounds.minZ ||
    player.z > world.bounds.maxZ
  )
}
