import { useEffect, useRef, type RefObject } from 'react'

const DEPTHS = [4, 9, 15, 24] as const

export interface ParallaxLayerRefs {
  sky: RefObject<SVGGElement | null>
  far: RefObject<SVGGElement | null>
  mid: RefObject<SVGGElement | null>
  foreground: RefObject<SVGGElement | null>
  frame: RefObject<HTMLDivElement | null>
}

export function useParallaxCursor(
  refs: ParallaxLayerRefs,
  enabled: boolean,
) {
  const dxRef = useRef(0)
  const dyRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      const layers = [refs.sky, refs.far, refs.mid, refs.foreground]
      for (const ref of layers) {
        if (ref.current) ref.current.style.transform = ''
      }
      if (refs.frame.current) refs.frame.current.style.transform = ''
      return
    }

    const apply = () => {
      rafRef.current = null
      const dx = dxRef.current
      const dy = dyRef.current
      const layerEls = [refs.sky.current, refs.far.current, refs.mid.current, refs.foreground.current]
      layerEls.forEach((el, i) => {
        if (!el) return
        const d = DEPTHS[i]
        el.style.transform = `translate(${dx * d}px, ${dy * d}px)`
      })
      if (refs.frame.current) {
        refs.frame.current.style.transform = `rotateY(${dx * 2.6}deg) rotateX(${-dy * 2}deg)`
      }
    }

    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth
      const h = window.innerHeight
      dxRef.current = (e.clientX / w - 0.5) * 2
      dyRef.current = (e.clientY / h - 0.5) * 2
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(apply)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, refs.sky, refs.far, refs.mid, refs.foreground, refs.frame])
}