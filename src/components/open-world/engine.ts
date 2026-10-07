import * as THREE from 'three'
import type { Memory } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { LOOK_SENSITIVITY } from '@/lib/open-world/constants'
import { isTypingTarget, mergeMotion, motionFromKeys, type Stick } from '@/lib/open-world/input'
import { layoutGardenWorld } from '@/lib/open-world/layout'
import { createPlayer, eyeOffset, findNearestPlant, stepPlayer } from '@/lib/open-world/locomotion'
import { plantRecipe } from '@/lib/open-world/plant-visual'
import type { GardenWorld, PlayerState, WorldPlant } from '@/lib/open-world/types'
import { createPlantGroup, disposePlantGroup } from './plant-mesh'
import { buildTerrain, type TerrainHandle } from './terrain'

export interface EngineHooks {
  onProximity: (plant: WorldPlant | null) => void
  onPlayer: (player: PlayerState, locked: boolean) => void
  onInteract: (plant: WorldPlant) => void
}

export class OpenWorldEngine {
  failed = false
  private renderer: THREE.WebGLRenderer | null = null
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(68, 1, 0.08, 220)
  private readonly hemi = new THREE.HemisphereLight('#88aacc', '#2a1a18', 0.85)
  private readonly sun = new THREE.DirectionalLight('#fff4d8', 1.15)
  private readonly fill = new THREE.AmbientLight('#1a1220', 0.22)
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
  private playerNotifyAt = 0
  private readonly canvas: HTMLCanvasElement
  private readonly hooks: EngineHooks
  private readonly onKeyDown: (e: KeyboardEvent) => void
  private readonly onKeyUp: (e: KeyboardEvent) => void
  private readonly onMouseMove: (e: MouseEvent) => void
  private readonly onPointerLockChange: () => void
  private readonly onResize: () => void
  private resizeObserver: ResizeObserver | null = null

  constructor(
    canvas: HTMLCanvasElement,
    memories: Memory[],
    palette: ScenePalette,
    opts: { reducedMotion: boolean; hooks: EngineHooks },
  ) {
    this.canvas = canvas
    this.hooks = opts.hooks
    this.reducedMotion = opts.reducedMotion
    this.palette = palette
    this.world = layoutGardenWorld(memories)
    this.player = createPlayer(this.world)

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
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
    this.scene.add(this.hemi, this.sun, this.fill, this.plantsRoot)

    this.rebuildTerrain()
    this.rebuildPlants()
    this.applyLighting()
    this.spawnFireflies()
    this.applyCamera()
    this.resize()

    this.onKeyDown = (e) => {
      if (this.paused || isTypingTarget(e.target)) return
      this.keys.add(e.code)
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE'].includes(e.code)) {
        e.preventDefault()
      }
    }
    this.onKeyUp = (e) => {
      this.keys.delete(e.code)
      if (e.code === 'KeyE' || e.code === 'Enter') this.interactArmed = true
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

  setPalette(palette: ScenePalette): void {
    this.palette = palette
    this.terrain?.recolor(palette)
    this.applyLighting()
    this.renderer?.setClearColor(palette.sky[2] ?? '#20123a', 1)
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.set(palette.sky[2] ?? '#20123a')
    }
  }

  setMemories(memories: Memory[]): void {
    const next = layoutGardenWorld(memories)
    this.world = next
    this.rebuildPlants()
    if (positionNeedsReset(this.player, next)) {
      this.player = createPlayer(next)
    }
  }

  getWorld(): GardenWorld {
    return this.world
  }

  getPlayer(): PlayerState {
    return this.player
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
      this.yawAcc = 0
      this.pitchAcc = 0
      this.applyCamera()
      this.pulseGrowing(time)
      this.driftFireflies(dt)
      const near = findNearestPlant(this.player.x, this.player.z, this.world.plants)
      if (near?.id !== this.nearby?.id) {
        this.nearby = near
        this.hooks.onProximity(near)
      }
      if (motion.interact && this.interactArmed && near) {
        this.interactArmed = false
        this.hooks.onInteract(near)
      }
      if (time - this.playerNotifyAt > 80) {
        this.playerNotifyAt = time
        this.hooks.onPlayer(this.player, this.isLocked())
      }
    }
    renderer.render(this.scene, this.camera)
  }

  private applyCamera(): void {
    const bob = eyeOffset(this.player.bob, this.reducedMotion)
    this.camera.position.set(this.player.x, this.player.y + bob, this.player.z)
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.player.yaw
    this.camera.rotation.x = this.player.pitch
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
    this.terrain = buildTerrain(this.world, this.palette, this.reducedMotion)
    this.scene.add(this.terrain.root)
  }

  private rebuildPlants(): void {
    this.clearPlants()
    for (const plant of this.world.plants) {
      const recipe = plantRecipe(
        plant.variety,
        plant.stage,
        plant.tone,
        this.palette,
        plant.height,
        plant.isHybrid,
      )
      const group = createPlantGroup(plant, recipe)
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
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
          obj.material.opacity = dim ? 0.22 : 1
          obj.material.transparent = dim
        }
      })
    }
  }

  private pulseGrowing(time: number): void {
    const s = 1 + Math.sin(time / 280) * 0.06
    for (const [id, group] of this.plantGroups) {
      const scale = this.growing.has(id) && !this.reducedMotion ? s : 1
      group.scale.setScalar(scale)
    }
  }

  private applyLighting(): void {
    const p = this.palette
    this.hemi.color.set(p.sky[1] ?? '#88aacc')
    this.hemi.groundColor.set(p.bank)
    const night = (p.starAlpha ?? 0) > 0.45
    this.hemi.intensity = night ? 0.35 : 0.9
    this.fill.color.set(p.silSoft)
    this.fill.intensity = night ? 0.12 : 0.22
    this.sun.color.set(p.sun?.disk ?? p.glow)
    this.sun.intensity = night ? 0.18 : 1.2
    if (p.sun) {
      const u = p.sun.x / 1200 - 0.5
      const v = (470 - p.sun.y) / 400
      this.sun.position.set(u * 55, 8 + v * 36, -18)
    } else if (p.moon) {
      this.sun.position.set((p.moon.x / 1200 - 0.5) * 40, 18, -12)
      this.sun.color.set('#c9d8ea')
    } else {
      this.sun.position.set(12, 28, -10)
    }
    if (this.fireflies) this.fireflies.visible = night && !this.reducedMotion
  }

  private spawnFireflies(): void {
    const count = 48
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * 28
      positions[i * 3 + 1] = 0.4 + Math.random() * 2.2
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * 28
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: this.palette.fire,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
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
