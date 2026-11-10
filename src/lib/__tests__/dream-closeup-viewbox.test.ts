import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { buildCloseupHybrid } from '@/components/plants/hybrid-builder'
import { closeupViewBoxFitsEstimate, DreamPlantCloseupSvg, fitCloseupViewBox } from '@/components/garden/DreamPlantCloseupSvg'
import { estimateCloseupHybridBounds } from '@/lib/garden/closeup-bounds'
import { localGenome } from '@/lib/garden/hybrid'
import { EMBER_DUSK } from '@/lib/garden/palettes'
import { PLANT_STAGES_ORDER } from '@/lib/garden/plant-stages'

const SAMPLE_GENOMES = [
  localGenome('crimson rose on the vineyard trellis'),
  localGenome('ancient oak at dusk'),
  localGenome('wild rosemary and hillside fern'),
]

describe('dream close-up viewBox and art', () => {
  it('renders non-empty closeup svg markup for every stage and sample genome', () => {
    for (const genome of SAMPLE_GENOMES) {
      for (let stageIndex = 0; stageIndex < 8; stageIndex++) {
        const inner = renderToStaticMarkup(
          createElement(
            'g',
            null,
            buildCloseupHybrid(stageIndex, genome, EMBER_DUSK, 0.9, false),
          ),
        )
        expect(inner.length).toBeGreaterThan(60)
        expect(inner).toMatch(/<ellipse|<g|<path/i)
      }
    }
  })

  it('fits padded viewBox around conservative bounds for every stage', () => {
    for (const genome of SAMPLE_GENOMES) {
      for (let stageIndex = 0; stageIndex < PLANT_STAGES_ORDER.length; stageIndex++) {
        const bounds = estimateCloseupHybridBounds(stageIndex, genome)
        const viewBox = fitCloseupViewBox(bounds)
        expect(closeupViewBoxFitsEstimate(viewBox, stageIndex, genome)).toBe(true)
      }
    }
  })

  it('exports a viewBox string on DreamPlantCloseupSvg markup', () => {
    const genome = SAMPLE_GENOMES[0]
    const markup = renderToStaticMarkup(
      createElement(DreamPlantCloseupSvg, {
        stageIndex: 7,
        genome,
        palette: EMBER_DUSK,
        rimStrength: 0.9,
        motion: false,
        stageLabel: 'elder',
      }),
    )
    expect(markup).toContain('data-testid="dream-plant-closeup-svg"')
    expect(markup).toMatch(/viewBox="[^"]+"/)
    expect(markup.length).toBeGreaterThan(100)
  })
})
