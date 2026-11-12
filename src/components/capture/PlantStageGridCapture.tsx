import { createElement as h, useEffect, useMemo, useRef } from 'react'
import type { PlantStage, PlantVariety } from '@/lib/types'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'
import { todPalette } from '@/lib/garden/day-night'
import { plantStageToIndex } from '@/lib/garden/stage'
import { TREE_STAGE_METRICS } from '@/lib/garden/plant-visual-spec'
import { buildSeededPlant } from '@/components/plants/seeded-builders'
import type { SeededVariety } from '@/components/plants/types'
import { gardenRng } from '@/lib/garden/prng'
import { mountStagePlantPreview } from '@/lib/open-world/plant-stage-renderer'

export const PLANT_STAGE_GRID_KEY = 'mg:plant-stage-grid'
export const PLANT_STAGE_GRID_VARIETY_KEY = 'mg:plant-stage-grid-variety'

function readCaptureVariety(): PlantVariety {
  const raw = sessionStorage.getItem(PLANT_STAGE_GRID_VARIETY_KEY) ?? 'tree'
  return raw === 'flower' ? 'flower' : 'tree'
}

function Stage2DCell({ variety, stage }: { variety: PlantVariety; stage: PlantStage }) {
  const palette = useMemo(() => {
    const p = todPalette(14, 'summer')
    return {
      ...p,
      plantDimBlend: 0,
      starAlpha: 0,
      sil: '#2A4534',
      silSoft: '#3E6B3F',
      glow: '#9DBE6E',
      bank: '#3D2817',
    }
  }, [])
  const nodes = buildSeededPlant(variety as SeededVariety, {
    stageIndex: plantStageToIndex(stage),
    palette,
    rimStrength: 0.55,
    motion: false,
    rng: gardenRng(variety === 'tree' ? 77 + plantStageToIndex(stage) : 99 + plantStageToIndex(stage)),
  })
  const stageIndex = plantStageToIndex(stage)
  let viewBox: string
  let svgHeight: number
  if (variety === 'tree') {
    const st = TREE_STAGE_METRICS[stageIndex] ?? TREE_STAGE_METRICS[7]
    const H = st.H
    const cw = st.cw
    const ch = st.ch
    const canopyTop = H > 0 ? H + ch * 0.82 + cw * 0.42 + 10 : 14
    const padTop = 26 + stageIndex * 4
    const padBottom = 18
    const minY = -(canopyTop + padTop)
    const boxH = canopyTop + padTop + padBottom
    const boxW = Math.max(156, cw * 2.85 + 48)
    viewBox = `${-boxW / 2} ${minY} ${boxW} ${boxH}`
    svgHeight = Math.min(128, 56 + boxH * 0.36)
  } else {
    viewBox = `-56 ${-108 - stageIndex * 9} 112 ${118 + stageIndex * 11}`
    svgHeight = 134 + stageIndex * 9
  }
  return h(
    'div',
    { className: 'overflow-visible', style: { minHeight: svgHeight } },
    h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox,
        className: 'mx-auto block w-full max-w-[150px]',
        height: svgHeight,
        preserveAspectRatio: 'xMidYMid meet',
        style: { overflow: 'visible' },
        'data-testid': `stage-2d-${variety}-${stage}`,
      },
      nodes,
    ),
  )
}

function Stage3DCell({ variety, stage }: { variety: PlantVariety; stage: PlantStage }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const duskPalette = useMemo(() => todPalette(19.5, 'autumn'), [])

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const handle = mountStagePlantPreview(el, variety, stage, duskPalette)
    return () => handle.dispose()
  }, [variety, stage, duskPalette])

  return (
    <div
      ref={hostRef}
      className={
        variety === 'tree'
          ? 'h-[168px] w-full overflow-hidden rounded-lg border border-white/10 bg-[#1a1224]'
          : 'h-[180px] w-full overflow-hidden rounded-lg border border-white/10 bg-[#1a1224]'
      }
      data-testid={`stage-3d-${variety}-${stage}`}
    />
  )
}

function StageColumn({ variety, stage }: { variety: PlantVariety; stage: PlantStage }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-black/35 p-2">
      <p className="text-center text-[10px] uppercase tracking-wide text-[#f0e7da]/75">{stage}</p>
      <Stage2DCell variety={variety} stage={stage} />
      <Stage3DCell variety={variety} stage={stage} />
    </div>
  )
}

export function PlantStageGridCapture() {
  const variety = typeof sessionStorage !== 'undefined' ? readCaptureVariety() : 'tree'
  const label = variety === 'tree' ? 'Tree' : 'Flower'

  return (
    <div
      className="min-h-screen w-full bg-[#120b16] px-4 py-6 text-[#f5efe6]"
      data-testid="plant-stage-grid"
      data-variety={variety}
    >
      <h1 className="mb-4 text-lg font-semibold">
        {label} growth stages — 2D (day) over 3D (dusk)
      </h1>
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-8">
        {PLANT_STAGES_ORDER.map((stage) => (
          <StageColumn key={stage} variety={variety} stage={stage} />
        ))}
      </div>
    </div>
  )
}
