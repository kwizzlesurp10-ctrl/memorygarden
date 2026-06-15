import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useKV } from '@/lib/storage'
import { useMemoriesKV } from '@/hooks/use-memories-kv'
import { createSeededMemories } from '@/lib/seed-memories'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plant as PlantIcon, Tree } from '@phosphor-icons/react'
import { GardenCanvas } from '@/components/GardenCanvas'
import { PlantMemoryModal } from '@/components/PlantMemoryModal'
import { MemoryCard } from '@/components/MemoryCard'
import { Onboarding } from '@/components/Onboarding'
import { SearchFilterBar } from '@/components/SearchFilterBar'
import { KeyboardShortcutsPanel } from '@/components/KeyboardShortcutsPanel'
import { AppHeader, type ViewMode } from '@/components/AppHeader'
import { useKeyboardShortcuts, APP_SHORTCUTS } from '@/lib/keyboard-shortcuts'
import type { Memory, UserPreferences, AudioRecording, SharedMemory, SearchFilters, CollaborativeGarden, GardenSettings, ActivityEvent, PlantStylePreference, GardenMood, PlantCosmetics, UnlockState, PlantTraits, PlantVariety } from '@/lib/types'

// ── Lazy-loaded non-critical components (modals, dialogs, secondary views) ──
const ExportGarden = lazy(() => import('@/components/ExportGarden').then(m => ({ default: m.ExportGarden })))
const MemoryClusters = lazy(() => import('@/components/MemoryClusters').then(m => ({ default: m.MemoryClusters })))
const ShareMemoryDialog = lazy(() => import('@/components/ShareMemoryDialog').then(m => ({ default: m.ShareMemoryDialog })))
const SharedMemoryView = lazy(() => import('@/components/SharedMemoryView').then(m => ({ default: m.SharedMemoryView })))
const FertilizerBoostModal = lazy(() => import('@/components/FertilizerBoostModal').then(m => ({ default: m.FertilizerBoostModal })))
const CreateGardenDialog = lazy(() => import('@/components/CreateGardenDialog').then(m => ({ default: m.CreateGardenDialog })))
const GardenInviteDialog = lazy(() => import('@/components/GardenInviteDialog').then(m => ({ default: m.GardenInviteDialog })))
const PlantStyleCustomizer = lazy(() => import('@/components/PlantStyleCustomizer').then(m => ({ default: m.PlantStyleCustomizer })))
const GardenUnlocks = lazy(() => import('@/components/GardenUnlocks').then(m => ({ default: m.GardenUnlocks })))
const PlantCosmeticsEditor = lazy(() => import('@/components/PlantCosmeticsEditor').then(m => ({ default: m.PlantCosmeticsEditor })))
const BloomWall = lazy(() => import('@/components/BloomWall').then(m => ({ default: m.BloomWall })))
const ExploreView = lazy(() => import('@/components/ExploreView').then(m => ({ default: m.ExploreView })))
const CommunityGardenView = lazy(() => import('@/components/CommunityGardenView').then(m => ({ default: m.CommunityGardenView })))
const GardenMembersPanel = lazy(() => import('@/components/GardenMembersPanel').then(m => ({ default: m.GardenMembersPanel })))
const ActivityFeed = lazy(() => import('@/components/ActivityFeed').then(m => ({ default: m.ActivityFeed })))
const ContributorLeaderboard = lazy(() => import('@/components/ContributorLeaderboard').then(m => ({ default: m.ContributorLeaderboard })))
import { countUnreadActivity, deriveActivityFromMemories } from '@/lib/activity-helpers'
import { classifyEmotionalTone, generateAIReflection, getPlantStage, getSeason, selectPlantVariety, calculateGrowthMetrics, applyPremiumFertilizer, filterMemories, getActiveFilterCount, computeGardenMood, generateGardenId, generateInviteToken, getDayPeriod, generateHybridTraits } from '@/lib/garden-helpers'
import { ensureUnlockState, generatePlantGenetics, awardForReflection, awardForRevisit, awardForClusterTending, awardForPlanting, applyAward, evaluateUnlocks, applyNewUnlocks, evaluateAchievements, deductRerollCost, canAffordReroll, UNLOCKABLE_ITEMS } from '@/lib/unlock-system'
import { generateGeneticsSeed, computeUnlocks } from '@/lib/trait-system'
import { useProtocolHandler, type ProtocolAction } from '@/hooks/use-protocol-handler'
import { getLocalUser, type LocalUser } from '@/lib/local-user'
import { GardenAmbientLayer } from '@/components/GardenAmbientLayer'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
import { EmptyGarden } from '@/components/EmptyGarden'
import { useCloudSync, type SyncStatus } from '@/hooks/use-cloud-sync'
import { toggleReaction, type ReactionType } from '@/lib/social'

