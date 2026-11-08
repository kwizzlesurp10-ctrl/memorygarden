import { createElement as h, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { HybridGenome } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { buildDreamHybridPreview } from '@/components/plants/hybrid-builder'

export interface DreamContactSheetOptions {
  samples: string[]
  genomes: HybridGenome[]
  palette: ScenePalette
  cols?: number
  cellW?: number
  cellH?: number
  labelH?: number
  rimStrength?: number
  stage?: number
  background?: string
  title?: string
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

export function renderDreamPlantCellSvg(
  genome: HybridGenome,
  palette: ScenePalette,
  stage = 7,
  rimStrength = 0.92,
): string {
  return renderToStaticMarkup(
    h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 132 150',
        width: 132,
        height: 150,
      },
      ...(buildDreamHybridPreview(genome, palette, stage, rimStrength, 1.28) as ReactNode[]),
    ),
  )
}

export function buildDreamContactSheetSvg(opts: DreamContactSheetOptions): string {
  const cols = opts.cols ?? 4
  const cellW = opts.cellW ?? 184
  const cellH = opts.cellH ?? 206
  const labelH = opts.labelH ?? 34
  const stage = opts.stage ?? 7
  const rimStrength = opts.rimStrength ?? 0.92
  const rows = Math.ceil(opts.samples.length / cols)
  const width = cols * cellW
  const padTop = opts.title ? 20 : 0
  const height = rows * cellH + padTop

  const cells = opts.samples
    .map((idea, i) => {
      const g = opts.genomes[i]!
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = col * cellW
      const y = row * cellH + padTop
      const plantMarkup = renderToStaticMarkup(
        h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 132 150',
            x: (cellW - 132) / 2,
            y: labelH,
            width: 132,
            height: cellH - labelH - 4,
            overflow: 'visible',
          },
          ...(buildDreamHybridPreview(g, opts.palette, stage, rimStrength, 1.28) as ReactNode[]),
        ),
      )
      return `<g transform="translate(${x} ${y})"><text x="8" y="14" font-size="10" fill="#2d2418" font-family="system-ui,sans-serif">${esc(idea)}</text><text x="8" y="27" font-size="8.5" fill="#6a5a48" font-family="system-ui,sans-serif">${esc(g.name)} · ${g.base}</text>${plantMarkup}</g>`
    })
    .join('')

  const bg = opts.background ? `<rect width="${width}" height="${height}" fill="${opts.background}"/>` : ''
  const title = opts.title
    ? `<text x="12" y="14" font-size="11" fill="#3d3024" font-family="system-ui,sans-serif" font-weight="600">${esc(opts.title)}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bg}${title}${cells}</svg>`
}
