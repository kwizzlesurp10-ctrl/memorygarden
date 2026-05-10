import type { PlantStage } from './types'

export interface BloomWallTileSpan {
  colSpan: number
  rowSpan: number
}

/**
 * 12-column CSS grid spans: larger stages claim more space so elders read as “full blooms”
 * on the collage wall.
 */
export function getBloomWallTileSpan(stage: PlantStage): BloomWallTileSpan {
  const map: Record<PlantStage, BloomWallTileSpan> = {
    seed: { colSpan: 2, rowSpan: 2 },
    sprout: { colSpan: 2, rowSpan: 2 },
    seedling: { colSpan: 2, rowSpan: 2 },
    young: { colSpan: 3, rowSpan: 2 },
    bud: { colSpan: 3, rowSpan: 3 },
    bloom: { colSpan: 4, rowSpan: 3 },
    mature: { colSpan: 5, rowSpan: 4 },
    elder: { colSpan: 6, rowSpan: 5 },
  }
  return map[stage]
}

export function bloomWallTileSortWeight(stage: PlantStage): number {
  const { colSpan, rowSpan } = getBloomWallTileSpan(stage)
  return colSpan * rowSpan
}
