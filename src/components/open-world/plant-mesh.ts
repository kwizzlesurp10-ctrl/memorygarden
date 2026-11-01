import * as THREE from 'three'
import { gardenRng } from '@/lib/garden/prng'
import type { PlantVisualRecipe } from '@/lib/open-world/plant-visual'
import type { WorldPlant } from '@/lib/open-world/types'

const geo = {
  stem: new THREE.CylinderGeometry(1, 1, 1, 8),
  stemTaper: new THREE.CylinderGeometry(0.65, 1, 1, 8),
  sphere: new THREE.SphereGeometry(1, 12, 10),
  cone: new THREE.ConeGeometry(1, 1, 8),
  cap: new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  disk: new THREE.CircleGeometry(1, 16),
  ring: new THREE.RingGeometry(0.72, 1, 20),
  torus: new THREE.TorusGeometry(1, 0.12, 8, 20),
  box: new THREE.BoxGeometry(1, 1, 1),
}

function mat(
  color: string,
  opts?: {
    emissive?: string
    emissiveIntensity?: number
    roughness?: number
    metalness?: number
    transparent?: boolean
    opacity?: number
  },
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts?.roughness ?? 0.72,
    metalness: opts?.metalness ?? 0.04,
    emissive: opts?.emissive ?? '#000000',
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
    transparent: opts?.transparent ?? false,
    opacity: opts?.opacity ?? 1,
    side: THREE.DoubleSide,
  })
}

