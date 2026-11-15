import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { PlantStage } from '@/lib/types'
import {
  PIXEL_ART_BLOCK_SCREEN_PX,
  plantPixelRasterWidth,
  plantPixelViewBox,
} from '@/lib/garden/plant-art-pixel'
import type { SeededVariety } from './types'

export interface PlantPixelArtRasterLayerProps {
  variety: SeededVariety
  stage: PlantStage
  scale: number
  filterDefs?: ReactNode
  swayStyle?: React.CSSProperties
  children: ReactNode
}

/** Browser-only: rasterize plant SVG subtree to a crisp pixel-art image. */
export function PlantPixelArtRasterLayer({
  variety,
  stage,
  scale,
  filterDefs,
  swayStyle,
  children,
}: PlantPixelArtRasterLayerProps) {
  const hostRef = useRef<SVGGElement>(null)
  const sourceRef = useRef<SVGGElement>(null)
  const [href, setHref] = useState<string | null>(null)
  const box = plantPixelViewBox(variety, stage, scale)

  useLayoutEffect(() => {
    const host = hostRef.current
    const source = sourceRef.current
    if (!host || !source) return

    const serialize = () => {
      const vb = `${box.minX} ${box.minY} ${box.width} ${box.height}`
      const markup = source.innerHTML
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${box.width}" height="${box.height}">
${markup}
</svg>`
      return { svg, vb }
    }

    const rasterize = () => {
      const renderW = Math.max(32, Math.round(box.width * 2))
      const renderH = Math.max(32, Math.round((box.height / box.width) * renderW))
      const lowW = plantPixelRasterWidth(renderW, PIXEL_ART_BLOCK_SCREEN_PX)
      const lowH = Math.max(4, Math.round((renderH / renderW) * lowW))
      const { svg } = serialize()
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = lowW
        canvas.height = lowH
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(url)
          return
        }
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, 0, 0, lowW, lowH)
        const out = document.createElement('canvas')
        out.width = renderW
        out.height = renderH
        const outCtx = out.getContext('2d')
        if (!outCtx) {
          URL.revokeObjectURL(url)
          return
        }
        outCtx.imageSmoothingEnabled = false
        outCtx.drawImage(canvas, 0, 0, renderW, renderH)
        setHref(out.toDataURL('image/png'))
        URL.revokeObjectURL(url)
      }
      img.onerror = () => URL.revokeObjectURL(url)
      img.src = url
    }

    const id = requestAnimationFrame(rasterize)
    return () => cancelAnimationFrame(id)
  }, [box.height, box.minX, box.minY, box.width, children, variety, stage, scale])

  return (
    <g ref={hostRef}>
      {filterDefs}
      <g ref={sourceRef} style={{ ...swayStyle, visibility: 'hidden' }} aria-hidden="true">
        {children}
      </g>
      {href ? (
        <image
          href={href}
          x={box.minX}
          y={box.minY}
          width={box.width}
          height={box.height}
          preserveAspectRatio="none"
          style={{
            imageRendering: 'pixelated',
            shapeRendering: 'crispEdges',
          }}
        />
      ) : (
        <g style={{ ...swayStyle, opacity: 0.35 }}>{children}</g>
      )}
    </g>
  )
}
