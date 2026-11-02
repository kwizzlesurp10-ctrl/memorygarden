import {
  EYE_HEIGHT,
  INTERACT_RADIUS,
  PITCH_MAX,
  PITCH_MIN,
  PLAYER_RADIUS,
  RUN_SPEED,
  TURN_SPEED,
  WALK_SPEED,
} from './constants'
import type { GardenWorld, LocomotionInput, PlayerState, WorldPlant } from './types'

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function createPlayer(world: GardenWorld): PlayerState {
  return {
    x: world.spawn.x,
    y: EYE_HEIGHT,
    z: world.spawn.z,
    yaw: world.spawn.yaw,
    pitch: -0.08,
    bob: 0,
  }
}

export function circleBlocked(
  x: number,
  z: number,
  radius: number,
  cx: number,
  cz: number,
  cr: number,
): boolean {
  const dx = x - cx
  const dz = z - cz
  const min = radius + cr
  return dx * dx + dz * dz < min * min
}

export function positionBlocked(
  x: number,
  z: number,
  world: GardenWorld,
  radius: number = PLAYER_RADIUS,
): boolean {
  const { bounds, pond, shed, plants } = world
  if (x - radius < bounds.minX + 0.35 || x + radius > bounds.maxX - 0.35) return true
  if (z - radius < bounds.minZ + 0.35 || z + radius > bounds.maxZ - 0.35) return true
  if (circleBlocked(x, z, radius, pond.x, pond.z, pond.radius * 0.92)) return true
  const shedR = Math.max(shed.width, shed.depth) * 0.55
  if (circleBlocked(x, z, radius, shed.x, shed.z, shedR)) return true
  for (const plant of plants) {
    const cr = plant.colliderRadius ?? plant.radius
    if (circleBlocked(x, z, radius, plant.x, plant.z, cr)) return true
  }
  return false
}

/**
 * Resolves any radial overlap between the player and nearby plant trunk colliders
 * (e.g., if a plant grows a stage in-place while the player stands beside it).
 */
export function resolveDepenetration(
  x: number,
  z: number,
  world: GardenWorld,
  radius: number = PLAYER_RADIUS,
): { x: number; z: number } {
  let outX = x
  let outZ = z
  for (const plant of world.plants) {
    const cr = plant.colliderRadius ?? plant.radius
    const min = radius + cr
    const dx = outX - plant.x
    const dz = outZ - plant.z
    const d = Math.hypot(dx, dz)
    if (d < min) {
      if (d < 1e-5) {
        outX = plant.x + min
      } else {
        const push = min - d + 0.01
        outX += (dx / d) * push
        outZ += (dz / d) * push
      }
    }
  }
  return { x: outX, z: outZ }
}

export function stepPlayer(
  player: PlayerState,
  input: LocomotionInput,
  dt: number,
  world: GardenWorld,
  reducedMotion = false,
): PlayerState {
  const t = Math.min(0.05, Math.max(0, dt))
  const yaw = player.yaw + input.yawDelta + input.turn * TURN_SPEED * t
  const pitch = clamp(player.pitch + input.pitchDelta, PITCH_MIN, PITCH_MAX)

  const forward = clamp(input.forward, -1, 1)
  const strafe = clamp(input.strafe, -1, 1)
  const mag = Math.hypot(forward, strafe)
  const scale = mag > 1 ? 1 / mag : 1
  const speed = (input.sprint ? RUN_SPEED : WALK_SPEED) * (reducedMotion ? 0.72 : 1)
  const sin = Math.sin(yaw)
  const cos = Math.cos(yaw)
  const dx = (forward * -sin + strafe * cos) * scale * speed * t
  const dz = (forward * -cos + strafe * -sin) * scale * speed * t

  const depen = resolveDepenetration(player.x, player.z, world)
  let x = depen.x
  let z = depen.z
  if (!positionBlocked(x + dx, z, world)) x += dx
  if (!positionBlocked(x, z + dz, world)) z += dz

  const moving = mag > 0.08 && (x !== player.x || z !== player.z)
  const bob = reducedMotion || !moving
    ? player.bob * Math.exp(-8 * t)
    : player.bob + t * speed * 1.35

  return {
    x,
    y: EYE_HEIGHT,
    z,
    yaw,
    pitch,
    bob,
  }
}

export function eyeOffset(bob: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0
  return Math.sin(bob * 1.7) * 0.035
}

export function findNearestPlant(
  x: number,
  z: number,
  plants: WorldPlant[],
  maxDist: number = INTERACT_RADIUS,
): WorldPlant | null {
  let best: WorldPlant | null = null
  let bestD = maxDist
  for (const plant of plants) {
    const d = Math.hypot(x - plant.x, z - plant.z) - plant.radius * 0.35
    if (d < bestD) {
      bestD = d
      best = plant
    }
  }
  return best
}
