import { Tree, UsersThree, Plus, CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CollaborativeGarden } from '@/lib/types'
import type { PersonalGardenEntry } from '@/lib/garden/personal-gardens'

interface GardenSelectorProps {
  gardens: CollaborativeGarden[]
  activeGardenId: string | null
  onSelectGarden: (gardenId: string | null) => void
  onCreateGarden: () => void
  personalGardens?: PersonalGardenEntry[]
  activePersonalGardenId?: string
  onSelectPersonalGarden?: (gardenId: string) => void
  onStartNewPersonalGarden?: () => void
}

export function GardenSelector({
  gardens,
  activeGardenId,
  onSelectGarden,
  onCreateGarden,
  personalGardens = [],
  activePersonalGardenId,
  onSelectPersonalGarden,
  onStartNewPersonalGarden,
}: GardenSelectorProps) {
  const activeCollab = gardens.find((g) => g.id === activeGardenId)
  const activePersonal = personalGardens.find((g) => g.id === activePersonalGardenId)
  const hasPersonal = personalGardens.length > 0 && onSelectPersonalGarden

  const triggerLabel = activeGardenId
    ? activeCollab?.name || 'Shared'
    : activePersonal?.name || 'My Garden'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 max-w-[7.25rem] shrink-0 gap-1 text-xs sm:max-w-[8.5rem]"
          data-testid="personal-garden-switcher"
        >
          {activeGardenId ? (
            <UsersThree size={14} weight="duotone" className="shrink-0" />
          ) : (
            <Tree size={14} weight="duotone" className="shrink-0" />
          )}
          <span className="truncate">{triggerLabel}</span>
          <CaretDown size={12} className="shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {hasPersonal
          ? personalGardens.map((garden) => (
              <DropdownMenuItem
                key={garden.id}
                onClick={() => {
                  onSelectGarden(null)
                  onSelectPersonalGarden(garden.id)
                }}
                className={
                  !activeGardenId && garden.id === activePersonalGardenId ? 'bg-accent' : ''
                }
              >
                <Tree size={16} className="mr-2" weight="duotone" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{garden.name}</p>
                  {garden.archivedAt ? (
                    <p className="text-[10px] text-muted-foreground">Archived garden</p>
                  ) : null}
                </div>
              </DropdownMenuItem>
            ))
          : (
              <DropdownMenuItem
                onClick={() => onSelectGarden(null)}
                className={!activeGardenId ? 'bg-accent' : ''}
              >
                <Tree size={16} className="mr-2" weight="duotone" />
                My Garden
              </DropdownMenuItem>
            )}

        {gardens.length > 0 ? <DropdownMenuSeparator /> : null}

        {gardens.map((garden) => (
          <DropdownMenuItem
            key={garden.id}
            onClick={() => onSelectGarden(garden.id)}
            className={activeGardenId === garden.id ? 'bg-accent' : ''}
          >
            <UsersThree size={16} className="mr-2" weight="duotone" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{garden.name}</p>
              <p className="text-xs text-muted-foreground">{garden.members.length} members</p>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        {onStartNewPersonalGarden ? (
          <DropdownMenuItem onClick={onStartNewPersonalGarden}>Start new garden…</DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={onCreateGarden}>
          <Plus size={16} className="mr-2" />
          Create shared garden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}