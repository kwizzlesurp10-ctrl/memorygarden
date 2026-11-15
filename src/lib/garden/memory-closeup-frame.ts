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

/** Tall varieties reframe from measured plant geometry so crowns are not clipped. */
const MEASURED_FRAME_VARIETIES = new Set<SeededVariety>(['tree', 'vine', 'fern'])

export function closeupUsesMeasuredPlantFrame(variety: SeededVariety): boolean {
  return MEASURED_FRAME_VARIETIES.has(variety)
}

export interface SvgBBox {
  x: number
  y: number
  width: number
  height: number
}

/** View box that tightly frames rendered plant geometry with ~marginRatio padding on each side. */
export function closeupViewBoxFromPlantBBox(bbox: SvgBBox, marginRatio = 0.08): string {
  const padX = Math.max(2, bbox.width * marginRatio)
  const padY = Math.max(2, bbox.height * marginRatio)
  const x = bbox.x - padX
  const y = bbox.y - padY
  const w = bbox.width + padX * 2
  const h = bbox.height + padY * 2
  return `${x} ${y} ${w} ${h}`
}

export function closeupShadowFromPlantBBox(bbox: SvgBBox, marginRatio = 0.08): {
  cx: number
  cy: number
  rx: number
  ry: number
} {
  const padX = Math.max(2, bbox.width * marginRatio)
  const cx = bbox.x + bbox.width / 2
  const groundY = bbox.y + bbox.height
  const shadowRx = Math.max(bbox.width * 0.38, 14)
  return {
    cx,
    cy: groundY + padX * 0.15,
    rx: shadowRx,
    ry: Math.max(3, shadowRx * 0.12),
  }
}

/** Tight SVG framing so the plant fills ~65% of the art panel height (r3 baseline; tall plants reframe client-side). */
export function memoryCloseupSvgLayout(
  variety: SeededVariety,
  stage: PlantStage,
  isHybrid: boolean,
): {
  viewBox: string
  plantTransform: string
  scale: number
  shadow: { cx: number; cy: number; rx: number; ry: number }
} {
  const stageT = plantStageToIndex(stage) / 7
  const baseW = isHybrid ? 88 : (APPROX_WIDTH[variety] ?? 70)
  const heightRatio = APPROX_HEIGHT_RATIO[variety] ?? 1.08
  const drawW = baseW * (0.4 + stageT * 0.58)
  const drawH = drawW * heightRatio * (isHybrid ? 1.06 : 1)
  const panelH = 100
  const fill = 0.72
  const rawScale = (panelH * fill) / Math.max(drawH, 14)
  const scale = Math.max(rawScale, 2.1)
  const scaledW = drawW * scale
  const vbW = Math.ceil(scaledW * 1.22)
  const vbH = panelH
  const cx = vbW / 2
  const groundY = vbH * 0.9
  const shadowRx = Math.max(scaledW * 0.38, 18)
  return {
    viewBox: `0 0 ${vbW} ${vbH}`,
    plantTransform: `translate(${cx} ${groundY}) scale(${scale})`,
    scale,
    shadow: {
      cx,
      cy: groundY - 4,
      rx: shadowRx,
      ry: Math.max(3.5, shadowRx * 0.14),
    },
  }
}

export function plantArtPanelFillRatio(svg: SVGSVGElement, plantGroup: SVGGElement): number {
  const panel = svg.closest('[data-testid="memory-plant-closeup-art-panel"]')
  if (!panel || typeof plantGroup.getBBox !== 'function') return 0
  const vb = svg.viewBox.baseVal
  if (vb.height < 1) return 0
  const bbox = plantGroup.getBBox()
  const svgRect = svg.getBoundingClientRect()
  const panelH = panel.getBoundingClientRect().height
  if (panelH < 1) return 0
  const scale = Math.min(svgRect.width / vb.width, svgRect.height / vb.height)
  const plantPxH = bbox.height * scale
  return plantPxH / panelH
}

export function assertCloseupPlantFill(
  fillRatio: number,
  stage: PlantStage,
): { ok: boolean; reason?: string } {
  if (plantStageToIndex(stage) < plantStageToIndex('bloom')) return { ok: true }
  if (fillRatio < 0.45) {
    return { ok: false, reason: `fill ${fillRatio.toFixed(3)} below 0.45` }
  }
  if (fillRatio > 0.95) {
    return { ok: false, reason: `fill ${fillRatio.toFixed(3)} above 0.95 (cropped)` }
  }
  return { ok: true }
}