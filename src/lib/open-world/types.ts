import type { EmotionalTone, PlantHealthStatus, PlantStage, PlantVariety } from '@/lib/types'

export interface Vec2 {
  x: number
  z: number
}

export interface WorldBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface WorldPlant {
  id: string
  x: number
  z: number
  radius: number
  height: number
  variety: PlantVariety
  stage: PlantStage
  tone: EmotionalTone
  title: string
  photoUrl: string
  isHybrid: boolean
  moistureLevel?: number
  healthStatus?: PlantHealthStatus
  wiltingFactor?: number
  needsWater?: boolean
  isEternal?: boolean
}

export interface WorldPath {
  points: Vec2[]
  width: number
}

export interface WorldCircle {
  x: number
  z: number
  radius: number
}

export interface WorldShed {
  x: number
  z: number
  width: number
  depth: number
  yaw: number
}

export interface WorldBed {
  tone: EmotionalTone
  x: number
  z: number
  radius: number
}

export interface GardenWorld {
  bounds: WorldBounds
  spawn: { x: number; z: number; yaw: number }
  plants: WorldPlant[]
  paths: WorldPath[]
  pond: WorldCircle
  shed: WorldShed
  gate: Vec2
  beds: WorldBed[]
}

export interface PlayerState {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  bob: number
}

export interface LocomotionInput {
  /** +1 walk forward (look direction), -1 back */
  forward: number
  /** +1 strafe right */
  strafe: number
  /** yaw radians to apply this frame (mouse) */
  yawDelta: number
  /** pitch radians to apply this frame (mouse) */
  pitchDelta: number
  /** yaw radians/sec from keys (arrow turn when unlocked) */
  turn: number
  sprint: boolean
}
