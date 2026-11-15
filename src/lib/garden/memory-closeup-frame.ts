import type { PlantStage } from '@/lib/types'
import type { SeededVariety } from '@/components/plants/types'
import { plantStageToIndex } from '@/lib/garden/stage'
import { plantPixelViewBox } from '@/lib/garden/plant-art-pixel'

export interface MemoryCloseupLayoutOptions {
  pixelArt?: boolean
}

/** Frame SVG viewBox + plant scale so the full plant fits with a small margin (popup art panel only). */
export function memoryCloseupSvgLayout(
  variety: SeededVariety,
  stage: PlantStage,
  isHybrid: boolean,
  options: MemoryCloseupLayoutOptions = {},
): {
  viewBox: string
  cx: number
  groundY: number
  plantScale: number
  shadow: { cx: number; cy: number; rx: number; ry: number }
} {
  const stageT = plantStageToIndex(stage) / 7
  const isSeedLike = stageT < 0.12
  const bbox = plantPixelViewBox(variety, stage, 1)
  let drawH = bbox.height
  let drawW = bbox.width
  if (isHybrid) {
    drawW *= 1.08
    drawH *= 1.06
  }
  if (variety === 'tree') {
    drawH *= 1.22
    drawW *= 1.04
  } else if (variety === 'vine' || variety === 'fern') {
    drawH *= 1.1
  }

  const targetFill = isSeedLike ? 0.38 : 0.62
  const rawScale = (100 * targetFill) / Math.max(drawH, 14)
  let plantScale = Math.max(rawScale, isSeedLike ? 1.05 : 2.65)
  if (options.pixelArt) {
    plantScale = Math.max(1, Math.round(plantScale * 2) / 2)
  }

  const contentH = drawH * plantScale
  const marginBottom = 7
  const extraTop = variety === 'tree' ? contentH * 0.06 : variety === 'vine' || variety === 'fern' ? contentH * 0.03 : 0
  const vbH = Math.ceil(contentH / targetFill + extraTop)
  const scaledW = drawW * plantScale
  const vbW = Math.ceil(scaledW * 1.18)
  const cx = vbW / 2
  const groundY = vbH - marginBottom
  const shadowRx = Math.max(scaledW * 0.36, 16)

  return {
    viewBox: `0 0 ${vbW} ${vbH}`,
    cx,
    groundY,
    plantScale,
    shadow: {
      cx,
      cy: groundY - 3,
      rx: shadowRx,
      ry: Math.max(3, shadowRx * 0.12),
    },
  }
}