function describeSyncStatus(status: SyncStatus): string | null {
  switch (status.kind) {
    case 'disabled':
      return null
    case 'unavailable':
      return 'Server has no cloud configured'
    case 'syncing':
      return 'Syncing…'
    case 'idle':
      return status.lastSyncAt
        ? `Synced ${new Date(status.lastSyncAt).toLocaleTimeString()}`
        : 'Connected'
    case 'error':
      return `Error: ${status.message}`
  }
}

/**
 * Migrate legacy non-scoped localStorage data into the user-scoped keys so
 * that memories planted before profile-scoping was introduced are not lost.
 * The migration is skipped if the destination key already has data.
 * A module-level set ensures this only runs once per page load per user.
 */
const _migratedProfiles = new Set<string>()
function migrateLegacyData(userId: string) {
  if (_migratedProfiles.has(userId)) return
  _migratedProfiles.add(userId)
  const legacyKeys = ['memories', 'preferences', 'collaborative-gardens', 'garden-activities'] as const
  for (const key of legacyKeys) {
    const legacyStorageKey = `memorygarden:${key}`
    const newStorageKey = `memorygarden:${userId}:${key}`
    try {
      const legacy = localStorage.getItem(legacyStorageKey)
      if (legacy !== null && localStorage.getItem(newStorageKey) === null) {
        localStorage.setItem(newStorageKey, legacy)
      }
    } catch {
      // ignore storage errors
    }
  }
}

