import { describe, expect, it } from 'vitest'
import { EMBER_DUSK } from '@/lib/garden/palettes'
import { todPalette } from '@/lib/garden/day-night'
import {
  PLANT_KIND_BY_VARIETY,
  TREE_STAGE_METRICS,
  plantFoliageColor,
  plantMeshFoliageColor,
  plantTrunkColor,
  treeMeshMetrics,
} from '@/lib/garden/plant-visual-spec'
import { plantRecipe } from '@/lib/open-world/plant-visual'

describe('plant-visual-spec', () => {
  it('maps every variety to a visual kind', () => {
    expect(PLANT_KIND_BY_VARIETY.tree).toBe('tree')
    expect(PLANT_KIND_BY_VARIETY.herb).toBe('bush')
    expect(PLANT_KIND_BY_VARIETY.ancient_oak).toBe('tree')
  })

  it('uses readable foliage at dusk instead of raw silhouette sil', () => {
    const dusk = { ...EMBER_DUSK, plantDimBlend: 0.82, starAlpha: 0.6 }
    const foliage = plantMeshFoliageColor('mid', dusk)
    const trunk = plantTrunkColor(dusk)
    expect(foliage.toLowerCase()).not.toBe(dusk.sil.toLowerCase())
    expect(plantMeshFoliageColor('mid', dusk)).not.toBe(plantFoliageColor('mid', dusk))
    expect(trunk.toLowerCase()).not.toBe('#000000')
  })

  it('sizes elder tree canopies proportionally to world height', () => {
    const elder = treeMeshMetrics('elder', 4)
    expect(elder.canopyRadius).toBeGreaterThan(1)
    expect(elder.stemHeight).toBeGreaterThan(2.5)
  })

  it('scales tree canopy blobs with shared TREE_STAGE metrics', () => {
    const young = treeMeshMetrics('young', 1.5)
    const elder = treeMeshMetrics('elder', 2.4)
    expect(young.blobCount).toBe(TREE_STAGE_METRICS[3].blobs)
    expect(elder.blobCount).toBe(TREE_STAGE_METRICS[7].blobs)
    expect(elder.stemHeight).toBeGreaterThan(young.stemHeight)
    expect(elder.blobCount).toBeGreaterThan(young.blobCount)
  })

  it('feeds 3D recipes from the same dusk palette as 2D', () => {
    const dusk = todPalette(19.2, 'autumn')
    const recipe = plantRecipe('tree', 'mature', 'peaceful', dusk, 1.85, false)
    expect(recipe.foliage).toBe(plantMeshFoliageColor('mid', dusk))
    expect(recipe.canopyBlobs).toBeGreaterThan(0)
  })
})
