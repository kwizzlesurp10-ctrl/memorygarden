import type { PlantStage } from '@/lib/types'
import type { SeededVariety } from '@/components/plants/types'
import { plantStageToIndex } from '@/lib/garden/stage'

const APPROX_WIDTH: Partial<Record<SeededVariety, number>> = {
  flower: 78,
  wildflower: 72,
  tree: 156,
  mushroom: 48,
  vine: 70,
  fern: 82,
  succulent: 52,
  herb: 58,
  lotus: 72,
}

const APPROX_HEIGHT_RATIO: Partial<Record<SeededVariety, number>> = {
  tree: 1.42,
  mushroom: 0.92,
  vine: 1.25,
  fern: 1.2,
}

/** Tight SVG framing so the plant fills ~65% of the art panel height. */
export function memoryCloseupSvgLayout(
  variety: SeededVariety,
  stage: PlantStage,
  isHybrid: boolean,
): {
  viewBox: string
  plantTransform: string
  shadow: { cx: number; cy: number; rx: number; ry: number }
} {
  const stageT = plantStageToIndex(stage) / 7
  const baseW = isHybrid ? 88 : (APPROX_WIDTH[variety] ?? 70)
  const heightRatio = APPROX_HEIGHT_RATIO[variety] ?? 1.08
  const drawW = baseW * (0.4 + stageT * 0.58)
  const drawH = drawW * heightRatio * (isHybrid ? 1.06 : 1)
  const panelH = 100
  const tallVariety = heightRatio > 1.12
  const fill = tallVariety ? 0.78 : 0.72
  const rawScale = (panelH * fill) / Math.max(drawH, 14)
  const scale = tallVariety
    ? Math.min(Math.max(rawScale, 0.26), 1.22)
    : Math.max(rawScale, 2.1)
  const scaledW = drawW * scale
  const vbW = Math.ceil(scaledW * (tallVariety ? 1.08 : 1.22))
  const vbH = panelH
  const cx = vbW / 2
  const groundY = vbH * 0.9
  const shadowRx = Math.max(scaledW * 0.38, 18)
  return {
    viewBox: `0 0 ${vbW} ${vbH}`,
    plantTransform: `translate(${cx} ${groundY}) scale(${scale})`,
    shadow: {
      cx,
      cy: groundY - 4,
      rx: shadowRx,
      ry: Math.max(3.5, shadowRx * 0.14),
    },
  }
}