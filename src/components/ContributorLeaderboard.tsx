import { motion } from 'framer-motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Crown, Plant, Drop, Lightning } from '@phosphor-icons/react'
import { computeLeaderboard } from '@/lib/activity-helpers'
import type { ActivityEvent, GardenMember } from '@/lib/types'

interface ContributorLeaderboardProps {
  events: ActivityEvent[]
  members: GardenMember[]
  /** Highlights the viewer's own row. */
  currentUserId?: string
}

const rankColors = ['text-yellow-500', 'text-slate-400', 'text-amber-700']

export function ContributorLeaderboard({ events, members, currentUserId }: ContributorLeaderboardProps) {
  const ranked = computeLeaderboard(events, members).slice(0, 5)

  if (ranked.length === 0) {
    return (
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Top Gardeners</h3>
        <p className="text-sm text-muted-foreground">No contributions yet</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold">Top Gardeners</h3>
      <div className="space-y-2">
        {ranked.map((stat, index) => {
          const isYou = !!currentUserId && stat.userId === currentUserId
          return (
            <motion.div
              key={stat.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-2 py-1 px-2 rounded-md ${
                isYou ? 'bg-primary/10' : ''
              }`}
            >
              <span className="w-4 flex-shrink-0 text-center">
                {index === 0 ? (
                  <Crown size={14} weight="fill" className={rankColors[0]} />
                ) : (
                  <span className={`text-xs font-semibold ${rankColors[index] || 'text-muted-foreground'}`}>
                    {index + 1}
                  </span>
                )}
              </span>
              <Avatar className="w-6 h-6">
                <AvatarImage src={stat.avatarUrl} alt={stat.login} />
                <AvatarFallback className="text-[10px]">
                  {stat.login[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {stat.login}
                  {isYou && <span className="text-muted-foreground font-normal"> (you)</span>}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5" title={`${stat.plants} planted`}>
                    <Plant size={10} weight="duotone" className="text-green-500" />
                    {stat.plants}
                  </span>
                  <span className="flex items-center gap-0.5" title={`${stat.reflections} reflections`}>
                    <Drop size={10} weight="duotone" className="text-blue-500" />
                    {stat.reflections}
                  </span>
                  <span className="flex items-center gap-0.5" title={`${stat.boosts} boosts`}>
                    <Lightning size={10} weight="duotone" className="text-yellow-500" />
                    {stat.boosts}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {stat.total}
              </Badge>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
