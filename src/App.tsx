import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useKV } from '@/lib/storage'
import { useMemoriesKV } from '@/hooks/use-memories-kv'
import { createGardenStarterDecor } from '@/lib/garden/garden-starter-decor'
import { seedFromGenetics } from '@/lib/garden/prng'
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
import { GardenBackupDialog } from '@/components/GardenBackupDialog'
import { useKeyboardShortcuts, APP_SHORTCUTS } from '@/lib/keyboard-shortcuts'
import type { Memory, UserPreferences, AudioRecording, SharedMemory, SearchFilters, CollaborativeGarden, GardenSettings, ActivityEvent, PlantStylePreference, GardenMood, PlantCosmetics, UnlockState, PlantTraits, PlantVariety, HybridGenome, GardenLandscapeView } from '@/lib/types'
import { EditPlantDialog, type EditPlantPayload } from '@/components/EditPlantDialog'

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
const PlantCommunityGardenModal = lazy(() =>
  import('@/components/PlantCommunityGardenModal').then((m) => ({ default: m.PlantCommunityGardenModal })),
)
const GardenMembersPanel = lazy(() => import('@/components/GardenMembersPanel').then(m => ({ default: m.GardenMembersPanel })))
const ActivityFeed = lazy(() => import('@/components/ActivityFeed').then(m => ({ default: m.ActivityFeed })))
const ContributorLeaderboard = lazy(() => import('@/components/ContributorLeaderboard').then(m => ({ default: m.ContributorLeaderboard })))
const OpenWorldGarden = lazy(() => import('@/components/open-world/OpenWorldGarden').then(m => ({ default: m.OpenWorldGarden })))
import { countUnreadActivity, deriveActivityFromMemories } from '@/lib/activity-helpers'
import { classifyEmotionalTone, generateAIReflection, getPlantStage, getSeason, selectPlantVariety, calculateGrowthMetrics, applyPremiumFertilizer, filterMemories, getActiveFilterCount, computeGardenMood, generateGardenId, generateInviteToken, getDayPeriod, generateHybridTraits, plantStageAfterGrowth, applyManualPlantStage } from '@/lib/garden-helpers'
import { memoryPrimaryLabel } from '@/lib/memory-display'
import { realClockTod, todToDayPeriod } from '@/lib/garden/day-night'
import { ensureUnlockState, generatePlantGenetics, awardForReflection, awardForRevisit, awardForClusterTending, awardForPlanting, applyAward, evaluateUnlocks, applyNewUnlocks, evaluateAchievements, deductRerollCost, canAffordReroll, UNLOCKABLE_ITEMS } from '@/lib/unlock-system'
import { generateGeneticsSeed, computeUnlocks } from '@/lib/trait-system'
import { useProtocolHandler, type ProtocolAction } from '@/hooks/use-protocol-handler'
import { getLocalUser, type LocalUser } from '@/lib/local-user'
import { GardenAmbientLayer } from '@/components/GardenAmbientLayer'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
import { EmptyGarden } from '@/components/EmptyGarden'
import { useCloudSync, type SyncStatus } from '@/hooks/use-cloud-sync'
import { toggleReaction, type ReactionType } from '@/lib/social'
import { skuForFertilizerLevel } from '@/lib/payments/catalog'
import { applyCosmeticPackToUnlockState } from '@/lib/payments/entitlements'
import { redirectToCheckout } from '@/lib/payments/client'
import { resolvePaidCheckoutSession } from '@/lib/payments/apply-return'
const NeonAuthPanel = lazy(() => import('@/components/auth/NeonAuthPanel').then((m) => ({ default: m.NeonAuthPanel })))
import { isNeonAuthConfigured } from '@/lib/auth/config'
import { getAuthClient } from '@/lib/auth/neon-auth-client'
import { completeSignInLinking } from '@/lib/auth/complete-sign-in'
import { applyRestoredEntitlementsToUnlockState } from '@/lib/auth/restore-purchases'

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

  // Persistent starter scenery for new empty gardens (not memories).
  useEffect(() => {
    if (memories.length > 0) return
    if (preferences?.gardenStarterDecor) return
    const gardenSeed = seedFromGenetics(localUser.id, 'starter-garden')
    const decor = createGardenStarterDecor(gardenSeed)
    setPreferences((p) => {
      const base: UserPreferences = p ?? {
        hasCompletedOnboarding: false,
        soundEnabled: false,
        lastVisit: new Date().toISOString(),
      }
      return { ...base, gardenStarterDecor: decor }
    })
  }, [memories.length, preferences?.gardenStarterDecor, localUser.id, setPreferences])

  const neonAuthAvailable = isNeonAuthConfigured()
  const [neonAuthOpen, setNeonAuthOpen] = useState(false)
  const [accountEmail, setAccountEmail] = useState<string | null>(null)

  const [viewMode, setViewMode] = useState<ViewMode>('garden')
  const [visitingGardenId, setVisitingGardenId] = useState<string | null>(null)
  const [visitingGardenName, setVisitingGardenName] = useState<string | null>(null)
  const [communityPlantOpen, setCommunityPlantOpen] = useState(false)
  const [communityGardenRefresh, setCommunityGardenRefresh] = useState(0)
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false)
  const [_activityEvents, _setActivityEvents] = useKV<ActivityEvent[]>(`${localUser.id}:activity-events`, [])
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [aiReflection, setAiReflection] = useState<string>('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [season, setSeason] = useState(getSeason())
  const [todHours, setTodHours] = useState(() => realClockTod())
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

  // Feature 5: AI Plant Style state
  const [isStyleCustomizerOpen, setIsStyleCustomizerOpen] = useState(false)
  const [isEditPlantOpen, setIsEditPlantOpen] = useState(false)

  // Constraint / Unlock system state
  const [isUnlocksOpen, setIsUnlocksOpen] = useState(false)
  const [isCosmeticsEditorOpen, setIsCosmeticsEditorOpen] = useState(false)
  const [cosmeticsEditMemory, setCosmeticsEditMemory] = useState<Memory | null>(null)
  const [isShortcutsPanelOpen, setIsShortcutsPanelOpen] = useState(false)

  const fallbackPreferences = useMemo(
    (): UserPreferences => ({
      hasCompletedOnboarding: false,
      soundEnabled: false,
      lastVisit: '',
    }),
    []
  )
  const safeMemories = useMemo(() => memories || [], [memories])
  const safePreferences = useMemo(
    () => preferences ?? fallbackPreferences,
    [preferences, fallbackPreferences]
  )
  const safeGardens = useMemo(() => collaborativeGardens || [], [collaborativeGardens])
  const activeGarden = safeGardens.find((g) => g.id === activeGardenId) ?? null
  // Activity is derived from synced memories rather than scoped per garden, since
  // memories carry no gardenId. This is the shared, cross-gardener source of truth.
  const activeGardenActivities = useMemo(
    () => deriveActivityFromMemories(safeMemories),
    [safeMemories]
  )
  const unreadActivityCount = useMemo(
    () => countUnreadActivity(activeGardenActivities, activityLastSeen ?? undefined, user?.id),
    [activeGardenActivities, activityLastSeen, user?.id]
  )

  // Keep the stream marked seen while the panel is open, so the badge stays
  // cleared as new activity arrives.
  useEffect(() => {
    if (showActivityPanel) markActivitySeen()
  }, [showActivityPanel, activeGardenActivities.length, markActivitySeen])

  // Notify the planter when another gardener tends a memory they planted. Because
  // this derives from synced memories, it fires once the contributor's reflection
  // has propagated. A baseline timestamp on first observation avoids toasting the
  // whole backlog.
  useEffect(() => {
    if (!user) return
    const fresh = activeGardenActivities.filter((e) => {
      if (e.type !== 'reflect' || e.userId === user.id || !e.memoryId) return false
      const memory = safeMemories.find((m) => m.id === e.memoryId)
      return memory?.plantedBy?.id === user.id
    })
    if (fresh.length === 0) return

    if (!lastNotifiedAt) {
      setLastNotifiedAt(new Date().toISOString())
      return
    }

    const toNotify = fresh
      .filter((e) => e.createdAt > lastNotifiedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    if (toNotify.length === 0) return

    for (const e of toNotify) {
      toast(`${e.userLogin} tended your memory 🌱`)
    }
    setLastNotifiedAt(toNotify[toNotify.length - 1].createdAt)
  }, [activeGardenActivities, safeMemories, user, lastNotifiedAt, setLastNotifiedAt])

  /** Process unlock state: evaluate new unlocks/achievements and notify */
  const processUnlockUpdates = useCallback((currentState: UnlockState): UnlockState => {
    let state = currentState

    // Evaluate cosmetic unlocks
    const newUnlocks = evaluateUnlocks(state)
    const hasNewUnlocks = newUnlocks.newPalettes.length > 0 || newUnlocks.newPatterns.length > 0 || newUnlocks.newAdornments.length > 0
    if (hasNewUnlocks) {
      state = applyNewUnlocks(state, newUnlocks)
      const allNew = [...newUnlocks.newPalettes, ...newUnlocks.newPatterns, ...newUnlocks.newAdornments]
      for (const id of allNew) {
        const item = UNLOCKABLE_ITEMS.find(i => i.id === id)
        const displayName = item?.name || id
        toast.success(`🌿 Unlocked: ${displayName}`, { description: 'Check your Garden Collection!' })
      }
    }

    // Evaluate achievements
    const { newAchievements, starlightEarned } = evaluateAchievements(state)
    if (newAchievements.length > 0) {
      state = {
        ...state,
        achievements: [...state.achievements, ...newAchievements],
        wallet: { ...state.wallet, starlight: state.wallet.starlight + starlightEarned },
      }
      for (const ach of newAchievements) {
        toast.success(`🏆 Achievement: ${ach.name}`, { description: ach.description })
      }
    }

    return state
  }, [])

  /** Update the unlock state in preferences with counter changes and process unlocks */
  const updateUnlockState = useCallback((updater: (state: UnlockState) => UnlockState) => {
    setPreferences((current) => {
      const base = current || { hasCompletedOnboarding: false, soundEnabled: false, lastVisit: '' }
      const currentUnlock = ensureUnlockState(base.unlockState)
      const updated = updater(currentUnlock)
      const processed = processUnlockUpdates(updated)
      return { ...base, unlockState: processed }
    })
  }, [setPreferences, processUnlockUpdates])

  const refreshAccountEmail = useCallback(async () => {
    if (!neonAuthAvailable) return
    const client = getAuthClient()
    if (!client) return
    try {
      const { data } = await client.getSession()
      const email =
        data && 'user' in data && data.user && typeof data.user.email === 'string'
          ? data.user.email
          : null
      setAccountEmail(email)
    } catch {
      setAccountEmail(null)
    }
  }, [neonAuthAvailable])

  const handleNeonSignInComplete = useCallback(async () => {
    try {
      const entitlements = await completeSignInLinking(localUser.id)
      updateUnlockState((state) => applyRestoredEntitlementsToUnlockState(state, entitlements))
      await refreshAccountEmail()
      toast.success('Signed in — browser profile linked; purchase unlocks restored where available.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not link account'
      toast.error(message)
    }
  }, [localUser.id, refreshAccountEmail, updateUnlockState])

  const handleNeonSignOut = useCallback(async () => {
    const client = getAuthClient()
    if (client) {
      await client.signOut()
    }
    setAccountEmail(null)
    toast.message('Signed out — your local garden is unchanged.')
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('share')

    if (shareId && sharedMemories) {
      const sharedMem = sharedMemories[shareId]
      if (sharedMem) {
        queueMicrotask(() => {
          setSharedMemoryView(sharedMem)
        })
      }
    }
  }, [sharedMemories])

  useEffect(() => {
    if (preferences && memories && memories.length === 0 && preferences.hasCompletedOnboarding) {
      setTimeout(() => setIsPlantModalOpen(true), 1000)
    }
  }, [preferences, memories])

  useEffect(() => {
    const interval = setInterval(() => {
      setSeason(getSeason())
    }, 3600000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setTodHours(realClockTod()), 60_000)
    return () => clearInterval(id)
  }, [])

  const handleCompleteOnboarding = (landscapeView?: GardenLandscapeView) => {
    setPreferences((current) => ({
      soundEnabled: current?.soundEnabled || false,
      lastVisit: current?.lastVisit || new Date().toISOString(),
      hasCompletedOnboarding: true,
      ...(landscapeView ? { gardenLandscapeView: landscapeView } : {}),
    }))
    setIsPlantModalOpen(true)
  }

  const handleLandscapeViewChange = useCallback((view: GardenLandscapeView) => {
    setPreferences((current) => ({
      ...(current ?? fallbackPreferences),
      gardenLandscapeView: view,
    }))
  }, [setPreferences, fallbackPreferences])

  const handleEditPlantSave = useCallback((memoryId: string, payload: EditPlantPayload) => {
    setMemories((currentMemories) => {
      const next = (currentMemories || []).map((m) => {
        if (m.id !== memoryId) return m
        const nearby = (currentMemories || []).filter(
          (nm) =>
            nm.id !== memoryId &&
            Math.abs(nm.position.x - m.position.x) < 300 &&
            Math.abs(nm.position.y - m.position.y) < 300,
        )
        const withFields: Memory = {
          ...m,
          text: payload.text,
          linkUrl: payload.linkUrl,
          plantVariety: payload.plantVariety,
          traits: payload.traits,
        }
        return applyManualPlantStage({ ...withFields, plantStage: payload.plantStage }, payload.plantStage, nearby)
      })
      const edited = next.find((m) => m.id === memoryId)
      if (edited) setSelectedMemory(edited)
      return next
    })
    setIsEditPlantOpen(false)
    toast.success('Plant updated')
  }, [setMemories])

  const handlePlantMemory = async (data: {
    photoFile?: File
    text: string
    date: string
    location?: string
    linkUrl?: string
    audioRecordings: AudioRecording[]
    plantVariety: PlantVariety
  }) => {
    const finishPlanting = async (photoUrl: string) => {
      const toneSource = data.text.trim() || data.linkUrl?.trim() || ''
      const emotionalTone = await classifyEmotionalTone(toneSource)

      let finalTraits: PlantTraits = {}
      let finalVariety = data.plantVariety ?? selectPlantVariety(emotionalTone, data.text)
      let finalGeneticsSeed = generateGeneticsSeed()
      let isHybrid = false
      let parentMemories: string[] | undefined = undefined

      if (hybridParents) {
        const hybridData = generateHybridTraits(hybridParents[0], hybridParents[1])
        finalTraits = hybridData.traits
        finalGeneticsSeed = hybridData.geneticsSeed
        finalVariety = hybridData.variety
        isHybrid = true
        parentMemories = [hybridParents[0].id, hybridParents[1].id]
        setHybridParents(null)
      }

      const newMemory: Memory = {
        id: `memory-${Date.now()}`,
        photoUrl,
        text: data.text,
        date: data.date,
        location: data.location,
        linkUrl: data.linkUrl,
        plantedAt: new Date().toISOString(),
        position: {
          x: 180 + Math.random() * 840,
          y: 430 + Math.random() * 35,
        },
        emotionalTone,
        plantVariety: finalVariety,
        plantStage: 'seed',
        visitCount: 0,
        reflections: [],
        audioRecordings: data.audioRecordings,
        geneticsSeed: finalGeneticsSeed,
        traits: finalTraits,
        unlocks: [],
        genetics: generatePlantGenetics(`${Date.now()}-${Math.random().toString(36).substring(2)}`),
        plantedBy: user
          ? { id: user.id, login: user.login, avatarUrl: user.avatarUrl }
          : undefined,
        isHybrid,
        parentMemories,
      }

      setMemories((currentMemories) => [...(currentMemories || []), newMemory])

      const currentSeason = getSeason()
      const seasonKey = `${currentSeason}-${new Date().getFullYear()}`
      updateUnlockState((state) => {
        const award = awardForPlanting()
        return {
          ...state,
          wallet: applyAward(state.wallet, award),
          counters: {
            ...state.counters,
            totalMemoriesPlanted: state.counters.totalMemoriesPlanted + 1,
            seasonalPlantings: {
              ...state.counters.seasonalPlantings,
              [seasonKey]: (state.counters.seasonalPlantings[seasonKey] || 0) + 1,
            },
          },
        }
      })

      setGrowingMemories((prev) => new Set(prev).add(newMemory.id))
      setTimeout(() => {
        setGrowingMemories((prev) => {
          const next = new Set(prev)
          next.delete(newMemory.id)
          return next
        })
      }, 3000) // matches PLANTING_CELEBRATION_MS in PlantMemoryModal
    }

    if (!data.photoFile) {
      await finishPlanting('')
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(data.photoFile)

    return new Promise<void>((resolve, reject) => {
      reader.onload = async () => {
        try {
          await finishPlanting(reader.result as string)
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  }

  const handlePlantHybrid = useCallback((genome: HybridGenome, idea: string, position: { x: number; y: number }) => {
    const newMemory: Memory = {
      id: `memory-${Date.now()}`,
      photoUrl: '',
      text: idea || genome.essence,
      date: new Date().toISOString().slice(0, 10),
      plantedAt: new Date().toISOString(),
      position,
      emotionalTone: 'nostalgic',
      plantVariety: genome.base,
      plantStage: 'seed',
      visitCount: 0,
      reflections: [],
      audioRecordings: [],
      geneticsSeed: String(genome.seed),
      isHybrid: true,
      hybridGenome: genome,
      traits: {},
      unlocks: [],
      genetics: generatePlantGenetics(String(genome.seed)),
    }
    setMemories((current) => [...(current || []), newMemory])
    setGrowingMemories((prev) => new Set(prev).add(newMemory.id))
    setTimeout(() => {
      setGrowingMemories((prev) => {
        const next = new Set(prev)
        next.delete(newMemory.id)
        return next
      })
    }, 1200)
  }, [setMemories])

  const handleMemoryClick = (memory: Memory) => {
    if (pollinationParent) {
      if (pollinationParent.id === memory.id) {
        toast.error('Cannot cross-pollinate a memory with itself.')
        setPollinationParent(null)
        return
      }
      setHybridParents([pollinationParent, memory])
      setPollinationParent(null)
      setIsPlantModalOpen(true)
      toast.success('Parents linked! Now plant your hybrid seed.')
      return
    }

    const nearbyMemories = (memories || []).filter(
      (m) =>
        m.id !== memory.id &&
        Math.abs(m.position.x - memory.position.x) < 300 &&
        Math.abs(m.position.y - memory.position.y) < 300
    )
    
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) => {
        if (m.id === memory.id) {
          const updatedMemory = {
            ...m,
            visitCount: m.visitCount + 1,
            lastVisited: new Date().toISOString(),
          }
          const growthMetrics = calculateGrowthMetrics(updatedMemory, nearbyMemories)
          const updatedWithStage = {
            ...updatedMemory,
            growthMetrics,
            plantStage: plantStageAfterGrowth(updatedMemory, growthMetrics),
          }
          return {
            ...updatedWithStage,
            unlocks: computeUnlocks(updatedWithStage),
          }
        }
        return m
      })
    )
    
    const updatedMemory = (memories || []).find((m) => m.id === memory.id)
    setSelectedMemory(updatedMemory || memory)
    setAiReflection('')

    // Track visit counters and award currencies
    updateUnlockState((state) => {
      let updated = { ...state, counters: { ...state.counters, totalVisits: state.counters.totalVisits + 1 } }

      // Night visit tracking
      const period = todToDayPeriod(todHours)
      if (period === 'night') {
        const today = new Date().toISOString().slice(0, 10)
        if (!updated.counters.nightVisitDates.includes(today)) {
          updated = {
            ...updated,
            counters: {
              ...updated.counters,
              nightVisitDates: [...updated.counters.nightVisitDates, today],
              nightVisitDays: updated.counters.nightVisitDays + 1,
            },
          }
        }
      }

      // Sunlight for revisiting old memories
      const revisitAward = awardForRevisit(memory)
      if (revisitAward) {
        updated = { ...updated, wallet: applyAward(updated.wallet, revisitAward) }
        const daysSincePlanted = Math.floor(
          (Date.now() - new Date(memory.plantedAt).getTime()) / 86400000
        )
        if (daysSincePlanted >= 60) {
          updated = {
            ...updated,
            counters: {
              ...updated.counters,
              uniqueOldMemoriesRevisited: updated.counters.uniqueOldMemoriesRevisited + 1,
            },
          }
        }
      }

      // Pollen for cluster interactions
      const clusterAward = awardForClusterTending(nearbyMemories.length)
      if (clusterAward) {
        updated = {
          ...updated,
          wallet: applyAward(updated.wallet, clusterAward),
          counters: { ...updated.counters, clustersTended: updated.counters.clustersTended + 1 },
        }
      }

      // Track mature/elder milestones
      const currentStage = getPlantStage(memory)
      if (currentStage === 'mature' || currentStage === 'elder') {
        let reachedMature = 0
        let reachedElder = 0
        for (const m of (memories || [])) {
          const s = getPlantStage(m)
          if (s === 'mature' || s === 'elder') reachedMature++
          if (s === 'elder') reachedElder++
        }
        updated = {
          ...updated,
          counters: {
            ...updated.counters,
            memoriesReachedMature: reachedMature,
            memoriesReachedElder: reachedElder,
          },
        }
      }

      return updated
    })
  }

  const handleProtocolAction = useCallback((action: ProtocolAction) => {
    switch (action.type) {
      case 'plant-memory':
        if (safePreferences.hasCompletedOnboarding) {
          setIsPlantModalOpen(true)
          if (action.data) {
            toast.info('Opening plant memory modal with data')
          }
        }
        break
      case 'view-memory': {
        const found = safeMemories.find((m) => m.id === action.id)
        if (found) {
          handleMemoryClick(found)
        } else {
          toast.error('Memory not found')
        }
        break
      }
      case 'unknown':
        toast.info(`Protocol handler invoked: ${action.protocol}`)
        break
    }
  }, [handleMemoryClick, safeMemories, safePreferences])

  useProtocolHandler(handleProtocolAction)

  const handleNavigateToMemory = (memoryId: string) => {
    const memory = safeMemories.find(m => m.id === memoryId)
    if (memory) {
      handleMemoryClick(memory)
    }
  }

  const handleMemoryMove = (memoryId: string, newPosition: { x: number; y: number }) => {
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) =>
        m.id === memoryId ? { ...m, position: newPosition } : m
      )
    )
  }

  const handleWater = async (memoryId: string, reflectionText: string) => {
    const tendedMemory = (memories || []).find((m) => m.id === memoryId)
    const planter = tendedMemory?.plantedBy
    const isTend = !!(planter && user && planter.id !== user.id)

    setMemories((currentMemories) =>
      (currentMemories || []).map((m) => {
        if (m.id === memoryId) {
          const updatedMemory = {
            ...m,
            reflections: [
              ...m.reflections,
              {
                id: `reflection-${Date.now()}`,
                text: reflectionText,
                createdAt: new Date().toISOString(),
                tone: m.emotionalTone,
                contributorId: user?.id,
                contributorLogin: user?.login,
                contributorAvatarUrl: user?.avatarUrl,
                isTend,
              },
            ],
          }
          const nearbyMemories = (currentMemories || []).filter(
            (nm) =>
              nm.id !== memoryId &&
              Math.abs(nm.position.x - m.position.x) < 300 &&
              Math.abs(nm.position.y - m.position.y) < 300
          )
          const growthMetrics = calculateGrowthMetrics(updatedMemory, nearbyMemories)
          const updatedWithStage = {
            ...updatedMemory,
            growthMetrics,
            plantStage: plantStageAfterGrowth(updatedMemory, growthMetrics),
          }
          return {
            ...updatedWithStage,
            unlocks: computeUnlocks(updatedWithStage),
          }
        }
        return m
      })
    )
    
    const updatedMemory = (memories || []).find((m) => m.id === memoryId)
    if (updatedMemory) {
      setSelectedMemory(updatedMemory)
    }

    // Award dew for reflection and track counter
    updateUnlockState((state) => {
      const award = awardForReflection()
      const newReflectionCount = (memories || []).reduce((sum, m) => sum + m.reflections.length, 0) + 1
      const memory = (memories || []).find(m => m.id === memoryId)
      const waterCount = memory ? memory.reflections.length + 1 : 1
      const memoriesWatered3 = [...state.counters.memoriesWatered3]
      if (waterCount >= 3 && !memoriesWatered3.includes(memoryId)) {
        memoriesWatered3.push(memoryId)
      }
      return {
        ...state,
        wallet: applyAward(state.wallet, award),
        counters: {
          ...state.counters,
          totalReflections: newReflectionCount,
          memoriesWatered3,
        },
      }
    })
  }

  const handleReaction = useCallback(
    (memoryId: string, reactionType: ReactionType) => {
      setMemories((currentMemories) =>
        (currentMemories || []).map((m) =>
          m.id === memoryId ? toggleReaction(m, reactionType, localUser.id) : m
        )
      )
    },
    [localUser.id]
  )

  const handleAskAI = async (memoryId: string) => {
    const memory = (memories || []).find((m) => m.id === memoryId)
    if (!memory) return

    setIsLoadingAI(true)
    try {
      const nearbyMemories = (memories || []).filter(
        (m) =>
          m.id !== memoryId &&
          Math.abs(m.position.x - memory.position.x) < 300 &&
          Math.abs(m.position.y - memory.position.y) < 300
      ).slice(0, 3)

      const reflection = await generateAIReflection(memory, nearbyMemories)
      setAiReflection(reflection)
    } catch {
      toast.error('Failed to generate reflection. Please try again.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handleShareMemory = (memoryId: string) => {
    setMemoryToShare(memoryId)
    setIsShareModalOpen(true)
  }

  const handleCreateShare = async (shareId: string) => {
    if (!memoryToShare || !user) return

    const memory = safeMemories.find(m => m.id === memoryToShare)
    if (!memory) return

    const sharedMemory: SharedMemory = {
      id: shareId,
      memoryId: memory.id,
      shareId,
      photoUrl: memory.photoUrl,
      text: memory.text,
      date: memory.date,
      location: memory.location,
      linkUrl: memory.linkUrl,
      plantedAt: memory.plantedAt,
      emotionalTone: memory.emotionalTone,
      plantStage: memory.plantStage,
      plantVariety: memory.plantVariety,
      audioRecordings: memory.audioRecordings,
      sharedBy: user.login,
      sharedAt: new Date().toISOString(),
    }

    setSharedMemories((current) => ({
      ...current,
      [shareId]: sharedMemory,
    }))

    setMemories((currentMemories) =>
      (currentMemories || []).map((m) => {
        if (m.id === memoryToShare) {
          const updatedMemory = {
            ...m,
            shareId,
            shareCreatedAt: new Date().toISOString(),
            shareCount: (m.shareCount || 0) + 1,
          }
          const nearbyMemories = (currentMemories || []).filter(
            (nm) =>
              nm.id !== memoryToShare &&
              Math.abs(nm.position.x - m.position.x) < 300 &&
              Math.abs(nm.position.y - m.position.y) < 300
          )
          const growthMetrics = calculateGrowthMetrics(updatedMemory, nearbyMemories)
          return {
            ...updatedMemory,
            growthMetrics,
          }
        }
        return m
      })
    )
  }

  const handleOpenBoost = (memoryId: string) => {
    const memory = safeMemories.find(m => m.id === memoryId)
    if (memory) {
      setMemoryToBoost(memory)
      setIsBoostModalOpen(true)
    }
  }

  const applyFertilizerToMemory = useCallback(
    (memoryId: string, boostLevel: 'standard' | 'premium' | 'legendary') => {
      setMemories((currentMemories) => {
        const target = (currentMemories || []).find((m) => m.id === memoryId)
        if (!target) return currentMemories || []

        const boostedMemory = applyPremiumFertilizer(target, boostLevel)
        const boostNames = {
          standard: 'Garden Boost',
          premium: 'Premium Fertilizer',
          legendary: 'Legendary Elixir',
        }
        toast.success(`${boostNames[boostLevel]} applied! Your memory is flourishing.`)

        return (currentMemories || []).map((m) => {
          if (m.id !== memoryId) return m
          const updatedMemory = { ...m, visitCount: boostedMemory.visitCount }
          const nearbyMemories = (currentMemories || []).filter(
            (nm) =>
              nm.id !== memoryId &&
              Math.abs(nm.position.x - m.position.x) < 300 &&
              Math.abs(nm.position.y - m.position.y) < 300,
          )
          const growthMetrics = calculateGrowthMetrics(updatedMemory, nearbyMemories)
          return {
            ...updatedMemory,
            growthMetrics,
            plantStage: plantStageAfterGrowth(updatedMemory, growthMetrics),
          }
        })
      })

      setGrowingMemories((prev) => new Set(prev).add(memoryId))
      setMemoryBoostTiers((prev) => new Map(prev).set(memoryId, boostLevel))

      setTimeout(() => {
        setGrowingMemories((prev) => {
          const next = new Set(prev)
          next.delete(memoryId)
          return next
        })
        setMemoryBoostTiers((prev) => {
          const next = new Map(prev)
          next.delete(memoryId)
          return next
        })
      }, 2000)
    },
    [setMemories],
  )

  const handleApplyFreeBoost = useCallback(
    (boostLevel: 'standard') => {
      if (!memoryToBoost) return
      applyFertilizerToMemory(memoryToBoost.id, boostLevel)
      setIsBoostModalOpen(false)
      setMemoryToBoost(null)
    },
    [applyFertilizerToMemory, memoryToBoost],
  )

  const handlePurchaseBoost = useCallback(
    async (boostLevel: 'premium' | 'legendary', memoryId: string) => {
      await redirectToCheckout({
        userId: localUser.id,
        sku: skuForFertilizerLevel(boostLevel),
        memoryId,
        returnPath: window.location.pathname,
      })
    },
    [localUser.id],
  )

  const handlePurchaseStarlightPack = useCallback(async () => {
    await redirectToCheckout({
      userId: localUser.id,
      sku: 'cosmetic-starlight-pack',
      returnPath: window.location.pathname,
    })
  }, [localUser.id])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutState = params.get('checkout')
    const sessionId = params.get('session_id')

    const cleanCheckoutParams = () => {
      params.delete('checkout')
      params.delete('session_id')
      const next = params.toString()
      const nextUrl = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', nextUrl)
    }

    if (checkoutState === 'cancelled') {
      toast.message('Checkout cancelled — your garden is unchanged.')
      cleanCheckoutParams()
      return
    }

    if (checkoutState !== 'success' || !sessionId) return

    void (async () => {
      try {
        const result = await resolvePaidCheckoutSession({
          userId: localUser.id,
          sessionId,
        })

        if (result.kind === 'pending') {
          toast.error('Payment is still confirming. Refresh in a moment if unlocks are missing.')
          return
        }

        if (result.kind === 'fertilizer') {
          applyFertilizerToMemory(result.memoryId, result.boostLevel)
          setIsBoostModalOpen(false)
          setMemoryToBoost(null)
          return
        }

        if (result.kind === 'cosmetic_pack') {
          updateUnlockState((state) => applyCosmeticPackToUnlockState(state, result.packId))
          toast.success('Starlight Collection unlocked — purely cosmetic, enjoy!')
          return
        }

        toast.error('We could not match this checkout to a garden unlock.')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not verify payment'
        toast.error(message)
      } finally {
        cleanCheckoutParams()
      }
    })()
  }, [applyFertilizerToMemory, localUser.id, updateUnlockState])

  const handleCrossPollinateInit = (memoryId: string) => {
    const parent1 = safeMemories.find(m => m.id === memoryId)
    if (parent1) {
      setPollinationParent(parent1)
      setSelectedMemory(null)
      toast.info('Select a second memory in your garden to cross-pollinate with!')
    }
  }

  const handleUpdateTraits = (memoryId: string, traits: PlantTraits) => {
    let updatedForSelection: Memory | null = null
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) => {
        if (m.id === memoryId) {
          const updated = { ...m, traits }
          updatedForSelection = updated
          return updated
        }
        return m
      })
    )
    if (updatedForSelection) {
      setSelectedMemory(updatedForSelection)
    }
    toast.success('Plant appearance updated!')
  }

  // Feature 2: Collaborative garden handlers
  const handleCreateGarden = (data: { name: string; description: string; settings: GardenSettings }) => {
    if (!user) return
    const gardenId = generateGardenId()
    const inviteToken = generateInviteToken()
    const newGarden: CollaborativeGarden = {
      id: gardenId,
      name: data.name,
      description: data.description,
      ownerId: user.login,
      ownerLogin: user.login,
      members: [{
        userId: user.login,
        login: user.login,
        avatarUrl: user.avatarUrl,
        role: 'owner',
        joinedAt: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
      settings: data.settings,
      inviteToken,
    }
    setCollaborativeGardens((current) => [...(current || []), newGarden])
    setActiveGardenId(gardenId)
    toast.success(`Garden "${data.name}" created!`)
  }

  const handleSelectGarden = (gardenId: string | null) => {
    setActiveGardenId(gardenId)
  }

  const handleEnterWalk = () => setViewMode('walk')
  const handleExitWalk = () => setViewMode('garden')

  const handleWaterMemory = useCallback((memoryId: string, result: import('@/lib/tending-logic').WateringResult) => {
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) => {
        if (m.id !== memoryId) return m
        const oldMetrics = m.growthMetrics || {
          vitality: 80,
          height: 1.2,
          width: 0.8,
          bloomCount: 3,
          foliageDensity: 0.8,
          rarityScore: 1.0,
          lastInteractionAt: Date.now(),
        }
        return {
          ...m,
          growthMetrics: {
            ...oldMetrics,
            vitality: result.newMoisture,
            lastInteractionAt: Date.now(),
          },
        }
      })
    )
    toast.success(result.message)
  }, [setMemories])

  const handleInviteToGarden = () => {
    if (activeGarden) {
      setIsInviteDialogOpen(true)
    }
  }

  const getInviteUrl = () => {
    if (!activeGarden?.inviteToken) return ''
    return `${window.location.origin}?invite=${activeGarden.id}&token=${activeGarden.inviteToken}`
  }

  // Handle invite link in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const inviteGardenId = params.get('invite')
    const inviteToken = params.get('token')
    if (inviteGardenId && inviteToken && user) {
      const garden = safeGardens.find(g => g.id === inviteGardenId && g.inviteToken === inviteToken)
      if (garden && !garden.members.some(m => m.login === user.login)) {
        // Validate invite token has not expired (tokens valid for 7 days based on garden creation time)
        const gardenCreatedAt = new Date(garden.createdAt).getTime()
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - gardenCreatedAt > sevenDaysMs && garden.inviteToken === inviteToken) {
          toast.error('This invite link has expired. Ask the garden owner for a new one.')
          window.history.replaceState({}, '', window.location.pathname)
          return
        }

        if (garden.members.length < garden.settings.maxMembers) {
          queueMicrotask(() => {
            setCollaborativeGardens((current) =>
              (current || []).map(g => {
                if (g.id === inviteGardenId) {
                  return {
                    ...g,
                    members: [...g.members, {
                      userId: user.login,
                      login: user.login,
                      avatarUrl: user.avatarUrl,
                      role: 'collaborator' as const,
                      joinedAt: new Date().toISOString(),
                    }],
                  }
                }
                return g
              })
            )
            setActiveGardenId(inviteGardenId)
            toast.success(`Joined "${garden.name}"!`)
            window.history.replaceState({}, '', window.location.pathname)
          })
        } else {
          toast.error('This garden is full')
        }
      }
    }
  }, [user, safeGardens])

  // Feature 5: Plant style preference handler
  const handleSavePlantStyle = (style: PlantStylePreference) => {
    setPreferences((current) => ({
      ...(current || { hasCompletedOnboarding: false, soundEnabled: false, lastVisit: '' }),
      plantStylePreference: style,
    }))
    toast.success('Plant art style saved!')
  }

  // Constraint system: per-memory cosmetic handlers
  const handleOpenCosmeticsEditor = (memory: Memory) => {
    setCosmeticsEditMemory(memory)
    setIsCosmeticsEditorOpen(true)
  }

  const handleSaveCosmetics = (memoryId: string, cosmetics: PlantCosmetics) => {
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) =>
        m.id === memoryId ? { ...m, cosmetics } : m
      )
    )
    toast.success('Plant cosmetics applied!')
  }

  const handleRerollGenetics = (memoryId: string) => {
    const unlockState = ensureUnlockState(safePreferences.unlockState)
    if (!canAffordReroll(unlockState.wallet)) {
      toast.error('Not enough dew to re-roll!')
      return
    }

    // Deduct cost
    updateUnlockState((state) => ({
      ...state,
      wallet: deductRerollCost(state.wallet),
    }))

    // Generate new genetics
    const newGenetics = generatePlantGenetics(`${Date.now()}-${Math.random().toString(36).substring(2)}`)
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) =>
        m.id === memoryId ? { ...m, genetics: newGenetics } : m
      )
    )
    toast.success('Plant appearance re-rolled!')
  }

  const syncStatus = useCloudSync({
    enabled: safePreferences.cloudSyncEnabled === true,
    userId: localUser.id,
    memories: safeMemories,
    preferences: safePreferences,
    onPulled: (mergedMemories, mergedPreferences) => {
      setMemories(mergedMemories)
      setPreferences(mergedPreferences)
    },
  })

  useKeyboardShortcuts({
    shortcuts: [
      {
        id: 'plant-memory',
        descriptor: APP_SHORTCUTS.PLANT_MEMORY,
        handler: () => {
          if (safePreferences.hasCompletedOnboarding) {
            setIsPlantModalOpen(true)
          }
        },
      },
      {
        id: 'view-garden',
        descriptor: APP_SHORTCUTS.VIEW_GARDEN,
        handler: () => setViewMode('garden'),
      },
      {
        id: 'view-walk',
        descriptor: APP_SHORTCUTS.VIEW_WALK,
        handler: () => setViewMode('walk'),
      },
      {
        id: 'view-timeline',
        descriptor: APP_SHORTCUTS.VIEW_TIMELINE,
        handler: () => setViewMode('timeline'),
      },
      {
        id: 'view-clusters',
        descriptor: APP_SHORTCUTS.VIEW_CLUSTERS,
        handler: () => setViewMode('clusters'),
      },
      {
        id: 'view-bloom-wall',
        descriptor: APP_SHORTCUTS.VIEW_BLOOM_WALL,
        handler: () => setViewMode('bloom'),
      },
      {
        id: 'export',
        descriptor: APP_SHORTCUTS.EXPORT,
        handler: () => setIsExportModalOpen(true),
      },
      {
        id: 'shortcuts-help',
        descriptor: { key: '?', description: 'Show keyboard shortcuts', category: 'Help' },
        handler: () => setIsShortcutsPanelOpen(true),
      },
    ],
    enabled: safePreferences.hasCompletedOnboarding,
  })

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
          todHours={todHours}
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
          onOpenBackup={() => setIsBackupModalOpen(true)}
          onOpenPlantStyle={() => setIsStyleCustomizerOpen(true)}
          onInviteToGarden={handleInviteToGarden}
          onOpenShortcuts={() => setIsShortcutsPanelOpen(true)}
          onOpenProtocolTest={() => window.open('/protocol-test.html', '_blank')}
          neonAuthAvailable={neonAuthAvailable}
          accountEmail={accountEmail}
          onOpenSignIn={() => {
            setNeonAuthOpen(true)
            void refreshAccountEmail()
          }}
          onSignOut={() => void handleNeonSignOut()}
          onToggleActivityPanel={() => setShowActivityPanel((v) => !v)}
          isActivityPanelOpen={showActivityPanel}
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
                    onPlantHybrid={handlePlantHybrid}
                    onEnterWalk={safeMemories.length > 0 ? handleEnterWalk : undefined}
                    landscapeView={safePreferences.gardenLandscapeView}
                    onLandscapeViewChange={handleLandscapeViewChange}
                    starterDecor={safePreferences.gardenStarterDecor}
                  />
                </SectionErrorBoundary>
              </motion.div>
            )}

            {viewMode === 'walk' && (
              <motion.div
                key="walk"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                {safeMemories.length === 0 ? (
                  <EmptyGarden onPlantFirst={() => setIsPlantModalOpen(true)} />
                ) : (
                  <SectionErrorBoundary label="open-world walk">
                    <Suspense fallback={
                      <div className="w-full h-full bg-[#0d0913] flex items-center justify-center text-[#f0e7da]/80 text-sm">
                        Opening the garden path…
                      </div>
                    }>
                      <OpenWorldGarden
                        memories={safeMemories}
                        season={season}
                        highlightedMemoryIds={highlightedMemoryIds}
                        growingMemories={growingMemories}
                        paused={selectedMemory !== null}
                        onMemoryClick={handleMemoryClick}
                        onWaterMemory={handleWaterMemory}
                        onExit={handleExitWalk}
                      />
                    </Suspense>
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
                          {memory.photoUrl?.trim() ? (
                            <img
                              src={memory.photoUrl}
                              alt="Memory"
                              className="w-20 h-20 md:w-32 md:h-32 object-cover rounded-md flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 md:w-32 md:h-32 rounded-md flex-shrink-0 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              No photo
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground mb-2">
                              {new Date(memory.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="line-clamp-2">{memoryPrimaryLabel(memory)}</p>
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
                      key={`${visitingGardenId}-${communityGardenRefresh}`}
                      gardenId={visitingGardenId}
                      gardenName={visitingGardenName ?? undefined}
                      userId={localUser.id}
                      userName={localUser.login || 'Anonymous Gardener'}
                      onBack={() => {
                        setVisitingGardenId(null)
                        setVisitingGardenName(null)
                      }}
                      onPlantMemory={() => setCommunityPlantOpen(true)}
                    />
                  ) : (
                    <ExploreView
                      userId={localUser.id}
                      userName={localUser.login || 'Anonymous Gardener'}
                      onVisitGarden={(gardenId, gardenName) => {
                        setVisitingGardenId(gardenId)
                        setVisitingGardenName(gardenName)
                      }}
                      onJoinGarden={(gardenId, gardenName) => {
                        toast.success(`Welcome to ${gardenName}!`, {
                          description: 'You can water plants, reflect, and plant memories',
                        })
                        setVisitingGardenId(gardenId)
                        setVisitingGardenName(gardenName)
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

          {viewMode !== 'walk' ? (
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
          ) : null}
        </main>
      </div>

      <PlantMemoryModal
        open={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        onPlant={handlePlantMemory}
      />

      {visitingGardenId && visitingGardenName ? (
        <Suspense fallback={null}>
          <PlantCommunityGardenModal
            open={communityPlantOpen}
            gardenId={visitingGardenId}
            gardenName={visitingGardenName}
            userId={localUser.id}
            userName={localUser.login || 'Anonymous Gardener'}
            memories={safeMemories}
            onClose={() => setCommunityPlantOpen(false)}
            onPlanted={() => {
              setCommunityPlantOpen(false)
              setCommunityGardenRefresh((n) => n + 1)
            }}
          />
        </Suspense>
      ) : null}

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
        onEditPlant={selectedMemory ? () => setIsEditPlantOpen(true) : undefined}
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
          onApplyFreeBoost={handleApplyFreeBoost}
          onPurchaseBoost={handlePurchaseBoost}
        />

        <ExportGarden
          open={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          memories={activeFilterCount > 0 ? filteredMemories : safeMemories}
        />

        <GardenBackupDialog
          open={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          localUserId={localUser.id}
          memories={safeMemories}
          preferences={safePreferences}
          onImport={(nextMemories, nextPreferences) => {
            setMemories(nextMemories)
            setPreferences(nextPreferences)
          }}
        />

        {neonAuthAvailable && neonAuthOpen && (
          <Suspense fallback={null}>
            <NeonAuthPanel
              open={neonAuthOpen}
              onOpenChange={setNeonAuthOpen}
              onSignedIn={() => void handleNeonSignInComplete()}
            />
          </Suspense>
        )}

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
          landscapeView={safePreferences.gardenLandscapeView}
          onLandscapeViewChange={handleLandscapeViewChange}
          onSave={handleSavePlantStyle}
        />

        <EditPlantDialog
          open={isEditPlantOpen && selectedMemory !== null}
          memory={selectedMemory}
          unlockState={safePreferences.unlockState}
          onClose={() => setIsEditPlantOpen(false)}
          onSave={handleEditPlantSave}
        />

        {/* Constraint System: Unlocks & Cosmetics */}
        <GardenUnlocks
          open={isUnlocksOpen}
          onClose={() => setIsUnlocksOpen(false)}
          unlockState={safePreferences.unlockState}
          onPurchaseStarlightPack={handlePurchaseStarlightPack}
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
          onPurchaseStarlightPack={handlePurchaseStarlightPack}
        />

        {/* Keyboard Shortcuts Panel */}
        <KeyboardShortcutsPanel
          open={isShortcutsPanelOpen}
          onClose={() => setIsShortcutsPanelOpen(false)}
        />
      </Suspense>
    </>
  )
}

export default App

