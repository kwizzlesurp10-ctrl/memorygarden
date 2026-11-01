import * as THREE from 'three'
import { gardenRng } from '@/lib/garden/prng'
import type { PlantVisualRecipe } from '@/lib/open-world/plant-visual'
import type { WorldPlant } from '@/lib/open-world/types'

const geo = {
  stem: new THREE.CylinderGeometry(1, 1, 1, 8),
  sphere: new THREE.SphereGeometry(1, 12, 10),
  cone: new THREE.ConeGeometry(1, 1, 8),
  cap: new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  disk: new THREE.CircleGeometry(1, 16),
}

function mat(color: string, opts?: { emissive?: string; emissiveIntensity?: number; roughness?: number }): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts?.roughness ?? 0.72,
    metalness: 0.02,
    emissive: opts?.emissive ?? '#000000',
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
  })
}

export function createPlantGroup(plant: WorldPlant, recipe: PlantVisualRecipe): THREE.Group {
  const g = new THREE.Group()
  g.name = `plant:${plant.id}`
  g.userData.memoryId = plant.id
  const rng = gardenRng((plant.id.charCodeAt(0) * 997 + plant.id.length * 13) >>> 0)
  const stemMat = mat(recipe.stem)
  const leafMat = mat(recipe.foliage, {
    emissive: recipe.emissive,
    emissiveIntensity: recipe.emissiveIntensity * 0.35,
  })
  const bloomMat = mat(recipe.bloom, {
    emissive: recipe.emissive,
    emissiveIntensity: recipe.emissiveIntensity,
    roughness: 0.45,
  })

  const stem = new THREE.Mesh(geo.stem, stemMat)
  stem.castShadow = true
  stem.scale.set(recipe.stemRadius, recipe.stemHeight, recipe.stemRadius)
  stem.position.y = recipe.stemHeight / 2
  g.add(stem)

  const canopyY = recipe.stemHeight

  if (recipe.kind === 'tree') {
    const layers = 2 + (plant.stage === 'elder' ? 2 : plant.stage === 'mature' ? 1 : 0)
    for (let i = 0; i < layers; i++) {
      const canopy = new THREE.Mesh(geo.sphere, leafMat)
      const r = recipe.canopyRadius * (1 - i * 0.18)
      canopy.scale.set(r * (1.15 + rng() * 0.2), r * 0.85, r * (1.15 + rng() * 0.2))
      canopy.position.y = canopyY + i * r * 0.45
      canopy.position.x = (rng() - 0.5) * 0.2
      canopy.castShadow = true
      g.add(canopy)
    }
  } else if (recipe.kind === 'mushroom') {
    const cap = new THREE.Mesh(geo.cap, bloomMat)
    cap.scale.set(recipe.canopyRadius * 1.4, recipe.canopyRadius * 0.9, recipe.canopyRadius * 1.4)
    cap.position.y = canopyY
    cap.castShadow = true
    g.add(cap)
  } else if (recipe.kind === 'succulent') {
    stem.visible = false
    const n = 3 + recipe.bloomCount
    for (let i = 0; i < n; i++) {
      const bulb = new THREE.Mesh(geo.sphere, i === 0 ? leafMat : bloomMat)
      const r = recipe.canopyRadius * (0.55 - i * 0.06)
      bulb.scale.setScalar(Math.max(0.08, r))
      bulb.position.y = 0.12 + i * r * 0.55
      bulb.castShadow = true
      g.add(bulb)
    }
  } else if (recipe.kind === 'lotus') {
    const pad = new THREE.Mesh(geo.disk, leafMat)
    pad.rotation.x = -Math.PI / 2
    pad.scale.setScalar(recipe.canopyRadius * 1.6)
    pad.position.y = 0.04
    g.add(pad)
    const bloom = new THREE.Mesh(geo.cone, bloomMat)
    bloom.scale.set(recipe.canopyRadius * 0.45, recipe.stemHeight * 0.5, recipe.canopyRadius * 0.45)
    bloom.position.y = recipe.stemHeight * 0.35
    g.add(bloom)
  } else if (recipe.kind === 'vine') {
    for (let i = 0; i < 4; i++) {
      const tendril = new THREE.Mesh(geo.stem, leafMat)
      const h = recipe.stemHeight * (0.7 + rng() * 0.5)
      tendril.scale.set(recipe.stemRadius * 0.6, h, recipe.stemRadius * 0.6)
      tendril.position.set((rng() - 0.5) * 0.35, h / 2, (rng() - 0.5) * 0.35)
      tendril.rotation.z = (rng() - 0.5) * 0.6
      g.add(tendril)
    }
    const bloom = new THREE.Mesh(geo.sphere, bloomMat)
    bloom.scale.setScalar(recipe.canopyRadius * 0.35)
    bloom.position.y = recipe.stemHeight * 0.85
    g.add(bloom)
  } else if (recipe.kind === 'fern') {
    for (let i = 0; i < 5; i++) {
      const frond = new THREE.Mesh(geo.cone, leafMat)
      frond.scale.set(recipe.canopyRadius * 0.25, recipe.stemHeight * 0.9, recipe.canopyRadius * 0.08)
      frond.position.y = recipe.stemHeight * 0.4
      frond.rotation.z = -0.7 + i * 0.35
      g.add(frond)
    }
  } else {
    // flower / bush
    const head = new THREE.Mesh(geo.sphere, bloomMat)
    head.scale.setScalar(recipe.canopyRadius * (recipe.kind === 'bush' ? 0.85 : 0.45))
    head.position.y = canopyY
    head.castShadow = true
    g.add(head)
    for (let i = 0; i < recipe.bloomCount; i++) {
      const petal = new THREE.Mesh(geo.sphere, i % 2 === 0 ? bloomMat : leafMat)
      const ang = (i / recipe.bloomCount) * Math.PI * 2
      const r = recipe.canopyRadius * 0.55
      petal.scale.setScalar(recipe.canopyRadius * 0.22)
      petal.position.set(Math.cos(ang) * r, canopyY + 0.05, Math.sin(ang) * r)
      g.add(petal)
    }
  }

  g.position.set(plant.x, 0, plant.z)
  g.userData.baseScale = 1
  return g
}

export function disposePlantGroup(group: THREE.Group): void {
  group.traverse((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Mesh) {
      const material = obj.material
      if (Array.isArray(material)) material.forEach((m) => m.dispose())
      else material.dispose()
    }
  })
}
