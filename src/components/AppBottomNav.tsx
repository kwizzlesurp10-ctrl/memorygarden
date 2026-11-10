import type { ViewMode } from '@/components/AppHeader'
import {
  Tree,
  List,
  GridFour,
  SquaresFour,
  Globe,
  PersonSimpleWalk,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const MOBILE_VIEWS: { value: ViewMode; label: string; Icon: PhosphorIcon }[] = [
  { value: 'garden', label: 'Garden', Icon: Tree },
  { value: 'walk', label: 'Walk', Icon: PersonSimpleWalk },
  { value: 'timeline', label: 'Timeline', Icon: List },
  { value: 'explore', label: 'Explore', Icon: Globe },
  { value: 'bloom', label: 'Bloom', Icon: SquaresFour },
  { value: 'clusters', label: 'Clusters', Icon: GridFour },
]

export interface AppBottomNavProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function AppBottomNav({ viewMode, onViewModeChange }: AppBottomNavProps) {
  return (
    <nav
      aria-label="Main views (mobile)"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur-md md:hidden"
    >
      <div className="flex items-stretch justify-around gap-0 px-1 pt-1">
        {MOBILE_VIEWS.map(({ value, label, Icon }) => {
          const selected = viewMode === value
          return (
            <button
              key={value}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => onViewModeChange(value)}
              className={cn(
                'flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1 text-[11px] font-medium',
                selected ? 'text-primary' : 'text-foreground/72',
              )}
            >
              <Icon size={22} aria-hidden className="flex-shrink-0" />
              <span className="leading-none">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
