import * as THREE from 'three'
import { createPlantGroup, disposePlantGroup } from '@/components/open-world/plant-mesh'
import type { ScenePalette } from '@/lib/garden/palettes'
import { plantHeight, plantRadius } from '@/lib/open-world/layout'
import { plantRecipe } from '@/lib/open-world/plant-visual'
import type { PlantStage, PlantVariety } from '@/lib/types'
import type { WorldPlant } from './types'

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

  const camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 40)
  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.35)
  const zoom = variety === 'tree' ? 0.68 : 0.88
  const dist = (maxDim / Math.tan((camera.fov * Math.PI) / 360)) * zoom
  const lookY = center.y + size.y * (variety === 'tree' ? 0.32 : 0.12)
  camera.position.set(center.x + dist * 0.08, center.y + maxDim * 0.02, center.z + dist * 0.95)
  camera.lookAt(center.x, lookY, center.z)

  const render = () => {
    renderer.render(scene, camera)
  }
  render()

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
