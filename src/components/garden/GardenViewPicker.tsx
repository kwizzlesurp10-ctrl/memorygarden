import type { GardenLandscapeView } from '@/lib/types'
import {
  GARDEN_LANDSCAPE_VIEW_COMPACT_LABEL,
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
      className={`max-sm:grid max-sm:grid-cols-4 max-sm:gap-0.5 max-sm:overflow-visible sm:flex sm:max-w-full sm:flex-nowrap sm:gap-1 sm:overflow-x-auto rounded-lg border border-white/25 bg-[#0d0913]/78 p-1 text-[#faf4ec] backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden ${className}`}
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
            aria-label={meta.label}
            title={meta.label}
            onClick={() => onChange(meta.id)}
            className="min-h-11 min-w-0 shrink rounded-md px-1 py-2 text-[10px] font-medium max-sm:flex max-sm:items-center max-sm:justify-center sm:shrink-0 sm:px-3 sm:text-xs"
            style={{
              background: selected ? 'rgba(240, 231, 218, 0.26)' : 'transparent',
              color: selected ? '#fff8ef' : '#f0e7da',
              transition: reducedMotion ? undefined : 'background 0.2s ease',
            }}
          >
            <span className="sm:hidden">{GARDEN_LANDSCAPE_VIEW_COMPACT_LABEL[meta.id]}</span>
            <span className="hidden sm:inline">{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}
