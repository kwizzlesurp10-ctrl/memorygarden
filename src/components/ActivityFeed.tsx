import { motion } from 'framer-motion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Plant, Drop, Lightning, UserPlus, SignOut } from '@phosphor-icons/react'
import { format } from 'date-fns'
import type { ActivityEvent } from '@/lib/types'

interface ActivityFeedProps {
  events: ActivityEvent[]
}

const eventIcons = {
  plant: Plant,
  reflect: Drop,
  boost: Lightning,
  join: UserPlus,
  leave: SignOut,
}

const eventColors = {
  plant: 'text-green-500',
  reflect: 'text-blue-500',
  boost: 'text-yellow-500',
  join: 'text-primary',
  leave: 'text-muted-foreground',
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold">Recent Activity</h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {events.slice(0, 20).map((event, index) => {
          const Icon = eventIcons[event.type] || Plant
          const colorClass = eventColors[event.type] || 'text-muted-foreground'

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-2 py-1"
            >
              <Icon size={16} weight="duotone" className={`mt-0.5 flex-shrink-0 ${colorClass}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs">
                  <span className="font-medium">{event.userLogin}</span>{' '}
                  {event.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.createdAt), 'MMM d, h:mm a')}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
