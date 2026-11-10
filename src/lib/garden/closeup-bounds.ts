import type { HybridGenome } from '@/lib/types'
import type { SvgBox } from '@/lib/garden/closeup-viewbox'
import { closeupHybridPlantScale } from '@/components/plants/hybrid-builder'

const BASE_HEIGHT: Record<string, number> = {
  flower: 72,
  tree: 90,
  succulent: 34,
  vine: 74,
  herb: 58,
  wildflower: 28,
  fern: 46,
  mushroom: 20,
  lotus: 18,
}

const MOTIF_SIZES = [0, 0, 0, 0, 12, 16, 22, 28]

/** Conservative content bounds in SVG user units (matches buildCloseupHybrid layout). */
export function estimateCloseupHybridBounds(stageIndex: number, genome: HybridGenome): SvgBox {
  const s = Math.max(0, Math.min(7, stageIndex))
  const plantScale = closeupHybridPlantScale(s)
  const growthT = s / 7
  const groundRx = 22 + growthT * 14
  const anchorX = 66
  const anchorY = 136 - (1 - growthT) * 6

  const baseH = BASE_HEIGHT[genome.base] ?? 50
  const hh = baseH * (0.38 + 0.62 * s / 7)
  const treeScale = genome.base === 'tree' ? 0.8 : 1
  const graftScale = genome.base === 'tree' || genome.base === 'vine' ? 0.62 : 0.58
  const graftOff = s >= 3 && genome.graft ? (genome.base === 'tree' ? 12 : genome.base === 'mushroom' ? 7 : 9) : 0

  let plantMinX = -hh * 0.55 * treeScale
  let plantMaxX = Math.max(hh * 0.55 * treeScale, graftOff + hh * 0.45 * graftScale)
  let plantMinY = -hh * treeScale * 1.05

  if (s >= 4) {
    const treeMotif = genome.base === 'tree'
    const msize = (MOTIF_SIZES[s] ?? 0) + (treeMotif ? 14 : 0)
    const motifPad = (msize / 24) * 16
    const my = treeMotif
      ? -hh * treeScale - 38
      : genome.base === 'mushroom'
        ? -hh - 2
        : -hh - 5
    plantMinY = Math.min(plantMinY, my - motifPad - 4)
    if (treeMotif) {
      plantMinY = Math.min(plantMinY, -hh * treeScale * 1.15)
    }
    const auraPad = hh * 0.62 + 10
    plantMinY = Math.min(plantMinY, -hh * 0.55 - auraPad)
  }

  if (s >= 6) {
    plantMinY = Math.min(plantMinY, -hh * treeScale * 1.2)
  }

  if (s === 7 && genome.motif?.paths?.length) {
    plantMinY = Math.min(plantMinY, -hh * 0.82 - (genome.base === 'tree' ? 42 : 18))
    if (genome.base !== 'tree') {
      plantMinX = Math.min(plantMinX, -20)
      plantMaxX = Math.max(plantMaxX, 20)
    }
    if (genome.adornment && genome.adornment !== 'none') {
      plantMinY = Math.min(plantMinY, -hh * 1.35)
    }
  }

  const plantMaxY = 8

  const groundMinX = anchorX - (groundRx + 12)
  const groundMaxX = anchorX + (groundRx + 12)
  const groundMinY = 131
  const groundMaxY = 141

  const minX = Math.min(groundMinX, anchorX + plantMinX * plantScale)
  const maxX = Math.max(groundMaxX, anchorX + plantMaxX * plantScale)
  const minY = Math.min(groundMinY, anchorY + plantMinY * plantScale)
  const maxY = Math.max(groundMaxY, anchorY + plantMaxY * plantScale)

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
