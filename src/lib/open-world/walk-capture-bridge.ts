import type { ArtStyle } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { CC0_MODEL_BY_ID, type Cc0ModelId } from './cc0-catalog'
import { cc0ShowcaseCapturePose } from './cc0-placement'

export interface WalkCapturePose {
  x: number
  z: number
  yaw: number
  pitch: number
}

export interface WalkCaptureBridge {
  setPose: (pose: WalkCapturePose) => void
  setPalette: (palette: ScenePalette) => void
  setPlantArtStyle?: (style: ArtStyle) => void
  showcaseModel: (modelId: Cc0ModelId | null) => Promise<void>
  showcasePoseFor: (modelId: Cc0ModelId) => WalkCapturePose
  ready: () => boolean
  worldPlants: () => Array<{ id: string; x: number; z: number; variety: string; stage: string }>
}

export const WALK_CAPTURE_SESSION_KEY = 'mg:walk-capture'
export const WALK_CAPTURE_BASELINE_KEY = 'mg:walk-capture-baseline'

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
