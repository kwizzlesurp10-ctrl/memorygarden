import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useKV } from '@/lib/storage'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plant as PlantIcon, Tree, List, GridFour, Export, DotsThree, Link as LinkIcon, Palette, UsersThree, Trophy, Keyboard } from '@phosphor-icons/react'
import { GardenCanvas } from '@/components/GardenCanvas'
import { PlantMemoryModal } from '@/components/PlantMemoryModal'
import { MemoryCard } from '@/components/MemoryCard'
import { Onboarding } from '@/components/Onboarding'
import { SeasonIndicator } from '@/components/SeasonIndicator'
import { SearchFilterBar } from '@/components/SearchFilterBar'
import { WeatherIndicator } from '@/components/WeatherIndicator'
import { GardenSelector } from '@/components/GardenSelector'
import { KeyboardShortcutsPanel } from '@/components/KeyboardShortcutsPanel'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKeyboardShortcuts, APP_SHORTCUTS } from '@/lib/keyboard-shortcuts'

// ── Lazy-loaded non-critical components (modals, dialogs, secondary views) ──
const ExportGarden = lazy(() => import('@/components/ExportGarden').then(m => ({ default: m.ExportGarden })))
const MemoryClusters = lazy(() => import('@/components/MemoryClusters').then(m => ({ default: m.MemoryClusters })))
const ShareMemoryDialog = lazy(() => import('@/components/ShareMemoryDialog').then(m => ({ default: m.ShareMemoryDialog })))
const SharedMemoryView = lazy(() => import('@/components/SharedMemoryView').then(m => ({ default: m.SharedMemoryView })))
const FertilizerBoostModal = lazy(() => import('@/components/FertilizerBoostModal').then(m => ({ default: m.FertilizerBoostModal })))
const CreateGardenDialog = lazy(() => import('@/components/CreateGardenDialog').then(m => ({ default: m.CreateGardenDialog })))
const GardenInviteDialog = lazy(() => import('@/components/GardenInviteDialog').then(m => ({ default: m.GardenInviteDialog })))
const GardenMembersPanel = lazy(() => import('@/components/GardenMembersPanel').then(m => ({ default: m.GardenMembersPanel })))
const ActivityFeed = lazy(() => import('@/components/ActivityFeed').then(m => ({ default: m.ActivityFeed })))
const PlantStyleCustomizer = lazy(() => import('@/components/PlantStyleCustomizer').then(m => ({ default: m.PlantStyleCustomizer })))
const GardenUnlocks = lazy(() => import('@/components/GardenUnlocks').then(m => ({ default: m.GardenUnlocks })))
const PlantCosmeticsEditor = lazy(() => import('@/components/PlantCosmeticsEditor').then(m => ({ default: m.PlantCosmeticsEditor })))
import type { Memory, UserPreferences, AudioRecording, SharedMemory, SearchFilters, CollaborativeGarden, GardenSettings, CollaborativeMemory, ActivityEvent, PlantStylePreference, GardenMood, PlantCosmetics, UnlockState, PlantTraits } from '@/lib/types'
import { classifyEmotionalTone, generateAIReflection, getPlantStage, getSeason, selectPlantVariety, calculateGrowthMetrics, applyPremiumFertilizer, filterMemories, getActiveFilterCount, computeGardenMood, generateGardenId, generateInviteToken, getDayPeriod } from '@/lib/garden-helpers'
import { ensureUnlockState, generatePlantGenetics, awardForReflection, awardForRevisit, awardForClusterTending, awardForPlanting, applyAward, evaluateUnlocks, applyNewUnlocks, evaluateAchievements, deductRerollCost, canAffordReroll, UNLOCKABLE_ITEMS } from '@/lib/unlock-system'
import { generateGeneticsSeed, computeUnlocks } from '@/lib/trait-system'
import { useProtocolHandler, type ProtocolAction } from '@/hooks/use-protocol-handler'
import { getLocalUser, type LocalUser } from '@/lib/local-user'

