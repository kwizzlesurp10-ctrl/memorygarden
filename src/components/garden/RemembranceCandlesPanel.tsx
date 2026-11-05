import { useState } from 'react'
import type { Candle } from '@/lib/types'
import { hashString } from '@/lib/garden/prng'

interface RemembranceCandlesPanelProps {
  candles: Candle[]
  onLight: (candle: Omit<Candle, 'id'>) => void
  onExtinguish: (id: string) => void
  onClose?: () => void
}

export function RemembranceCandlesPanel({ candles, onLight, onExtinguish, onClose }: RemembranceCandlesPanelProps) {
  const [candleDate, setCandleDate] = useState('')
  const [candleNote, setCandleNote] = useState('')

  const lightCandle = () => {
    if (!candleDate) return
    const note = candleNote.trim().slice(0, 80)
    const h = hashString(candleDate + note + String(candles.length))
    const x = 130 + (h % 1000) * 0.94
    const y = 505 + ((h >>> 10) % 145)
    onLight({ date: candleDate, note, x, y })
    setCandleNote('')
  }

  return (
    <div className="rounded-xl border border-white/8 bg-black/30 p-4 text-[#f0e7da] font-serif space-y-3">
      <div className="space-y-1">
        <div className="flex w-full items-center gap-2">
          <span className="rounded-md border border-[#ffd88a]/35 bg-[#ffd88a]/13 px-2 py-0.5 font-mono text-xs text-[#ffd88a]">6a</span>
          <h3 className="text-lg font-semibold">Floating candles</h3>
          {onClose && (
            <button type="button" onClick={onClose} className="ml-auto text-sm opacity-50 hover:opacity-90" aria-label="Close floating candles panel">
              ✕
            </button>
          )}
        </div>
        <p className="text-xs italic opacity-60">a candle on the water, in memory of a life</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={candleDate}
          onChange={(e) => setCandleDate(e.target.value)}
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none color-scheme-dark"
        />
        <input
          type="text"
          value={candleNote}
          onChange={(e) => setCandleNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lightCandle()}
          placeholder="in memory of… (kept private)"
          className="flex-1 min-w-[180px] rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={lightCandle}
          className="rounded-lg border border-[#ffd88a]/40 bg-[#ffd88a]/12 px-5 text-sm tracking-wide text-[#ffd88a]"
        >
          Light a candle
        </button>
      </div>
      {candles.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {[...candles].sort((a, b) => (a.date < b.date ? -1 : 1)).map((cd) => (
            <div key={cd.id} className="flex items-center gap-2 rounded-full border border-[#ffd88a]/20 bg-white/[0.03] px-3 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#ffd88a] shadow-[0_0_8px_2px_rgba(255,216,138,0.5)]" />
              <span className="text-sm">
                <span className="font-mono opacity-70">{cd.date}</span>{' '}
                <span className="italic opacity-85">{cd.note}</span>
              </span>
              <button type="button" onClick={() => onExtinguish(cd.id)} className="text-xs opacity-40 hover:opacity-90" title="Extinguish">✕</button>
            </div>
          ))}
          <span className="text-xs italic opacity-50 ml-1">{candles.length} candle{candles.length === 1 ? '' : 's'} on the water</span>
        </div>
      )}
    </div>
  )
}