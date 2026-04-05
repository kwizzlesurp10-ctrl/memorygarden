import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tree, UsersThree, Plus, CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { CollaborativeGarden } from '@/lib/types'

interface GardenSelectorProps {
  gardens: CollaborativeGarden[]
  activeGardenId: string | null
  onSelectGarden: (gardenId: string | null) => void
  onCreateGarden: () => void
}

export function GardenSelector({ gardens, activeGardenId, onSelectGarden, onCreateGarden }: GardenSelectorProps) {
  const activeGarden = gardens.find((g) => g.id === activeGardenId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
          {activeGardenId ? (
            <>
              <UsersThree size={14} weight="duotone" />
              <span className="max-w-[100px] truncate">{activeGarden?.name || 'Shared'}</span>
            </>
          ) : (
            <>
              <Tree size={14} weight="duotone" />
              <span>My Garden</span>
            </>
          )}
          <CaretDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem
          onClick={() => onSelectGarden(null)}
          className={!activeGardenId ? 'bg-accent' : ''}
        >
          <Tree size={16} className="mr-2" weight="duotone" />
          My Garden
        </DropdownMenuItem>

        {gardens.length > 0 && <DropdownMenuSeparator />}

        {gardens.map((garden) => (
          <DropdownMenuItem
            key={garden.id}
            onClick={() => onSelectGarden(garden.id)}
            className={activeGardenId === garden.id ? 'bg-accent' : ''}
          >
            <UsersThree size={16} className="mr-2" weight="duotone" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm">{garden.name}</p>
              <p className="text-xs text-muted-foreground">{garden.members.length} members</p>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateGarden}>
          <Plus size={16} className="mr-2" />
          Create Shared Garden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