type ViewMode = 'garden' | 'timeline' | 'clusters'

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

  const [user, setUser] = useState<LocalUser | null>(localUser)
  const [memories, setMemories] = useKV<Memory[]>(`${localUser.id}:memories`, [])
  const [sharedMemories, setSharedMemories] = useKV<Record<string, SharedMemory>>('shared-memories', {})
  const [preferences, setPreferences] = useKV<UserPreferences>(`${localUser.id}:preferences`, {
    hasCompletedOnboarding: false,
    soundEnabled: false,
    lastVisit: new Date().toISOString(),
  })

  const [viewMode, setViewMode] = useState<ViewMode>('garden')
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [aiReflection, setAiReflection] = useState<string>('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [season, setSeason] = useState(getSeason())
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [memoryToShare, setMemoryToShare] = useState<string | null>(null)
  const [sharedMemoryView, setSharedMemoryView] = useState<SharedMemory | null>(null)
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false)
  const [memoryToBoost, setMemoryToBoost] = useState<Memory | null>(null)
  const [growingMemories, setGrowingMemories] = useState<Set<string>>(new Set())
  const [memoryBoostTiers, setMemoryBoostTiers] = useState<Map<string, 'standard' | 'premium' | 'legendary'>>(new Map())

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
  const [gardenActivities, setGardenActivities] = useKV<Record<string, ActivityEvent[]>>(`${localUser.id}:garden-activities`, {})
  const [isCreateGardenOpen, setIsCreateGardenOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [showMembersPanel, setShowMembersPanel] = useState(false)

  // Feature 5: AI Plant Style state
  const [isStyleCustomizerOpen, setIsStyleCustomizerOpen] = useState(false)

  // Constraint / Unlock system state
  const [isUnlocksOpen, setIsUnlocksOpen] = useState(false)
  const [isCosmeticsEditorOpen, setIsCosmeticsEditorOpen] = useState(false)
  const [cosmeticsEditMemory, setCosmeticsEditMemory] = useState<Memory | null>(null)
  const [isShortcutsPanelOpen, setIsShortcutsPanelOpen] = useState(false)

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('share')
    
    if (shareId && sharedMemories) {
      const sharedMem = sharedMemories[shareId]
      if (sharedMem) {
        setSharedMemoryView(sharedMem)
      }
    }
  }, [sharedMemories])

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
      case 'view-memory':
        const memory = safeMemories.find(m => m.id === action.id)
        if (memory) {
          handleMemoryClick(memory)
        } else {
          toast.error('Memory not found')
        }
        break
      case 'unknown':
        toast.info(`Protocol handler invoked: ${action.protocol}`)
        break
    }
  }, [memories, preferences])

  useProtocolHandler(handleProtocolAction)

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

  const handleCompleteOnboarding = () => {
    setPreferences((current) => ({
      soundEnabled: current?.soundEnabled || false,
      lastVisit: current?.lastVisit || new Date().toISOString(),
      hasCompletedOnboarding: true,
    }))
    setIsPlantModalOpen(true)
  }

  const handlePlantMemory = async (data: {
    photoFile: File
    text: string
    date: string
    location?: string
    audioRecordings: AudioRecording[]
  }) => {
    const reader = new FileReader()
    reader.readAsDataURL(data.photoFile)
    
    return new Promise<void>((resolve, reject) => {
      reader.onload = async () => {
        try {
          const photoUrl = reader.result as string
          
          const emotionalTone = await classifyEmotionalTone(data.text)
          const plantVariety = selectPlantVariety(emotionalTone, data.text)
          
          const newMemory: Memory = {
            id: `memory-${Date.now()}`,
            photoUrl,
            text: data.text,
            date: data.date,
            location: data.location,
            plantedAt: new Date().toISOString(),
            position: {
              x: 400 + Math.random() * 800,
              y: 400 + Math.random() * 800,
            },
            emotionalTone,
            plantVariety,
            plantStage: 'seed',
            visitCount: 0,
            reflections: [],
            audioRecordings: data.audioRecordings,
            geneticsSeed: generateGeneticsSeed(),
            traits: {},
            unlocks: [],
            genetics: generatePlantGenetics(`${Date.now()}-${Math.random().toString(36).substring(2)}`),
          }

          setMemories((currentMemories) => [...(currentMemories || []), newMemory])

          // Award currency and update counters for planting
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

          // Trigger sprouting particle animation on the canvas when seed first appears
          setGrowingMemories((prev) => new Set(prev).add(newMemory.id))
          setTimeout(() => {
            setGrowingMemories((prev) => {
              const next = new Set(prev)
              next.delete(newMemory.id)
              return next
            })
          }, 3000) // matches PLANTING_CELEBRATION_MS in PlantMemoryModal

          resolve()
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  }

  const handleMemoryClick = (memory: Memory) => {
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
            plantStage: getPlantStage(updatedMemory),
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
      const period = getDayPeriod()
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

  const handleMemoryMove = (memoryId: string, newPosition: { x: number; y: number }) => {
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) =>
        m.id === memoryId ? { ...m, position: newPosition } : m
      )
    )
  }

  const handleWater = async (memoryId: string, reflectionText: string) => {
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
            plantStage: getPlantStage(updatedMemory),
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
    } catch (error) {
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

  const handleApplyBoost = (boostLevel: 'standard' | 'premium' | 'legendary') => {
    if (!memoryToBoost) return

    const boostedMemory = applyPremiumFertilizer(memoryToBoost, boostLevel)
    
    setGrowingMemories((prev) => new Set(prev).add(memoryToBoost.id))
    setMemoryBoostTiers((prev) => new Map(prev).set(memoryToBoost.id, boostLevel))
    
    setTimeout(() => {
      setGrowingMemories((prev) => {
        const next = new Set(prev)
        next.delete(memoryToBoost.id)
        return next
      })
      setMemoryBoostTiers((prev) => {
        const next = new Map(prev)
        next.delete(memoryToBoost.id)
        return next
      })
    }, 2000)
    
    setMemories((currentMemories) =>
      (currentMemories || []).map((m) => {
        if (m.id === memoryToBoost.id) {
          const updatedMemory = {
            ...m,
            visitCount: boostedMemory.visitCount,
          }
          const nearbyMemories = (currentMemories || []).filter(
            (nm) =>
              nm.id !== memoryToBoost.id &&
              Math.abs(nm.position.x - m.position.x) < 300 &&
              Math.abs(nm.position.y - m.position.y) < 300
          )
          const growthMetrics = calculateGrowthMetrics(updatedMemory, nearbyMemories)
          return {
            ...updatedMemory,
            growthMetrics,
            plantStage: getPlantStage(updatedMemory),
          }
        }
        return m
      })
    )

    const boostNames = {
      standard: 'Garden Boost',
      premium: 'Premium Fertilizer',
      legendary: 'Legendary Elixir',
    }

    toast.success(`${boostNames[boostLevel]} applied! Your memory is flourishing.`)
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
        } else {
          toast.error('This garden is full')
        }
      }
    }
  }, [user, collaborativeGardens])

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

  const safeMemories = memories || []
  const safePreferences = preferences || { hasCompletedOnboarding: false, soundEnabled: false, lastVisit: '' }
  const safeGardens = collaborativeGardens || []
  const safeActivities = gardenActivities || {}

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

  // Feature 2: Active collaborative garden
  const activeGarden = useMemo(
    () => safeGardens.find((g) => g.id === activeGardenId) || null,
    [safeGardens, activeGardenId]
  )
  const activeGardenActivities = useMemo(
    () => (activeGardenId ? safeActivities[activeGardenId] || [] : []),
    [activeGardenId, safeActivities]
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
      
      <Onboarding
        open={!safePreferences.hasCompletedOnboarding}
        onComplete={handleCompleteOnboarding}
      />

      <div className="w-full h-screen flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Tree size={28} weight="duotone" className="text-primary flex-shrink-0 md:w-8 md:h-8" />
            <h1 className="text-lg md:text-xl font-bold truncate">MemoryGarden</h1>
            <SeasonIndicator season={season} className="hidden sm:flex" />
            <WeatherIndicator mood={gardenMood} className="hidden sm:flex" />
            <GardenSelector
              gardens={safeGardens}
              activeGardenId={activeGardenId}
              onSelectGarden={handleSelectGarden}
              onCreateGarden={() => setIsCreateGardenOpen(true)}
            />
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="absolute left-1/2 -translate-x-1/2">
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
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <DotsThree size={24} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsUnlocksOpen(true)}>
                  <Trophy size={16} className="mr-2" />
                  Garden Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsExportModalOpen(true)}>
                  <Export size={16} className="mr-2" />
                  Export Garden
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsStyleCustomizerOpen(true)}>
                  <Palette size={16} className="mr-2" />
                  Plant Art Style
                </DropdownMenuItem>
                {activeGarden && (
                  <DropdownMenuItem onClick={handleInviteToGarden}>
                    <UsersThree size={16} className="mr-2" />
                    Invite Members
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsShortcutsPanelOpen(true)}>
                  <Keyboard size={16} className="mr-2" />
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/protocol-test.html', '_blank')}>
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

        {/* Feature 1: Search/Filter bar */}
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          activeFilterCount={activeFilterCount}
          availableLocations={availableLocations}
        />

        <main className="flex-1 relative overflow-hidden">
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
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-background via-background/95 to-primary/5">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center space-y-4 max-w-md px-6"
                    >
                      <PlantIcon size={80} weight="duotone" className="text-primary mx-auto" />
                      <h2 className="text-2xl font-bold">Your garden awaits</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        Plant your first memory to begin growing your personal sanctuary of
                        moments, reflections, and connections.
                      </p>
                      <Button size="lg" onClick={() => setIsPlantModalOpen(true)} className="mt-6">
                        <PlantIcon size={20} weight="fill" className="mr-2" />
                        Plant Your First Memory
                      </Button>
                    </motion.div>
                  </div>
                ) : (
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
                )}
              </motion.div>
            )}

            {viewMode === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full overflow-y-auto p-8 bg-background"
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
                            className="w-32 h-32 object-cover rounded-md flex-shrink-0"
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
                <Suspense fallback={null}>
                  <MemoryClusters memories={activeFilterCount > 0 ? filteredMemories : safeMemories} onMemoryClick={handleMemoryClick} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>

          {safeMemories.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="fixed bottom-8 right-8 z-20"
            >
              <Button
                size="lg"
                onClick={() => setIsPlantModalOpen(true)}
                className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-shadow"
              >
                <PlantIcon size={28} weight="fill" />
              </Button>
            </motion.div>
          )}
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
        aiReflection={aiReflection}
        isLoadingAI={isLoadingAI}
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
          onClose={() => setIsShortcutsPanelOpen(false)}
        />
      </Suspense>
    </>
  )
}

export default App
      </Suspense>
    </>
  )
}

export default App
