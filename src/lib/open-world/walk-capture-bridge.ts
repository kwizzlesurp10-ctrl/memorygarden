import type { ArtStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { CC0_MODEL_BY_ID, type Cc0ModelId } from './cc0-catalog'
import { cc0ShowcaseCapturePose } from './cc0-placement'

export interface WalkCapturePose {
  x: number
  z: number
  yaw: number
  pitch: number
  eyeY?: number
  screenFrac?: number
}

export interface WalkCaptureBridge {
  setPose: (pose: WalkCapturePose) => void
  setPalette: (palette: ScenePalette) => void
  setPlantArtStyle?: (style: ArtStyle) => void
  showcaseModel: (modelId: Cc0ModelId | null) => Promise<void>
  showcasePoseFor: (modelId: Cc0ModelId) => WalkCapturePose
  ready: () => boolean
  worldPlants: () => Array<{
    id: string
    x: number
    z: number
    variety: string
    stage: string
    height: number
  }>
  voxelMeshCount?: () => number
  voxelPlantGroupCount?: () => number
  plantCount?: () => number
  plantCapturePose?: (plantId: string) => WalkCapturePose | null
  deterministicPlantPose?: (plantId: string) => WalkCapturePose | null
  clusterOverviewPose?: () => WalkCapturePose | null
  waitCaptureReady?: () => Promise<void>
  plantScreenCoverage?: (plantId: string, pose?: WalkCapturePose) => number
  plantCaptureFitAt?: (
    plantId: string,
    pose: WalkCapturePose,
  ) => { frac: number; centerX: number; centerY: number } | null
  hasPlantGroup?: (plantId: string) => boolean
  plantBoxSize?: (plantId: string) => { x: number; y: number; z: number } | null
  setSoloPlantFocus?: (plantId: string | null) => void
  plantCaptureFitNow?: (plantId: string) => { frac: number; centerX: number; centerY: number } | null
  cameraDebug?: () => { y: number; pitch: number }
  footAt?: (x: number, z: number) => number
  plantWorldAabb?: (
    plantId: string,
  ) => {
    minX: number
    minY: number
    minZ: number
    maxX: number
    maxY: number
    maxZ: number
  } | null
  captureCameraFov?: () => number
  captureCameraAspect?: () => number
  elderCloseupPose?: (plantId: string) => WalkCapturePose | null
  mushroomCloseupPose?: (plantId: string) => WalkCapturePose | null
  plantProjectedBoxScreenY?: (plantId: string) => { top: number; bottom: number } | null
  plantProjectedAabbScreen?: (
    plantId: string,
  ) => { left: number; right: number; top: number; bottom: number } | null
  pondCloseupPose?: () => WalkCapturePose | null
}

export const WALK_CAPTURE_SESSION_KEY = 'mg:walk-capture'
export const WALK_CAPTURE_BASELINE_KEY = 'mg:walk-capture-baseline'
export const WALK_HIDE_POINTER_HINT_KEY = 'mg:walk-hide-pointer-hint'

export function isWalkHidePointerHint(): boolean {
  return (
    typeof window !== 'undefined' &&
    sessionStorage.getItem(WALK_HIDE_POINTER_HINT_KEY) === '1'
  )
}

export function isWalkCaptureBaseline(): boolean {
  return (
    typeof window !== 'undefined' && sessionStorage.getItem(WALK_CAPTURE_BASELINE_KEY) === '1'
  )
}

export function isWalkCaptureSession(): boolean {
  return typeof window !== 'undefined' && sessionStorage.getItem(WALK_CAPTURE_SESSION_KEY) === '1'
}

export function registerWalkCaptureBridge(bridge: WalkCaptureBridge | null): void {
  if (typeof window === 'undefined') return
  const win = window as Window & { __mgWalkCapture?: WalkCaptureBridge }
  if (bridge) win.__mgWalkCapture = bridge
  else delete win.__mgWalkCapture
}
