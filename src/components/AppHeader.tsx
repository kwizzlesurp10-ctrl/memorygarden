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
  CloudArrowDown,
  Globe,
  ChatCircleDots,
  PersonSimpleWalk,
  UserCircle,
  SignOut,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { SeasonIndicator } from '@/components/SeasonIndicator'
import { WeatherIndicator } from '@/components/WeatherIndicator'
import { GardenSelector } from '@/components/GardenSelector'
import type { CollaborativeGarden, GardenMood, Season } from '@/lib/types'
import type { LocalUser } from '@/lib/local-user'
import { cn } from '@/lib/utils'

export type ViewMode = 'garden' | 'walk' | 'timeline' | 'clusters' | 'bloom' | 'explore'

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
  onOpenBackup: () => void
  onOpenPlantStyle: () => void
  onInviteToGarden: () => void
  onOpenShortcuts: () => void
  onOpenProtocolTest: () => void
  onToggleActivityPanel?: () => void
  isActivityPanelOpen?: boolean
  activityCount?: number
  neonAuthAvailable?: boolean
  accountEmail?: string | null
  onOpenSignIn?: () => void
  onSignOut?: () => void
}

const VIEW_ITEMS: { value: ViewMode; label: string; title: string; Icon: PhosphorIcon }[] = [
  { value: 'garden', label: 'Garden', title: 'Garden View', Icon: Tree },
  { value: 'walk', label: 'Walk', title: 'Walk the garden', Icon: PersonSimpleWalk },
  { value: 'timeline', label: 'Timeline', title: 'Timeline View', Icon: List },
  { value: 'clusters', label: 'Clusters', title: 'Clusters View', Icon: GridFour },
  { value: 'bloom', label: 'Bloom wall', title: 'Bloom wall', Icon: SquaresFour },
  { value: 'explore', label: 'Explore', title: 'Explore Gardens', Icon: Globe },
]

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
    onOpenBackup,
    onOpenPlantStyle,
    onInviteToGarden,
    onOpenShortcuts,
    onOpenProtocolTest,
    onToggleActivityPanel,
    isActivityPanelOpen,
    activityCount = 0,
    neonAuthAvailable = false,
    accountEmail = null,
    onOpenSignIn,
    onSignOut,
  } = props

  const showProtocolTest = import.meta.env.DEV

  return (
    <header className="relative z-10 border-b border-border bg-card/50 px-4 py-3 backdrop-blur-sm md:px-6 md:py-4">
      <div className="grid grid-cols-1 items-center gap-x-3 gap-y-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-4">
        <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden md:gap-3 md:justify-self-start">
          <Tree size={28} weight="duotone" className="flex-shrink-0 text-primary md:h-8 md:w-8" />
          <h1 className="min-w-0 truncate text-lg font-bold md:text-xl">MemoryGarden</h1>
          <SeasonIndicator season={season} className="hidden shrink-0 sm:flex" />
          <WeatherIndicator mood={gardenMood} className="hidden shrink-0 sm:flex" />
        </div>

        <nav
          aria-label="Main views"
          className="relative z-20 flex w-full min-w-0 justify-center overflow-x-auto md:w-auto md:max-w-[min(100%,42rem)] md:justify-self-center"
        >
          <div
            role="list"
            className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-1"
          >
            {VIEW_ITEMS.map(({ value, label, title, Icon }) => {
              const selected = viewMode === value
              return (
                <button
                  key={value}
                  type="button"
                  role="listitem"
                  title={title}
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => onViewModeChange(value)}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                  )}
                >
                  <Icon size={18} className="flex-shrink-0" aria-hidden />
                  <span className="hidden xl:inline">{label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="flex min-w-0 flex-shrink-0 items-center justify-end gap-2 md:gap-2 md:justify-self-end lg:gap-3">
          <GardenSelector
            gardens={gardens}
            activeGardenId={activeGardenId}
            onSelectGarden={onSelectGarden}
            onCreateGarden={onCreateGarden}
          />
          {activeGarden && onToggleActivityPanel && (
            <Button
              variant={isActivityPanelOpen ? 'secondary' : 'ghost'}
              size="icon"
              className="relative h-9 w-9"
              aria-label="Toggle garden activity panel"
              aria-pressed={isActivityPanelOpen}
              onClick={onToggleActivityPanel}
              title="Garden activity & members"
            >
              <ChatCircleDots size={20} weight={isActivityPanelOpen ? 'fill' : 'regular'} />
              {activityCount > 0 && !isActivityPanelOpen && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none"
                >
                  {activityCount > 99 ? '99+' : activityCount}
                </Badge>
              )}
            </Button>
          )}
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
              <DropdownMenuItem onClick={onOpenBackup}>
                <CloudArrowDown size={16} className="mr-2" />
                Backup &amp; restore
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
              {neonAuthAvailable && (
                <>
                  <DropdownMenuSeparator />
                  {accountEmail ? (
                    <>
                      <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                        <UserCircle size={16} className="mr-2" />
                        {accountEmail}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onSignOut}>
                        <SignOut size={16} className="mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={onOpenSignIn}>
                      <UserCircle size={16} className="mr-2" />
                      Sign in (optional)
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenShortcuts}>
                <Keyboard size={16} className="mr-2" />
                Keyboard Shortcuts
              </DropdownMenuItem>
              {showProtocolTest ? (
                <DropdownMenuItem onClick={onOpenProtocolTest}>
                  <LinkIcon size={16} className="mr-2" />
                  Protocol Handler Test
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          <Avatar className="h-8 w-8 md:h-9 md:w-9">
            <AvatarImage src={user.avatarUrl} alt={user.login} />
            <AvatarFallback>{user.login[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