function App() {
  // Resolve the local user profile synchronously so that profile-scoped storage
  // keys are stable for the entire component lifecycle.
  const localUser: LocalUser = getLocalUser()
  migrateLegacyData(localUser.id)

  const [user, _setUser] = useState<LocalUser | null>(localUser)
  const [memories, setMemories] = useMemoriesKV(`${localUser.id}:memories`, [])
  const [sharedMemories, setSharedMemories] = useKV<Record<string, SharedMemory>>('shared-memories', {})
  const [preferences, setPreferences] = useKV<UserPreferences>(`${localUser.id}:preferences`, {
    hasCompletedOnboarding: false,
    soundEnabled: false,
    lastVisit: new Date().toISOString(),
  })

  // Seed beautiful example memories only on first-ever load
  useEffect(() => {
    if (!preferences?.hasCompletedOnboarding && memories.length === 0) {
      const seeded = createSeededMemories()
      setMemories(seeded)
      setPreferences(p => ({ ...p, hasCompletedOnboarding: true }))
    }
  }, [preferences, memories])

  const [viewMode, setViewMode] = useState<ViewMode>('garden')
  const [visitingGardenId, setVisitingGardenId] = useState<string | null>(null)
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false)
  const [_activityEvents, _setActivityEvents] = useKV<ActivityEvent[]>(`${localUser.id}:activity-events`, [])
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [aiReflection, setAiReflection] = useState<string>('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [season, setSeason] = useState(getSeason())
  const [dayPeriod, setDayPeriod] = useState(() => getDayPeriod())
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [memoryToShare, setMemoryToShare] = useState<string | null>(null)
  const [sharedMemoryView, setSharedMemoryView] = useState<SharedMemory | null>(null)
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false)
  const [memoryToBoost, setMemoryToBoost] = useState<Memory | null>(null)
  const [growingMemories, setGrowingMemories] = useState<Set<string>>(new Set())
  const [memoryBoostTiers, setMemoryBoostTiers] = useState<Map<string, 'standard' | 'premium' | 'legendary'>>(new Map())
  
  // Cross-pollination state
  const [pollinationParent, setPollinationParent] = useState<Memory | null>(null)
  const [hybridParents, setHybridParents] = useState<[Memory, Memory] | null>(null)

  // Feature 1: Search/Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    emotionalTones: [],
    plantStages: [],
    dateRange: {},
    locations: [],
  })

  // Feature 2: Collaborative Gardens state
  const [collaborativeGardens, setCollaborativeGardens] = useKV<CollaborativeGarden[]>(`${localUser.id}:collaborative-gardens`, [])
  const [activeGardenId, setActiveGardenId] = useState<string | null>(null)
  const [isCreateGardenOpen, setIsCreateGardenOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [showActivityPanel, setShowActivityPanel] = useState(false)
  // Social activity is derived from the synced memory set (see deriveActivityFromMemories),
  // so it propagates across gardeners. We persist only the viewer's last-seen and
  // last-notified timestamps to drive the unread badge and one-shot notifications.
  const [activityLastSeen, setActivityLastSeen] = useKV<string | null>(`${localUser.id}:activity-last-seen`, null)
  const [lastNotifiedAt, setLastNotifiedAt] = useKV<string | null>(`${localUser.id}:activity-last-notified`, null)

  /** Mark the activity stream as seen up to now (clears the unread badge). */
  const markActivitySeen = useCallback(() => {
    setActivityLastSeen(new Date().toISOString())
  }, [setActivityLastSeen])

  // Feature 1: Filtered memories computation
  const filteredMemories = useMemo(
    () => filterMemories(safeMemories, searchQuery, filters),
    [safeMemories, searchQuery, filters]
  )
  const activeFilterCount = useMemo(
    () => getActiveFilterCount(searchQuery, filters),
    [searchQuery, filters]
  )
  const highlightedMemoryIds = useMemo(
    () => (activeFilterCount > 0 ? new Set(filteredMemories.map((m) => m.id)) : null),
    [filteredMemories, activeFilterCount]
  )
  const availableLocations = useMemo(
    () => Array.from(new Set(safeMemories.map((m) => m.location).filter(Boolean) as string[])),
    [safeMemories]
  )

  // Feature 3: Garden mood computation
  const gardenMood = useMemo<GardenMood>(
    () => computeGardenMood(activeFilterCount > 0 ? filteredMemories : safeMemories),
    [safeMemories, filteredMemories, activeFilterCount]
  )

  if (sharedMemoryView) {
    return <Suspense fallback={null}><SharedMemoryView memory={sharedMemoryView} /></Suspense>
  }

  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <Tree size={64} weight="duotone" className="text-primary mx-auto" />
          <h1 className="text-3xl font-bold">MemoryGarden</h1>
          <p className="text-muted-foreground">Loading your garden...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" richColors />

      {safePreferences.hasCompletedOnboarding && (
        <GardenAmbientLayer
          enabled={safePreferences.soundEnabled}
          season={season}
          dayPeriod={dayPeriod}
          weatherType={gardenMood.weatherType}
          memoryCount={safeMemories.length}
        />
      )}
      
      <Onboarding
        open={!safePreferences.hasCompletedOnboarding}
        onComplete={handleCompleteOnboarding}
      />

      <div className="w-full h-screen flex flex-col overflow-hidden">
        <AppHeader
          user={user}
          season={season}
          gardenMood={gardenMood}
          gardens={safeGardens}
          activeGardenId={activeGardenId}
          activeGarden={activeGarden}
          viewMode={viewMode}
          soundEnabled={safePreferences.soundEnabled}
          cloudSyncEnabled={safePreferences.cloudSyncEnabled === true}
          cloudSyncStatusLabel={describeSyncStatus(syncStatus)}
          onSelectGarden={handleSelectGarden}
          onCreateGarden={() => setIsCreateGardenOpen(true)}
          onViewModeChange={setViewMode}
          onToggleSound={(checked) => {
            setPreferences((c) => ({
              ...(c ?? {
                hasCompletedOnboarding: false,
                soundEnabled: false,
                lastVisit: new Date().toISOString(),
              }),
              soundEnabled: checked,
            }))
          }}
          onToggleCloudSync={(checked) => {
            setPreferences((c) => ({
              ...(c ?? {
                hasCompletedOnboarding: false,
                soundEnabled: false,
                lastVisit: new Date().toISOString(),
              }),
              cloudSyncEnabled: checked,
            }))
            if (checked) {
              toast.info('Cloud sync enabled — connecting…')
            } else {
              toast.info('Cloud sync disabled. Local memories are unchanged.')
            }
          }}
          onOpenUnlocks={() => setIsUnlocksOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenPlantStyle={() => setIsStyleCustomizerOpen(true)}
          onInviteToGarden={handleInviteToGarden}
          onOpenShortcuts={() => setIsShortcutsPanelOpen(true)}
          onOpenProtocolTest={() => window.open('/protocol-test.html', '_blank')}
          onToggleActivityPanel={() => setShowActivityPanel((v) => !v)}
          activityCount={unreadActivityCount}
        />

        {/* Feature 1: Search/Filter bar */}
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
          availableLocations={availableLocations}
        />

        <main className="flex-1 relative outline-none" tabIndex={-1}>
          
          <AnimatePresence>
            {pollinationParent && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-6 py-3 bg-accent/90 text-accent-foreground rounded-full shadow-lg backdrop-blur-sm border border-accent flex items-center gap-3 cursor-pointer"
                onClick={() => setPollinationParent(null)}
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="font-medium text-sm">Select a memory to cross-pollinate with (click to cancel)</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {viewMode === 'garden' && (
              <motion.div
                key="garden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                {safeMemories.length === 0 ? (
                  <EmptyGarden onPlantFirst={() => setIsPlantModalOpen(true)} />
                ) : (
                  <SectionErrorBoundary label="garden view">
                    <GardenCanvas
                      memories={safeMemories}
                      onMemoryClick={handleMemoryClick}
                      onMemoryMove={handleMemoryMove}
                      season={season}
                      growingMemories={growingMemories}
                      memoryBoostTiers={memoryBoostTiers}
                      highlightedMemoryIds={highlightedMemoryIds}
                      mood={gardenMood}
                    />
                  </SectionErrorBoundary>
                )}
              </motion.div>
            )}

            {viewMode === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full overflow-y-auto p-4 md:p-8 bg-background"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  <h2 className="text-2xl font-bold mb-8">Timeline</h2>
                  {filteredMemories.length === 0 ? (
                    <p className="text-muted-foreground text-center py-12">
                      {safeMemories.length === 0
                        ? 'No memories yet. Plant your first one to get started!'
                        : 'No memories match your search. Try adjusting your filters.'}
                    </p>
                  ) : (
                    [...filteredMemories]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((memory) => (
                        <motion.div
                          key={memory.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleMemoryClick(memory)}
                          className="flex gap-4 p-4 bg-card rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <img
                            src={memory.photoUrl}
                            alt="Memory"
                            className="w-20 h-20 md:w-32 md:h-32 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground mb-2">
                              {new Date(memory.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="line-clamp-2">{memory.text}</p>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </motion.div>
            )}

            {viewMode === 'clusters' && (
              <motion.div
                key="clusters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <SectionErrorBoundary label="clusters view">
                  <Suspense fallback={null}>
                    <MemoryClusters memories={activeFilterCount > 0 ? filteredMemories : safeMemories} onMemoryClick={handleMemoryClick} />
                  </Suspense>
                </SectionErrorBoundary>
              </motion.div>
            )}

            {viewMode === 'explore' && (
              <motion.div
                key="explore"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <Suspense fallback={null}>
                  {visitingGardenId ? (
                    <CommunityGardenView
                      gardenId={visitingGardenId}
                      userId={localUser.id}
                      userName={localUser.login || 'Anonymous Gardener'}
                      onBack={() => setVisitingGardenId(null)}
                      onPlantMemory={(gardenId) => {
                        toast.info('Plant memory feature coming soon!', {
                          description: `You'll be able to contribute to ${gardenId}`,
                        })
                      }}
                    />
                  ) : (
                    <ExploreView
                      userId={localUser.id}
                      userName={localUser.login || 'Anonymous Gardener'}
                      onVisitGarden={(gardenId) => {
                        console.log("[v0] onVisitGarden called with:", gardenId)
                        setVisitingGardenId(gardenId)
                      }}
                      onJoinGarden={(gardenId) => {
                        toast.success('Welcome to the garden!', { 
                          description: 'You can now water plants and add reflections',
                        })
                        setVisitingGardenId(gardenId)
                      }}
                    />
                  )}
                </Suspense>
              </motion.div>
            )}

            {viewMode === 'bloom' && (
              <motion.div
                key="bloom"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <SectionErrorBoundary label="bloom wall">
                  <Suspense fallback={null}>
                    <BloomWall
                      memories={activeFilterCount > 0 ? filteredMemories : safeMemories}
                      onMemoryClick={handleMemoryClick}
                    />
                  </Suspense>
                </SectionErrorBoundary>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Always-available Plant Memory button (primary action) */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-8 right-8 z-20"
          >
            <Button
              size="lg"
              onClick={() => setIsPlantModalOpen(true)}
              className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Plant a new memory"
            >
              <PlantIcon size={28} weight="fill" />
            </Button>
          </motion.div>
        </main>
      </div>

      <PlantMemoryModal
        open={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        onPlant={handlePlantMemory}
      />

      <MemoryCard
        memory={selectedMemory}
        open={selectedMemory !== null}
        onClose={() => {
          setSelectedMemory(null)
          setAiReflection('')
        }}
        onWater={handleWater}
        onAskAI={handleAskAI}
        onShare={handleShareMemory}
        onBoost={handleOpenBoost}
        onUpdateTraits={handleUpdateTraits}
        onCustomize={selectedMemory ? () => handleOpenCosmeticsEditor(selectedMemory) : undefined}
        onCrossPollinate={handleCrossPollinateInit}
        aiReflection={aiReflection}
        isLoadingAI={isLoadingAI}
        allMemories={safeMemories}
        onNavigate={handleNavigateToMemory}
        onReact={handleReaction}
        currentUserId={user?.id}
      />

      <Suspense fallback={null}>
        <ShareMemoryDialog
          open={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false)
            setMemoryToShare(null)
          }}
          onShare={handleCreateShare}
          existingShareId={memoryToShare ? safeMemories.find(m => m.id === memoryToShare)?.shareId : undefined}
        />

        <FertilizerBoostModal
          open={isBoostModalOpen}
          onClose={() => {
            setIsBoostModalOpen(false)
            setMemoryToBoost(null)
          }}
          memory={memoryToBoost}
          onApplyBoost={handleApplyBoost}
        />

        <ExportGarden
          open={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          memories={activeFilterCount > 0 ? filteredMemories : safeMemories}
        />

        {/* Feature 2: Collaborative Garden Dialogs */}
        <CreateGardenDialog
          open={isCreateGardenOpen}
          onClose={() => setIsCreateGardenOpen(false)}
          onCreate={handleCreateGarden}
        />

        <GardenInviteDialog
          open={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          garden={activeGarden}
          inviteUrl={getInviteUrl()}
        />

        <AnimatePresence>
          {showActivityPanel && activeGarden && (
            <motion.aside
              key="garden-social-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card/95 backdrop-blur-md border-l border-border shadow-2xl z-40 overflow-y-auto"
              role="complementary"
              aria-label="Garden activity and members"
            >
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold truncate">{activeGarden.name}</h2>
                  <p className="text-xs text-muted-foreground">Garden activity</p>
                </div>
                <button
                  className="text-muted-foreground hover:text-foreground text-lg leading-none px-2"
                  onClick={() => setShowActivityPanel(false)}
                  aria-label="Close panel"
                >
                  ×
                </button>
              </div>
              <GardenMembersPanel garden={activeGarden} onInvite={handleInviteToGarden} />
              <div className="border-t border-border" />
              <ContributorLeaderboard
                events={activeGardenActivities}
                members={activeGarden.members}
                currentUserId={user?.id}
              />
              <div className="border-t border-border" />
              <ActivityFeed events={activeGardenActivities} members={activeGarden.members} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Feature 5: Plant Style Customizer */}
        <PlantStyleCustomizer
          open={isStyleCustomizerOpen}
          onClose={() => setIsStyleCustomizerOpen(false)}
          currentStyle={safePreferences.plantStylePreference}
          onSave={handleSavePlantStyle}
        />

        {/* Constraint System: Unlocks & Cosmetics */}
        <GardenUnlocks
          open={isUnlocksOpen}
          onClose={() => setIsUnlocksOpen(false)}
          unlockState={safePreferences.unlockState}
        />

        <PlantCosmeticsEditor
          open={isCosmeticsEditorOpen}
          onClose={() => {
            setIsCosmeticsEditorOpen(false)
            setCosmeticsEditMemory(null)
          }}
          memory={cosmeticsEditMemory}
          unlockState={safePreferences.unlockState}
          onSave={handleSaveCosmetics}
          onReroll={handleRerollGenetics}
        />

        {/* Keyboard Shortcuts Panel */}
        <KeyboardShortcutsPanel
          open={isShortcutsPanelOpen}
          onClose={() => setIsShortcutsPanelOpen(true)}
        />
      </Suspense>
    </>
  )
}

export default App
