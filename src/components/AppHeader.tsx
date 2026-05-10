import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tree,
  List,
  GridFour,
  SquaresFour,
  Export,
  DotsThree,
  Link as LinkIcon,
  Palette,
  UsersThree,
  Trophy,
  Keyboard,
  SpeakerHigh,
  CloudArrowUp,
} from '@phosphor-icons/react'
import { SeasonIndicator } from '@/components/SeasonIndicator'
import { WeatherIndicator } from '@/components/WeatherIndicator'
import { GardenSelector } from '@/components/GardenSelector'
import type { CollaborativeGarden, GardenMood, Season } from '@/lib/types'
import type { LocalUser } from '@/lib/local-user'

export type ViewMode = 'garden' | 'timeline' | 'clusters' | 'bloom'

export interface AppHeaderProps {
  user: LocalUser
  season: Season
  gardenMood: GardenMood
  gardens: CollaborativeGarden[]
  activeGardenId: string | null
  activeGarden: CollaborativeGarden | null | undefined
  viewMode: ViewMode
  soundEnabled: boolean
  cloudSyncEnabled: boolean
  cloudSyncStatusLabel: string | null
  onSelectGarden: (id: string | null) => void
  onCreateGarden: () => void
  onViewModeChange: (mode: ViewMode) => void
  onToggleSound: (enabled: boolean) => void
  onToggleCloudSync: (enabled: boolean) => void
  onOpenUnlocks: () => void
  onOpenExport: () => void
  onOpenPlantStyle: () => void
  onInviteToGarden: () => void
  onOpenShortcuts: () => void
  onOpenProtocolTest: () => void
}

export function AppHeader(props: AppHeaderProps) {
  const {
    user,
    season,
    gardenMood,
    gardens,
    activeGardenId,
    activeGarden,
    viewMode,
    soundEnabled,
    cloudSyncEnabled,
    cloudSyncStatusLabel,
    onSelectGarden,
    onCreateGarden,
    onViewModeChange,
    onToggleSound,
    onToggleCloudSync,
    onOpenUnlocks,
    onOpenExport,
    onOpenPlantStyle,
    onInviteToGarden,
    onOpenShortcuts,
    onOpenProtocolTest,
  } = props

  return (
    <header className="flex flex-wrap items-center justify-between gap-y-4 px-4 md:px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm z-10 relative">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <Tree size={28} weight="duotone" className="text-primary flex-shrink-0 md:w-8 md:h-8" />
        <h1 className="text-lg md:text-xl font-bold truncate">MemoryGarden</h1>
        <SeasonIndicator season={season} className="hidden sm:flex" />
        <WeatherIndicator mood={gardenMood} className="hidden sm:flex" />
        <GardenSelector
          gardens={gardens}
          activeGardenId={activeGardenId}
          onSelectGarden={onSelectGarden}
          onCreateGarden={onCreateGarden}
        />
      </div>

      <Tabs
        value={viewMode}
        onValueChange={(v) => onViewModeChange(v as ViewMode)}
        className="w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 order-last md:order-none flex justify-center"
      >
        <TabsList>
          <TabsTrigger value="garden" className="flex items-center gap-0 md:gap-2 px-2 md:px-3" title="Garden View">
            <Tree size={18} className="flex-shrink-0" />
            <span className="hidden md:inline">Garden</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-0 md:gap-2 px-2 md:px-3" title="Timeline View">
            <List size={18} className="flex-shrink-0" />
            <span className="hidden md:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="clusters" className="flex items-center gap-0 md:gap-2 px-2 md:px-3" title="Clusters View">
            <GridFour size={18} className="flex-shrink-0" />
            <span className="hidden md:inline">Clusters</span>
          </TabsTrigger>
          <TabsTrigger value="bloom" className="flex items-center gap-0 md:gap-2 px-2 md:px-3" title="Bloom wall">
            <SquaresFour size={18} className="flex-shrink-0" />
            <span className="hidden md:inline">Bloom wall</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
              <DotsThree size={24} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem checked={soundEnabled} onCheckedChange={onToggleSound}>
              <SpeakerHigh size={16} className="mr-2" />
              Garden ambience
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={cloudSyncEnabled} onCheckedChange={onToggleCloudSync}>
              <CloudArrowUp size={16} className="mr-2" />
              <div className="flex flex-col">
                <span>Sync to cloud</span>
                {cloudSyncStatusLabel && (
                  <span className="text-xs text-muted-foreground">{cloudSyncStatusLabel}</span>
                )}
              </div>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenUnlocks}>
              <Trophy size={16} className="mr-2" />
              Garden Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenExport}>
              <Export size={16} className="mr-2" />
              Export Garden
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenPlantStyle}>
              <Palette size={16} className="mr-2" />
              Plant Art Style
            </DropdownMenuItem>
            {activeGarden && (
              <DropdownMenuItem onClick={onInviteToGarden}>
                <UsersThree size={16} className="mr-2" />
                Invite Members
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpenShortcuts}>
              <Keyboard size={16} className="mr-2" />
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenProtocolTest}>
              <LinkIcon size={16} className="mr-2" />
              Protocol Handler Test
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Avatar className="w-8 h-8 md:w-9 md:h-9">
          <AvatarImage src={user.avatarUrl} alt={user.login} />
          <AvatarFallback>{user.login[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
