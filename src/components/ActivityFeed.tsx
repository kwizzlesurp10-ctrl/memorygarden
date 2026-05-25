import { motion } from 'framer-motion'
import { Heart, Lightning, SignOut, Tree, Users } from '@phosphor-icons/react'
import type { ActivityEvent } from '@/lib/types'

interface ActivityFeedProps {
  events: ActivityEvent[]
}

function ActivityIcon({ type }: { type: ActivityEvent['type'] }) {
  const common = { weight: 'fill' as const, size: 20 }
  switch (type) {
    case 'plant':
      return <Tree {...common} />
    case 'reflect':
      return <Heart {...common} />
    case 'boost':
      return <Lightning {...common} />
    case 'join':
      return <Users {...common} />
    case 'leave':
      return <SignOut {...common} />
  }
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No activity yet. Start tending gardens to see social moments appear here.
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Users /> Garden Activity
      </h3>

      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="flex gap-4 p-4 bg-card border rounded-2xl"
        >
          <div className="mt-1 text-primary">
            <ActivityIcon type={event.type} />
          </div>
          <div className="flex-1 text-sm">
            <span className="font-medium">{event.userLogin}</span>{' '}
            <span className="text-muted-foreground">{event.description}</span>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(event.createdAt).toLocaleDateString()}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
