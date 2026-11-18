import { CaretDown, Tree } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PersonalGardenEntry } from '@/lib/garden/personal-gardens'
import { cn } from '@/lib/utils'

interface PersonalGardenSwitcherProps {
  gardens: PersonalGardenEntry[]
  activeGardenId: string
  onSelectGarden: (gardenId: string) => void
  onStartNewGarden: () => void
  className?: string
}

export function PersonalGardenSwitcher({
  gardens,
  activeGardenId,
  onSelectGarden,
  onStartNewGarden,
  className,
}: PersonalGardenSwitcherProps) {
  const active = gardens.find((g) => g.id === activeGardenId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-1.5 text-xs h-8 max-w-[9.5rem]', className)}
          data-testid="personal-garden-switcher"
        >
          <Tree size={14} weight="duotone" className="shrink-0" />
          <span className="truncate">{active?.name ?? 'My Garden'}</span>
          <CaretDown size={12} className="shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {gardens.map((garden) => (
          <DropdownMenuItem
            key={garden.id}
            onClick={() => onSelectGarden(garden.id)}
            className={garden.id === activeGardenId ? 'bg-accent' : ''}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="truncate text-sm">{garden.name}</span>
              {garden.archivedAt ? (
                <span className="text-[10px] text-muted-foreground">Archived garden</span>
              ) : null}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onStartNewGarden}>Start new garden…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}