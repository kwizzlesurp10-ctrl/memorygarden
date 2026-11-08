import type { ShedStyle } from '@/lib/types'

export interface WorldEntity {
  id: string
  wx: number
  wz: number
  /** Compass yaw the object's front faces (0 = toward +WZ / pond). */
  yaw: number
}

/** Storybook cottage — east bank, door faces west toward the grove. */
export const WORLD_COTTAGE: WorldEntity = {
  id: 'cottage',
  wx: 0.9,
  wz: 0.7,
  yaw: Math.PI / 2,
}

export interface DistantTreeDef extends WorldEntity {
  stage: number
  geneticsSeed: string
  scale: number
}

export const WORLD_DISTANT_TREES: readonly DistantTreeDef[] = [
  { id: 'far-t-1', wx: 0.18, wz: 0.06, yaw: 0, stage: 5, geneticsSeed: 'far-hill-1', scale: 0.44 },
  { id: 'far-t-2', wx: 0.5, wz: 0.04, yaw: Math.PI / 6, stage: 6, geneticsSeed: 'far-hill-2', scale: 0.52 },
  { id: 'far-t-3', wx: 0.78, wz: 0.07, yaw: -Math.PI / 5, stage: 4, geneticsSeed: 'far-hill-3', scale: 0.4 },
]

export interface WorldPropRock extends WorldEntity {
  kind: 'rock'
  width: number
}

export interface WorldPropCattail extends WorldEntity {
  kind: 'cattail'
  scale: number
  seed: number
}

export interface WorldPropGrass extends WorldEntity {
  kind: 'grass'
  scale: number
  seed: number
}

export type WorldProp = WorldPropRock | WorldPropCattail | WorldPropGrass

export const WORLD_PROPS: readonly WorldProp[] = [
  { id: 'rock-1', wx: 0.28, wz: 0.7, yaw: 0, kind: 'rock', width: 15 },
  { id: 'rock-2', wx: 0.52, wz: 0.74, yaw: 0, kind: 'rock', width: 9 },
  { id: 'rock-3', wx: 0.71, wz: 0.68, yaw: 0, kind: 'rock', width: 12 },
  { id: 'cattail-1', wx: 0.1, wz: 0.62, yaw: 0, kind: 'cattail', scale: 1, seed: 30 },
  { id: 'cattail-2', wx: 0.14, wz: 0.58, yaw: 0, kind: 'cattail', scale: 0.92, seed: 31 },
  { id: 'cattail-3', wx: 0.22, wz: 0.66, yaw: 0, kind: 'cattail', scale: 0.82, seed: 32 },
  { id: 'grass-1', wx: 0.34, wz: 0.72, yaw: 0, kind: 'grass', scale: 1.35, seed: 33 },
  { id: 'grass-2', wx: 0.62, wz: 0.76, yaw: 0, kind: 'grass', scale: 1.2, seed: 34 },
  { id: 'grass-3', wx: 0.48, wz: 0.64, yaw: 0, kind: 'grass', scale: 1.05, seed: 35 },
]

/** Celestial anchor in the northern sky (not on the land plane). */
export const WORLD_SUN = { wx: 0.72, wz: -0.22 }

export const DEFAULT_SHED_STYLE: ShedStyle = 'storybook'
