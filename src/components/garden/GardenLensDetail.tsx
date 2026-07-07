import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Memory } from '@/lib/types'
import type { ScenePalette } from '@/lib/garden/palettes'
import { plantStageToIndex, indexToPlantStage } from '@/lib/garden/stage'
import { SeededPlantSvg } from '@/components/plants/SeededPlantSvg'
import { HybridPlantSvg, HybridGrowthStrip } from '@/components/plants/hybrid-builder'
import type { SeededVariety } from '@/components/plants/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useParallaxCursor } from '@/hooks/useParallaxCursor'

interface GardenLensDetailProps {
  memory: Memory
  palette: ScenePalette
  rimStrength: number
  motion: boolean
  onClose: () => void
}

export function GardenLensDetail({ memory, palette, rimStrength, motion, onClose }: GardenLensDetailProps) {
  const reducedMotion = useReducedMotion()
  const parallaxOn = motion && !reducedMotion
  const plantRef = useRef<SVGGElement>(null)
  const backRef = useRef<SVGGElement>(null)
  const foreRef = useRef<SVGGElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  useParallaxCursor(
    { sky: backRef, far: backRef, mid: plantRef, foreground: foreRef, frame: frameRef },
    parallaxOn,
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isHybrid = memory.isHybrid && memory.hybridGenome
  const variety = memory.plantVariety as SeededVariety

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <div
          ref={frameRef}
          className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          style={{ perspective: parallaxOn ? '1100px' : undefined, background: palette.bank }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full border border-white/25 bg-black/30 px-4 py-1.5 text-sm text-[#f0e7da] hover:bg-black/50"
          >
            zoom out
          </button>

          <svg viewBox="0 0 800 420" className="w-full block" aria-hidden>
            <defs>
              <linearGradient id="detailSky" x1="0" y1="0" x2="0" y2="1">
                {palette.sky.map((c, i) => (
                  <stop key={i} offset={i / (palette.sky.length - 1)} stopColor={c} />
                ))}
              </linearGradient>
            </defs>
            <g ref={backRef}>
              <rect width={800} height={280} fill="url(#detailSky)" />
              <path d="M 0 260 Q 200 220 400 240 T 800 230 L 800 280 L 0 280 Z" fill={palette.hills[0]} />
              <path d="M 0 270 Q 180 250 400 262 T 800 255 L 800 280 L 0 280 Z" fill={palette.hills[1]} />
            </g>
            <g ref={plantRef} transform="translate(400 300) scale(2.2)">
              {isHybrid && memory.hybridGenome ? (
                <HybridPlantSvg genome={memory.hybridGenome} palette={palette} rimStrength={rimStrength} motion={motion} stage={plantStageToIndex(memory.plantStage)} x={0} y={0} scale={1} />
              ) : (
                <SeededPlantSvg
                  variety={variety}
                  stage={memory.plantStage}
                  geneticsSeed={memory.geneticsSeed || memory.id}
                  palette={palette}
                  rimStrength={rimStrength}
                  motion={motion}
                />
              )}
            </g>
            <g ref={foreRef}>
              <ellipse cx={400} cy={310} rx={120} ry={8} fill={palette.hills[2]} opacity={0.85} />
            </g>
          </svg>

          <div ref={panelRef} className="px-6 py-5 space-y-4 text-[#f0e7da] font-serif border-t border-white/8">
            {isHybrid && memory.hybridGenome && (
              <HybridGrowthStrip genome={memory.hybridGenome} palette={palette} rimStrength={rimStrength} motion={motion} />
            )}
            {!isHybrid && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1 min-w-[72px]">
                    <svg width={72} height={90} viewBox="0 0 72 90">
                      <ellipse cx={36} cy={82} rx={20} ry={4} fill={palette.hills[2]} opacity={0.85} />
                      <g transform="translate(36 80) scale(0.9)">
                        <SeededPlantSvg
                          variety={variety}
                          stage={indexToPlantStage(i)}
                          geneticsSeed={memory.geneticsSeed || memory.id}
                          palette={palette}
                          rimStrength={rimStrength}
                          motion={false}
                        />
                      </g>
                    </svg>
                    <span className="text-[10px] uppercase tracking-widest opacity-60">{indexToPlantStage(i)}</span>
                  </div>
                ))}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{isHybrid ? memory.hybridGenome?.name : memory.plantVariety}</h2>
              <p className="text-sm opacity-70 italic mt-1 line-clamp-3">{memory.text}</p>
              <p className="text-xs font-mono opacity-45 mt-2">{memory.date}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}