export function createPlantGroup(plant: WorldPlant, recipe: PlantVisualRecipe): THREE.Group {
  const g = new THREE.Group()
  g.name = `plant:${plant.id}`
  g.userData.memoryId = plant.id
  const rng = gardenRng((plant.id.charCodeAt(0) * 997 + plant.id.length * 13) >>> 0)

  const wiltingFactor = plant.wiltingFactor ?? 0
  const healthStatus = plant.healthStatus ?? 'healthy'
  const isThirstyOrWilting = healthStatus === 'thirsty' || healthStatus === 'wilting' || healthStatus === 'dormant'
  const isThriving = healthStatus === 'thriving'
  const isEternal = Boolean(plant.isEternal)

  const stemMat = mat(recipe.stem, { roughness: 0.85 })
  const leafMat = mat(recipe.foliage, {
    emissive: recipe.emissive,
    emissiveIntensity: recipe.emissiveIntensity * 0.35,
    roughness: 0.65,
  })
  const bloomMat = mat(recipe.bloom, {
    emissive: recipe.emissive,
    emissiveIntensity: Math.max(0.08, recipe.emissiveIntensity),
    roughness: 0.42,
  })
  const stamenMat = mat('#f6d860', {
    emissive: '#ffd700',
    emissiveIntensity: 0.25,
    roughness: 0.5,
  })

  // Dynamic 3-Tier Visual Vitality Adjustments
  if (wiltingFactor > 0) {
    leafMat.color.lerp(new THREE.Color('#7a6e58'), wiltingFactor * 0.4)
    leafMat.roughness = THREE.MathUtils.lerp(0.65, 0.92, wiltingFactor)
    bloomMat.roughness = THREE.MathUtils.lerp(0.42, 0.92, wiltingFactor)
    bloomMat.emissiveIntensity *= Math.max(0, 1 - wiltingFactor)
  } else if (isThriving) {
    bloomMat.emissiveIntensity = Math.max(0.28, recipe.emissiveIntensity * 1.4)
  }

  let soilColor = '#231812'
  let soilRoughness = 0.85
  if (isThirstyOrWilting) {
    soilColor = '#4e4136'
    soilRoughness = 0.98
  } else if (isThriving) {
    soilColor = '#120b07'
    soilRoughness = 0.30
  }
  const soilMat = mat(soilColor, { roughness: soilRoughness })
  const stoneMat = mat('#635b6b', { roughness: 0.88 })

  const isEarlyStage = plant.stage === 'seed' || plant.stage === 'sprout' || plant.stage === 'seedling'
  const isAdvanced = plant.stage === 'mature' || plant.stage === 'elder' || plant.isHybrid

  // Ground soil mound & garden pebble accent for non-lotus plants
  if (recipe.kind !== 'lotus') {
    const moundRadius = Math.max(0.18, recipe.canopyRadius * 0.6)
    const mound = new THREE.Mesh(geo.cone, soilMat)
    mound.scale.set(moundRadius, 0.06, moundRadius)
    mound.position.y = 0.03
    mound.receiveShadow = true
    g.add(mound)

    // Pebbles nestled in soil
    for (let p = 0; p < 3; p++) {
      const pebble = new THREE.Mesh(geo.sphere, stoneMat)
      const ang = rng() * Math.PI * 2
      const dist = moundRadius * (0.35 + rng() * 0.45)
      pebble.scale.set(0.035 + rng() * 0.025, 0.02 + rng() * 0.015, 0.03 + rng() * 0.02)
      pebble.position.set(Math.cos(ang) * dist, 0.025, Math.sin(ang) * dist)
      g.add(pebble)
    }
  }

  // Aura Ring for mature/elder, hybrid, or eternal plants
  if (isAdvanced || isEternal) {
    const auraColor = isEternal ? '#fbbf24' : recipe.bloom
    const auraEmissive = isEternal ? '#f59e0b' : recipe.emissive
    const auraMat = mat(auraColor, {
      emissive: auraEmissive,
      emissiveIntensity: isEternal ? 0.65 : 0.45,
      transparent: true,
      opacity: isEternal ? 0.6 : 0.45,
    })
    const aura = new THREE.Mesh(geo.ring, auraMat)
    aura.rotation.x = -Math.PI / 2
    aura.scale.setScalar(Math.max(0.4, recipe.canopyRadius * (isEternal ? 1.5 : 1.35)))
    aura.position.y = 0.015
    g.add(aura)
  }

  // Thriving Tier: Sparkling floating dewdrop motes
  if (isThriving) {
    const moteCount = 10
    const motePositions = new Float32Array(moteCount * 3)
    for (let i = 0; i < moteCount; i++) {
      const ang = (i / moteCount) * Math.PI * 2 + rng() * 0.5
      const r = 0.22 + rng() * 0.28
      motePositions[i * 3] = Math.cos(ang) * r
      motePositions[i * 3 + 1] = recipe.stemHeight + 0.12 + (rng() - 0.5) * 0.25
      motePositions[i * 3 + 2] = Math.sin(ang) * r
    }
    const moteGeo = new THREE.BufferGeometry()
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3))
    const moteMat = new THREE.PointsMaterial({
      color: '#6ee7b7',
      size: 0.05,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
    const motes = new THREE.Points(moteGeo, moteMat)
    g.add(motes)
  }

  // Dormant Tier: Translucent protective mist ring at plant base
  if (healthStatus === 'dormant') {
    g.scale.set(0.85, 0.75, 0.85)
    const mistMat = mat('#e2e8f0', {
      transparent: true,
      opacity: 0.35,
      roughness: 0.95,
      emissive: '#cbd5e1',
      emissiveIntensity: 0.15,
    })
    const mistRing = new THREE.Mesh(geo.ring, mistMat)
    mistRing.rotation.x = -Math.PI / 2
    mistRing.scale.setScalar(Math.max(0.35, recipe.canopyRadius * 0.95))
    mistRing.position.y = 0.04
    g.add(mistRing)
  }

  // Early botanical stages: Seed & Sprout
  if (isEarlyStage) {
    if (plant.stage === 'seed') {
      const shellMat = mat('#3c271e', { roughness: 0.6 })
      const shell1 = new THREE.Mesh(geo.sphere, shellMat)
      shell1.scale.set(0.07, 0.05, 0.045)
      shell1.position.set(0, 0.05, 0)
      shell1.rotation.set(0.2, 0.3, 0.4)
      shell1.castShadow = true
      g.add(shell1)

      const tip = new THREE.Mesh(geo.cone, leafMat)
      tip.scale.set(0.02, 0.06, 0.02)
      tip.position.set(0.04, 0.07, 0.02)
      tip.rotation.z = -0.5
      g.add(tip)
    } else {
      // Sprout or Seedling
      const sproutStem = new THREE.Mesh(geo.stem, leafMat)
      const h = Math.max(0.12, recipe.stemHeight * 0.7)
      sproutStem.scale.set(0.02, h, 0.02)
      sproutStem.position.set(0, h / 2, 0)
      sproutStem.rotation.z = 0.15
      sproutStem.castShadow = true
      g.add(sproutStem)

      // Two tender cotyledon leaves
      for (const side of [-1, 1]) {
        const leaf = new THREE.Mesh(geo.sphere, leafMat)
        leaf.scale.set(0.055, 0.018, 0.035)
        leaf.position.set(side * 0.04, h + 0.01, 0)
        leaf.rotation.z = side * 0.45
        g.add(leaf)
      }

      // Dewdrop
      const dewMat = mat('#ffffff', {
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85,
        emissive: '#d0f0fd',
        emissiveIntensity: 0.3,
      })
      const dew = new THREE.Mesh(geo.sphere, dewMat)
      dew.scale.setScalar(0.018)
      dew.position.set(0, h + 0.035, 0)
      g.add(dew)
    }

    g.position.set(plant.x, 0, plant.z)
    g.userData.baseScale = 1
    return g
  }

  // Main stem structure
  const stem = new THREE.Mesh(geo.stemTaper, stemMat)
  stem.castShadow = true
  stem.receiveShadow = true
  stem.scale.set(recipe.stemRadius, recipe.stemHeight, recipe.stemRadius)
  stem.position.y = recipe.stemHeight / 2
  stem.rotation.z = (rng() - 0.5) * 0.08
  if (wiltingFactor > 0) {
    stem.rotation.z += (rng() > 0.5 ? 1 : -1) * (0.12 + wiltingFactor * 0.32)
    stem.rotation.x += 0.10 + wiltingFactor * 0.24
  }
  g.add(stem)

  const canopyY = recipe.stemHeight

  // Botanical species generator
  if (recipe.kind === 'tree') {
    // Sculpted organic tree with flared trunk base & branching
    stem.scale.set(recipe.stemRadius * 0.9, recipe.stemHeight, recipe.stemRadius * 1.35)

    // Root buttresses
    for (let i = 0; i < 4; i++) {
      const root = new THREE.Mesh(geo.cone, stemMat)
      const ang = (i / 4) * Math.PI * 2 + (rng() - 0.5) * 0.3
      const dist = recipe.stemRadius * 1.1
      root.scale.set(recipe.stemRadius * 0.4, recipe.stemHeight * 0.32, recipe.stemRadius * 0.6)
      root.position.set(Math.cos(ang) * dist, (recipe.stemHeight * 0.32) / 2, Math.sin(ang) * dist)
      root.rotation.x = Math.sin(ang) * 0.4
      root.rotation.z = -Math.cos(ang) * 0.4
      g.add(root)
    }

    // Branch boughs
    const branchCount = 3
    for (let b = 0; b < branchCount; b++) {
      const bough = new THREE.Mesh(geo.stem, stemMat)
      const ang = (b / branchCount) * Math.PI * 2 + rng() * 0.4
      const bLen = recipe.canopyRadius * 0.85
      bough.scale.set(recipe.stemRadius * 0.42, bLen, recipe.stemRadius * 0.42)
      bough.position.set(Math.cos(ang) * 0.25, canopyY * 0.78, Math.sin(ang) * 0.25)
      bough.rotation.x = Math.sin(ang) * 0.75
      bough.rotation.z = -Math.cos(ang) * 0.75
      bough.castShadow = true
      g.add(bough)
    }

    // Multi-lobed lush foliage canopy clusters
    const layers = 3 + (plant.stage === 'elder' ? 2 : plant.stage === 'mature' ? 1 : 0)
    for (let i = 0; i < layers; i++) {
      const canopy = new THREE.Mesh(geo.sphere, leafMat)
      const r = recipe.canopyRadius * (1.05 - i * 0.14)
      canopy.scale.set(r * (1.1 + rng() * 0.25), r * (0.8 + rng() * 0.15), r * (1.1 + rng() * 0.25))
      const offX = (rng() - 0.5) * recipe.canopyRadius * 0.5
      const offZ = (rng() - 0.5) * recipe.canopyRadius * 0.5
      canopy.position.set(offX, canopyY + i * r * 0.42 + 0.1, offZ)
      canopy.castShadow = true
      g.add(canopy)
    }

    // Blossom / fruit speckles in canopy
    for (let f = 0; f < 8; f++) {
      const fruit = new THREE.Mesh(geo.sphere, bloomMat)
      const ang = rng() * Math.PI * 2
      const dist = recipe.canopyRadius * (0.5 + rng() * 0.4)
      fruit.scale.setScalar(0.065 + rng() * 0.035)
      fruit.position.set(
        Math.cos(ang) * dist,
        canopyY + recipe.canopyRadius * (0.2 + rng() * 0.6),
        Math.sin(ang) * dist,
      )
      g.add(fruit)
    }

    // Fallen flower petals / leaves ring around trunk
    for (let fl = 0; fl < 7; fl++) {
      const petal = new THREE.Mesh(geo.disk, bloomMat)
      const ang = rng() * Math.PI * 2
      const dist = recipe.stemRadius * 1.8 + rng() * recipe.canopyRadius * 0.9
      petal.rotation.x = -Math.PI / 2
      petal.rotation.z = rng() * Math.PI
      petal.scale.set(0.05, 0.08, 0.05)
      petal.position.set(Math.cos(ang) * dist, 0.02, Math.sin(ang) * dist)
      g.add(petal)
    }
  } else if (recipe.kind === 'mushroom') {
    // Sculpted mushroom with swollen base, gills, annulus ring and dots
    stem.scale.set(recipe.stemRadius * 1.25, recipe.stemHeight, recipe.stemRadius * 1.25)
    stem.position.y = recipe.stemHeight / 2

    // Annulus / collar ring on stem
    const collar = new THREE.Mesh(geo.ring, stemMat)
    collar.rotation.x = -Math.PI / 2
    collar.scale.setScalar(recipe.stemRadius * 2.2)
    collar.position.y = recipe.stemHeight * 0.65
    g.add(collar)

    // Gills underside
    const gillMat = mat('#e8ded2', { roughness: 0.95 })
    const gills = new THREE.Mesh(geo.disk, gillMat)
    gills.rotation.x = Math.PI / 2
    gills.scale.setScalar(recipe.canopyRadius * 1.35)
    gills.position.y = canopyY - 0.02
    g.add(gills)

    // Main mushroom cap
    const cap = new THREE.Mesh(geo.cap, bloomMat)
    cap.scale.set(recipe.canopyRadius * 1.4, recipe.canopyRadius * 0.95, recipe.canopyRadius * 1.4)
    cap.position.y = canopyY
    cap.castShadow = true
    g.add(cap)

    // Decorative cap speckles
    const dotMat = mat('#ffffff', { roughness: 0.4 })
    for (let d = 0; d < 7; d++) {
      const dot = new THREE.Mesh(geo.sphere, dotMat)
      const ang = (d / 7) * Math.PI * 2 + rng() * 0.3
      const dist = recipe.canopyRadius * (0.45 + rng() * 0.35)
      dot.scale.setScalar(recipe.canopyRadius * 0.08)
      dot.position.set(
        Math.cos(ang) * dist,
        canopyY + recipe.canopyRadius * 0.55 - dist * 0.25,
        Math.sin(ang) * dist,
      )
      g.add(dot)
    }

    // Companion baby mushroom
    const babyStem = new THREE.Mesh(geo.stem, stemMat)
    const bH = recipe.stemHeight * 0.45
    babyStem.scale.set(recipe.stemRadius * 0.6, bH, recipe.stemRadius * 0.6)
    babyStem.position.set(recipe.stemRadius * 2.2, bH / 2, recipe.stemRadius * 1.2)
    babyStem.rotation.z = -0.25
    g.add(babyStem)

    const babyCap = new THREE.Mesh(geo.cap, bloomMat)
    babyCap.scale.setScalar(recipe.canopyRadius * 0.55)
    babyCap.position.set(recipe.stemRadius * 2.3, bH, recipe.stemRadius * 1.2)
    babyCap.rotation.z = -0.25
    g.add(babyCap)
  } else if (recipe.kind === 'succulent') {
    // True spiral Fibonacci rosette of fleshy succulent leaves
    stem.visible = false

    const goldenAngle = 2.39996
    const tiers = [
      { count: 3, r: recipe.canopyRadius * 0.28, y: 0.18, pitch: 0.95, s: 0.12 },
      { count: 5, r: recipe.canopyRadius * 0.5, y: 0.13, pitch: 0.65, s: 0.18 },
      { count: 7, r: recipe.canopyRadius * 0.78, y: 0.08, pitch: 0.38, s: 0.24 },
      { count: 9, r: recipe.canopyRadius * 1.05, y: 0.04, pitch: 0.15, s: 0.28 },
    ]

    let leafIndex = 0
    tiers.forEach((tier) => {
      for (let i = 0; i < tier.count; i++) {
        const ang = leafIndex * goldenAngle
        const leaf = new THREE.Mesh(geo.cone, leafIndex < 6 ? bloomMat : leafMat)
        // Flatten into a fleshy succulent leaf
        leaf.scale.set(tier.s * 0.55, tier.s * 1.2, tier.s * 0.22)
        leaf.position.set(Math.cos(ang) * tier.r, tier.y, Math.sin(ang) * tier.r)
        leaf.rotation.y = -ang + Math.PI / 2
        leaf.rotation.x = tier.pitch
        leaf.castShadow = true
        g.add(leaf)
        leafIndex++
      }
    })

    // Glowing starlight center bud
    const centerBud = new THREE.Mesh(geo.sphere, bloomMat)
    centerBud.scale.setScalar(0.06)
    centerBud.position.y = 0.21
    g.add(centerBud)
  } else if (recipe.kind === 'lotus') {
    // Water-lily pad with V-notch and multi-tiered lotus blossom
    stem.visible = false

    // Water lily pad
    const pad = new THREE.Mesh(geo.disk, leafMat)
    pad.rotation.x = -Math.PI / 2
    pad.scale.setScalar(recipe.canopyRadius * 1.8)
    pad.position.y = 0.03
    g.add(pad)

    // Notch cut overlay
    const notchMat = mat('#12091c', { roughness: 1 })
    const notch = new THREE.Mesh(geo.disk, notchMat)
    notch.rotation.x = -Math.PI / 2
    notch.scale.set(recipe.canopyRadius * 0.75, recipe.canopyRadius * 0.75, 1)
    notch.position.set(recipe.canopyRadius * 1.1, 0.035, 0)
    g.add(notch)

    // Lotus flower petals: 3 concentric radiating tiers
    const petalTiers = [
      { count: 8, r: recipe.canopyRadius * 0.72, y: 0.06, pitch: 0.25, s: 0.24 },
      { count: 6, r: recipe.canopyRadius * 0.48, y: 0.12, pitch: 0.62, s: 0.22 },
      { count: 5, r: recipe.canopyRadius * 0.26, y: 0.17, pitch: 0.88, s: 0.18 },
    ]

    petalTiers.forEach((tier) => {
      for (let p = 0; p < tier.count; p++) {
        const ang = (p / tier.count) * Math.PI * 2
        const petal = new THREE.Mesh(geo.cone, bloomMat)
        petal.scale.set(tier.s * 0.5, tier.s * 1.1, tier.s * 0.18)
        petal.position.set(Math.cos(ang) * tier.r, tier.y, Math.sin(ang) * tier.r)
        petal.rotation.y = -ang + Math.PI / 2
        petal.rotation.x = tier.pitch
        petal.castShadow = true
        g.add(petal)
      }
    })

    // Central golden-green seed pod head (receptacle)
    const seedHead = new THREE.Mesh(geo.stem, stamenMat)
    seedHead.scale.set(0.12, 0.14, 0.12)
    seedHead.position.y = 0.18
    g.add(seedHead)

    const stamenRing = new THREE.Mesh(geo.ring, stamenMat)
    stamenRing.rotation.x = -Math.PI / 2
    stamenRing.scale.setScalar(0.18)
    stamenRing.position.y = 0.19
    g.add(stamenRing)
  } else if (recipe.kind === 'vine') {
    // Climbing vine: bamboo garden cane with winding helical stem & blossoms
    const caneMat = mat('#7d6244', { roughness: 0.85 })
    const cane = new THREE.Mesh(geo.stem, caneMat)
    cane.scale.set(0.04, recipe.stemHeight * 1.15, 0.04)
    cane.position.y = (recipe.stemHeight * 1.15) / 2
    cane.castShadow = true
    g.add(cane)

    // Helical vine tendrils climbing up
    const spiralSteps = 16
    for (let s = 0; s < spiralSteps; s++) {
      const t = s / spiralSteps
      const ang = t * Math.PI * 5
      const rad = 0.08 + Math.sin(t * Math.PI) * 0.04
      const x = Math.cos(ang) * rad
      const z = Math.sin(ang) * rad
      const y = t * recipe.stemHeight

      const tendrilNode = new THREE.Mesh(geo.sphere, leafMat)
      tendrilNode.scale.setScalar(0.035)
      tendrilNode.position.set(x, y, z)
      g.add(tendrilNode)

      // Sprouting heart/almond leaves
      if (s % 2 === 0) {
        const leaf = new THREE.Mesh(geo.cone, leafMat)
        leaf.scale.set(0.045, 0.12, 0.02)
        leaf.position.set(x * 1.35, y, z * 1.35)
        leaf.rotation.set((rng() - 0.5) * 0.4, ang, (rng() - 0.5) * 0.4)
        g.add(leaf)
      }

      // Drooping bell blossoms
      if (s % 5 === 2) {
        const bell = new THREE.Mesh(geo.cone, bloomMat)
        bell.scale.set(0.05, 0.09, 0.05)
        bell.position.set(x * 1.5, y - 0.04, z * 1.5)
        bell.rotation.x = Math.PI
        bell.castShadow = true
        g.add(bell)
      }
    }
  } else if (recipe.kind === 'fern') {
    // Crown rosette of arching fronds with side pinnae leaflets
    stem.visible = false

    const frondCount = 7 + (plant.stage === 'elder' ? 2 : 0)
    for (let f = 0; f < frondCount; f++) {
      const baseAng = (f / frondCount) * Math.PI * 2 + (rng() - 0.5) * 0.2
      const frondGroup = new THREE.Group()

      // Main arching frond spine
      const spine = new THREE.Mesh(geo.cone, leafMat)
      const fLen = recipe.stemHeight * (0.85 + rng() * 0.3)
      spine.scale.set(recipe.canopyRadius * 0.18, fLen, recipe.canopyRadius * 0.04)
      spine.position.y = fLen / 2
      frondGroup.add(spine)

      // Side leaflets
      const pinnaePairs = 5
      for (let p = 1; p <= pinnaePairs; p++) {
        const pFrac = p / (pinnaePairs + 1)
        const pY = pFrac * fLen
        const pSpan = (1 - pFrac * 0.7) * recipe.canopyRadius * 0.35

        for (const side of [-1, 1]) {
          const pinna = new THREE.Mesh(geo.cone, leafMat)
          pinna.scale.set(pSpan * 0.3, pSpan, pSpan * 0.1)
          pinna.position.set(side * pSpan * 0.45, pY, 0)
          pinna.rotation.z = side * 1.15
          frondGroup.add(pinna)
        }
      }

      frondGroup.rotation.y = baseAng
      frondGroup.rotation.x = 0.55 + rng() * 0.2
      frondGroup.position.y = 0.05
      g.add(frondGroup)
    }

    // Emerging fiddlehead curl in the center
    const fiddle = new THREE.Mesh(geo.torus, leafMat)
    fiddle.scale.setScalar(0.06)
    fiddle.position.set(0, 0.12, 0)
    fiddle.rotation.x = Math.PI / 4
    g.add(fiddle)
  } else if (recipe.kind === 'bush') {
    // Lush rounded multi-cluster shrub with berry accents
    const clusterCount = 5 + (plant.stage === 'elder' ? 3 : 0)
    for (let c = 0; c < clusterCount; c++) {
      const cluster = new THREE.Mesh(geo.sphere, leafMat)
      const ang = (c / clusterCount) * Math.PI * 2 + (rng() - 0.5) * 0.4
      const r = recipe.canopyRadius * (0.55 + rng() * 0.3)
      const cR = recipe.canopyRadius * (0.42 + rng() * 0.2)
      cluster.scale.set(cR * 1.1, cR * 0.9, cR * 1.1)
      cluster.position.set(Math.cos(ang) * r, canopyY * 0.65 + rng() * 0.25, Math.sin(ang) * r)
      cluster.castShadow = true
      g.add(cluster)
    }

    // Central dome
    const centralDome = new THREE.Mesh(geo.sphere, leafMat)
    centralDome.scale.set(recipe.canopyRadius * 0.85, recipe.canopyRadius * 0.75, recipe.canopyRadius * 0.85)
    centralDome.position.y = canopyY * 0.75
    centralDome.castShadow = true
    g.add(centralDome)

    // Little berry / flower specks
    for (let b = 0; b < recipe.bloomCount * 2; b++) {
      const berry = new THREE.Mesh(geo.sphere, bloomMat)
      const ang = rng() * Math.PI * 2
      const dist = recipe.canopyRadius * (0.4 + rng() * 0.5)
      berry.scale.setScalar(0.055)
      berry.position.set(
        Math.cos(ang) * dist,
        canopyY * 0.6 + rng() * recipe.canopyRadius * 0.5,
        Math.sin(ang) * dist,
      )
      g.add(berry)
    }
  } else {
    // Flower / Wildflower / Rose: multi-layered petals, calyx, leaves and stamen
    // Stem leaves along height
    const leafNodes = 3
    for (let l = 0; l < leafNodes; l++) {
      const leaf = new THREE.Mesh(geo.cone, leafMat)
      const lY = recipe.stemHeight * (0.3 + l * 0.25)
      const ang = l * 2.2 + (rng() - 0.5) * 0.4
      leaf.scale.set(0.07, recipe.stemHeight * 0.3, 0.02)
      leaf.position.set(Math.cos(ang) * 0.05, lY, Math.sin(ang) * 0.05)
      leaf.rotation.set((rng() - 0.5) * 0.3, ang, 0.65)
      g.add(leaf)
    }

    // Calyx / sepals under flower head
    const calyxCount = 5
    for (let c = 0; c < calyxCount; c++) {
      const sepal = new THREE.Mesh(geo.cone, leafMat)
      const ang = (c / calyxCount) * Math.PI * 2
      sepal.scale.set(0.045, 0.12, 0.015)
      sepal.position.set(Math.cos(ang) * 0.06, canopyY - 0.02, Math.sin(ang) * 0.06)
      sepal.rotation.set(Math.sin(ang) * 0.45, ang, -Math.cos(ang) * 0.45)
      g.add(sepal)
    }

    // Central pistil / stamen button
    const head = new THREE.Mesh(geo.sphere, stamenMat)
    head.scale.set(recipe.canopyRadius * 0.35, recipe.canopyRadius * 0.22, recipe.canopyRadius * 0.35)
    head.position.y = canopyY + 0.04
    head.castShadow = true
    g.add(head)

    // Outer & inner radiating petal rings
    const petalCount = Math.max(5, recipe.bloomCount + 4)
    for (let i = 0; i < petalCount; i++) {
      const petal = new THREE.Mesh(geo.cone, bloomMat)
      const ang = (i / petalCount) * Math.PI * 2
      const r = recipe.canopyRadius * 0.58
      petal.scale.set(recipe.canopyRadius * 0.32, recipe.canopyRadius * 0.62, recipe.canopyRadius * 0.08)
      petal.position.set(Math.cos(ang) * r, canopyY + 0.05, Math.sin(ang) * r)
      petal.rotation.y = -ang + Math.PI / 2
      petal.rotation.x = 0.35
      petal.castShadow = true
      g.add(petal)
    }

    // Inner smaller cupped petals
    const innerPetals = Math.max(4, Math.floor(petalCount * 0.7))
    for (let i = 0; i < innerPetals; i++) {
      const petal = new THREE.Mesh(geo.cone, bloomMat)
      const ang = (i / innerPetals) * Math.PI * 2 + 0.3
      const r = recipe.canopyRadius * 0.32
      petal.scale.set(recipe.canopyRadius * 0.22, recipe.canopyRadius * 0.45, recipe.canopyRadius * 0.06)
      petal.position.set(Math.cos(ang) * r, canopyY + 0.07, Math.sin(ang) * r)
      petal.rotation.y = -ang + Math.PI / 2
      petal.rotation.x = 0.65
      g.add(petal)
    }

    // For elder or hybrid: secondary nodding flower bud
    if (isAdvanced) {
      const sideStem = new THREE.Mesh(geo.stem, stemMat)
      const sbH = recipe.stemHeight * 0.55
      sideStem.scale.set(recipe.stemRadius * 0.6, sbH, recipe.stemRadius * 0.6)
      sideStem.position.set(recipe.canopyRadius * 0.6, sbH * 0.45, recipe.canopyRadius * 0.3)
      sideStem.rotation.z = -0.35
      g.add(sideStem)

      const sideBloom = new THREE.Mesh(geo.sphere, bloomMat)
      sideBloom.scale.setScalar(recipe.canopyRadius * 0.25)
      sideBloom.position.set(recipe.canopyRadius * 0.75, sbH * 0.85, recipe.canopyRadius * 0.35)
      g.add(sideBloom)
    }
  }

  g.position.set(plant.x, 0, plant.z)
  g.userData.baseScale = 1
  return g
}

export function disposePlantGroup(group: THREE.Group): void {
  group.traverse((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
      if (obj.geometry && !obj.userData.isSharedStatic) {
        obj.geometry.dispose()
      }
      const material = obj.material
      if (Array.isArray(material)) material.forEach((m) => m.dispose())
      else material?.dispose()
    }
  })
}
