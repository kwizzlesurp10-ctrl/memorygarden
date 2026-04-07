import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Trophy, Lock, Drop, Sun, Flower, Star } from '@phosphor-icons/react'
import type { UnlockState, RarityTier } from '@/lib/types'
import { UNLOCKABLE_ITEMS, ACHIEVEMENT_RULES, getCurrencyInfo, getRarityInfo, ensureUnlockState } from '@/lib/unlock-system'

interface GardenUnlocksProps {
  open: boolean
  onClose: () => void
  unlockState: UnlockState | undefined
}

const CURRENCY_ICONS: Record<string, React.ReactNode> = {
  dew: <Drop size={18} weight="fill" />,
  sunlight: <Sun size={18} weight="fill" />,
  pollen: <Flower size={18} weight="fill" />,
  starlight: <Star size={18} weight="fill" />,
}

function RarityBadge({ rarity }: { rarity: RarityTier }) {
  const info = getRarityInfo(rarity)
  return (
    <Badge
      variant="secondary"
      className="text-xs"
      style={{ backgroundColor: `${info.color}20`, color: info.color, borderColor: `${info.color}40` }}
    >
      {info.label}
    </Badge>
  )
}

export function GardenUnlocks({ open, onClose, unlockState }: GardenUnlocksProps) {
  const state = ensureUnlockState(unlockState)

  const isUnlocked = (item: typeof UNLOCKABLE_ITEMS[0]) => {
    switch (item.type) {
      case 'palette': return state.unlockedPalettes.includes(item.id as never)
      case 'adornment': return state.unlockedAdornments.includes(item.id as never)
      case 'pattern': return state.unlockedPatterns.includes(item.id as never)
      case 'frame': return state.unlockedFrames.includes(item.id)
      default: return false
    }
  }

  const palettes = UNLOCKABLE_ITEMS.filter(i => i.type === 'palette')
  const patterns = UNLOCKABLE_ITEMS.filter(i => i.type === 'pattern')
  const adornments = UNLOCKABLE_ITEMS.filter(i => i.type === 'adornment')
  const achievementIds = new Set(state.achievements.map(a => a.id))

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Trophy size={24} weight="duotone" className="text-primary" />
            Garden Collection
          </DialogTitle>
          <DialogDescription>
            Earn cosmetics by tending your garden. Unlocks are cosmetic-only and never affect growth.
          </DialogDescription>
        </DialogHeader>

        {/* Currency display */}
        <div className="px-6 pb-2">
          <div className="grid grid-cols-4 gap-2">
            {(['dew', 'sunlight', 'pollen', 'starlight'] as const).map((currency) => {
              const info = getCurrencyInfo(currency)
              return (
                <motion.div
                  key={currency}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border"
                  whileHover={{ scale: 1.02 }}
                >
                  <span style={{ color: info.color }}>{CURRENCY_ICONS[currency]}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    <p className="text-sm font-semibold">{state.wallet[currency]}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <Tabs defaultValue="palettes" className="flex-1 flex flex-col min-h-0">
          <div className="px-6">
            <TabsList className="w-full">
              <TabsTrigger value="palettes" className="flex-1">Palettes</TabsTrigger>
              <TabsTrigger value="patterns" className="flex-1">Patterns</TabsTrigger>
              <TabsTrigger value="adornments" className="flex-1">Adornments</TabsTrigger>
              <TabsTrigger value="achievements" className="flex-1">Achievements</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
            <TabsContent value="palettes" className="mt-4 space-y-2">
              {palettes.map((item) => (
                <UnlockItem key={item.id} item={item} unlocked={isUnlocked(item)} />
              ))}
            </TabsContent>

            <TabsContent value="patterns" className="mt-4 space-y-2">
              {patterns.map((item) => (
                <UnlockItem key={item.id} item={item} unlocked={isUnlocked(item)} />
              ))}
            </TabsContent>

            <TabsContent value="adornments" className="mt-4 space-y-2">
              {adornments.map((item) => (
                <UnlockItem key={item.id} item={item} unlocked={isUnlocked(item)} />
              ))}
            </TabsContent>

            <TabsContent value="achievements" className="mt-4 space-y-2">
              {ACHIEVEMENT_RULES.map((rule) => {
                const earned = achievementIds.has(rule.id)
                const achievement = state.achievements.find(a => a.id === rule.id)
                return (
                  <motion.div
                    key={rule.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      earned ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-border opacity-60'
                    }`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: earned ? 1 : 0.6, y: 0 }}
                  >
                    <div className={`mt-0.5 ${earned ? 'text-primary' : 'text-muted-foreground'}`}>
                      {earned ? <Trophy size={20} weight="fill" /> : <Lock size={20} weight="regular" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${earned ? '' : 'text-muted-foreground'}`}>
                          {rule.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          +{rule.starlightReward} ✨
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                      {earned && achievement && (
                        <p className="text-xs text-primary/70 mt-1">
                          Earned {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function UnlockItem({ item, unlocked }: { item: typeof UNLOCKABLE_ITEMS[0]; unlocked: boolean }) {
  return (
    <AnimatePresence>
      <motion.div
        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
          unlocked ? 'bg-card border-border' : 'bg-muted/20 border-border opacity-60'
        }`}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: unlocked ? 1 : 0.6, y: 0 }}
      >
        <div className={`mt-0.5 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`}>
          {unlocked ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
              ✓
            </motion.div>
          ) : (
            <Lock size={16} weight="regular" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${unlocked ? '' : 'text-muted-foreground'}`}>
              {item.name}
            </p>
            <RarityBadge rarity={item.rarity} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
          {!unlocked && (
            <p className="text-xs text-muted-foreground/70 mt-1 italic">
              🔒 {item.requirement}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
