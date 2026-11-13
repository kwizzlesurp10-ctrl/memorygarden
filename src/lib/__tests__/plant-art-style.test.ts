import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement as h } from 'react'
import type { ArtStyle } from '@/lib/types'
import {
  PLANT_ART_FILTER_PREFIX,
  PLANT_ART_STYLES,
  plantArtFilterId,
  plantArtFilterUrl,
} from '@/lib/garden/plant-art-style'
import { PlantArtStyleDefs } from '@/components/plants/PlantArtStyleDefs'

describe('plant art style filters', () => {
  it('maps each ArtStyle to a unique filter id', () => {
    const ids = PLANT_ART_STYLES.map((style) => plantArtFilterId(style))
    expect(new Set(ids).size).toBe(PLANT_ART_STYLES.length)
    for (const id of ids) {
      expect(id.startsWith(PLANT_ART_FILTER_PREFIX)).toBe(true)
    }
  })

  it('defines one SVG filter element per ArtStyle', () => {
    const markup = renderToStaticMarkup(h(PlantArtStyleDefs))
    for (const style of PLANT_ART_STYLES) {
      expect(markup).toContain(`id="${plantArtFilterId(style)}"`)
    }
    const filterCount = (markup.match(/<filter /g) ?? []).length
    expect(filterCount).toBe(PLANT_ART_STYLES.length)
  })

  it('uses distinct filter primitives per style (not byte-identical definitions)', () => {
    const markup = renderToStaticMarkup(h(PlantArtStyleDefs))
    const chunks = PLANT_ART_STYLES.map((style: ArtStyle) => {
      const id = plantArtFilterId(style)
      const start = markup.indexOf(`id="${id}"`)
      expect(start).toBeGreaterThan(-1)
      const end = markup.indexOf('</filter>', start)
      return markup.slice(start, end)
    })
    for (let i = 0; i < chunks.length; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        expect(chunks[i]).not.toEqual(chunks[j])
      }
    }
  })

  it('exposes stable filter urls for plant renderers', () => {
    expect(plantArtFilterUrl('pixel-art')).toBe(`url(#${plantArtFilterId('pixel-art')})`)
  })

  it('registers filters in SeededPlantSvg rendering path', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/plants/SeededPlantSvg.tsx'), 'utf8')
    expect(source).toContain('plantArtFilterUrl')
    expect(source).toContain('filter={plantFilter}')
  })
})
