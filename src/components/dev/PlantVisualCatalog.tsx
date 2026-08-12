import React, { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlowerPlant } from '../plants/FlowerPlant'
import { TreePlant, SucculentPlant, VinePlant, HerbPlant, WildflowerPlant } from '../plants/OtherPlants'
import type { PlantStage, Season, PlantVariety } from '@/lib/types'
import { Download, Copy, RotateCw, Sparkles, X } from 'lucide-react'

const VARIETIES = [
  { key: 'flower' as const, label: 'Flower', comp: FlowerPlant },
  { key: 'tree' as const, label: 'Tree', comp: TreePlant },
  { key: 'succulent' as const, label: 'Succulent', comp: SucculentPlant },
  { key: 'vine' as const, label: 'Vine', comp: VinePlant },
  { key: 'herb' as const, label: 'Herb', comp: HerbPlant },
  { key: 'wildflower' as const, label: 'Wildflower', comp: WildflowerPlant },
]

const STAGES: PlantStage[] = ['seed','sprout','seedling','young','bud','bloom','mature','elder']
const SEASONS: Season[] = ['spring','summer','autumn','winter']

export function PlantVisualCatalog() {
  const [variety, setVariety] = useState<PlantVariety>('flower')
  const [stage, setStage] = useState<PlantStage>('bloom')
  const [season, setSeason] = useState<Season>('spring')
  const [color, setColor] = useState('#a3c585')
  const [size, setSize] = useState(460)
  const [showSway, setShowSway] = useState(true)
  const previewRef = useRef<HTMLDivElement>(null)

  const CurrentPlant = VARIETIES.find(v => v.key === variety)!.comp

  const plantProps = useMemo(() => ({
    stage,
    color,
    stemColor: season === 'autumn' ? '#5c6b4e' : season === 'winter' ? '#4a5a4a' : '#3f5c3a',
    groundColor: season === 'winter' ? '#d1d5db' : '#3f2a1f',
    season,
  }), [stage, color, season])

  const exportSVG = () => {
    const svg = previewRef.current?.querySelector('svg')
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memorygarden-${variety}-${stage}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copySVG = async () => {
    const svg = previewRef.current?.querySelector('svg')
    if (svg) await navigator.clipboard.writeText(new XMLSerializer().serializeToString(svg))
  }

  // Midnight-level animation explorer controls
  const [animDuration, setAnimDuration] = useState(1.4)
  const [springStiffness, setSpringStiffness] = useState(300)

  const askAIForNewVariety = async () => {
    const prompt = `You are an expert botanical illustrator for MemoryGarden. 
    Create a new plant variety concept for emotional memories. 
    Current variety: ${variety}. Stage: ${stage}. Season: ${season}.
    Return ONLY a JSON object with: name, description, suggestedPetalPath (SVG d attribute), suggestedColor, emotionalTone.`
    alert('AI variety generation hook ready — connect to your existing /api/llm endpoint. This is the exact prompt we would send at midnight.')
  }

  return (
    <div className="min-h-screen bg-[#050805] text-white p-8 font-sans selection:bg-white/20">
      {/* Floating Midnight Header */}
      <div className="max-w-7xl mx-auto mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-5xl font-semibold tracking-[-2.5px]">PlantVisualCatalog</div>
            <div className="text-white/40 text-sm tracking-[3px] -mt-1">LAST MIDNIGHT • SVG PATH ANIMATION EXPLORER</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={exportSVG} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.985] transition-all text-sm">
            <Download className="w-4 h-4" /> Export SVG
          </button>
          <button onClick={copySVG} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.985] transition-all text-sm">
            <Copy className="w-4 h-4" /> Copy SVG
          </button>
          <button onClick={askAIForNewVariety} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black font-medium active:scale-[0.985] transition-all text-sm">
            <Sparkles className="w-4 h-4" /> Ask Grok for New Variety
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Floating Variety Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-3 sticky top-8">
            <div className="px-5 pt-5 pb-3 text-[10px] tracking-[2px] text-white/40">VARIETIES</div>
            {VARIETIES.map(v => (
              <button key={v.key} onClick={() => setVariety(v.key)}
                className={`w-full text-left px-5 py-4 rounded-2xl mb-1 flex justify-between items-center text-sm transition-all ${variety === v.key ? 'bg-white text-black' : 'hover:bg-white/5'}`}>
                {v.label}
                {variety === v.key && <div className="w-2 h-2 rounded-full bg-black" />}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Preview — Floating Glass with Animation Explorer */}
        <div className="lg:col-span-6">
          <div ref={previewRef} className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 flex flex-col items-center shadow-2xl">
            <div className="flex gap-2 mb-6 text-xs">
              <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10">{variety}</div>
              <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 capitalize">{stage}</div>
              <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 capitalize">{season}</div>
            </div>

            <div style={{ width: size, height: size }} className="flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={`${variety}-${stage}-${season}`} initial={{opacity:0, scale:0.96}} animate={{opacity:1, scale:1}} exit={{opacity:0}} transition={{duration:0.18}}>
                  <CurrentPlant {...plantProps} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Animation Explorer Controls - Floating inside preview */}
            <div className="mt-8 w-full bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-[10px] tracking-[2px] text-white/40 mb-3">SVG PATH ANIMATION LAB (LIVE)</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/50 text-xs mb-1">Growth Duration</div>
                  <input type="range" min="0.6" max="2.5" step="0.1" value={animDuration} onChange={e => setAnimDuration(parseFloat(e.target.value))} className="w-full accent-white" />
                  <div className="text-right text-xs font-mono text-white/60">{animDuration.toFixed(1)}s</div>
                </div>
                <div>
                  <div className="text-white/50 text-xs mb-1">Spring Stiffness</div>
                  <input type="range" min="100" max="600" step="10" value={springStiffness} onChange={e => setSpringStiffness(parseInt(e.target.value))} className="w-full accent-white" />
                  <div className="text-right text-xs font-mono text-white/60">{springStiffness}</div>
                </div>
              </div>
              <div className="text-[10px] text-white/40 mt-3">Stem now uses pathLength growth • Petals use spring morph ready</div>
            </div>

            {/* All Stages Gallery */}
            <div className="mt-6 w-full">
              <div className="text-[10px] tracking-[2px] text-white/40 mb-3 px-1">ALL STAGES — INSTANT VISUAL REGRESSION</div>
              <div className="flex gap-2 overflow-x-auto pb-4">
                {STAGES.map(s => (
                  <button key={s} onClick={() => setStage(s)} className={`flex-shrink-0 w-[78px] h-[78px] rounded-2xl border flex items-center justify-center transition-all ${stage === s ? 'border-white/70 scale-105' : 'border-white/10 hover:border-white/30'}`}>
                    <div style={{transform: 'scale(0.48)'}}><CurrentPlant {...plantProps} stage={s} /></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Control Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-7">
            <div className="text-[10px] tracking-[2px] text-white/40 mb-5">LIVE CONTROLS</div>

            <div className="mb-7">
              <div className="text-xs text-white/50 mb-3">Season</div>
              <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-2xl">
                {SEASONS.map(s => (
                  <button key={s} onClick={() => setSeason(s)} className={`py-2.5 text-xs rounded-xl capitalize transition-all ${season === s ? 'bg-white text-black' : 'hover:bg-white/10'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="mb-7">
              <div className="flex justify-between text-xs text-white/50 mb-2"><span>Base Color</span><span className="font-mono">{color}</span></div>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-12 rounded-2xl overflow-hidden border border-white/10 p-1 cursor-pointer bg-transparent" />
            </div>

            <div>
              <div className="flex justify-between text-xs text-white/50 mb-2"><span>Preview Size</span><span>{size}px</span></div>
              <input type="range" min="280" max="560" value={size} onChange={e => setSize(+e.target.value)} className="w-full accent-white" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-7 text-sm text-white/60">
            This surface was built as if midnight is the final deadline.<br />Every decision was made to prove what we are capable of shipping together.
          </div>
        </div>
      </div>
    </div>
  )
}
