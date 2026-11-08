import type { GardenLandscapeView } from '@/lib/types'
import {
  GARDEN_LANDSCAPE_VIEW_META,
  resolveGardenLandscapeView,
} from '@/lib/garden/landscape-view'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface GardenViewPickerProps {
  value: GardenLandscapeView | undefined
  onChange: (view: GardenLandscapeView) => void
  layout?: 'compact' | 'cards'
  className?: string
}

export function GardenViewPicker({
  value,
  onChange,
  layout = 'compact',
  className = '',
}: GardenViewPickerProps) {
  const reducedMotion = useReducedMotion()
  const active = resolveGardenLandscapeView(value)

  if (layout === 'cards') {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`} role="radiogroup" aria-label="Garden landscape view">
        {GARDEN_LANDSCAPE_VIEW_META.map((meta) => {
          const selected = meta.id === active
          return (
            <button
              key={meta.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(meta.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <p className="text-sm font-medium">{meta.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-wrap gap-1 rounded-lg border border-white/15 bg-black/35 p-1 text-[#f0e7da] backdrop-blur-sm ${className}`}
      role="radiogroup"
      aria-label="Garden landscape view"
    >
      {GARDEN_LANDSCAPE_VIEW_META.map((meta) => {
        const selected = meta.id === active
        return (
          <button
            key={meta.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(meta.id)}
            className="rounded-md px-2.5 py-1 text-xs tracking-wide"
            style={{
              background: selected ? 'rgba(240, 231, 218, 0.18)' : 'transparent',
              color: selected ? '#f0e7da' : 'rgba(240, 231, 218, 0.55)',
              transition: reducedMotion ? undefined : 'background 0.2s ease',
            }}
          >
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}
