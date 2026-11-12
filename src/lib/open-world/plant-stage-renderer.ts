import * as THREE from 'three'
import { createPlantGroup, disposePlantGroup } from '@/components/open-world/plant-mesh'
import type { ScenePalette } from '@/lib/garden/palettes'
import { plantHeight, plantRadius } from '@/lib/open-world/layout'
import { plantRecipe } from '@/lib/open-world/plant-visual'
import type { PlantStage, PlantVariety } from '@/lib/types'
import { plantStageToIndex } from '@/lib/garden/stage'
import {
  FLOWER_STAGE_HEIGHT,
  TREE_STAGE_METRICS,
} from '@/lib/garden/plant-visual-spec'
import type { WorldPlant } from './types'

function stage2DVisualExtent(variety: PlantVariety, stageIdx: number): number {
  if (variety === 'tree') {
    const st = TREE_STAGE_METRICS[stageIdx] ?? TREE_STAGE_METRICS[7]
    return Math.max(10, st.H + st.ch * 0.95 + st.cw * 0.4)
  }
  const h = FLOWER_STAGE_HEIGHT[stageIdx] ?? FLOWER_STAGE_HEIGHT[7]
  return Math.max(10, h + 14)
}

function elder2DVisualExtent(variety: PlantVariety): number {
  if (variety === 'tree') {
    const st = TREE_STAGE_METRICS[7]
    return st.H + st.ch * 0.95 + st.cw * 0.4
  }
  return FLOWER_STAGE_HEIGHT[7] + 14
}

function fitCameraDistance(
  camera: THREE.PerspectiveCamera,
  size: THREE.Vector3,
  width: number,
  height: number,
  margin: number,
): number {
  const vFov = (camera.fov * Math.PI) / 180
  const aspect = width / height
  const distY = (size.y * 0.52) / Math.tan(vFov / 2)
  const distX = (Math.max(size.x, size.z) * 0.52) / (Math.tan(vFov / 2) * aspect)
  return Math.max(distY, distX, 0.35) * margin
}

export interface StagePreviewHandle {
  dispose: () => void
  render: () => void
}

function mockWorldPlant(
  variety: PlantVariety,
  stage: PlantStage,
  id: string,
): WorldPlant {
  const height = plantHeight(stage, variety)
  const radius = plantRadius(stage, variety)
  return {
    id,
    x: 0,
    z: 0,
    radius,
    colliderRadius: Math.min(radius, 0.22),
    height,
    variety,
    stage,
    tone: 'peaceful',
    title: `${variety} ${stage}`,
    photoUrl: '',
    isHybrid: false,
    geneticsSeed: `grid-${variety}-${stage}`,
    moistureLevel: 72,
    healthStatus: 'healthy',
    wiltingFactor: 0,
    needsWater: false,
    isEternal: false,
    activeGifts: [],
  }
}

export function mountStagePlantPreview(
  host: HTMLElement,
  variety: PlantVariety,
  stage: PlantStage,
  palette: ScenePalette,
): StagePreviewHandle {
  const plant = mockWorldPlant(variety, stage, `grid-${variety}-${stage}`)
  const recipe = plantRecipe(
    variety,
    stage,
    plant.tone,
    palette,
    plant.height,
    false,
  )
  const group = createPlantGroup(plant, recipe)
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(palette.hills[1] ?? '#2c163c')

  const hemi = new THREE.HemisphereLight(palette.sky[1] ?? '#c4d4ff', palette.bank ?? '#2a1a18', 1.05)
  const key = new THREE.DirectionalLight(palette.glow ?? '#ffe8c8', 0.95)
  key.position.set(2.4, 4.8, 3.2)
  const fill = new THREE.DirectionalLight(palette.hills[0] ?? '#6b8f5a', 0.42)
  fill.position.set(-3, 2, -2)
  scene.add(hemi, key, fill, group)

  const width = Math.max(120, host.clientWidth || 150)
  const height = Math.max(140, host.clientHeight || 180)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMappingExposure = (palette.starAlpha ?? 0) > 0.2 ? 1.42 : 1.12
  host.replaceChildren(renderer.domElement)

  const stageIdx = plantStageToIndex(stage)
  const camera = new THREE.PerspectiveCamera(variety === 'tree' ? 50 : 36, width / height, 0.05, 48)
  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.2)

  const elderExtent = elder2DVisualExtent(variety)
  const stageExtent = stage2DVisualExtent(variety, stageIdx)

  const baseFit = fitCameraDistance(camera, size, width, height, 1.16)
  const metricRatio = stageExtent / elderExtent
  const tinyStage = variety === 'tree' ? stageIdx <= 4 : stageIdx <= 3

  let finalDist: number
  if (tinyStage) {
    finalDist = variety === 'tree' ? 1.86 - stageIdx * 0.12 : 1.78 - stageIdx * 0.1
  } else if (metricRatio < 0.5) {
    finalDist = baseFit * (0.52 + metricRatio * 0.88)
  } else {
    finalDist = baseFit * (0.8 + metricRatio * 0.26)
  }
  if (variety === 'tree' && stageIdx === 5) finalDist *= 1.08
  if (variety === 'tree' && stageIdx >= 6) finalDist *= 0.86
  if (variety === 'tree' && stageIdx >= 7) finalDist *= 0.7
  if (variety === 'flower' && stageIdx >= 7) finalDist *= 0.84

  const lookY =
    variety === 'tree'
      ? center.y + size.y * 0.36
      : center.y + size.y * 0.14
  camera.position.set(
    center.x + finalDist * 0.12,
    center.y + (variety === 'tree' ? size.y * 0.06 : maxDim * 0.02),
    center.z + finalDist,
  )
  camera.lookAt(center.x, lookY, center.z)

  const render = () => {
    renderer.render(scene, camera)
  }
  render()
  host.dataset.stagePreviewReady = '1'

  return {
    render,
    dispose: () => {
      scene.remove(group)
      disposePlantGroup(group)
      renderer.dispose()
      host.replaceChildren()
    },
  }
}
